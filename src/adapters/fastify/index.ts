/**
 * Fastify adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints as a Fastify plugin with Drizzle ORM
 *
 * This adapter holds only framework translation: it maps Fastify request/reply to
 * an {@link McpHttpPort} and routes to the framework-agnostic core
 * (`src/adapters/core`). All request-handling logic (validate / execute / format,
 * MCP dispatch) lives in the core. The exceptions that remain here are inherently
 * transport-bound: the agent/chat SSE stream and the long-lived GET/DELETE `/mcp`
 * lifecycle.
 */

import { FastifyPluginCallback, FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'
import type { FastifyCorsOptions } from '@fastify/cors'
import type {
  SemanticQuery,
  SecurityContext,
  DatabaseExecutor,
  DrizzleDatabase,
  Cube,
  CacheConfig,
  RLSSetupFn
} from '../../server/index.js'
import type { AgentConfig } from '../../server/agent/types.js'
import { SemanticLayerCompiler } from '../../server/compiler.js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import {
  formatErrorResponse,
  type MCPOptions
} from '../utils.js'
import {
  primeEventId,
  serializeSseEvent,
  extractBearerToken,
  buildWwwAuthenticateChallenge,
  validateOriginHeader,
  originOptionsFromMcp
} from '../mcp-transport.js'
import { ensureLocaleHeader } from '../locale.js'
import { createCubeHttpHandler, withLocaleFromHeaders, type McpHttpPort } from '../core/index.js'

/** Read a Fastify request header as a single string (first value when an array). */
function readFastifyHeader(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

/**
 * Construct an {@link McpHttpPort} over a Fastify request/reply pair.
 * Drives every core handler (REST + MCP); see `src/adapters/core`.
 */
function createFastifyPort(request: FastifyRequest, reply: FastifyReply): McpHttpPort<FastifyReply> {
  return {
    getHeader: (name) => readFastifyHeader(request, name),
    getBody: async () => request.body,
    getQueryParam: (name) => (request.query as Record<string, unknown> | undefined)?.[name] as string | undefined,
    send: (status, body) => reply.status(status).send(body),
    setHeader: (name, value) => { reply.header(name, value) },
    sendEmpty: (status) => reply.status(status).send(),
    sendSse: (status, body) => {
      reply.header('Content-Type', 'text/event-stream')
      reply.header('Cache-Control', 'no-cache')
      reply.header('Connection', 'keep-alive')
      return reply.status(status).send(body)
    }
  }
}

export interface FastifyAdapterOptions {
  /**
   * Array of cube definitions to register
   */
  cubes: Cube[]

  /**
   * Drizzle database instance (REQUIRED)
   * This is the core of drizzle-cube - Drizzle ORM integration
   * Accepts PostgreSQL, MySQL, or SQLite database instances
   */
  drizzle: PostgresJsDatabase<any> | MySql2Database<any> | BetterSQLite3Database<any> | DrizzleDatabase

  /**
   * Database schema for type inference (RECOMMENDED)
   * Provides full type safety for cube definitions
   */
  schema?: any

  /**
   * Extract security context from incoming HTTP request.
   * Called for EVERY API request to determine user permissions and multi-tenant isolation.
   *
   * This is your security boundary - ensure proper authentication and authorization here.
   *
   * @param request - Fastify Request object containing the incoming HTTP request
   * @returns Security context with organisationId, userId, roles, etc.
   *
   * @example
   * extractSecurityContext: async (request) => {
   *   // Extract JWT from Authorization header
   *   const token = request.headers.authorization?.replace('Bearer ', '')
   *   const decoded = await verifyJWT(token)
   *
   *   // Return context that will be available in all cube SQL functions
   *   return {
   *     organisationId: decoded.orgId,
   *     userId: decoded.userId,
   *     roles: decoded.roles
   *   }
   * }
   */
  extractSecurityContext: (request: FastifyRequest) => SecurityContext | Promise<SecurityContext>

  /**
   * Database engine type (optional - auto-detected if not provided)
   */
  engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'

  /**
   * CORS configuration (optional)
   */
  cors?: FastifyCorsOptions

  /**
   * API base path (default: '/cubejs-api/v1')
   */
  basePath?: string

  /**
   * JSON body parser limit (default: 10485760 - 10MB)
   */
  bodyLimit?: number

  /**
   * Cache configuration for query result caching
   * When provided, query results will be cached using the specified provider
   */
  cache?: CacheConfig

  /**
   * MCP (AI-Ready) endpoint configuration
   * Enables AI agents to discover and query your data
   * @default { enabled: true }
   */
  mcp?: MCPOptions

  /**
   * Agent configuration for the agentic AI notebook feature.
   * When provided, enables the POST /agent/chat SSE endpoint.
   * Requires `@anthropic-ai/sdk` as a peer dependency.
   */
  agent?: AgentConfig

  /**
   * Row-Level Security setup function.
   * When provided, every query execution opens a transaction, calls this function
   * to configure RLS (e.g., set JWT claims and switch Postgres roles), then runs the query.
   */
  rlsSetup?: RLSSetupFn
}

/**
 * Fastify plugin for Cube.js-compatible API
 */
export const cubePlugin: FastifyPluginCallback<FastifyAdapterOptions> = function cubePlugin(
  fastify: FastifyInstance,
  options: FastifyAdapterOptions,
  done: (err?: Error) => void
) {
  const {
    cubes,
    drizzle,
    schema,
    extractSecurityContext,
    engineType,
    cors: corsConfig,
    basePath = '/cubejs-api/v1',
    bodyLimit = 10485760, // 10MB
    cache,
    mcp = { enabled: true },
    agent: agentConfig
  } = options

  // Validate required options
  if (!cubes || cubes.length === 0) {
    return done(new Error('At least one cube must be provided in the cubes array'))
  }

  // Register CORS plugin if configured
  if (corsConfig) {
    const localeAwareCorsConfig: FastifyCorsOptions = {
      ...corsConfig,
      allowedHeaders: ensureLocaleHeader(corsConfig.allowedHeaders as string[] | string | undefined)
    }
    fastify.register(import('@fastify/cors'), localeAwareCorsConfig)
  }

  // Configure body limit - just a placeholder hook that doesn't use reply
  fastify.addHook('onRequest', async (request, _reply) => {
    if (request.method === 'POST') {
      request.body = undefined // Reset body to allow parsing with custom limit
    }
  })

  // Create semantic layer and register all cubes
  const semanticLayer = new SemanticLayerCompiler({
    drizzle,
    schema,
    engineType,
    cache,
    rlsSetup: options.rlsSetup
  })

  // Register all provided cubes
  cubes.forEach(cube => {
    semanticLayer.registerCube(cube)
  })

  // Framework-agnostic core. The base-context thunk returns the pre-locale
  // context; the core does the locale merge. Every REST + MCP handler funnels
  // through here — this adapter only translates request/reply to a port and routes.
  const httpHandler = createCubeHttpHandler({
    semanticLayer,
    // codeql[js/log-injection] error source is internal, not user-controlled
    onError: (error) => fastify.log.error(error, 'Query execution error'),
    mcp
  })

  // Per-request base-context thunk: the user's extractSecurityContext closed over
  // the real Fastify request. The core merges the request locale on top.
  const baseContext = (request: FastifyRequest) => () => extractSecurityContext(request)

  // Fastify route options preserve per-route body limits and schema validation;
  // the handlers themselves are thin port translations onto the core.
  const postOptions = { bodyLimit, schema: { body: { type: 'object', additionalProperties: true } } }
  const queryStringOptions = {
    schema: {
      querystring: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query']
      }
    }
  }

  // ============================================
  // REST endpoints (all served via the core)
  // ============================================

  fastify.post(`${basePath}/load`, postOptions, (request, reply) =>
    httpHandler.handleLoadPost(createFastifyPort(request, reply), baseContext(request))
  )

  fastify.get(`${basePath}/load`, queryStringOptions, (request, reply) =>
    httpHandler.handleLoadGet(createFastifyPort(request, reply), baseContext(request))
  )

  fastify.post(`${basePath}/batch`, {
    bodyLimit,
    schema: {
      body: {
        type: 'object',
        required: ['queries'],
        properties: { queries: { type: 'array', items: { type: 'object' } } }
      }
    }
  }, (request, reply) =>
    httpHandler.handleBatchPost(createFastifyPort(request, reply), baseContext(request))
  )

  fastify.get(`${basePath}/meta`, (request, reply) =>
    httpHandler.handleMetaGet(createFastifyPort(request, reply))
  )

  fastify.post(`${basePath}/sql`, postOptions, (request, reply) =>
    httpHandler.handleSqlPost(createFastifyPort(request, reply), baseContext(request))
  )

  fastify.get(`${basePath}/sql`, queryStringOptions, (request, reply) =>
    httpHandler.handleSqlGet(createFastifyPort(request, reply), baseContext(request))
  )

  fastify.post(`${basePath}/dry-run`, postOptions, (request, reply) =>
    httpHandler.handleDryRunPost(createFastifyPort(request, reply), baseContext(request))
  )

  fastify.get(`${basePath}/dry-run`, queryStringOptions, (request, reply) =>
    httpHandler.handleDryRunGet(createFastifyPort(request, reply), baseContext(request))
  )

  fastify.post(`${basePath}/explain`, postOptions, (request, reply) =>
    httpHandler.handleExplainPost(createFastifyPort(request, reply), baseContext(request))
  )

  // ============================================
  // Agent (Agentic AI Notebook) Endpoint
  // ============================================

  if (agentConfig) {
    /**
     * POST /cubejs-api/v1/agent/chat - Agentic AI notebook chat
     * Streams SSE events as the agent discovers data, executes queries,
     * and creates visualizations. Inherently transport-bound, so it stays inline.
     */
    fastify.post(`${basePath}/agent/chat`, {
      bodyLimit,
      schema: {
        body: {
          type: 'object',
          additionalProperties: true
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { handleAgentChat } = await import('../../server/agent/handler.js')

        const body = request.body as any
        const { message, sessionId, history } = body as { message: string; sessionId?: string; history?: import('../../server/agent/types.js').AgentHistoryMessage[] }

        if (!message || typeof message !== 'string') {
          return reply.status(400).send({ error: 'message is required and must be a string' })
        }

        // Resolve API key: server config or client header override
        let apiKey = (agentConfig.apiKey || '').trim()
        if (agentConfig.allowClientApiKey) {
          const clientKey = readFastifyHeader(request, 'x-agent-api-key')
          if (clientKey) {
            apiKey = clientKey.trim()
          }
        }

        if (!apiKey) {
          return reply.status(401).send({
            error: 'No API key configured. Set agent.apiKey in server config or send X-Agent-Api-Key header.'
          })
        }

        // Per-request provider overrides from client headers
        const providerOverride = agentConfig.allowClientApiKey ? readFastifyHeader(request, 'x-agent-provider') : undefined
        const modelOverride = agentConfig.allowClientApiKey ? readFastifyHeader(request, 'x-agent-model') : undefined
        const baseURLOverride = agentConfig.allowClientApiKey ? readFastifyHeader(request, 'x-agent-provider-endpoint') : undefined

        // Extract security context (required for all queries), merging request locale
        const securityContext = withLocaleFromHeaders(
          await extractSecurityContext(request),
          (header) => readFastifyHeader(request, header)
        )

        // Build per-request system context from the callback (if configured)
        const systemContext = agentConfig.buildSystemContext?.(securityContext)

        // Set SSE headers and use raw response for streaming
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        })

        try {
          const events = handleAgentChat({
            message,
            sessionId,
            history,
            semanticLayer,
            securityContext,
            agentConfig,
            apiKey,
            systemContext,
            providerOverride,
            modelOverride,
            baseURLOverride,
          })

          for await (const event of events) {
            reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)
          }
        } catch (error) {
          const errorEvent = {
            type: 'error',
            data: { message: error instanceof Error ? error.message : 'Stream failed' }
          }
          reply.raw.write(`data: ${JSON.stringify(errorEvent)}\n\n`)
        } finally {
          reply.raw.end()
        }
      } catch (error) {
        request.log.error(error, 'Agent chat error')
        if (!reply.raw.headersSent) {
          return reply.status(500).send({
            error: error instanceof Error ? error.message : 'Agent chat failed'
          })
        }
      }
    })
  }

  // ============================================
  // MCP (AI-Ready) Endpoints
  // ============================================

  if (mcp.enabled !== false) {
    const mcpBasePath = mcp.basePath ?? '/mcp'

    /**
     * MCP Streamable HTTP endpoint (JSON-RPC 2.0 + optional SSE)
     * Implements MCP 2025-11-25 spec
     * POST /mcp      - JSON-RPC request/notification (dispatched via the core)
     * GET  /mcp      - Optional receive-only SSE channel (heartbeat only for now)
     * DELETE /mcp    - Session termination
     */
    fastify.post(`${mcpBasePath}`, {
      bodyLimit,
      schema: {
        body: {
          type: 'object',
          additionalProperties: true
        }
      }
    }, (request, reply) =>
      httpHandler.handleMcpPost(createFastifyPort(request, reply), baseContext(request))
    )

    fastify.get(`${mcpBasePath}`, async (request: FastifyRequest, reply: FastifyReply) => {
      const originValidation = validateOriginHeader(request.headers.origin, originOptionsFromMcp(mcp))
      if (!originValidation.valid) {
        return reply.status(403).send({ error: originValidation.reason })
      }

      if (mcp.resourceMetadataUrl && !extractBearerToken(request.headers.authorization)) {
        reply.header('WWW-Authenticate', buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl))
        return reply.status(401).send({ error: 'Bearer token required' })
      }

      const eventId = primeEventId()
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      })

      reply.raw.write(serializeSseEvent({
        jsonrpc: '2.0',
        method: 'mcp/ready',
        params: { protocol: 'streamable-http' }
      }, eventId, 15000))

      const keepAlive = setInterval(() => {
        reply.raw.write(': keep-alive\n\n')
      }, 15000)

      request.raw.on('close', () => {
        clearInterval(keepAlive)
      })
    })

    /**
     * DELETE handler for session termination (MCP 2025-11-25)
     * Clients SHOULD send DELETE to terminate sessions
     */
    fastify.delete(`${mcpBasePath}`, async (_request: FastifyRequest, reply: FastifyReply) => {
      const originValidation = validateOriginHeader(_request.headers.origin, originOptionsFromMcp(mcp))
      if (!originValidation.valid) {
        return reply.status(403).send({ error: originValidation.reason })
      }

      if (mcp.resourceMetadataUrl && !extractBearerToken(_request.headers.authorization)) {
        reply.header('WWW-Authenticate', buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl))
        return reply.status(401).send({ error: 'Bearer token required' })
      }

      // For now, return 405 Method Not Allowed as we don't track sessions server-side
      // A full implementation would track sessions and clean up resources here
      return reply.status(405).send({ error: 'Session termination not supported' })
    })

  }

  // Global error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    request.log.error(error, 'Fastify cube adapter error')

    if (reply.statusCode < 400) {
      reply.status(500)
    }

    const errorArg = error instanceof Error ? error : String(error)
    return formatErrorResponse(errorArg, reply.statusCode)
  })

  done()
}

/**
 * Helper function to register cube routes on an existing Fastify instance
 */
export async function registerCubeRoutes(
  fastify: FastifyInstance,
  options: FastifyAdapterOptions
): Promise<void> {
  await fastify.register(cubePlugin as any, options)
}

/**
 * Create a complete Fastify instance with Cube.js routes
 *
 * @example
 * const app = createCubeApp({
 *   cubes: [salesCube, employeesCube],
 *   drizzle: db,
 *   schema,
 *   extractSecurityContext: async (request) => {
 *     const token = request.headers.authorization?.replace('Bearer ', '')
 *     const decoded = await verifyJWT(token)
 *     return { organisationId: decoded.orgId, userId: decoded.userId }
 *   }
 * })
 */
export function createCubeApp(
  options: FastifyAdapterOptions
): FastifyInstance {
  const fastify = require('fastify')({
    logger: true
  })

  fastify.register(cubePlugin as any, options)

  return fastify
}

// Re-export types for convenience
export type { SecurityContext, DatabaseExecutor, SemanticQuery, DrizzleDatabase, FastifyCorsOptions }

/**
 * Express adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints for Express applications with Drizzle ORM
 *
 * This adapter holds only framework translation: it maps Express req/res to an
 * {@link McpHttpPort} and routes to the framework-agnostic core
 * (`src/adapters/core`). All request-handling logic (validate / execute /
 * format, MCP dispatch) lives in the core. The exceptions that remain here are
 * inherently transport-bound: the agent/chat SSE stream and the long-lived
 * GET/DELETE `/mcp` lifecycle.
 */

import express, { Router, Request, Response, NextFunction, Express } from 'express'
import cors from 'cors'
import type { CorsOptions } from 'cors'
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

/**
 * Construct an {@link McpHttpPort} over an Express request/response pair.
 * Drives every core handler (REST + MCP); see `src/adapters/core`.
 */
function createExpressPort(req: Request, res: Response): McpHttpPort<Response> {
  return {
    getHeader: (name) => req.get(name),
    getBody: async () => req.body,
    getQueryParam: (name) => req.query[name] as string | undefined,
    send: (status, body) => res.status(status).json(body),
    setHeader: (name, value) => { res.setHeader(name, value) },
    sendEmpty: (status) => res.status(status).end(),
    sendSse: (status, body) => {
      res.status(status)
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.write(body)
      return res.end()
    }
  }
}

export interface ExpressAdapterOptions {
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
   * @param req - Express Request object containing the incoming HTTP request
   * @param res - Express Response object
   * @returns Security context with organisationId, userId, roles, etc.
   *
   * @example
   * extractSecurityContext: async (req, res) => {
   *   // Extract JWT from Authorization header
   *   const token = req.headers.authorization?.replace('Bearer ', '')
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
  extractSecurityContext: (req: Request, res: Response) => SecurityContext | Promise<SecurityContext>

  /**
   * Database engine type (optional - auto-detected if not provided)
   */
  engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'

  /**
   * CORS configuration (optional)
   */
  cors?: CorsOptions

  /**
   * API base path (default: '/cubejs-api/v1')
   */
  basePath?: string

  /**
   * JSON body parser limit (default: '10mb')
   */
  jsonLimit?: string

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
 * Create Express router for Cube.js-compatible API
 */
export function createCubeRouter(
  options: ExpressAdapterOptions
): Router {
  const {
    cubes,
    drizzle,
    schema,
    extractSecurityContext,
    engineType,
    cors: corsConfig,
    basePath = '/cubejs-api/v1',
    jsonLimit = '10mb',
    cache,
    mcp = { enabled: true },
    agent: agentConfig
  } = options

  // Validate required options
  if (!cubes || cubes.length === 0) {
    throw new Error('At least one cube must be provided in the cubes array')
  }

  const router = Router()

  // Configure CORS if provided
  if (corsConfig) {
    const localeAwareCorsConfig: CorsOptions = {
      ...corsConfig,
      allowedHeaders: ensureLocaleHeader(corsConfig.allowedHeaders)
    }
    router.use(cors(localeAwareCorsConfig))
  }

  // JSON body parser with size limit
  router.use(express.json({ limit: jsonLimit }))

  // URL-encoded parser (for GET requests with complex queries)
  router.use(express.urlencoded({ extended: true, limit: jsonLimit }))

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
  // through here — this adapter only translates req/res to a port and routes.
  const httpHandler = createCubeHttpHandler({
    semanticLayer,
    // codeql[js/log-injection] error source is internal, not user-controlled
    onError: (error) => console.error('Query execution error:', error),
    mcp
  })

  // Per-request base-context thunk: the user's extractSecurityContext closed
  // over the real Express req/res. The core merges the request locale on top.
  const baseContext = (req: Request, res: Response) => () => extractSecurityContext(req, res)

  // ============================================
  // REST endpoints (all served via the core)
  // ============================================

  router.post(`${basePath}/load`, async (req: Request, res: Response) => {
    await httpHandler.handleLoadPost(createExpressPort(req, res), baseContext(req, res))
  })

  router.get(`${basePath}/load`, async (req: Request, res: Response) => {
    await httpHandler.handleLoadGet(createExpressPort(req, res), baseContext(req, res))
  })

  router.post(`${basePath}/batch`, async (req: Request, res: Response) => {
    await httpHandler.handleBatchPost(createExpressPort(req, res), baseContext(req, res))
  })

  router.get(`${basePath}/meta`, (req: Request, res: Response) => {
    httpHandler.handleMetaGet(createExpressPort(req, res))
  })

  router.post(`${basePath}/sql`, async (req: Request, res: Response) => {
    await httpHandler.handleSqlPost(createExpressPort(req, res), baseContext(req, res))
  })

  router.get(`${basePath}/sql`, async (req: Request, res: Response) => {
    await httpHandler.handleSqlGet(createExpressPort(req, res), baseContext(req, res))
  })

  router.post(`${basePath}/dry-run`, async (req: Request, res: Response) => {
    await httpHandler.handleDryRunPost(createExpressPort(req, res), baseContext(req, res))
  })

  router.get(`${basePath}/dry-run`, async (req: Request, res: Response) => {
    await httpHandler.handleDryRunGet(createExpressPort(req, res), baseContext(req, res))
  })

  router.post(`${basePath}/explain`, async (req: Request, res: Response) => {
    await httpHandler.handleExplainPost(createExpressPort(req, res), baseContext(req, res))
  })

  // ============================================
  // Agent (Agentic AI Notebook) Endpoint
  // ============================================

  if (agentConfig) {
    /**
     * POST /cubejs-api/v1/agent/chat - Agentic AI notebook chat
     * Streams SSE events as the agent discovers data, executes queries,
     * and creates visualizations.
     */
    router.post(`${basePath}/agent/chat`, async (req: Request, res: Response) => {
      try {
        const { handleAgentChat } = await import('../../server/agent/handler.js')

        const { message, sessionId, history } = req.body as { message: string; sessionId?: string; history?: import('../../server/agent/types.js').AgentHistoryMessage[] }

        if (!message || typeof message !== 'string') {
          return res.status(400).json({ error: 'message is required and must be a string' })
        }

        // Resolve API key: server config or client header override
        let apiKey = (agentConfig.apiKey || '').trim()
        if (agentConfig.allowClientApiKey) {
          const clientKey = req.headers['x-agent-api-key'] as string | undefined
          if (clientKey) {
            apiKey = clientKey.trim()
          }
        }

        if (!apiKey) {
          return res.status(401).json({
            error: 'No API key configured. Set agent.apiKey in server config or send X-Agent-Api-Key header.'
          })
        }

        // Per-request provider overrides from client headers
        const providerOverride = agentConfig.allowClientApiKey ? req.headers['x-agent-provider'] as string | undefined : undefined
        const modelOverride = agentConfig.allowClientApiKey ? req.headers['x-agent-model'] as string | undefined : undefined
        const baseURLOverride = agentConfig.allowClientApiKey ? req.headers['x-agent-provider-endpoint'] as string | undefined : undefined

        // Extract security context (required for all queries), merging request locale
        const securityContext = withLocaleFromHeaders(
          await extractSecurityContext(req, res),
          (header) => req.get(header)
        )

        // Build per-request system context from the callback (if configured)
        const systemContext = agentConfig.buildSystemContext?.(securityContext)

        // Set SSE headers
        res.writeHead(200, {
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
            res.write(`data: ${JSON.stringify(event)}\n\n`)
          }
        } catch (error) {
          const errorEvent = {
            type: 'error',
            data: { message: error instanceof Error ? error.message : 'Stream failed' }
          }
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`)
        } finally {
          res.end()
        }
      } catch (error) {
        console.error('Agent chat error:', error)
        if (!res.headersSent) {
          res.status(500).json({
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
    router.post(`${mcpBasePath}`, async (req: Request, res: Response) => {
      await httpHandler.handleMcpPost(createExpressPort(req, res), baseContext(req, res))
    })

    router.get(`${mcpBasePath}`, async (req: Request, res: Response) => {
      const originValidation = validateOriginHeader(req.headers.origin, originOptionsFromMcp(mcp))
      if (!originValidation.valid) {
        return res.status(403).json({ error: originValidation.reason })
      }

      if (mcp.resourceMetadataUrl && !extractBearerToken(req.headers.authorization)) {
        res.setHeader('WWW-Authenticate', buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl))
        return res.status(401).json({ error: 'Bearer token required' })
      }

      const eventId = primeEventId()
      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.write(serializeSseEvent({
        jsonrpc: '2.0',
        method: 'mcp/ready',
        params: { protocol: 'streamable-http' }
      }, eventId, 15000))

      const keepAlive = setInterval(() => {
        res.write(': keep-alive\n\n')
      }, 15000)

      req.on('close', () => {
        clearInterval(keepAlive)
      })
    })

    /**
     * DELETE handler for session termination (MCP 2025-11-25)
     * Clients SHOULD send DELETE to terminate sessions
     */
    router.delete(`${mcpBasePath}`, (_req: Request, res: Response) => {
      const originValidation = validateOriginHeader(_req.headers.origin, originOptionsFromMcp(mcp))
      if (!originValidation.valid) {
        return res.status(403).json({ error: originValidation.reason })
      }

      if (mcp.resourceMetadataUrl && !extractBearerToken(_req.headers.authorization)) {
        res.setHeader('WWW-Authenticate', buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl))
        return res.status(401).json({ error: 'Bearer token required' })
      }

      // For now, return 405 Method Not Allowed as we don't track sessions server-side
      // A full implementation would track sessions and clean up resources here
      return res.status(405).json({ error: 'Session termination not supported' })
    })
  }

  // Error handling middleware for the router
  router.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Express adapter error:', error)
    if (!res.headersSent) {
      res.status(500).json(formatErrorResponse(error, 500))
    }
  })

  return router
}

/**
 * Convenience function to mount Cube routes on an existing Express app
 */
export function mountCubeRoutes(
  app: Express,
  options: ExpressAdapterOptions
): Express {
  const cubeRouter = createCubeRouter(options)
  app.use('/', cubeRouter)
  return app
}

/**
 * Create a complete Express app with Cube.js routes
 *
 * @example
 * const app = createCubeApp({
 *   cubes: [salesCube, employeesCube],
 *   drizzle: db,
 *   schema,
 *   extractSecurityContext: async (req, res) => {
 *     const token = req.headers.authorization?.replace('Bearer ', '')
 *     const decoded = await verifyJWT(token)
 *     return { organisationId: decoded.orgId, userId: decoded.userId }
 *   }
 * })
 */
export function createCubeApp(
  options: ExpressAdapterOptions
): Express {
  const app = express()
  return mountCubeRoutes(app, options)
}

// Re-export types for convenience
export type { SecurityContext, DatabaseExecutor, SemanticQuery, DrizzleDatabase, CorsOptions }

/**
 * Hono adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints for Hono applications with Drizzle ORM
 *
 * This adapter holds only framework translation: it maps a Hono `Context` to an
 * {@link McpHttpPort} and routes to the framework-agnostic core
 * (`src/adapters/core`). All request-handling logic (validate / execute / format,
 * MCP dispatch) lives in the core. The exceptions that remain here are inherently
 * transport-bound: the agent/chat SSE stream and the long-lived GET/DELETE `/mcp`
 * lifecycle.
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import { cors } from 'hono/cors'
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
import { handleAgentChatRequest } from './agent-handler.js'
import { ensureLocaleHeader } from '../locale.js'
import { createCubeHttpHandler, withLocaleFromHeaders, type McpHttpPort } from '../core/index.js'

/**
 * Construct an {@link McpHttpPort} over a Hono `Context`.
 * Drives every core handler (REST + MCP); see `src/adapters/core`.
 *
 * Headers set via `setHeader` (e.g. MCP-Session-Id, WWW-Authenticate) are applied
 * through `c.header`, so they are merged into the response produced by
 * `c.json`/`c.body`.
 */
function createHonoPort(c: Context): McpHttpPort<Response> {
  return {
    getHeader: (name) => c.req.header(name),
    getBody: async () => {
      // Tolerate an absent/invalid JSON body (mirrors the original `.catch(() => null)`);
      // the core maps a null MCP body to a JSON-RPC parse error.
      try {
        return await c.req.json()
      } catch {
        return null
      }
    },
    getQueryParam: (name) => c.req.query(name),
    send: (status, body) => c.json(body as any, status as any),
    setHeader: (name, value) => { c.header(name, value) },
    sendEmpty: (status) => c.body(null, status as any),
    sendSse: (status, body) => {
      c.header('Content-Type', 'text/event-stream')
      c.header('Cache-Control', 'no-cache')
      c.header('Connection', 'keep-alive')
      return c.body(body, status as any)
    }
  }
}

export interface HonoAdapterOptions {
  /**
   * Array of cube definitions to register.
   * Optional when `semanticLayer` is provided (caller manages registration).
   */
  cubes?: Cube[]

  /**
   * Pre-configured SemanticLayerCompiler instance.
   * When provided, skips creating a new compiler and cube registration (caller manages it).
   */
  semanticLayer?: SemanticLayerCompiler

  /**
   * Drizzle database instance.
   * Required unless `semanticLayer` is provided.
   * Accepts PostgreSQL, MySQL, or SQLite database instances.
   */
  drizzle?: PostgresJsDatabase<any> | MySql2Database<any> | BetterSQLite3Database<any> | DrizzleDatabase

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
   * @param c - Hono context containing the incoming HTTP request
   * @returns Security context with organisationId, userId, roles, etc.
   *
   * @example
   * extractSecurityContext: async (c) => {
   *   // Extract JWT from Authorization header
   *   const token = c.req.header('Authorization')?.replace('Bearer ', '')
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
  extractSecurityContext: (c: any) => SecurityContext | Promise<SecurityContext>

  /**
   * Database engine type (optional - auto-detected if not provided)
   */
  engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'

  /**
   * CORS configuration (optional)
   */
  cors?: {
    origin?: string | string[] | ((origin: string, c: any) => string | null | undefined)
    allowMethods?: string[]
    allowHeaders?: string[]
    credentials?: boolean
  }

  /**
   * API base path (default: '/cubejs-api/v1')
   */
  basePath?: string

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
 * Create Hono routes for Cube.js-compatible API
 */
export function createCubeRoutes(
  options: HonoAdapterOptions
) {
  const {
    cubes,
    drizzle,
    schema,
    extractSecurityContext,
    engineType,
    cors: corsConfig,
    basePath = '/cubejs-api/v1',
    cache,
    mcp = { enabled: true },
    agent: agentConfig
  } = options

  // Validate: need either semanticLayer or (cubes + drizzle)
  if (!options.semanticLayer && (!cubes || cubes.length === 0)) {
    throw new Error('Either semanticLayer or a non-empty cubes array must be provided')
  }

  const app = new Hono()

  // Configure CORS if provided
  if (corsConfig) {
    const localeAwareCorsConfig = {
      ...corsConfig,
      allowHeaders: ensureLocaleHeader(corsConfig.allowHeaders)
    }
    app.use('/*', cors(localeAwareCorsConfig as any))
  }

  // Use provided semantic layer or create a new one
  const semanticLayer = options.semanticLayer ?? new SemanticLayerCompiler({
    drizzle,
    schema,
    engineType,
    cache,
    rlsSetup: options.rlsSetup
  })

  // Register cubes only when we created the compiler (not caller-managed)
  if (!options.semanticLayer && cubes) {
    cubes.forEach(cube => {
      semanticLayer.registerCube(cube)
    })
  }

  // Framework-agnostic core. The base-context thunk returns the pre-locale
  // context; the core does the locale merge. Every REST + MCP handler funnels
  // through here — this adapter only translates the Hono context to a port.
  const httpHandler = createCubeHttpHandler({
    semanticLayer,
    onError: (error) => console.error('Query execution error:', error),
    mcp
  })

  // Per-request base-context thunk: the user's extractSecurityContext closed over
  // the real Hono context. The core merges the request locale on top.
  const baseContext = (c: Context) => () => extractSecurityContext(c)

  // ============================================
  // REST endpoints (all served via the core)
  // ============================================

  app.post(`${basePath}/load`, (c) => httpHandler.handleLoadPost(createHonoPort(c), baseContext(c)))
  app.get(`${basePath}/load`, (c) => httpHandler.handleLoadGet(createHonoPort(c), baseContext(c)))
  app.post(`${basePath}/batch`, (c) => httpHandler.handleBatchPost(createHonoPort(c), baseContext(c)))
  app.get(`${basePath}/meta`, (c) => httpHandler.handleMetaGet(createHonoPort(c)))
  app.post(`${basePath}/sql`, (c) => httpHandler.handleSqlPost(createHonoPort(c), baseContext(c)))
  app.get(`${basePath}/sql`, (c) => httpHandler.handleSqlGet(createHonoPort(c), baseContext(c)))
  app.post(`${basePath}/dry-run`, (c) => httpHandler.handleDryRunPost(createHonoPort(c), baseContext(c)))
  app.get(`${basePath}/dry-run`, (c) => httpHandler.handleDryRunGet(createHonoPort(c), baseContext(c)))
  app.post(`${basePath}/explain`, (c) => httpHandler.handleExplainPost(createHonoPort(c), baseContext(c)))

  // ============================================
  // Agent (Agentic AI Notebook) Endpoint
  // ============================================

  if (agentConfig) {
    /**
     * POST /cubejs-api/v1/agent/chat - Agentic AI notebook chat
     * Streams SSE events as the agent discovers data, executes queries,
     * and creates visualizations. Inherently transport-bound, so it stays inline.
     */
    app.post(`${basePath}/agent/chat`, (c) =>
      handleAgentChatRequest(c, agentConfig, semanticLayer, (ctx) =>
        Promise.resolve(extractSecurityContext(ctx)).then((base) =>
          withLocaleFromHeaders(base, (header) => ctx.req.header(header))
        )
      )
    )
  }

  // ============================================
  // MCP (AI-Ready) Endpoints
  // ============================================

  if (mcp.enabled !== false) {
    const mcpBasePath = mcp.basePath ?? '/mcp'

    /**
     * MCP Streamable HTTP endpoint (JSON-RPC 2.0 + optional SSE)
     * Implements MCP 2025-11-25 spec. POST is dispatched via the core; the
     * receive-only GET stream and DELETE lifecycle stay inline (transport-bound).
     */
    app.post(`${mcpBasePath}`, (c) => httpHandler.handleMcpPost(createHonoPort(c), baseContext(c)))

    /**
     * DELETE handler for session termination (MCP 2025-11-25)
     * Clients SHOULD send DELETE to terminate sessions
     */
    app.delete(`${mcpBasePath}`, (c) => {
      const originValidation = validateOriginHeader(c.req.header('origin'), originOptionsFromMcp(mcp))
      if (!originValidation.valid) {
        return c.json({ error: originValidation.reason }, 403)
      }

      if (mcp.resourceMetadataUrl && !extractBearerToken(c.req.header('authorization'))) {
        c.header('WWW-Authenticate', buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl))
        return c.json({ error: 'Bearer token required' }, 401)
      }

      // For now, return 405 Method Not Allowed as we don't track sessions server-side
      // A full implementation would track sessions and clean up resources here
      return c.json({ error: 'Session termination not supported' }, 405)
    })

    app.get(`${mcpBasePath}`, (c) => {
      const originValidation = validateOriginHeader(c.req.header('origin'), originOptionsFromMcp(mcp))
      if (!originValidation.valid) {
        return c.json({ error: originValidation.reason }, 403)
      }

      if (mcp.resourceMetadataUrl && !extractBearerToken(c.req.header('authorization'))) {
        c.header('WWW-Authenticate', buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl))
        return c.json({ error: 'Bearer token required' }, 401)
      }

      const encoder = new TextEncoder()
      const eventId = primeEventId()
      let keepAlive: ReturnType<typeof setInterval>
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(serializeSseEvent({
            jsonrpc: '2.0',
            method: 'mcp/ready',
            params: { protocol: 'streamable-http' }
          }, eventId, 15000)))

          keepAlive = setInterval(() => {
            controller.enqueue(encoder.encode(': keep-alive\n\n'))
          }, 15000)
        },
        cancel() {
          clearInterval(keepAlive)
        }
      })

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      })
    })

  }

  return app
}

/**
 * Convenience function to create routes and mount them on an existing Hono app
 */
export function mountCubeRoutes(
  app: Hono,
  options: HonoAdapterOptions
) {
  const cubeRoutes = createCubeRoutes(options)
  app.route('/', cubeRoutes)
  return app
}

/**
 * Create a complete Hono app with Cube.js routes
 *
 * @example
 * const app = createCubeApp({
 *   cubes: [salesCube, employeesCube],
 *   drizzle: db,
 *   schema,
 *   extractSecurityContext: async (c) => {
 *     const token = c.req.header('Authorization')
 *     const decoded = await verifyJWT(token)
 *     return { organisationId: decoded.orgId, userId: decoded.userId }
 *   }
 * })
 */
export function createCubeApp(
  options: HonoAdapterOptions
) {
  const app = new Hono()
  return mountCubeRoutes(app, options)
}

// Re-export types for convenience
export type { SecurityContext, DatabaseExecutor, SemanticQuery, DrizzleDatabase }

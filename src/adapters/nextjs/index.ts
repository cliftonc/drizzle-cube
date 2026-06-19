/**
 * Next.js App Router adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints as Next.js route handlers
 *
 * The Cube.js REST endpoints (`load`/`meta`/`sql`/`dry-run`/`batch`/`explain`) and
 * MCP POST are served by the framework-agnostic core (`src/adapters/core`); each
 * handler factory only maps `NextRequest`/`NextResponse` to a port and routes by
 * HTTP method. The endpoints that stay inline are the AI-discovery helpers
 * (`discover`/`suggest`/`validate`/`mcp-load`, which are Next.js-only) and the
 * transport-bound flows (agent/chat SSE, MCP GET stream).
 */

import { NextRequest, NextResponse } from 'next/server'
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
  handleDiscover,
  handleSuggest,
  handleValidate,
  handleLoad,
  type MCPOptions,
  type DiscoverRequest,
  type SuggestRequest,
  type ValidateRequest,
  type LoadRequest
} from '../utils.js'
import {
  extractBearerToken,
  buildWwwAuthenticateChallenge
} from '../mcp-transport.js'
import {
  type ApplyCors,
  buildMcpGetResponse
} from './mcp-handler.js'
import { ensureLocaleHeader, resolveRequestLocale, withLocaleInSecurityContext } from '../locale.js'
import {
  createCubeHttpHandler,
  withLocaleFromHeaders,
  type CubeHttpHandler,
  type McpHttpPort,
  type BaseSecurityContextThunk
} from '../core/index.js'

export interface NextCorsOptions {
  /**
   * Allowed origins for CORS
   */
  origin?: string | string[] | ((origin: string) => boolean)

  /**
   * Allowed HTTP methods
   */
  methods?: string[]

  /**
   * Allowed headers
   */
  allowedHeaders?: string[]

  /**
   * Allow credentials
   */
  credentials?: boolean
}

export interface NextAdapterOptions {
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
   * @param request - Next.js Request object containing the incoming HTTP request
   * @param context - Route context with params (optional)
   * @returns Security context with organisationId, userId, roles, etc.
   *
   * @example
   * extractSecurityContext: async (request, context) => {
   *   // Extract JWT from Authorization header
   *   const token = request.headers.get('Authorization')?.replace('Bearer ', '')
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
  extractSecurityContext: (request: NextRequest, context?: RouteContext) => SecurityContext | Promise<SecurityContext>

  /**
   * Database engine type (optional - auto-detected if not provided)
   */
  engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'

  /**
   * CORS configuration (optional)
   */
  cors?: NextCorsOptions

  /**
   * Runtime environment (default: 'nodejs')
   * 'edge' for Edge Runtime, 'nodejs' for Node.js Runtime
   */
  runtime?: 'edge' | 'nodejs'

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

  /**
   * Pre-built semantic layer to reuse across handlers.
   * When provided, the adapter reuses this compiler instead of constructing a
   * new one (and skips cube registration — register cubes on it yourself).
   * `createCubeHandlers` sets this internally so every handler it returns shares
   * one compiler, keeping metadata/result caches consistent. Mirrors the Hono
   * adapter's `semanticLayer` option.
   */
  semanticLayer?: SemanticLayerCompiler
}

export interface RouteContext {
  params?: Record<string, string | string[]>
}

export type RouteHandler = (
  request: NextRequest,
  context?: RouteContext
) => Promise<Response>

export interface CubeHandlers {
  load: RouteHandler
  meta: RouteHandler
  sql: RouteHandler
  dryRun: RouteHandler
  batch: RouteHandler
  explain: RouteHandler
  mcpRpc?: RouteHandler
  agentChat?: RouteHandler
}

/**
 * Helper function to create and configure semantic layer from options
 */
function createSemanticLayer(
  options: NextAdapterOptions
): SemanticLayerCompiler {
  // Reuse a pre-built compiler when one is injected (e.g. by createCubeHandlers)
  // so all handlers share a single metadata/result cache.
  if (options.semanticLayer) {
    return options.semanticLayer
  }

  const { cubes, drizzle, schema, engineType, cache, rlsSetup } = options

  // Validate required options
  if (!cubes || cubes.length === 0) {
    throw new Error('At least one cube must be provided in the cubes array')
  }

  // Create semantic layer and register all cubes
  const semanticLayer = new SemanticLayerCompiler({
    drizzle,
    schema,
    engineType,
    cache,
    rlsSetup
  })

  // Register all provided cubes
  cubes.forEach(cube => {
    semanticLayer.registerCube(cube)
  })

  return semanticLayer
}

function getLocaleAwareRequestOptions(options: NextAdapterOptions): {
  extractSecurityContext: (request: NextRequest, context?: RouteContext) => Promise<SecurityContext>
  cors?: NextCorsOptions
} {
  const extractSecurityContextWithLocale = async (
    request: NextRequest,
    context?: RouteContext
  ): Promise<SecurityContext> => {
    const securityContext = await options.extractSecurityContext(request, context)
    const requestLocale = resolveRequestLocale((header) => request.headers.get(header))
    return withLocaleInSecurityContext(securityContext, requestLocale)
  }

  const cors = options.cors
    ? {
        ...options.cors,
        allowedHeaders: ensureLocaleHeader(options.cors.allowedHeaders)
      }
    : undefined

  return {
    extractSecurityContext: extractSecurityContextWithLocale,
    cors
  }
}

/**
 * Generate CORS headers for Next.js responses
 */
function getCorsHeaders(request: NextRequest, corsOptions: NextCorsOptions): Record<string, string> {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {}

  // Handle origin
  if (corsOptions.origin) {
    if (typeof corsOptions.origin === 'string') {
      headers['Access-Control-Allow-Origin'] = corsOptions.origin
    } else if (Array.isArray(corsOptions.origin)) {
      if (origin && corsOptions.origin.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin
      }
    } else if (typeof corsOptions.origin === 'function') {
      if (origin && corsOptions.origin(origin)) {
        headers['Access-Control-Allow-Origin'] = origin
      }
    }
  }

  // Handle methods
  if (corsOptions.methods) {
    headers['Access-Control-Allow-Methods'] = corsOptions.methods.join(', ')
  }

  // Handle headers
  if (corsOptions.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = corsOptions.allowedHeaders.join(', ')
  }

  // Handle credentials
  if (corsOptions.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true'
  }

  return headers
}

/**
 * Per-request handle on the framework-agnostic core, plus the CORS-header and
 * base-context helpers each route handler needs. Built once per handler factory.
 */
interface NextCore {
  httpHandler: CubeHttpHandler
  corsHeaders: (request: NextRequest) => Record<string, string>
  baseContext: (request: NextRequest, context?: RouteContext) => BaseSecurityContextThunk
}

/**
 * Build the core HTTP handler for a Next.js handler factory. The base-context
 * thunk returns the pre-locale context; the core merges the request locale.
 */
function createNextCore(options: NextAdapterOptions): NextCore {
  const semanticLayer = createSemanticLayer(options)
  const httpHandler = createCubeHttpHandler({
    semanticLayer,
    onError: (error) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js handler error:', error)
      }
    },
    mcp: options.mcp
  })

  const corsConfig = options.cors
    ? { ...options.cors, allowedHeaders: ensureLocaleHeader(options.cors.allowedHeaders) }
    : undefined
  const corsHeaders = (request: NextRequest) => (corsConfig ? getCorsHeaders(request, corsConfig) : {})
  const baseContext = (request: NextRequest, context?: RouteContext) => () =>
    options.extractSecurityContext(request, context)

  return { httpHandler, corsHeaders, baseContext }
}

/**
 * Construct an {@link McpHttpPort} over a `NextRequest`. CORS headers (computed
 * once per request) and any headers set via `setHeader` (MCP-Session-Id) are
 * attached to every response. Drives every core handler (REST + MCP POST).
 */
function createNextPort(request: NextRequest, corsHeaders: Record<string, string>): McpHttpPort<NextResponse> {
  const extraHeaders: Record<string, string> = {}
  return {
    getHeader: (name) => request.headers.get(name) ?? undefined,
    getBody: async () => {
      try {
        return await request.json()
      } catch {
        return null
      }
    },
    getQueryParam: (name) => request.nextUrl.searchParams.get(name) ?? undefined,
    send: (status, body) =>
      NextResponse.json(body, { status, headers: { ...corsHeaders, ...extraHeaders } }),
    setHeader: (name, value) => { extraHeaders[name] = value },
    sendEmpty: (status) => new NextResponse(null, { status, headers: { ...corsHeaders, ...extraHeaders } }),
    sendSse: (status, body) =>
      new NextResponse(body, {
        status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          ...corsHeaders,
          ...extraHeaders
        }
      })
  }
}

/**
 * Create OPTIONS handler for CORS preflight requests
 */
export function createOptionsHandler(corsOptions: NextCorsOptions): RouteHandler {
  return async function optionsHandler(request: NextRequest) {
    const localeAwareCorsOptions: NextCorsOptions = {
      ...corsOptions,
      allowedHeaders: ensureLocaleHeader(corsOptions.allowedHeaders)
    }
    const corsHeaders = getCorsHeaders(request, localeAwareCorsOptions)
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }
}

/**
 * Create load handler - Execute queries (GET + POST via the core)
 */
export function createLoadHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { httpHandler, corsHeaders, baseContext } = createNextCore(options)

  return async function loadHandler(request: NextRequest, context?: RouteContext) {
    const port = createNextPort(request, corsHeaders(request))
    if (request.method === 'POST') {
      return httpHandler.handleLoadPost(port, baseContext(request, context))
    }
    if (request.method === 'GET') {
      return httpHandler.handleLoadGet(port, baseContext(request, context))
    }
    return NextResponse.json(formatErrorResponse('Method not allowed', 405), { status: 405 })
  }
}

/**
 * Create meta handler - Get cube metadata
 */
export function createMetaHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { httpHandler, corsHeaders } = createNextCore(options)

  return async function metaHandler(request: NextRequest, _context?: RouteContext) {
    return httpHandler.handleMetaGet(createNextPort(request, corsHeaders(request)))
  }
}

/**
 * Create SQL handler - Generate SQL without execution (GET + POST via the core)
 */
export function createSqlHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { httpHandler, corsHeaders, baseContext } = createNextCore(options)

  return async function sqlHandler(request: NextRequest, context?: RouteContext) {
    const port = createNextPort(request, corsHeaders(request))
    if (request.method === 'POST') {
      return httpHandler.handleSqlPost(port, baseContext(request, context))
    }
    if (request.method === 'GET') {
      return httpHandler.handleSqlGet(port, baseContext(request, context))
    }
    return NextResponse.json(formatErrorResponse('Method not allowed', 405), { status: 405 })
  }
}

/**
 * Create dry-run handler - Validate queries without execution (GET + POST via the core)
 */
export function createDryRunHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { httpHandler, corsHeaders, baseContext } = createNextCore(options)

  return async function dryRunHandler(request: NextRequest, context?: RouteContext) {
    const port = createNextPort(request, corsHeaders(request))
    if (request.method === 'POST') {
      return httpHandler.handleDryRunPost(port, baseContext(request, context))
    }
    if (request.method === 'GET') {
      return httpHandler.handleDryRunGet(port, baseContext(request, context))
    }
    return NextResponse.json({ error: 'Method not allowed', valid: false }, { status: 405 })
  }
}

/**
 * Create batch handler - Execute multiple queries in a single request (POST via the core)
 */
export function createBatchHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { httpHandler, corsHeaders, baseContext } = createNextCore(options)

  return async function batchHandler(request: NextRequest, context?: RouteContext) {
    if (request.method !== 'POST') {
      return NextResponse.json(formatErrorResponse('Method not allowed - use POST', 405), { status: 405 })
    }
    return httpHandler.handleBatchPost(createNextPort(request, corsHeaders(request)), baseContext(request, context))
  }
}

/**
 * Create explain handler - Get execution plan for a query (POST via the core)
 */
export function createExplainHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { httpHandler, corsHeaders, baseContext } = createNextCore(options)

  return async function explainHandler(request: NextRequest, context?: RouteContext) {
    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }
    return httpHandler.handleExplainPost(createNextPort(request, corsHeaders(request)), baseContext(request, context))
  }
}

// ============================================
// MCP (AI-Ready) Handlers
// ============================================

/**
 * Create discover handler - Find relevant cubes based on topic/intent
 */
export function createDiscoverHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { cors } = getLocaleAwareRequestOptions(options)

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function discoverHandler(request: NextRequest, _context?: RouteContext) {
    try {
      if (request.method !== 'POST') {
        return NextResponse.json(
          formatErrorResponse('Method not allowed - use POST', 405),
          { status: 405 }
        )
      }

      const body = await request.json() as DiscoverRequest
      const result = await handleDiscover(semanticLayer, body)

      return NextResponse.json(result, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js discover handler error:', error)
      }
      return NextResponse.json(
        formatErrorResponse(
          error instanceof Error ? error.message : 'Discovery failed',
          500
        ),
        { status: 500 }
      )
    }
  }
}

/**
 * Create suggest handler - Generate query from natural language
 */
export function createSuggestHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { cors } = getLocaleAwareRequestOptions(options)

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function suggestHandler(request: NextRequest, _context?: RouteContext) {
    try {
      if (request.method !== 'POST') {
        return NextResponse.json(
          formatErrorResponse('Method not allowed - use POST', 405),
          { status: 405 }
        )
      }

      const body = await request.json() as SuggestRequest
      if (!body.naturalLanguage) {
        return NextResponse.json(
          formatErrorResponse('naturalLanguage field is required', 400),
          { status: 400 }
        )
      }

      const result = await handleSuggest(semanticLayer, body)

      return NextResponse.json(result, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js suggest handler error:', error)
      }
      return NextResponse.json(
        formatErrorResponse(
          error instanceof Error ? error.message : 'Query suggestion failed',
          500
        ),
        { status: 500 }
      )
    }
  }
}

/**
 * Create validate handler - Validate query with helpful corrections
 */
export function createValidateHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { cors } = getLocaleAwareRequestOptions(options)

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function validateHandler(request: NextRequest, _context?: RouteContext) {
    try {
      if (request.method !== 'POST') {
        return NextResponse.json(
          formatErrorResponse('Method not allowed - use POST', 405),
          { status: 405 }
        )
      }

      const body = await request.json() as ValidateRequest
      if (!body.query) {
        return NextResponse.json(
          formatErrorResponse('query field is required', 400),
          { status: 400 }
        )
      }

      const result = await handleValidate(semanticLayer, body)

      return NextResponse.json(result, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js validate handler error:', error)
      }
      return NextResponse.json(
        formatErrorResponse(
          error instanceof Error ? error.message : 'Query validation failed',
          500
        ),
        { status: 500 }
      )
    }
  }
}

/**
 * Create MCP load handler - Execute a query and return results
 * Completes the AI workflow: discover → suggest → validate → load
 */
export function createMcpLoadHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { extractSecurityContext, cors } = getLocaleAwareRequestOptions(options)

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function mcpLoadHandler(request: NextRequest, context?: RouteContext) {
    try {
      if (request.method !== 'POST') {
        return NextResponse.json(
          formatErrorResponse('Method not allowed - use POST', 405),
          { status: 405 }
        )
      }

      const body = await request.json() as LoadRequest
      if (!body.query) {
        return NextResponse.json(
          formatErrorResponse('query field is required', 400),
          { status: 400 }
        )
      }

      const securityContext = await extractSecurityContext(request, context)
      const result = await handleLoad(semanticLayer, securityContext, body)

      return NextResponse.json(result, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js MCP load handler error:', error)
      }
      return NextResponse.json(
        formatErrorResponse(
          error instanceof Error ? error.message : 'Query execution failed',
          500
        ),
        { status: 500 }
      )
    }
  }
}

/**
 * Create MCP Streamable HTTP handler (JSON-RPC 2.0 + optional SSE)
 * Implements MCP 2025-11-25 spec. POST is dispatched via the core; the GET
 * streaming connection and DELETE lifecycle stay inline (transport-bound).
 */
export function createMcpRpcHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { httpHandler, corsHeaders, baseContext } = createNextCore(options)
  const { mcp = { enabled: true } } = options

  // Bind the adapter CORS configuration into the GET-stream helper.
  const applyCors: ApplyCors = (request, headers) => {
    Object.entries(corsHeaders(request)).forEach(([key, value]) => headers.set(key, value))
  }

  return async function mcpRpcHandler(request: NextRequest, context?: RouteContext) {
    // OAuth 2.1 bearer token check (RFC 9728)
    if (mcp.resourceMetadataUrl && !extractBearerToken(request.headers.get('authorization'))) {
      return NextResponse.json(
        { error: 'Bearer token required' },
        { status: 401, headers: { 'WWW-Authenticate': buildWwwAuthenticateChallenge(mcp.resourceMetadataUrl) } }
      )
    }

    // Handle DELETE for session termination (MCP 2025-11-25)
    if (request.method === 'DELETE') {
      return NextResponse.json(
        { error: 'Session termination not supported' },
        { status: 405 }
      )
    }

    if (request.method === 'GET') {
      return buildMcpGetResponse(request, applyCors)
    }

    if (request.method !== 'POST') {
      return NextResponse.json(
        formatErrorResponse('Method not allowed - use POST', 405),
        { status: 405 }
      )
    }

    return httpHandler.handleMcpPost(createNextPort(request, corsHeaders(request)), baseContext(request, context))
  }
}

// ============================================
// Agent (Agentic AI Notebook) Handler
// ============================================

/**
 * Create agent chat handler - Agentic AI notebook chat
 * Streams SSE events as the agent discovers data, executes queries,
 * and creates visualizations. Inherently transport-bound, so it stays inline.
 */
export function createAgentChatHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { cors } = getLocaleAwareRequestOptions(options)
  const { agent: agentConfig } = options

  if (!agentConfig) {
    throw new Error('agent config is required for createAgentChatHandler')
  }

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function agentChatHandler(request: NextRequest, context?: RouteContext) {
    try {
      if (request.method !== 'POST') {
        return NextResponse.json(
          { error: 'Method not allowed - use POST' },
          { status: 405 }
        )
      }

      const { handleAgentChat } = await import('../../server/agent/handler.js')

      const body = await request.json()
      const { message, sessionId, history } = body as { message: string; sessionId?: string; history?: import('../../server/agent/types.js').AgentHistoryMessage[] }

      if (!message || typeof message !== 'string') {
        return NextResponse.json(
          { error: 'message is required and must be a string' },
          { status: 400 }
        )
      }

      // Resolve API key: server config or client header override
      let apiKey = (agentConfig.apiKey || '').trim()
      if (agentConfig.allowClientApiKey) {
        const clientKey = request.headers.get('x-agent-api-key')
        if (clientKey) {
          apiKey = clientKey.trim()
        }
      }

      if (!apiKey) {
        return NextResponse.json(
          { error: 'No API key configured. Set agent.apiKey in server config or send X-Agent-Api-Key header.' },
          { status: 401 }
        )
      }

      // Per-request provider overrides from client headers
      const providerOverride = agentConfig.allowClientApiKey ? request.headers.get('x-agent-provider') || undefined : undefined
      const modelOverride = agentConfig.allowClientApiKey ? request.headers.get('x-agent-model') || undefined : undefined
      const baseURLOverride = agentConfig.allowClientApiKey ? request.headers.get('x-agent-provider-endpoint') || undefined : undefined

      // Extract security context (required for all queries), merging request locale
      const securityContext = withLocaleFromHeaders(
        await options.extractSecurityContext(request, context),
        (header) => request.headers.get(header) ?? undefined
      )

      // Build per-request system context from the callback (if configured)
      const systemContext = agentConfig.buildSystemContext?.(securityContext)

      // Create SSE stream
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
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
              const sseData = `data: ${JSON.stringify(event)}\n\n`
              controller.enqueue(encoder.encode(sseData))
            }
          } catch (error) {
            const errorEvent = {
              type: 'error',
              data: { message: error instanceof Error ? error.message : 'Stream failed' }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`))
          } finally {
            controller.close()
          }
        }
      })

      const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      })
      if (cors) {
        const corsHeaders = getCorsHeaders(request, cors)
        Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value))
      }

      return new Response(stream, { status: 200, headers })

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js agent chat handler error:', error)
      }
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Agent chat failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Convenience function to create all route handlers
 *
 * @example
 * const handlers = createCubeHandlers({
 *   cubes: [salesCube, employeesCube],
 *   drizzle: db,
 *   schema,
 *   extractSecurityContext: async (request, context) => {
 *     const token = request.headers.get('Authorization')?.replace('Bearer ', '')
 *     const decoded = await verifyJWT(token)
 *     return { organisationId: decoded.orgId, userId: decoded.userId }
 *   }
 * })
 *
 * // Use in your API routes:
 * export const GET = handlers.load
 * export const POST = handlers.load
 */
export function createCubeHandlers(
  options: NextAdapterOptions
): CubeHandlers {
  const { mcp = { enabled: true } } = options

  // Build the semantic layer once and inject it into every handler so they all
  // share one metadata/result cache (cube registration runs a single time).
  const semanticLayer = createSemanticLayer(options)
  const sharedOptions: NextAdapterOptions = { ...options, semanticLayer }

  const handlers: CubeHandlers = {
    load: createLoadHandler(sharedOptions),
    meta: createMetaHandler(sharedOptions),
    sql: createSqlHandler(sharedOptions),
    dryRun: createDryRunHandler(sharedOptions),
    batch: createBatchHandler(sharedOptions),
    explain: createExplainHandler(sharedOptions)
  }

  // Add MCP handlers if enabled
  if (mcp.enabled !== false) {
    handlers.mcpRpc = createMcpRpcHandler(sharedOptions)
  }

  // Add agent handler if configured
  if (options.agent) {
    handlers.agentChat = createAgentChatHandler(sharedOptions)
  }

  return handlers
}

// Re-export types for convenience
export type {
  SecurityContext,
  DatabaseExecutor,
  SemanticQuery,
  DrizzleDatabase,
  NextCorsOptions as CorsOptions
}

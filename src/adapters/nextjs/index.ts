/**
 * Next.js App Router adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints as Next.js route handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import type {
  SemanticQuery,
  SecurityContext,
  DatabaseExecutor,
  DrizzleDatabase,
  Cube,
  CacheConfig,
  ExplainOptions
} from '../../server'
import { SemanticLayerCompiler } from '../../server/compiler'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import {
  handleDryRun,
  formatCubeResponse,
  formatSqlResponse,
  formatMetaResponse,
  formatErrorResponse,
  handleBatchRequest,
  handleDiscover,
  handleSuggest,
  handleValidate,
  handleLoad,
  type MCPOptions,
  type DiscoverRequest,
  type SuggestRequest,
  type ValidateRequest,
  type LoadRequest
} from '../utils'
import {
  buildJsonRpcError,
  buildJsonRpcResult,
  dispatchMcpMethod,
  isNotification,
  negotiateProtocol,
  parseJsonRpc,
  primeEventId,
  serializeSseEvent,
  wantsEventStream,
  validateAcceptHeader,
  validateOriginHeader,
  MCP_SESSION_ID_HEADER
} from '../mcp-transport'

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
  engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb'
  
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
}

/**
 * Helper function to create and configure semantic layer from options
 */
function createSemanticLayer(
  options: NextAdapterOptions
): SemanticLayerCompiler {
  const { cubes, drizzle, schema, engineType, cache } = options

  // Validate required options
  if (!cubes || cubes.length === 0) {
    throw new Error('At least one cube must be provided in the cubes array')
  }

  // Create semantic layer and register all cubes
  const semanticLayer = new SemanticLayerCompiler({
    drizzle,
    schema,
    engineType,
    cache
  })

  // Register all provided cubes
  cubes.forEach(cube => {
    semanticLayer.registerCube(cube)
  })

  return semanticLayer
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
 * Create OPTIONS handler for CORS preflight requests
 */
export function createOptionsHandler(corsOptions: NextCorsOptions): RouteHandler {
  return async function optionsHandler(request: NextRequest) {
    const corsHeaders = getCorsHeaders(request, corsOptions)
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    })
  }
}

/**
 * Create load handler - Execute queries
 */
export function createLoadHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { extractSecurityContext, cors } = options

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function loadHandler(request: NextRequest, context?: RouteContext) {
    try {
      let query: SemanticQuery

      if (request.method === 'POST') {
        const body = await request.json()
        query = (body as any).query || body // Handle nested format
      } else if (request.method === 'GET') {
        const queryParam = request.nextUrl.searchParams.get('query')
        if (!queryParam) {
          return NextResponse.json(
            formatErrorResponse('Query parameter is required', 400),
            { status: 400 }
          )
        }
        try {
          query = JSON.parse(queryParam)
        } catch {
          return NextResponse.json(
            formatErrorResponse('Invalid JSON in query parameter', 400),
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          formatErrorResponse('Method not allowed', 405),
          { status: 405 }
        )
      }

      const securityContext = await extractSecurityContext(request, context)

      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return NextResponse.json(
          formatErrorResponse(`Query validation failed: ${validation.errors.join(', ')}`, 400),
          { status: 400 }
        )
      }

      // Check for cache bypass header (X-Cache-Control: no-cache)
      const skipCache = request.headers.get('x-cache-control') === 'no-cache'

      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext, { skipCache })
      const response = formatCubeResponse(query, result, semanticLayer)

      return NextResponse.json(response, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })
      
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js load handler error:', error)
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
 * Create meta handler - Get cube metadata
 */
export function createMetaHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { cors } = options

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function metaHandler(request: NextRequest, _context?: RouteContext) {
    try {
      // Extract security context (some apps may want to filter cubes by context)
      // const securityContext = await getSecurityContext(request, context) // Available if needed for filtering
      
      // Get cached metadata (fast path)
      const metadata = semanticLayer.getMetadata()
      const response = formatMetaResponse(metadata)
      
      return NextResponse.json(response, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })
      
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js meta handler error:', error)
      }
      return NextResponse.json(
        formatErrorResponse(
          error instanceof Error ? error.message : 'Failed to fetch metadata',
          500
        ),
        { status: 500 }
      )
    }
  }
}

/**
 * Create SQL handler - Generate SQL without execution
 */
export function createSqlHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { extractSecurityContext, cors } = options

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function sqlHandler(request: NextRequest, context?: RouteContext) {
    try {
      let query: SemanticQuery

      if (request.method === 'POST') {
        const body = await request.json()
        query = (body as any).query || body // Handle nested format
      } else if (request.method === 'GET') {
        const queryParam = request.nextUrl.searchParams.get('query')
        if (!queryParam) {
          return NextResponse.json(
            formatErrorResponse('Query parameter is required', 400),
            { status: 400 }
          )
        }
        try {
          query = JSON.parse(queryParam)
        } catch {
          return NextResponse.json(
            formatErrorResponse('Invalid JSON in query parameter', 400),
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          formatErrorResponse('Method not allowed', 405),
          { status: 405 }
        )
      }
      
      const securityContext = await extractSecurityContext(request, context)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return NextResponse.json(
          formatErrorResponse(`Query validation failed: ${validation.errors.join(', ')}`, 400),
          { status: 400 }
        )
      }

      // For SQL generation, we need at least one cube referenced
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return NextResponse.json(
          formatErrorResponse('No measures or dimensions specified', 400),
          { status: 400 }
        )
      }

      const cubeName = firstMember.split('.')[0]
      
      // Generate SQL using the semantic layer compiler
      const sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
      const response = formatSqlResponse(query, sqlResult)
      
      return NextResponse.json(response, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })
      
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js SQL handler error:', error)
      }
      return NextResponse.json(
        formatErrorResponse(
          error instanceof Error ? error.message : 'SQL generation failed',
          500
        ),
        { status: 500 }
      )
    }
  }
}

/**
 * Create dry-run handler - Validate queries without execution
 */
export function createDryRunHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { extractSecurityContext, cors } = options

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function dryRunHandler(request: NextRequest, context?: RouteContext) {
    try {
      let query: SemanticQuery

      if (request.method === 'POST') {
        const body = await request.json()
        query = (body as any).query || body // Handle nested format
      } else if (request.method === 'GET') {
        const queryParam = request.nextUrl.searchParams.get('query')
        if (!queryParam) {
          return NextResponse.json(
            { error: 'Query parameter is required', valid: false },
            { status: 400 }
          )
        }
        try {
          query = JSON.parse(queryParam)
        } catch {
          return NextResponse.json(
            { error: 'Invalid JSON in query parameter', valid: false },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Method not allowed', valid: false },
          { status: 405 }
        )
      }
      
      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(request, context)
      
      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext, semanticLayer)
      
      return NextResponse.json(result, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })
      
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js dry-run handler error:', error)
      }
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Dry-run validation failed',
          valid: false
        },
        { status: 400 }
      )
    }
  }
}

/**
 * Create batch handler - Execute multiple queries in a single request
 * Optimizes network overhead for dashboards with many portlets
 */
export function createBatchHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { extractSecurityContext, cors } = options

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function batchHandler(request: NextRequest, context?: RouteContext) {
    try {
      if (request.method !== 'POST') {
        return NextResponse.json(
          formatErrorResponse('Method not allowed - use POST', 405),
          { status: 405 }
        )
      }

      const body = await request.json()
      const { queries } = body as { queries: SemanticQuery[] }

      if (!queries || !Array.isArray(queries)) {
        return NextResponse.json(
          formatErrorResponse('Request body must contain a "queries" array', 400),
          { status: 400 }
        )
      }

      if (queries.length === 0) {
        return NextResponse.json(
          formatErrorResponse('Queries array cannot be empty', 400),
          { status: 400 }
        )
      }

      // Extract security context ONCE (shared across all queries)
      const securityContext = await extractSecurityContext(request, context)

      // Check for cache bypass header (X-Cache-Control: no-cache)
      const skipCache = request.headers.get('x-cache-control') === 'no-cache'

      // Use shared batch handler (wraps existing single query logic)
      const batchResult = await handleBatchRequest(queries, securityContext, semanticLayer, { skipCache })

      return NextResponse.json(batchResult, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js batch handler error:', error)
      }
      return NextResponse.json(
        formatErrorResponse(
          error instanceof Error ? error.message : 'Batch execution failed',
          500
        ),
        { status: 500 }
      )
    }
  }
}

/**
 * Create explain handler - Get execution plan for a query
 * Returns normalized EXPLAIN output across PostgreSQL, MySQL, and SQLite
 */
export function createExplainHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { extractSecurityContext, cors } = options

  // Create semantic layer with all cubes registered
  const semanticLayer = createSemanticLayer(options)

  return async function explainHandler(request: NextRequest, context?: RouteContext) {
    try {
      if (request.method !== 'POST') {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        )
      }

      const body = await request.json()
      const query: SemanticQuery = (body as any).query || body
      const explainOptions: ExplainOptions = (body as any).options || {}

      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(request, context)

      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Query validation failed: ${validation.errors.join(', ')}` },
          { status: 400 }
        )
      }

      // Execute EXPLAIN using the semantic layer
      const explainResult = await semanticLayer.explainQuery(
        query,
        securityContext,
        explainOptions
      )

      return NextResponse.json(explainResult, {
        headers: cors ? getCorsHeaders(request, cors) : {}
      })

    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js explain handler error:', error)
      }
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Explain query failed' },
        { status: 500 }
      )
    }
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
  const { cors } = options

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

      const body: DiscoverRequest = await request.json()
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
  const { cors } = options

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

      const body: SuggestRequest = await request.json()
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
  const { cors } = options

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

      const body: ValidateRequest = await request.json()
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
  const { extractSecurityContext, cors } = options

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

      const body: LoadRequest = await request.json()
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
 * Implements MCP 2025-11-25 spec
 */
export function createMcpRpcHandler(
  options: NextAdapterOptions
): RouteHandler {
  const { extractSecurityContext, cors, mcp = { enabled: true } } = options

  const semanticLayer = createSemanticLayer(options)

  return async function mcpRpcHandler(request: NextRequest) {
    // Handle DELETE for session termination (MCP 2025-11-25)
    if (request.method === 'DELETE') {
      return NextResponse.json(
        { error: 'Session termination not supported' },
        { status: 405 }
      )
    }

    if (request.method === 'GET') {
      const encoder = new TextEncoder()
      const eventId = primeEventId()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(serializeSseEvent({
            jsonrpc: '2.0',
            method: 'mcp/ready',
            params: { protocol: 'streamable-http' }
          }, eventId, 15000)))
        }
      })

      const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      })
      if (cors) {
        const corsHeaders = getCorsHeaders(request, cors)
        Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value))
      }
      return new NextResponse(stream, { status: 200, headers })
    }

    if (request.method !== 'POST') {
      return NextResponse.json(
        formatErrorResponse('Method not allowed - use POST', 405),
        { status: 405 }
      )
    }

    // Validate Origin header (MCP 2025-11-25: MUST validate, return 403 if invalid)
    const originValidation = validateOriginHeader(
      request.headers.get('origin'),
      mcp.allowedOrigins ? { allowedOrigins: mcp.allowedOrigins } : {}
    )
    if (!originValidation.valid) {
      return NextResponse.json(
        buildJsonRpcError(null, -32600, originValidation.reason),
        { status: 403 }
      )
    }

    // Validate Accept header (MCP 2025-11-25: MUST include both application/json and text/event-stream)
    const acceptHeader = request.headers.get('accept')
    if (!validateAcceptHeader(acceptHeader)) {
      return NextResponse.json(
        buildJsonRpcError(null, -32600, 'Accept header must include both application/json and text/event-stream'),
        { status: 400 }
      )
    }

    const protocol = negotiateProtocol(Object.fromEntries(request.headers.entries()))
    if (!protocol.ok) {
      return NextResponse.json({
        error: 'Unsupported MCP protocol version',
        supported: protocol.supported
      }, { status: 426 })
    }

    let body: unknown = null
    try {
      body = await request.json()
    } catch {
      body = null
    }

    const rpcRequest = parseJsonRpc(body)
    if (!rpcRequest) {
      return NextResponse.json(
        buildJsonRpcError(null, -32600, 'Invalid JSON-RPC 2.0 request'),
        { status: 400 }
      )
    }

    const wantsStream = wantsEventStream(acceptHeader)
    const isInitialize = rpcRequest.method === 'initialize'

    const sendJson = (payload: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
      NextResponse.json(payload, {
        status,
        headers: { ...(cors ? getCorsHeaders(request, cors) : {}), ...extraHeaders }
      })

    try {
      const result = await dispatchMcpMethod(
        rpcRequest.method,
        rpcRequest.params,
        {
          semanticLayer,
          extractSecurityContext: (req) => extractSecurityContext(req as any),
          rawRequest: request,
          rawResponse: null
        }
      )

      if (isNotification(rpcRequest)) {
        return new NextResponse(null, { status: 202 })
      }

      // Extract session ID for header (MCP 2025-11-25: return in MCP-Session-Id header)
      const sessionId = isInitialize && result && typeof result === 'object' && 'sessionId' in result
        ? (result as { sessionId?: string }).sessionId
        : undefined

      const responseHeaders: Record<string, string> = {}
      if (sessionId) {
        responseHeaders[MCP_SESSION_ID_HEADER] = sessionId
      }

      const response = buildJsonRpcResult(rpcRequest.id ?? null, result)
      if (wantsStream) {
        const encoder = new TextEncoder()
        const eventId = primeEventId()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`id: ${eventId}\n\n`))
            controller.enqueue(encoder.encode(serializeSseEvent(response, eventId)))
            controller.close()
          }
        })

        const headers = new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          ...responseHeaders
        })
        if (cors) {
          const corsHeaders = getCorsHeaders(request, cors)
          Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value))
        }

        return new NextResponse(stream, { status: 200, headers })
      }

      return sendJson(response, 200, responseHeaders)
    } catch (error) {
      // Log notification errors before returning 202 (P3 fix)
      if (isNotification(rpcRequest)) {
        if (process.env.NODE_ENV !== 'test') {
          console.error('Next.js MCP notification processing error:', error)
        }
        return new NextResponse(null, { status: 202 })
      }

      if (process.env.NODE_ENV !== 'test') {
        console.error('Next.js MCP RPC handler error:', error)
      }
      const code = (error as any)?.code ?? -32603
      const data = (error as any)?.data
      const message = (error as Error).message || 'MCP request failed'
      const rpcError = buildJsonRpcError(rpcRequest.id ?? null, code, message, data)

      if (wantsStream) {
        const encoder = new TextEncoder()
        const eventId = primeEventId()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`id: ${eventId}\n\n`))
            controller.enqueue(encoder.encode(serializeSseEvent(rpcError, eventId)))
            controller.close()
          }
        })

        const headers = new Headers({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        })
        if (cors) {
          const corsHeaders = getCorsHeaders(request, cors)
          Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value))
        }

        return new NextResponse(stream, { status: 200, headers })
      }

      return sendJson(rpcError, 200)
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

  const handlers: CubeHandlers = {
    load: createLoadHandler(options),
    meta: createMetaHandler(options),
    sql: createSqlHandler(options),
    dryRun: createDryRunHandler(options),
    batch: createBatchHandler(options),
    explain: createExplainHandler(options)
  }

  // Add MCP handlers if enabled
  if (mcp.enabled !== false) {
    handlers.mcpRpc = createMcpRpcHandler(options)
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

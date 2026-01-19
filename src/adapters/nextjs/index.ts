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
import { SemanticLayerCompiler } from '../../server'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import {
  handleDryRun,
  formatCubeResponse,
  formatSqlResponse,
  formatMetaResponse,
  formatErrorResponse,
  handleBatchRequest
} from '../utils'

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
  engineType?: 'postgres' | 'mysql' | 'sqlite'
  
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
  return {
    load: createLoadHandler(options),
    meta: createMetaHandler(options),
    sql: createSqlHandler(options),
    dryRun: createDryRunHandler(options),
    batch: createBatchHandler(options),
    explain: createExplainHandler(options)
  }
}

// Re-export types for convenience
export type { 
  SecurityContext, 
  DatabaseExecutor, 
  SemanticQuery, 
  DrizzleDatabase,
  NextCorsOptions as CorsOptions
}
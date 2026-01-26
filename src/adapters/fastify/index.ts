/**
 * Fastify adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints as a Fastify plugin with Drizzle ORM
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
  type MCPOptions
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
  engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb'
  
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
    mcp = { enabled: true }
  } = options

  // Validate required options
  if (!cubes || cubes.length === 0) {
    return done(new Error('At least one cube must be provided in the cubes array'))
  }

  // Register CORS plugin if configured
  if (corsConfig) {
    fastify.register(import('@fastify/cors'), corsConfig)
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
    cache
  })

  // Register all provided cubes
  cubes.forEach(cube => {
    semanticLayer.registerCube(cube)
  })

  /**
   * POST /cubejs-api/v1/load - Execute queries
   */
  fastify.post(`${basePath}/load`, {
    bodyLimit,
    schema: {
      body: {
        type: 'object',
        additionalProperties: true
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Handle both direct query and nested query formats
      const body = request.body as any
      const query: SemanticQuery = body.query || body

      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(request)

      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return reply.status(400).send(formatErrorResponse(
          `Query validation failed: ${validation.errors.join(', ')}`,
          400
        ))
      }

      // Check for cache bypass header (X-Cache-Control: no-cache)
      const skipCache = request.headers['x-cache-control'] === 'no-cache'

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext, { skipCache })

      // Return in official Cube.js format
      return formatCubeResponse(query, result, semanticLayer)

    } catch (error) {
      request.log.error(error, 'Query execution error')
      return reply.status(500).send(formatErrorResponse(
        error instanceof Error ? error.message : 'Query execution failed',
        500
      ))
    }
  })

  /**
   * GET /cubejs-api/v1/load - Execute queries via query string
   */
  fastify.get(`${basePath}/load`, {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { query: queryParam } = request.query as { query: string }

      let query: SemanticQuery
      try {
        query = JSON.parse(queryParam)
      } catch {
        return reply.status(400).send(formatErrorResponse(
          'Invalid JSON in query parameter',
          400
        ))
      }

      // Extract security context
      const securityContext = await extractSecurityContext(request)

      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return reply.status(400).send(formatErrorResponse(
          `Query validation failed: ${validation.errors.join(', ')}`,
          400
        ))
      }

      // Check for cache bypass header (X-Cache-Control: no-cache)
      const skipCache = request.headers['x-cache-control'] === 'no-cache'

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext, { skipCache })

      // Return in official Cube.js format
      return formatCubeResponse(query, result, semanticLayer)

    } catch (error) {
      request.log.error(error, 'Query execution error')
      return reply.status(500).send(formatErrorResponse(
        error instanceof Error ? error.message : 'Query execution failed',
        500
      ))
    }
  })

  /**
   * POST /cubejs-api/v1/batch - Execute multiple queries in a single request
   * Optimizes network overhead for dashboards with many portlets
   */
  fastify.post(`${basePath}/batch`, {
    bodyLimit,
    schema: {
      body: {
        type: 'object',
        required: ['queries'],
        properties: {
          queries: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { queries } = request.body as { queries: SemanticQuery[] }

      if (!queries || !Array.isArray(queries)) {
        return reply.status(400).send(formatErrorResponse(
          'Request body must contain a "queries" array',
          400
        ))
      }

      if (queries.length === 0) {
        return reply.status(400).send(formatErrorResponse(
          'Queries array cannot be empty',
          400
        ))
      }

      // Extract security context ONCE (shared across all queries)
      const securityContext = await extractSecurityContext(request)

      // Check for cache bypass header (X-Cache-Control: no-cache)
      const skipCache = request.headers['x-cache-control'] === 'no-cache'

      // Use shared batch handler (wraps existing single query logic)
      const batchResult = await handleBatchRequest(queries, securityContext, semanticLayer, { skipCache })

      return batchResult

    } catch (error) {
      request.log.error(error, 'Batch execution error')
      return reply.status(500).send(formatErrorResponse(
        error instanceof Error ? error.message : 'Batch execution failed',
        500
      ))
    }
  })

  /**
   * GET /cubejs-api/v1/meta - Get cube metadata
   * Optimized for fast response times with caching
   */
  fastify.get(`${basePath}/meta`, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Extract security context (some apps may want to filter cubes by context)
      // await getSecurityContext(request) // Available if needed for filtering
      
      // Get cached metadata (fast path)
      const metadata = semanticLayer.getMetadata()
      
      return formatMetaResponse(metadata)
      
    } catch (error) {
      request.log.error(error, 'Metadata error')
      return reply.status(500).send(formatErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch metadata',
        500
      ))
    }
  })

  /**
   * POST /cubejs-api/v1/sql - Generate SQL without execution (dry run)
   */
  fastify.post(`${basePath}/sql`, {
    bodyLimit,
    schema: {
      body: {
        type: 'object',
        additionalProperties: true
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query: SemanticQuery = request.body as SemanticQuery
      
      const securityContext = await extractSecurityContext(request)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return reply.status(400).send(formatErrorResponse(
          `Query validation failed: ${validation.errors.join(', ')}`,
          400
        ))
      }

      // For SQL generation, we need at least one cube referenced
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return reply.status(400).send(formatErrorResponse(
          'No measures or dimensions specified',
          400
        ))
      }

      const cubeName = firstMember.split('.')[0]
      
      // Generate SQL using the semantic layer compiler
      const sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
      
      return formatSqlResponse(query, sqlResult)
      
    } catch (error) {
      request.log.error(error, 'SQL generation error')
      return reply.status(500).send(formatErrorResponse(
        error instanceof Error ? error.message : 'SQL generation failed',
        500
      ))
    }
  })

  /**
   * GET /cubejs-api/v1/sql - Generate SQL via query string
   */
  fastify.get(`${basePath}/sql`, {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { query: queryParam } = request.query as { query: string }

      const query: SemanticQuery = JSON.parse(queryParam)
      const securityContext = await extractSecurityContext(request)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return reply.status(400).send(formatErrorResponse(
          `Query validation failed: ${validation.errors.join(', ')}`,
          400
        ))
      }

      // For SQL generation, we need at least one cube referenced
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return reply.status(400).send(formatErrorResponse(
          'No measures or dimensions specified',
          400
        ))
      }

      const cubeName = firstMember.split('.')[0]
      
      // Generate SQL using the semantic layer compiler
      const sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
      
      return formatSqlResponse(query, sqlResult)
      
    } catch (error) {
      request.log.error(error, 'SQL generation error')
      return reply.status(500).send(formatErrorResponse(
        error instanceof Error ? error.message : 'SQL generation failed',
        500
      ))
    }
  })

  /**
   * POST /cubejs-api/v1/dry-run - Validate queries without execution
   */
  fastify.post(`${basePath}/dry-run`, {
    bodyLimit,
    schema: {
      body: {
        type: 'object',
        additionalProperties: true
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Handle both direct query and nested query formats
      const body = request.body as any
      const query: SemanticQuery = body.query || body
      
      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(request)
      
      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext, semanticLayer)
      
      return result
      
    } catch (error) {
      request.log.error(error, 'Dry-run error')
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Dry-run validation failed',
        valid: false
      })
    }
  })

  /**
   * GET /cubejs-api/v1/dry-run - Validate queries via query string
   */
  fastify.get(`${basePath}/dry-run`, {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { query: queryParam } = request.query as { query: string }

      const query: SemanticQuery = JSON.parse(queryParam)

      // Extract security context
      const securityContext = await extractSecurityContext(request)

      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext, semanticLayer)

      return result

    } catch (error) {
      request.log.error(error, 'Dry-run error')
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Dry-run validation failed',
        valid: false
      })
    }
  })

  /**
   * POST /cubejs-api/v1/explain - Get execution plan for a query
   * Returns normalized EXPLAIN output across PostgreSQL, MySQL, and SQLite
   */
  fastify.post(`${basePath}/explain`, {
    bodyLimit,
    schema: {
      body: {
        type: 'object',
        additionalProperties: true
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Handle both direct query and nested query formats
      const body = request.body as any
      const query: SemanticQuery = body.query || body
      const options: ExplainOptions = body.options || {}

      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(request)

      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return reply.status(400).send({
          error: `Query validation failed: ${validation.errors.join(', ')}`
        })
      }

      // Execute EXPLAIN using the semantic layer
      const explainResult = await semanticLayer.explainQuery(query, securityContext, options)

      return explainResult

    } catch (error) {
      request.log.error(error, 'Explain error')
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Explain query failed'
      })
    }
  })

  // ============================================
  // MCP (AI-Ready) Endpoints
  // ============================================

  if (mcp.enabled !== false) {
    const mcpBasePath = mcp.basePath ?? '/mcp'

    /**
     * MCP Streamable HTTP endpoint (JSON-RPC 2.0 + optional SSE)
     * Implements MCP 2025-11-25 spec
     */
    fastify.post(`${mcpBasePath}`, {
      bodyLimit,
      schema: {
        body: {
          type: 'object',
          additionalProperties: true
        }
      }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      // Validate Origin header (MCP 2025-11-25: MUST validate, return 403 if invalid)
      const originValidation = validateOriginHeader(
        request.headers.origin as string | undefined,
        mcp.allowedOrigins ? { allowedOrigins: mcp.allowedOrigins } : {}
      )
      if (!originValidation.valid) {
        return reply.status(403).send(buildJsonRpcError(null, -32600, originValidation.reason))
      }

      // Validate Accept header (MCP 2025-11-25: MUST include both application/json and text/event-stream)
      const acceptHeader = request.headers.accept as string | undefined
      if (!validateAcceptHeader(acceptHeader)) {
        return reply.status(400).send(buildJsonRpcError(null, -32600, 'Accept header must include both application/json and text/event-stream'))
      }

      const protocol = negotiateProtocol(request.headers as Record<string, string>)
      if (!protocol.ok) {
        return reply.status(426).send({
          error: 'Unsupported MCP protocol version',
          supported: protocol.supported
        })
      }

      const rpcRequest = parseJsonRpc(request.body)
      if (!rpcRequest) {
        return reply.status(400).send(buildJsonRpcError(null, -32600, 'Invalid JSON-RPC 2.0 request'))
      }

      const wantsStream = wantsEventStream(acceptHeader)
      const isInitialize = rpcRequest.method === 'initialize'

      try {
        const result = await dispatchMcpMethod(
          rpcRequest.method,
          rpcRequest.params,
          {
            semanticLayer,
            extractSecurityContext,
            rawRequest: request,
            rawResponse: reply,
            negotiatedProtocol: protocol.negotiated
          }
        )

        if (isNotification(rpcRequest)) {
          return reply.status(202).send()
        }

        // Extract session ID for header (MCP 2025-11-25: return in MCP-Session-Id header)
        const sessionId = isInitialize && result && typeof result === 'object' && 'sessionId' in result
          ? (result as { sessionId?: string }).sessionId
          : undefined

        if (sessionId) {
          reply.header(MCP_SESSION_ID_HEADER, sessionId)
        }

        const response = buildJsonRpcResult(rpcRequest.id ?? null, result)
        if (wantsStream) {
          const eventId = primeEventId()
          reply
            .header('Content-Type', 'text/event-stream')
            .header('Cache-Control', 'no-cache')
            .header('Connection', 'keep-alive')
            .send(`id: ${eventId}\n\n${serializeSseEvent(response, eventId)}`)
          return
        }

        return reply.send(response)
      } catch (error) {
        // Log notification errors before returning 202 (P3 fix)
        if (isNotification(rpcRequest)) {
          request.log.error(error, 'MCP notification processing error')
          return reply.status(202).send()
        }

        request.log.error(error, 'MCP RPC error')
        const code = (error as any)?.code ?? -32603
        const data = (error as any)?.data
        const message = (error as Error).message || 'MCP request failed'
        const rpcError = buildJsonRpcError(rpcRequest.id ?? null, code, message, data)

        if (wantsStream) {
          const eventId = primeEventId()
          reply
            .header('Content-Type', 'text/event-stream')
            .header('Cache-Control', 'no-cache')
            .header('Connection', 'keep-alive')
            .send(`id: ${eventId}\n\n${serializeSseEvent(rpcError, eventId)}`)
          return
        }

        return reply.send(rpcError)
      }
    })

    fastify.get(`${mcpBasePath}`, async (request: FastifyRequest, reply: FastifyReply) => {
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

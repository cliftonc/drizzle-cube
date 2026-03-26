/**
 * Express adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints for Express applications with Drizzle ORM
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
  ExplainOptions,
  RLSSetupFn
} from '../../server'
import type { AgentConfig } from '../../server/agent/types'
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
    router.use(cors(corsConfig))
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

  /**
   * POST /cubejs-api/v1/load - Execute queries
   */
  router.post(`${basePath}/load`, async (req: Request, res: Response) => {
    try {
      // Handle both direct query and nested query formats
      const query: SemanticQuery = req.body.query || req.body

      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(req, res)

      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return res.status(400).json(formatErrorResponse(
          `Query validation failed: ${validation.errors.join(', ')}`,
          400
        ))
      }

      // Check for cache bypass header (X-Cache-Control: no-cache)
      const skipCache = req.headers['x-cache-control'] === 'no-cache'

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext, { skipCache })

      // Return in official Cube.js format
      res.json(formatCubeResponse(query, result, semanticLayer))

    } catch (error) {

      // codeql[js/log-injection] error source is internal, not user-controlled
      console.error('Query execution error:', error)
      res.status(500).json(formatErrorResponse(
        error instanceof Error ? error.message : 'Query execution failed',
        500
      ))
    }
  })

  /**
   * GET /cubejs-api/v1/load - Execute queries via query string
   */
  router.get(`${basePath}/load`, async (req: Request, res: Response) => {
    try {
      const queryParam = req.query.query as string
      if (!queryParam) {
        return res.status(400).json(formatErrorResponse(
          'Query parameter is required',
          400
        ))
      }

      let query: SemanticQuery
      try {
        query = JSON.parse(queryParam)
      } catch {
        return res.status(400).json(formatErrorResponse(
          'Invalid JSON in query parameter',
          400
        ))
      }

      // Extract security context
      const securityContext = await extractSecurityContext(req, res)

      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return res.status(400).json(formatErrorResponse(
          `Query validation failed: ${validation.errors.join(', ')}`,
          400
        ))
      }

      // Check for cache bypass header (X-Cache-Control: no-cache)
      const skipCache = req.headers['x-cache-control'] === 'no-cache'

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext, { skipCache })

      // Return in official Cube.js format
      res.json(formatCubeResponse(query, result, semanticLayer))

    } catch (error) {

      // codeql[js/log-injection] error source is internal, not user-controlled
      console.error('Query execution error:', error)
      res.status(500).json(formatErrorResponse(
        error instanceof Error ? error.message : 'Query execution failed',
        500
      ))
    }
  })

  /**
   * POST /cubejs-api/v1/batch - Execute multiple queries in a single request
   * Optimizes network overhead for dashboards with many portlets
   */
  router.post(`${basePath}/batch`, async (req: Request, res: Response) => {
    try {
      const { queries } = req.body as { queries: SemanticQuery[] }

      if (!queries || !Array.isArray(queries)) {
        return res.status(400).json(formatErrorResponse(
          'Request body must contain a "queries" array',
          400
        ))
      }

      if (queries.length === 0) {
        return res.status(400).json(formatErrorResponse(
          'Queries array cannot be empty',
          400
        ))
      }

      // Extract security context ONCE (shared across all queries)
      const securityContext = await extractSecurityContext(req, res)

      // Check for cache bypass header (X-Cache-Control: no-cache)
      const skipCache = req.headers['x-cache-control'] === 'no-cache'

      // Use shared batch handler (wraps existing single query logic)
      const batchResult = await handleBatchRequest(queries, securityContext, semanticLayer, { skipCache })

      res.json(batchResult)

    } catch (error) {

      // codeql[js/log-injection] error source is internal, not user-controlled
      console.error('Batch execution error:', error)
      res.status(500).json(formatErrorResponse(
        error instanceof Error ? error.message : 'Batch execution failed',
        500
      ))
    }
  })

  /**
   * GET /cubejs-api/v1/meta - Get cube metadata
   * Optimized for fast response times with caching
   */
  router.get(`${basePath}/meta`, (_req: Request, res: Response) => {
    try {
      // Extract security context (some apps may want to filter cubes by context)
      // await extractSecurityContext(req, res) // Available if needed for filtering
      
      // Get cached metadata (fast path)
      const metadata = semanticLayer.getMetadata()
      
      res.json(formatMetaResponse(metadata))
      
    } catch (error) {

      // codeql[js/log-injection] error source is internal, not user-controlled
      console.error('Metadata error:', error)
      res.status(500).json(formatErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch metadata',
        500
      ))
    }
  })

  /**
   * POST /cubejs-api/v1/sql - Generate SQL without execution (dry run)
   */
  router.post(`${basePath}/sql`, async (req: Request, res: Response) => {
    try {
      const query: SemanticQuery = req.body
      
      const securityContext = await extractSecurityContext(req, res)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return res.status(400).json(formatErrorResponse(
          `Query validation failed: ${validation.errors.join(', ')}`,
          400
        ))
      }

      // For SQL generation, we need at least one cube referenced
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return res.status(400).json(formatErrorResponse(
          'No measures or dimensions specified',
          400
        ))
      }

      const cubeName = firstMember.split('.')[0]
      
      // Generate SQL using the semantic layer compiler
      const sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
      
      res.json(formatSqlResponse(query, sqlResult))
      
    } catch (error) {
      console.error('SQL generation error:', String(error).replace(/\n|\r/g, ''))
      res.status(500).json(formatErrorResponse(
        error instanceof Error ? error.message : 'SQL generation failed',
        500
      ))
    }
  })

  /**
   * GET /cubejs-api/v1/sql - Generate SQL via query string
   */
  router.get(`${basePath}/sql`, async (req: Request, res: Response) => {
    try {
      const queryParam = req.query.query as string
      if (!queryParam) {
        return res.status(400).json(formatErrorResponse(
          'Query parameter is required',
          400
        ))
      }

      const query: SemanticQuery = JSON.parse(queryParam)
      const securityContext = await extractSecurityContext(req, res)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return res.status(400).json(formatErrorResponse(
          `Query validation failed: ${validation.errors.join(', ')}`,
          400
        ))
      }

      // For SQL generation, we need at least one cube referenced
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return res.status(400).json(formatErrorResponse(
          'No measures or dimensions specified',
          400
        ))
      }

      const cubeName = firstMember.split('.')[0]
      
      // Generate SQL using the semantic layer compiler
      const sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
      
      res.json(formatSqlResponse(query, sqlResult))
      
    } catch (error) {
      console.error('SQL generation error:', String(error).replace(/\n|\r/g, ''))
      res.status(500).json(formatErrorResponse(
        error instanceof Error ? error.message : 'SQL generation failed',
        500
      ))
    }
  })

  /**
   * POST /cubejs-api/v1/dry-run - Validate queries without execution
   */
  router.post(`${basePath}/dry-run`, async (req: Request, res: Response) => {
    try {
      // Handle both direct query and nested query formats
      const query: SemanticQuery = req.body.query || req.body
      
      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(req, res)
      
      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext, semanticLayer)
      
      res.json(result)
      
    } catch (error) {
      console.error('Dry-run error:', error)
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Dry-run validation failed',
        valid: false
      })
    }
  })

  /**
   * GET /cubejs-api/v1/dry-run - Validate queries via query string
   */
  router.get(`${basePath}/dry-run`, async (req: Request, res: Response) => {
    try {
      const queryParam = req.query.query as string
      if (!queryParam) {
        return res.status(400).json({
          error: 'Query parameter is required',
          valid: false
        })
      }

      const query: SemanticQuery = JSON.parse(queryParam)

      // Extract security context
      const securityContext = await extractSecurityContext(req, res)

      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext, semanticLayer)

      res.json(result)

    } catch (error) {
      console.error('Dry-run error:', error)
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Dry-run validation failed',
        valid: false
      })
    }
  })

  /**
   * POST /cubejs-api/v1/explain - Get execution plan for a query
   * Returns normalized EXPLAIN output across PostgreSQL, MySQL, and SQLite
   */
  router.post(`${basePath}/explain`, async (req: Request, res: Response) => {
    try {
      // Handle both direct query and nested query formats
      const query: SemanticQuery = req.body.query || req.body
      const options: ExplainOptions = req.body.options || {}

      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(req, res)

      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return res.status(400).json({
          error: `Query validation failed: ${validation.errors.join(', ')}`
        })
      }

      // Execute EXPLAIN using the semantic layer
      const explainResult = await semanticLayer.explainQuery(query, securityContext, options)

      res.json(explainResult)

    } catch (error) {
      console.error('Explain error:', error)
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Explain query failed'
      })
    }
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
        const { handleAgentChat } = await import('../../server/agent/handler')

        const { message, sessionId, history } = req.body as { message: string; sessionId?: string; history?: import('../../server/agent/types').AgentHistoryMessage[] }

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

        // Extract security context (required for all queries)
        const securityContext = await extractSecurityContext(req, res)

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
     * POST /mcp      - JSON-RPC request/notification
     * GET  /mcp      - Optional receive-only SSE channel (heartbeat only for now)
     * DELETE /mcp    - Session termination
     */
    router.post(`${mcpBasePath}`, async (req: Request, res: Response) => {
      // Validate Origin header (MCP 2025-11-25: MUST validate, return 403 if invalid)
      const originValidation = validateOriginHeader(
        req.headers.origin as string | undefined,
        mcp.allowedOrigins ? { allowedOrigins: mcp.allowedOrigins } : {}
      )
      if (!originValidation.valid) {
        return res.status(403).json(buildJsonRpcError(null, -32600, originValidation.reason))
      }

      // Validate Accept header (MCP 2025-11-25: MUST include both application/json and text/event-stream)
      const acceptHeader = req.headers.accept
      if (!validateAcceptHeader(acceptHeader)) {
        return res.status(400).json(buildJsonRpcError(null, -32600, 'Accept header must include both application/json and text/event-stream'))
      }

      const protocol = negotiateProtocol(req.headers as Record<string, string>)
      if (!protocol.ok) {
        return res.status(426).json({
          error: 'Unsupported MCP protocol version',
          supported: protocol.supported
        })
      }

      const rpcRequest = parseJsonRpc(req.body)
      if (!rpcRequest) {
        return res.status(400).json(buildJsonRpcError(null, -32600, 'Invalid JSON-RPC 2.0 request'))
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
            rawRequest: req,
            rawResponse: res,
            negotiatedProtocol: protocol.negotiated
          }
        )

        if (isNotification(rpcRequest)) {
          return res.status(202).end()
        }

        // Extract session ID for header (MCP 2025-11-25: return in MCP-Session-Id header)
        const sessionId = isInitialize && result && typeof result === 'object' && 'sessionId' in result
          ? (result as { sessionId?: string }).sessionId
          : undefined

        if (sessionId) {
          res.setHeader(MCP_SESSION_ID_HEADER, sessionId)
        }

        const response = buildJsonRpcResult(rpcRequest.id ?? null, result)
        if (wantsStream) {
          const eventId = primeEventId()
          res.status(200)
          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')
          res.write(`id: ${eventId}\n\n`)
          res.write(serializeSseEvent(response, eventId))
          return res.end()
        }

        return res.json(response)
      } catch (error) {
        // Log notification errors before returning 202 (P3 fix)
        if (isNotification(rpcRequest)) {
          console.error('MCP notification processing error:', String(error).replace(/\n|\r/g, ''))
          return res.status(202).end()
        }

        console.error('MCP RPC error:', String(error).replace(/\n|\r/g, ''))
        const code = (error as any)?.code ?? -32603
        const data = (error as any)?.data
        const message = (error as Error).message || 'MCP request failed'
        const rpcError = buildJsonRpcError(rpcRequest.id ?? null, code, message, data)

        if (wantsStream) {
          const eventId = primeEventId()
          res.status(200)
          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')
          res.write(`id: ${eventId}\n\n`)
          res.write(serializeSseEvent(rpcError, eventId))
          return res.end()
        }

        return res.status(200).json(rpcError)
      }
    })

    router.get(`${mcpBasePath}`, async (req: Request, res: Response) => {
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

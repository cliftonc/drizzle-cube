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
  CacheConfig
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
  engineType?: 'postgres' | 'mysql' | 'sqlite'
  
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
    cache
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
    cache
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

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
      
      // Return in official Cube.js format
      res.json(formatCubeResponse(query, result, semanticLayer))
      
    } catch (error) {
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

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
      
      // Return in official Cube.js format
      res.json(formatCubeResponse(query, result, semanticLayer))
      
    } catch (error) {
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

      // Use shared batch handler (wraps existing single query logic)
      const batchResult = await handleBatchRequest(queries, securityContext, semanticLayer)

      res.json(batchResult)

    } catch (error) {
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
      // await getSecurityContext(req, res) // Available if needed for filtering
      
      // Get cached metadata (fast path)
      const metadata = semanticLayer.getMetadata()
      
      res.json(formatMetaResponse(metadata))
      
    } catch (error) {
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
      console.error('SQL generation error:', error)
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
      console.error('SQL generation error:', error)
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
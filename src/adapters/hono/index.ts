/**
 * Hono adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints for Hono applications with Drizzle ORM
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { 
  SemanticQuery, 
  SecurityContext, 
  DatabaseExecutor,
  DrizzleDatabase,
  Cube
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
  handleBatchRequest
} from '../utils'

export interface HonoAdapterOptions {
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
  engineType?: 'postgres' | 'mysql' | 'sqlite'
  
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
    basePath = '/cubejs-api/v1'
  } = options

  // Validate required options
  if (!cubes || cubes.length === 0) {
    throw new Error('At least one cube must be provided in the cubes array')
  }

  const app = new Hono()

  // Configure CORS if provided
  if (corsConfig) {
    app.use('/*', cors(corsConfig as any))
  }

  // Create semantic layer and register all cubes
  const semanticLayer = new SemanticLayerCompiler({
    drizzle,
    schema,
    engineType
  })

  // Register all provided cubes
  cubes.forEach(cube => {
    semanticLayer.registerCube(cube)
  })

  /**
   * POST /cubejs-api/v1/load - Execute queries
   */
  app.post(`${basePath}/load`, async (c) => {
    try {
      const requestBody = await c.req.json()
      
      // Handle both direct query and nested query formats
      const query: SemanticQuery = requestBody.query || requestBody
      
      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(c)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return c.json({
          error: `Query validation failed: ${validation.errors.join(', ')}`
        }, 400)
      }

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
      
      // Return in official Cube.js format
      return c.json(formatCubeResponse(query, result, semanticLayer))
      
    } catch (error) {
      console.error('Query execution error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Query execution failed'
      }, 500)
    }
  })

  /**
   * GET /cubejs-api/v1/load - Execute queries via query string
   */
  app.get(`${basePath}/load`, async (c) => {
    try {
      const queryParam = c.req.query('query')
      if (!queryParam) {
        return c.json({
          error: 'Query parameter is required'
        }, 400)
      }

      let query: SemanticQuery
      try {
        query = JSON.parse(queryParam)
      } catch (parseError) {
        return c.json({
          error: 'Invalid JSON in query parameter'
        }, 400)
      }
      
      // Extract security context
      const securityContext = await extractSecurityContext(c)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return c.json({
          error: `Query validation failed: ${validation.errors.join(', ')}`
        }, 400)
      }

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
      
      // Return in official Cube.js format
      return c.json(formatCubeResponse(query, result, semanticLayer))
      
    } catch (error) {
      console.error('Query execution error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Query execution failed'
      }, 500)
    }
  })

  /**
   * POST /cubejs-api/v1/batch - Execute multiple queries in a single request
   * Optimizes network overhead for dashboards with many portlets
   */
  app.post(`${basePath}/batch`, async (c) => {
    try {
      const requestBody = await c.req.json()
      const { queries } = requestBody as { queries: SemanticQuery[] }

      if (!queries || !Array.isArray(queries)) {
        return c.json({
          error: 'Request body must contain a "queries" array'
        }, 400)
      }

      if (queries.length === 0) {
        return c.json({
          error: 'Queries array cannot be empty'
        }, 400)
      }

      // Extract security context ONCE (shared across all queries)
      const securityContext = await extractSecurityContext(c)

      // Use shared batch handler (wraps existing single query logic)
      const batchResult = await handleBatchRequest(queries, securityContext, semanticLayer)

      return c.json(batchResult)

    } catch (error) {
      console.error('Batch execution error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Batch execution failed'
      }, 500)
    }
  })

  /**
   * GET /cubejs-api/v1/meta - Get cube metadata
   * Optimized for fast response times with caching
   */
  app.get(`${basePath}/meta`, (c) => {
    try {
      // Extract security context (some apps may want to filter cubes by context)
      // await extractSecurityContext(c) // Available if needed for filtering
      
      // Get cached metadata (fast path)
      const metadata = semanticLayer.getMetadata()
      
      return c.json(formatMetaResponse(metadata))
      
    } catch (error) {
      console.error('Metadata error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Failed to fetch metadata'
      }, 500)
    }
  })

  /**
   * POST /cubejs-api/v1/sql - Generate SQL without execution (dry run)
   */
  app.post(`${basePath}/sql`, async (c) => {
    try {
      const query: SemanticQuery = await c.req.json()
      
      const securityContext = await extractSecurityContext(c)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return c.json({
          error: `Query validation failed: ${validation.errors.join(', ')}`
        }, 400)
      }

      // For SQL generation, we need at least one cube referenced
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      
      // Generate SQL using the semantic layer compiler
      const sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
      
      return c.json(formatSqlResponse(query, sqlResult))
      
    } catch (error) {
      console.error('SQL generation error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'SQL generation failed'
      }, 500)
    }
  })

  /**
   * GET /cubejs-api/v1/sql - Generate SQL via query string
   */
  app.get(`${basePath}/sql`, async (c) => {
    try {
      const queryParam = c.req.query('query')
      if (!queryParam) {
        return c.json({
          error: 'Query parameter is required'
        }, 400)
      }

      const query: SemanticQuery = JSON.parse(queryParam)
      const securityContext = await extractSecurityContext(c)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return c.json({
          error: `Query validation failed: ${validation.errors.join(', ')}`
        }, 400)
      }

      // For SQL generation, we need at least one cube referenced
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      
      // Generate SQL using the semantic layer compiler
      const sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
      
      return c.json(formatSqlResponse(query, sqlResult))
      
    } catch (error) {
      console.error('SQL generation error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'SQL generation failed'
      }, 500)
    }
  })


  /**
   * POST /cubejs-api/v1/dry-run - Validate queries without execution
   */
  app.post(`${basePath}/dry-run`, async (c) => {
    try {
      const requestBody = await c.req.json()
      
      // Handle both direct query and nested query formats
      const query: SemanticQuery = requestBody.query || requestBody
      
      // Extract security context using user-provided function
      const securityContext = await extractSecurityContext(c)
      
      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext, semanticLayer)
      
      return c.json(result)
      
    } catch (error) {
      console.error('Dry-run error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Dry-run validation failed',
        valid: false
      }, 400)
    }
  })

  /**
   * GET /cubejs-api/v1/dry-run - Validate queries via query string
   */
  app.get(`${basePath}/dry-run`, async (c) => {
    try {
      const queryParam = c.req.query('query')
      if (!queryParam) {
        return c.json({
          error: 'Query parameter is required',
          valid: false
        }, 400)
      }

      const query: SemanticQuery = JSON.parse(queryParam)
      
      // Extract security context
      const securityContext = await extractSecurityContext(c)
      
      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext, semanticLayer)
      
      return c.json(result)
      
    } catch (error) {
      console.error('Dry-run error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Dry-run validation failed',
        valid: false
      }, 400)
    }
  })

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
/**
 * Hono adapter for Drizzle Cube
 * Provides Cube.js-compatible API endpoints for Hono applications with Drizzle ORM
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { 
  SemanticLayerCompiler, 
  SemanticQuery, 
  SecurityContext, 
  DatabaseExecutor,
  DrizzleDatabase
} from '../../server'

export interface HonoAdapterOptions<TSchema extends Record<string, any> = Record<string, any>> {
  /**
   * The semantic layer instance to use
   */
  semanticLayer: SemanticLayerCompiler<TSchema>
  
  /**
   * Drizzle database instance (REQUIRED)
   * This is the core of drizzle-cube - Drizzle ORM integration
   */
  drizzle: DrizzleDatabase<TSchema>
  
  /**
   * Database schema for type inference (RECOMMENDED)
   * Provides full type safety for cube definitions
   */
  schema?: TSchema
  
  /**
   * Function to extract security context from Hono context
   * This is where you provide your app-specific context extraction logic
   */
  getSecurityContext: (c: any) => SecurityContext | Promise<SecurityContext>
  
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
export function createCubeRoutes<TSchema extends Record<string, any> = Record<string, any>>(
  options: HonoAdapterOptions<TSchema>
) {
  const { 
    semanticLayer, 
    drizzle,
    schema,
    getSecurityContext, 
    cors: corsConfig,
    basePath = '/cubejs-api/v1'
  } = options

  const app = new Hono()

  // Configure CORS if provided
  if (corsConfig) {
    app.use('/*', cors(corsConfig as any))
  }

  // Configure semantic layer with Drizzle only if not already configured
  if (!semanticLayer.hasExecutor()) {
    semanticLayer.setDrizzle(drizzle, schema)
  }

  /**
   * POST /cubejs-api/v1/load - Execute queries
   */
  app.post(`${basePath}/load`, async (c) => {
    try {
      const query: SemanticQuery = await c.req.json()
      
      // Extract security context using user-provided function
      const securityContext = await getSecurityContext(c)
      
      // Validate query has at least measures or dimensions
      if (!query.measures?.length && !query.dimensions?.length) {
        return c.json({
          error: 'Query must specify at least one measure or dimension'
        }, 400)
      }

      // Determine which cube to use (assume first measure/dimension determines cube)
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      const cube = semanticLayer.getCube(cubeName)
      
      if (!cube) {
        return c.json({
          error: `Cube '${cubeName}' not found`
        }, 404)
      }

      // Execute query
      const result = await cube.queryFn(query, securityContext)
      
      // Return in Cube.js format
      return c.json({
        data: result.data,
        annotation: result.annotation,
        query,
        slowQuery: false
      })
      
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

      const query: SemanticQuery = JSON.parse(queryParam)
      
      // Extract security context
      const securityContext = await getSecurityContext(c)
      
      // Execute same logic as POST endpoint
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      const cube = semanticLayer.getCube(cubeName)
      
      if (!cube) {
        return c.json({
          error: `Cube '${cubeName}' not found`
        }, 404)
      }

      const result = await cube.queryFn(query, securityContext)
      
      return c.json({
        data: result.data,
        annotation: result.annotation,
        query,
        slowQuery: false
      })
      
    } catch (error) {
      console.error('Query execution error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'Query execution failed'
      }, 500)
    }
  })

  /**
   * GET /cubejs-api/v1/meta - Get cube metadata
   */
  app.get(`${basePath}/meta`, async (c) => {
    try {
      // Extract security context (some apps may want to filter cubes by context)
      // await getSecurityContext(c) // Available if needed for filtering
      
      const metadata = semanticLayer.getMetadata()
      
      return c.json({
        cubes: metadata
      })
      
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
      
      const securityContext = await getSecurityContext(c)
      
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      const cube = semanticLayer.getCube(cubeName)
      
      if (!cube) {
        return c.json({
          error: `Cube '${cubeName}' not found`
        }, 404)
      }

      // Generate SQL without executing
      const executor = new (await import('../../server')).SemanticQueryExecutor({
        db: {} as any, // Dummy db for SQL generation
        execute: async <T = any[]>(_query: any): Promise<T> => [] as T // Dummy executor for SQL generation
      })
      
      const sqlResult = await executor.generateSQL(cube as any, query, securityContext)
      
      return c.json({
        sql: sqlResult.sql,
        params: sqlResult.params || [],
        query
      })
      
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
      const securityContext = await getSecurityContext(c)
      
      const firstMember = query.measures?.[0] || query.dimensions?.[0]
      if (!firstMember) {
        return c.json({
          error: 'No measures or dimensions specified'
        }, 400)
      }

      const cubeName = firstMember.split('.')[0]
      const cube = semanticLayer.getCube(cubeName)
      
      if (!cube) {
        return c.json({
          error: `Cube '${cubeName}' not found`
        }, 404)
      }

      const executor = new (await import('../../server')).SemanticQueryExecutor({
        db: {} as any, // Dummy db for SQL generation
        execute: async <T = any[]>(_query: any): Promise<T> => [] as T // Dummy executor for SQL generation
      })
      
      const sqlResult = await executor.generateSQL(cube as any, query, securityContext)
      
      return c.json({
        sql: sqlResult.sql,
        params: sqlResult.params || [],
        query
      })
      
    } catch (error) {
      console.error('SQL generation error:', error)
      return c.json({
        error: error instanceof Error ? error.message : 'SQL generation failed'
      }, 500)
    }
  })

  return app
}

/**
 * Convenience function to create routes and mount them on an existing Hono app
 */
export function mountCubeRoutes<TSchema extends Record<string, any> = Record<string, any>>(
  app: Hono, 
  options: HonoAdapterOptions<TSchema>
) {
  const cubeRoutes = createCubeRoutes(options)
  app.route('/', cubeRoutes)
  return app
}

/**
 * Create a complete Hono app with Cube.js routes
 */
export function createCubeApp<TSchema extends Record<string, any> = Record<string, any>>(
  options: HonoAdapterOptions<TSchema>
) {
  const app = new Hono()
  return mountCubeRoutes(app, options)
}

// Re-export types for convenience
export type { SecurityContext, DatabaseExecutor, SemanticQuery, DrizzleDatabase }
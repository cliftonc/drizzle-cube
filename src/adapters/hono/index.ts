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
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { MySql2Database } from 'drizzle-orm/mysql2'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'

export interface HonoAdapterOptions<TSchema extends Record<string, any> = Record<string, any>> {
  /**
   * The semantic layer instance to use
   */
  semanticLayer: SemanticLayerCompiler<TSchema>
  
  /**
   * Drizzle database instance (REQUIRED)
   * This is the core of drizzle-cube - Drizzle ORM integration
   * Accepts PostgreSQL, MySQL, or SQLite database instances
   */
  drizzle: PostgresJsDatabase<TSchema> | MySql2Database<TSchema> | BetterSQLite3Database<TSchema> | DrizzleDatabase<TSchema>
  
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
      const requestBody = await c.req.json()
      
      // Handle both direct query and nested query formats
      const query: SemanticQuery = requestBody.query || requestBody
      
      // Extract security context using user-provided function
      const securityContext = await getSecurityContext(c)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return c.json({
          error: `Query validation failed: ${validation.errors.join(', ')}`
        }, 400)
      }

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
      
      // Get database type
      const dbType = getDatabaseType(semanticLayer)
      
      // Generate request ID and timestamps
      const requestId = generateRequestId()
      const lastRefreshTime = new Date().toISOString()
      
      // Build transformed query metadata
      const transformedQuery = buildTransformedQuery(query)
      
      // Return in official Cube.js format
      return c.json({
        queryType: "regularQuery",
        results: [{
          query,
          lastRefreshTime,
          usedPreAggregations: {},
          transformedQuery,
          requestId,
          annotation: result.annotation,
          dataSource: "default",
          dbType,
          extDbType: dbType,
          external: false,
          slowQuery: false,
          data: result.data
        }],
        pivotQuery: {
          ...query,
          queryType: "regularQuery"
        },
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

      let query: SemanticQuery
      try {
        query = JSON.parse(queryParam)
      } catch (parseError) {
        return c.json({
          error: 'Invalid JSON in query parameter'
        }, 400)
      }
      
      // Extract security context
      const securityContext = await getSecurityContext(c)
      
      // Validate query structure and field existence
      const validation = semanticLayer.validateQuery(query)
      if (!validation.isValid) {
        return c.json({
          error: `Query validation failed: ${validation.errors.join(', ')}`
        }, 400)
      }

      // Execute multi-cube query (handles both single and multi-cube automatically)
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)
      
      // Get database type
      const dbType = getDatabaseType(semanticLayer)
      
      // Generate request ID and timestamps
      const requestId = generateRequestId()
      const lastRefreshTime = new Date().toISOString()
      
      // Build transformed query metadata
      const transformedQuery = buildTransformedQuery(query)
      
      // Return in official Cube.js format
      return c.json({
        queryType: "regularQuery",
        results: [{
          query,
          lastRefreshTime,
          usedPreAggregations: {},
          transformedQuery,
          requestId,
          annotation: result.annotation,
          dataSource: "default",
          dbType,
          extDbType: dbType,
          external: false,
          slowQuery: false,
          data: result.data
        }],
        pivotQuery: {
          ...query,
          queryType: "regularQuery"
        },
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
   * Optimized for fast response times with caching
   */
  app.get(`${basePath}/meta`, (c) => {
    try {
      // Extract security context (some apps may want to filter cubes by context)
      // await getSecurityContext(c) // Available if needed for filtering
      
      // Get cached metadata (fast path)
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
   * Helper function to calculate query complexity
   */
  function calculateQueryComplexity(query: SemanticQuery): string {
    let complexity = 0
    complexity += (query.measures?.length || 0) * 1
    complexity += (query.dimensions?.length || 0) * 1
    complexity += (query.filters?.length || 0) * 2
    complexity += (query.timeDimensions?.length || 0) * 3
    
    if (complexity <= 5) return 'low'
    if (complexity <= 15) return 'medium'
    return 'high'
  }

  /**
   * Generate a unique request ID
   */
  function generateRequestId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    return `${timestamp}-${random}`
  }

  /**
   * Build transformed query metadata
   */
  function buildTransformedQuery(query: SemanticQuery): any {
    const sortedDimensions = query.dimensions || []
    const sortedTimeDimensions = query.timeDimensions || []
    const measures = query.measures || []

    return {
      sortedDimensions,
      sortedTimeDimensions,
      timeDimensions: sortedTimeDimensions,
      measures,
      leafMeasureAdditive: true,
      leafMeasures: measures,
      measureToLeafMeasures: {},
      hasNoTimeDimensionsWithoutGranularity: true,
      allFiltersWithinSelectedDimensions: true,
      isAdditive: true,
      granularityHierarchies: {},
      hasMultipliedMeasures: false,
      hasCumulativeMeasures: false,
      windowGranularity: null,
      filterDimensionsSingleValueEqual: {},
      ownedDimensions: sortedDimensions,
      ownedTimeDimensionsWithRollupGranularity: [],
      ownedTimeDimensionsAsIs: [],
      allBackAliasMembers: {},
      hasMultiStage: false
    }
  }

  /**
   * Get database type from semantic layer
   */
  function getDatabaseType(semanticLayer: SemanticLayerCompiler<any>): string {
    // Extract from the semantic layer's database executor
    if (semanticLayer.hasExecutor()) {
      const executor = (semanticLayer as any).databaseExecutor
      if (executor?.engineType) {
        return executor.engineType
      }
    }
    return 'postgres' // default fallback
  }

  /**
   * Helper function to handle dry-run logic for both GET and POST requests
   */
  async function handleDryRun(query: SemanticQuery, securityContext: SecurityContext) {
    // Validate query structure and field existence
    const validation = semanticLayer.validateQuery(query)
    if (!validation.isValid) {
      throw new Error(`Query validation failed: ${validation.errors.join(', ')}`)
    }

    // Get all referenced cubes from measures and dimensions
    const referencedCubes = new Set<string>()
    
    query.measures?.forEach(measure => {
      const cubeName = measure.split('.')[0]
      referencedCubes.add(cubeName)
    })
    
    query.dimensions?.forEach(dimension => {
      const cubeName = dimension.split('.')[0]
      referencedCubes.add(cubeName)
    })

    // Also include cubes from timeDimensions and filters
    query.timeDimensions?.forEach(timeDimension => {
      const cubeName = timeDimension.dimension.split('.')[0]
      referencedCubes.add(cubeName)
    })

    query.filters?.forEach(filter => {
      if ('member' in filter) {
        const cubeName = filter.member.split('.')[0]
        referencedCubes.add(cubeName)
      }
    })

    // Determine if this is a multi-cube query
    const isMultiCube = referencedCubes.size > 1

    // Generate SQL using the semantic layer compiler
    let sqlResult
    if (isMultiCube) {
      // For multi-cube queries, use the new multi-cube SQL generation
      sqlResult = await semanticLayer.generateMultiCubeSQL(query, securityContext)
    } else {
      // For single cube queries, use the cube-specific SQL generation
      const cubeName = Array.from(referencedCubes)[0]
      sqlResult = await semanticLayer.generateSQL(cubeName, query, securityContext)
    }

    // Create normalized queries array (for Cube.js compatibility)
    const normalizedQueries = Array.from(referencedCubes).map(cubeName => ({
      cube: cubeName,
      query: {
        measures: query.measures?.filter(m => m.startsWith(cubeName + '.')) || [],
        dimensions: query.dimensions?.filter(d => d.startsWith(cubeName + '.')) || [],
        filters: query.filters || [],
        timeDimensions: query.timeDimensions || [],
        order: query.order || {},
        limit: query.limit,
        offset: query.offset
      }
    }))

    // Build comprehensive response
    return {
      queryType: "regularQuery",
      normalizedQueries,
      queryOrder: Array.from(referencedCubes),
      transformedQueries: normalizedQueries,
      pivotQuery: {
        query,
        cubes: Array.from(referencedCubes)
      },
      sql: {
        sql: [sqlResult.sql],
        params: sqlResult.params || []
      },
      complexity: calculateQueryComplexity(query),
      valid: true,
      cubesUsed: Array.from(referencedCubes),
      joinType: isMultiCube ? "multi_cube_join" : "single_cube",
      query
    }
  }

  /**
   * POST /cubejs-api/v1/dry-run - Validate queries without execution
   */
  app.post(`${basePath}/dry-run`, async (c) => {
    try {
      const requestBody = await c.req.json()
      
      // Handle both direct query and nested query formats
      const query: SemanticQuery = requestBody.query || requestBody
      
      // Extract security context using user-provided function
      const securityContext = await getSecurityContext(c)
      
      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext)
      
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
      const securityContext = await getSecurityContext(c)
      
      // Perform dry-run analysis
      const result = await handleDryRun(query, securityContext)
      
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
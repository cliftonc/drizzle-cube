/**
 * Shared utilities for framework adapters
 * Common functions used across Express, Fastify, Next.js, and Hono adapters
 */

import { format } from 'sql-formatter'
import type { 
  SemanticLayerCompiler, 
  SemanticQuery, 
  SecurityContext
} from '../server'

/**
 * Calculate query complexity based on query structure
 */
export function calculateQueryComplexity(query: SemanticQuery): string {
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
export function generateRequestId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${timestamp}-${random}`
}

/**
 * Build transformed query metadata for Cube.js compatibility
 */
export function buildTransformedQuery(query: SemanticQuery): any {
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
export function getDatabaseType(semanticLayer: SemanticLayerCompiler): string {
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
 * Helper function to handle dry-run logic for all adapters
 */
export async function handleDryRun(
  query: SemanticQuery, 
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler
) {
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
 * Format standard Cube.js API response
 */
export function formatCubeResponse(
  query: SemanticQuery,
  result: { data: any[]; annotation?: any },
  semanticLayer: SemanticLayerCompiler
) {
  const dbType = getDatabaseType(semanticLayer)
  const requestId = generateRequestId()
  const lastRefreshTime = new Date().toISOString()
  const transformedQuery = buildTransformedQuery(query)

  return {
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
  }
}

/**
 * Format SQL string using sql-formatter with appropriate dialect
 */
export function formatSqlString(sqlString: string, engineType: 'postgres' | 'mysql' | 'sqlite' | 'singlestore'): string {
  try {
    // Map drizzle-cube engine types to sql-formatter language options
    const dialectMap = {
      postgres: 'postgresql',
      mysql: 'mysql',
      sqlite: 'sqlite',
      singlestore: 'mysql'  // SingleStore uses MySQL dialect for formatting
    } as const
    
    return format(sqlString, {
      language: dialectMap[engineType],
      tabWidth: 2,
      keywordCase: 'upper',
      indentStyle: 'standard'
    })
  } catch (error) {
    // If formatting fails, return original SQL
    console.warn('SQL formatting failed:', error)
    return sqlString
  }
}

/**
 * Format SQL generation response
 */
export function formatSqlResponse(
  query: SemanticQuery,
  sqlResult: { sql: string; params?: any[] }
) {
  return {
    sql: sqlResult.sql,
    params: sqlResult.params || [],
    query
  }
}

/**
 * Format metadata response
 */
export function formatMetaResponse(metadata: any) {
  return {
    cubes: metadata
  }
}

/**
 * Standard error response format
 */
export function formatErrorResponse(error: string | Error, status: number = 500) {
  return {
    error: error instanceof Error ? error.message : error,
    status
  }
}

/**
 * Handle batch query requests - wrapper around existing single query execution
 * Executes multiple queries in parallel and returns partial success results
 *
 * @param queries - Array of semantic queries to execute
 * @param securityContext - Security context (extracted once, shared across all queries)
 * @param semanticLayer - Semantic layer compiler instance
 * @returns Array of results matching input query order (successful or error results)
 */
export async function handleBatchRequest(
  queries: SemanticQuery[],
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler
) {
  // Execute all queries in parallel using Promise.allSettled for partial success
  // This ensures one failing query doesn't affect others
  const settledResults = await Promise.allSettled(
    queries.map(async (query) => {
      // Use EXISTING single query execution logic - NO CODE DUPLICATION
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext)

      // Use EXISTING response formatter - NO CODE DUPLICATION
      return formatCubeResponse(query, result, semanticLayer)
    })
  )

  // Transform Promise.allSettled results to match expected format
  const results = settledResults.map((settledResult, index) => {
    if (settledResult.status === 'fulfilled') {
      // Query succeeded - return the formatted result with success flag
      return {
        success: true,
        ...settledResult.value
      }
    } else {
      // Query failed - return error information
      return {
        success: false,
        error: settledResult.reason instanceof Error
          ? settledResult.reason.message
          : String(settledResult.reason),
        query: queries[index] // Include the query that failed for debugging
      }
    }
  })

  return { results }
}
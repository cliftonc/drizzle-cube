/**
 * Shared utilities for framework adapters
 * Common functions used across Express, Fastify, Next.js, and Hono adapters
 */

import { format } from 'sql-formatter'
import type {
  SemanticLayerCompiler,
  SemanticQuery,
  SecurityContext,
  QueryAnalysis
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
 * Recursively extract cube names from filters (handles nested AND/OR logical filters)
 * Similar to query-planner's extractCubeNamesFromFilter
 */
function extractCubeNamesFromFilter(filter: any, cubesSet: Set<string>): void {
  // Handle logical filters (AND/OR) - Server format: { and: [...] } or { or: [...] }
  if ('and' in filter || 'or' in filter) {
    const logicalFilters = filter.and || filter.or || []
    for (const subFilter of logicalFilters) {
      extractCubeNamesFromFilter(subFilter, cubesSet)
    }
    return
  }

  // Handle simple filter condition
  if ('member' in filter) {
    const [cubeName] = filter.member.split('.')
    if (cubeName) {
      cubesSet.add(cubeName)
    }
  }
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
  // Check for funnel queries FIRST - they have their own dry-run path
  // Funnel queries send { funnel: { ... } } and need special SQL generation
  if (query.funnel && query.funnel.steps?.length >= 2) {
    return handleFunnelDryRun(query, securityContext, semanticLayer)
  }

  // Check for flow queries - they have their own dry-run path
  // Flow queries send { flow: { ... } } and need special SQL generation
  if (query.flow && query.flow.bindingKey && query.flow.eventDimension) {
    return handleFlowDryRun(query, securityContext, semanticLayer)
  }

  // Check for retention queries - they have their own dry-run path
  // Retention queries send { retention: { ... } } and need special SQL generation
  if (query.retention && query.retention.bindingKey && query.retention.timeDimension) {
    return handleRetentionDryRun(query, securityContext, semanticLayer)
  }

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

  // Extract cubes from filters using recursive extraction to handle nested AND/OR
  query.filters?.forEach(filter => {
    extractCubeNamesFromFilter(filter, referencedCubes)
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

  // Generate query analysis for debugging transparency
  let analysis: QueryAnalysis | undefined
  try {
    analysis = semanticLayer.analyzeQuery(query, securityContext)
  } catch (analysisError) {
    // Analysis is optional - don't fail the dry-run if it fails
    console.warn('Query analysis failed:', analysisError)
  }

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
    query,
    // Query analysis for debugging and transparency
    analysis
  }
}

/**
 * Format standard Cube.js API response
 */
export function formatCubeResponse(
  query: SemanticQuery,
  result: { data: any[]; annotation?: any; cache?: { hit: boolean; cachedAt?: string; ttlMs?: number; ttlRemainingMs?: number } },
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
      data: result.data,
      // Include cache metadata if present (indicates cache hit with TTL info)
      ...(result.cache && { cache: result.cache })
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
export function formatSqlString(sqlString: string, engineType: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb'): string {
  try {
    // Map drizzle-cube engine types to sql-formatter language options
    const dialectMap = {
      postgres: 'postgresql',
      mysql: 'mysql',
      sqlite: 'sqlite',
      singlestore: 'mysql',  // SingleStore uses MySQL dialect for formatting
      duckdb: 'postgresql'   // DuckDB is PostgreSQL-compatible for formatting
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
 * Options for batch request handling
 */
export interface BatchRequestOptions {
  /**
   * Whether to bypass server-side cache for all queries in the batch
   * When true, all queries will be executed fresh without cache
   */
  skipCache?: boolean
}

/**
 * Handle batch query requests - wrapper around existing single query execution
 * Executes multiple queries in parallel and returns partial success results
 *
 * @param queries - Array of semantic queries to execute
 * @param securityContext - Security context (extracted once, shared across all queries)
 * @param semanticLayer - Semantic layer compiler instance
 * @param options - Optional batch request options (e.g., skipCache)
 * @returns Array of results matching input query order (successful or error results)
 */
export async function handleBatchRequest(
  queries: SemanticQuery[],
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler,
  options?: BatchRequestOptions
) {
  // Execute all queries in parallel using Promise.allSettled for partial success
  // This ensures one failing query doesn't affect others
  const settledResults = await Promise.allSettled(
    queries.map(async (query) => {
      // Use EXISTING single query execution logic - NO CODE DUPLICATION
      // Pass skipCache option to bypass server-side caching when requested
      const result = await semanticLayer.executeMultiCubeQuery(query, securityContext, {
        skipCache: options?.skipCache
      })

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

/**
 * Helper function to handle funnel dry-run logic
 * Funnel queries have a different structure and generate CTE-based SQL
 */
async function handleFunnelDryRun(
  query: SemanticQuery,
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler
) {
  // Validate funnel query
  const validation = semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    throw new Error(`Funnel query validation failed: ${validation.errors.join(', ')}`)
  }

  // Get the funnel SQL using the dedicated dry-run method
  const sqlResult = await semanticLayer.dryRunFunnel(query, securityContext)

  // Extract cube names from the funnel configuration
  const referencedCubes = new Set<string>()
  const funnel = query.funnel!

  // Extract from binding key
  if (typeof funnel.bindingKey === 'string') {
    const [cubeName] = funnel.bindingKey.split('.')
    if (cubeName) referencedCubes.add(cubeName)
  } else if (Array.isArray(funnel.bindingKey)) {
    for (const mapping of funnel.bindingKey) {
      referencedCubes.add(mapping.cube)
    }
  }

  // Extract from time dimension
  if (typeof funnel.timeDimension === 'string') {
    const [cubeName] = funnel.timeDimension.split('.')
    if (cubeName) referencedCubes.add(cubeName)
  } else if (Array.isArray(funnel.timeDimension)) {
    for (const mapping of funnel.timeDimension) {
      referencedCubes.add(mapping.cube)
    }
  }

  // Extract from steps (multi-cube funnels have cube per step)
  for (const step of funnel.steps) {
    if ('cube' in step && step.cube) {
      referencedCubes.add(step.cube)
    }
  }

  // Build response structure
  return {
    queryType: 'funnelQuery',
    normalizedQueries: [], // Funnel is a single unified query
    queryOrder: Array.from(referencedCubes),
    transformedQueries: [],
    pivotQuery: {
      query,
      cubes: Array.from(referencedCubes)
    },
    sql: {
      sql: [sqlResult.sql],
      params: sqlResult.params || []
    },
    complexity: 'high', // Funnel queries are inherently complex (CTEs)
    valid: true,
    cubesUsed: Array.from(referencedCubes),
    joinType: 'funnel_cte',
    query,
    // Funnel-specific metadata
    funnel: {
      stepCount: funnel.steps.length,
      steps: funnel.steps.map((step, index) => ({
        index,
        name: step.name,
        timeToConvert: step.timeToConvert,
        cube: 'cube' in step ? step.cube : undefined
      })),
      bindingKey: funnel.bindingKey,
      timeDimension: funnel.timeDimension,
      includeTimeMetrics: funnel.includeTimeMetrics,
      globalTimeWindow: funnel.globalTimeWindow
    }
  }
}

/**
 * Helper function to handle flow dry-run logic
 * Flow queries have a different structure and generate CTE-based SQL
 */
async function handleFlowDryRun(
  query: SemanticQuery,
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler
) {
  // Validate flow query
  const validation = semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    throw new Error(`Flow query validation failed: ${validation.errors.join(', ')}`)
  }

  // Get the flow SQL using the dedicated dry-run method
  const sqlResult = await semanticLayer.dryRunFlow(query, securityContext)

  // Extract cube names from the flow configuration
  const referencedCubes = new Set<string>()
  const flow = query.flow!

  // Extract from binding key
  if (typeof flow.bindingKey === 'string') {
    const [cubeName] = flow.bindingKey.split('.')
    if (cubeName) referencedCubes.add(cubeName)
  } else if (Array.isArray(flow.bindingKey)) {
    for (const mapping of flow.bindingKey) {
      referencedCubes.add(mapping.cube)
    }
  }

  // Extract from time dimension
  if (typeof flow.timeDimension === 'string') {
    const [cubeName] = flow.timeDimension.split('.')
    if (cubeName) referencedCubes.add(cubeName)
  }

  // Extract from event dimension
  if (typeof flow.eventDimension === 'string') {
    const [cubeName] = flow.eventDimension.split('.')
    if (cubeName) referencedCubes.add(cubeName)
  }

  // Build response structure
  return {
    queryType: 'flowQuery',
    normalizedQueries: [], // Flow is a single unified query
    queryOrder: Array.from(referencedCubes),
    transformedQueries: [],
    pivotQuery: {
      measures: [],
      dimensions: [],
      timeDimensions: [],
      order: {},
      filters: [],
      queryType: 'flowQuery',
      joinType: 'flow_cte',
      query,
      // Flow-specific metadata
      flow: {
        stepsBefore: flow.stepsBefore,
        stepsAfter: flow.stepsAfter,
        bindingKey: flow.bindingKey,
        timeDimension: flow.timeDimension,
        eventDimension: flow.eventDimension,
        startingStep: flow.startingStep
      }
    },
    sql: {
      sql: sqlResult.sql,
      params: sqlResult.params || []
    }
  }
}

/**
 * Handle dry-run for retention queries
 */
async function handleRetentionDryRun(
  query: SemanticQuery,
  securityContext: SecurityContext,
  semanticLayer: SemanticLayerCompiler
) {
  // Validate retention query
  const validation = semanticLayer.validateQuery(query)
  if (!validation.isValid) {
    throw new Error(`Retention query validation failed: ${validation.errors.join(', ')}`)
  }

  // Get the retention SQL using the dedicated dry-run method
  const sqlResult = await semanticLayer.dryRunRetention(query, securityContext)

  // Extract cube names from the retention configuration
  const referencedCubes = new Set<string>()
  const retention = query.retention!

  // Extract from time dimension (single dimension for both cohort and activity)
  if (typeof retention.timeDimension === 'string') {
    const [cubeName] = retention.timeDimension.split('.')
    if (cubeName) referencedCubes.add(cubeName)
  } else if (retention.timeDimension && typeof retention.timeDimension === 'object') {
    referencedCubes.add(retention.timeDimension.cube)
  }

  // Extract from binding key
  if (typeof retention.bindingKey === 'string') {
    const [cubeName] = retention.bindingKey.split('.')
    if (cubeName) referencedCubes.add(cubeName)
  } else if (Array.isArray(retention.bindingKey)) {
    for (const mapping of retention.bindingKey) {
      referencedCubes.add(mapping.cube)
    }
  }

  // Extract from breakdown dimensions
  if (retention.breakdownDimensions && Array.isArray(retention.breakdownDimensions)) {
    for (const dim of retention.breakdownDimensions) {
      const [cubeName] = dim.split('.')
      if (cubeName) referencedCubes.add(cubeName)
    }
  }

  // Build response structure
  return {
    queryType: 'retentionQuery',
    normalizedQueries: [], // Retention is a single unified query
    queryOrder: Array.from(referencedCubes),
    transformedQueries: [],
    pivotQuery: {
      measures: [],
      dimensions: [],
      timeDimensions: [],
      order: {},
      filters: [],
      queryType: 'retentionQuery',
      joinType: 'retention_cte',
      query,
      // Retention-specific metadata
      retention: {
        timeDimension: retention.timeDimension,
        bindingKey: retention.bindingKey,
        granularity: retention.granularity,
        periods: retention.periods,
        retentionType: retention.retentionType,
        breakdownDimensions: retention.breakdownDimensions,
      }
    },
    sql: {
      sql: sqlResult.sql,
      params: sqlResult.params || []
    }
  }
}
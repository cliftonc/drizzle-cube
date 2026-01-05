/**
 * Unified Drizzle Query Executor
 * Handles both single and multi-cube queries through a unified execution path
 * Uses QueryBuilder for SQL generation and QueryPlanner for query planning
 */

import {
  and,
  sql,
  SQL,
  sum,
  min,
  max
} from 'drizzle-orm'

import type {
  SecurityContext,
  SemanticQuery,
  QueryResult,
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation,
  DatabaseExecutor,
  Cube,
  QueryContext,
  QueryPlan,
  JoinKeyInfo,
  CacheConfig
} from './types'

import { resolveSqlExpression } from './cube-utils'
import { FilterCacheManager, getFilterKey, getTimeDimensionFilterKey, flattenFilters } from './filter-cache'
import { generateCacheKey } from './cache-utils'
import { QueryBuilder } from './query-builder'
import { QueryPlanner } from './query-planner'
import { CTEBuilder } from './cte-builder'
import { MeasureBuilder } from './builders/measure-builder'
import { validateQueryAgainstCubes } from './compiler'
import { applyGapFilling } from './gap-filler'
import type { DatabaseAdapter } from './adapters/base-adapter'
import { ComparisonQueryBuilder } from './comparison-query-builder'

export class QueryExecutor {
  private queryBuilder: QueryBuilder
  private queryPlanner: QueryPlanner
  private cteBuilder: CTEBuilder
  private databaseAdapter: DatabaseAdapter
  private comparisonQueryBuilder: ComparisonQueryBuilder
  private cacheConfig?: CacheConfig

  constructor(private dbExecutor: DatabaseExecutor, cacheConfig?: CacheConfig) {
    // Get the database adapter from the executor
    this.databaseAdapter = dbExecutor.databaseAdapter
    if (!this.databaseAdapter) {
      throw new Error('DatabaseExecutor must have a databaseAdapter property')
    }
    this.queryBuilder = new QueryBuilder(this.databaseAdapter)
    this.queryPlanner = new QueryPlanner()
    this.cteBuilder = new CTEBuilder(this.queryBuilder)
    this.comparisonQueryBuilder = new ComparisonQueryBuilder(this.databaseAdapter)
    this.cacheConfig = cacheConfig
  }

  /**
   * Unified query execution method that handles both single and multi-cube queries
   */
  async execute(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    try {
      // Validate query before execution
      const validation = validateQueryAgainstCubes(cubes, query)
      if (!validation.isValid) {
        throw new Error(`Query validation failed: ${validation.errors.join(', ')}`)
      }

      // Check cache BEFORE expensive operations (after validation, includes security context)
      let cacheKey: string | undefined
      if (this.cacheConfig?.enabled !== false && this.cacheConfig?.provider) {
        cacheKey = generateCacheKey(query, securityContext, this.cacheConfig)
        try {
          const startTime = Date.now()
          const cacheResult = await this.cacheConfig.provider.get<QueryResult>(cacheKey)
          if (cacheResult) {
            this.cacheConfig.onCacheEvent?.({
              type: 'hit',
              key: cacheKey,
              durationMs: Date.now() - startTime
            })

            // Return cached result WITH cache metadata
            return {
              ...cacheResult.value,
              cache: cacheResult.metadata
                ? {
                    hit: true as const,
                    cachedAt: new Date(cacheResult.metadata.cachedAt).toISOString(),
                    ttlMs: cacheResult.metadata.ttlMs,
                    ttlRemainingMs: cacheResult.metadata.ttlRemainingMs
                  }
                : {
                    hit: true as const,
                    cachedAt: new Date().toISOString(),
                    ttlMs: 0,
                    ttlRemainingMs: 0
                  }
            }
          }
          this.cacheConfig.onCacheEvent?.({
            type: 'miss',
            key: cacheKey,
            durationMs: Date.now() - startTime
          })
        } catch (error) {
          this.cacheConfig.onError?.(error as Error, 'get')
          // Continue without cache - failures are non-fatal
        }
      }

      // Check for compareDateRange queries and route to comparison execution
      if (this.comparisonQueryBuilder.hasComparison(query)) {
        return this.executeComparisonQueryWithCache(cubes, query, securityContext, cacheKey)
      }

      // Create filter cache for parameter deduplication across CTEs
      const filterCache = new FilterCacheManager()

      // Create query context with filter cache
      const context: QueryContext = {
        db: this.dbExecutor.db,
        schema: this.dbExecutor.schema,
        securityContext,
        filterCache
      }

      // Pre-build filter SQL for reuse across CTEs and main query
      this.preloadFilterCache(query, filterCache, cubes, context)

      // Create unified query plan (works for both single and multi-cube)
      const queryPlan = this.queryPlanner.createQueryPlan(cubes, query, context)

      // Validate security context is applied to all cubes in the query plan
      this.validateSecurityContext(queryPlan, context)

      // Build the query using unified approach
      const builtQuery = this.buildUnifiedQuery(queryPlan, query, context)

      // Execute query - pass numeric field names for selective conversion
      const numericFields = this.queryBuilder.collectNumericFields(cubes, query)
      const data = await this.dbExecutor.execute(builtQuery, numericFields)
      
      // Process time dimension results
      const mappedData = Array.isArray(data) ? data.map(row => {
        const mappedRow = { ...row }
        if (query.timeDimensions) {
          for (const timeDim of query.timeDimensions) {
            if (timeDim.dimension in mappedRow) {
              let dateValue = mappedRow[timeDim.dimension]

              // If we have a date that is not 'T' in the center and Z at the end, we need to fix it
              if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
                const isoString = dateValue.replace(' ', 'T')
                const finalIsoString = !isoString.endsWith('Z') && !isoString.includes('+')
                  ? isoString + 'Z'
                  : isoString
                dateValue = new Date(finalIsoString)
              }

              // Convert time dimension result using database adapter if required
              dateValue = this.databaseAdapter.convertTimeDimensionResult(dateValue)
              mappedRow[timeDim.dimension] = dateValue
            }
          }
        }
        return mappedRow
      }) : [data]

      // Apply gap filling for time series if requested
      const measureNames = query.measures || []
      const filledData = applyGapFilling(mappedData, query, measureNames)

      // Generate annotations for UI
      const annotation = this.generateAnnotations(queryPlan, query)

      const result: QueryResult = {
        data: filledData,
        annotation
      }

      // Cache result before returning (without cache metadata - that's only on cache hits)
      if (cacheKey && this.cacheConfig?.provider) {
        try {
          const startTime = Date.now()
          await this.cacheConfig.provider.set(
            cacheKey,
            result,
            this.cacheConfig.defaultTtlMs ?? 300000
          )
          this.cacheConfig.onCacheEvent?.({
            type: 'set',
            key: cacheKey,
            durationMs: Date.now() - startTime
          })
        } catch (error) {
          this.cacheConfig.onError?.(error as Error, 'set')
          // Continue without caching - failures are non-fatal
        }
      }

      return result
    } catch (error) {
      // Extract the actual database error from the cause chain
      // Drizzle ORM wraps database errors, but the real error is in the cause
      if (error instanceof Error) {
        let dbError: Error = error
        while (dbError.cause instanceof Error) {
          dbError = dbError.cause
        }

        // Build comprehensive error message with the actual database error
        let message = dbError.message

        // Add PostgreSQL-specific details if available
        const pgError = dbError as any
        if (pgError.code) message += ` [${pgError.code}]`
        if (pgError.detail) message += ` Detail: ${pgError.detail}`
        if (pgError.hint) message += ` Hint: ${pgError.hint}`

        error.message = `Query execution failed: ${message}`
        throw error
      }
      throw new Error(`Query execution failed: Unknown error`)
    }
  }

  /**
   * Legacy interface for single cube queries
   */
  async executeQuery(
    cube: Cube,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    // Convert single cube to map for unified execution
    const cubes = new Map<string, Cube>()
    cubes.set(cube.name, cube)
    return this.execute(cubes, query, securityContext)
  }

  /**
   * Execute a comparison query with caching support
   * Wraps executeComparisonQuery with cache set logic
   */
  private async executeComparisonQueryWithCache(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey: string | undefined
  ): Promise<QueryResult> {
    const result = await this.executeComparisonQuery(cubes, query, securityContext)

    // Cache result before returning (without cache metadata - that's only on cache hits)
    if (cacheKey && this.cacheConfig?.provider) {
      try {
        const startTime = Date.now()
        await this.cacheConfig.provider.set(
          cacheKey,
          result,
          this.cacheConfig.defaultTtlMs ?? 300000
        )
        this.cacheConfig.onCacheEvent?.({
          type: 'set',
          key: cacheKey,
          durationMs: Date.now() - startTime
        })
      } catch (error) {
        this.cacheConfig.onError?.(error as Error, 'set')
        // Continue without caching - failures are non-fatal
      }
    }

    return result
  }

  /**
   * Execute a comparison query with multiple date periods
   * Expands compareDateRange into multiple sub-queries and merges results
   */
  private async executeComparisonQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    // Get the time dimension with compareDateRange
    const timeDimension = this.comparisonQueryBuilder.getComparisonTimeDimension(query)
    if (!timeDimension || !timeDimension.compareDateRange) {
      throw new Error('No compareDateRange found in query')
    }

    // Normalize periods (parse relative dates, etc.)
    const periods = this.comparisonQueryBuilder.normalizePeriods(
      timeDimension.compareDateRange
    )

    if (periods.length < 2) {
      throw new Error('compareDateRange requires at least 2 periods')
    }

    // Get granularity (default to 'day' if not specified)
    const granularity = timeDimension.granularity || 'day'

    // Execute query for each period in parallel
    const periodResultPromises = periods.map(async (period) => {
      // Create a sub-query for this specific period
      const periodQuery = this.comparisonQueryBuilder.createPeriodQuery(query, period)

      // Execute using the standard path (this.execute handles the rest)
      // Note: We call executeStandardQuery to avoid recursion
      const result = await this.executeStandardQuery(cubes, periodQuery, securityContext)

      return { result, period }
    })

    // Wait for all period queries to complete
    const periodResults = await Promise.all(periodResultPromises)

    // Merge results with period metadata
    const mergedResult = this.comparisonQueryBuilder.mergeComparisonResults(
      periodResults,
      timeDimension,
      granularity
    )

    // Sort by period index and time dimension
    mergedResult.data = this.comparisonQueryBuilder.sortComparisonResults(
      mergedResult.data as any,
      timeDimension.dimension
    )

    return mergedResult
  }

  /**
   * Standard query execution (non-comparison)
   * This is the core execution logic extracted for use by comparison queries
   */
  private async executeStandardQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    // Create filter cache for parameter deduplication across CTEs
    const filterCache = new FilterCacheManager()

    // Create query context with filter cache
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext,
      filterCache
    }

    // Pre-build filter SQL for reuse across CTEs and main query
    this.preloadFilterCache(query, filterCache, cubes, context)

    // Create unified query plan (works for both single and multi-cube)
    const queryPlan = this.queryPlanner.createQueryPlan(cubes, query, context)

    // Build the query using unified approach
    const builtQuery = this.buildUnifiedQuery(queryPlan, query, context)

    // Execute query - pass numeric field names for selective conversion
    const numericFields = this.queryBuilder.collectNumericFields(cubes, query)
    const data = await this.dbExecutor.execute(builtQuery, numericFields)

    // Process time dimension results
    const mappedData = Array.isArray(data) ? data.map(row => {
      const mappedRow = { ...row }
      if (query.timeDimensions) {
        for (const timeDim of query.timeDimensions) {
          if (timeDim.dimension in mappedRow) {
            let dateValue = mappedRow[timeDim.dimension]

            // If we have a date that is not 'T' in the center and Z at the end, we need to fix it
            if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
              const isoString = dateValue.replace(' ', 'T')
              const finalIsoString = !isoString.endsWith('Z') && !isoString.includes('+')
                ? isoString + 'Z'
                : isoString
              dateValue = new Date(finalIsoString)
            }

            // Convert time dimension result using database adapter if required
            dateValue = this.databaseAdapter.convertTimeDimensionResult(dateValue)
            mappedRow[timeDim.dimension] = dateValue
          }
        }
      }
      return mappedRow
    }) : [data]

    // Apply gap filling for time series if requested
    const measureNames = query.measures || []
    const filledData = applyGapFilling(mappedData, query, measureNames)

    // Generate annotations for UI
    const annotation = this.generateAnnotations(queryPlan, query)

    return {
      data: filledData,
      annotation
    }
  }

  /**
   * Validate that all cubes in the query plan have proper security filtering.
   * Emits a warning if a cube's sql() function doesn't return a WHERE clause.
   *
   * Security is critical in multi-tenant applications - this validation helps
   * detect cubes that may leak data across tenants.
   */
  private validateSecurityContext(queryPlan: QueryPlan, context: QueryContext): void {
    // Only run validation in development or when explicitly enabled
    // Use safe check for process.env to support edge runtimes (Cloudflare Workers, etc.)
    const nodeEnv = typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined
    const warnSecurity = typeof process !== 'undefined' ? process.env?.DRIZZLE_CUBE_WARN_SECURITY : undefined
    if (nodeEnv !== 'development' && !warnSecurity) {
      return
    }

    // Collect all cubes in the query (primary + joined cubes + CTE cubes)
    const cubesToCheck: Cube[] = [queryPlan.primaryCube]

    for (const joinInfo of queryPlan.joinCubes || []) {
      cubesToCheck.push(joinInfo.cube)
    }

    for (const cteInfo of queryPlan.preAggregationCTEs || []) {
      cubesToCheck.push(cteInfo.cube)
    }

    // Track unique cubes to avoid duplicate warnings
    const checkedCubes = new Set<string>()

    // Check each cube's security context
    for (const cube of cubesToCheck) {
      if (checkedCubes.has(cube.name)) continue
      checkedCubes.add(cube.name)

      try {
        const securityResult = cube.sql(context)

        // A properly secured cube should have a 'where' clause that filters by security context
        // If no 'where' clause is present, the cube might be returning all data
        if (!securityResult.where) {
          console.warn(
            `[drizzle-cube] WARNING: Cube '${cube.name}' may not have proper security filtering. ` +
            `The sql() function returned no 'where' clause. ` +
            `Ensure it returns a filter like: { from: table, where: eq(table.organisationId, ctx.securityContext.organisationId) }`
          )
        }
      } catch {
        // If calling sql() throws, skip validation for this cube
        // The actual execution will catch the error with better context
      }
    }
  }

  /**
   * Build unified query that works for both single and multi-cube queries
   */
  private buildUnifiedQuery(
    queryPlan: any,
    query: SemanticQuery,
    context: QueryContext
  ) {
    // Pre-build filter SQL for propagating filters to enable parameter deduplication
    // This ensures the same filter values are shared between CTE subqueries and main query
    const preBuiltFilterMap = new Map<string, SQL[]>()

    if (queryPlan.preAggregationCTEs && queryPlan.preAggregationCTEs.length > 0) {
      for (const cteInfo of queryPlan.preAggregationCTEs) {
        if (cteInfo.propagatingFilters && cteInfo.propagatingFilters.length > 0) {
          for (const propFilter of cteInfo.propagatingFilters) {
            const sourceCubeName = propFilter.sourceCube.name

            // Build filter SQL once if not already built for this cube
            if (!preBuiltFilterMap.has(sourceCubeName)) {
              const syntheticQuery: SemanticQuery = {
                filters: propFilter.filters
              }
              const cubeMap = new Map([[sourceCubeName, propFilter.sourceCube]])
              const filterSQL = this.queryBuilder.buildWhereConditions(
                cubeMap,
                syntheticQuery,
                context
              )
              preBuiltFilterMap.set(sourceCubeName, filterSQL)
            }

            // Store the pre-built SQL in the propagating filter for reuse
            const preBuiltSQL = preBuiltFilterMap.get(sourceCubeName)
            if (preBuiltSQL && preBuiltSQL.length > 0) {
              propFilter.preBuiltFilterSQL = preBuiltSQL.length === 1
                ? preBuiltSQL[0]
                : and(...preBuiltSQL) as SQL
            }
          }
        }
      }
    }

    // Build pre-aggregation CTEs if needed
    const ctes: any[] = []
    const cteAliasMap = new Map<string, string>()

    if (queryPlan.preAggregationCTEs && queryPlan.preAggregationCTEs.length > 0) {
      for (const cteInfo of queryPlan.preAggregationCTEs) {
        const cte = this.cteBuilder.buildPreAggregationCTE(cteInfo, query, context, queryPlan, preBuiltFilterMap)
        if (cte) {
          ctes.push(cte)
          cteAliasMap.set(cteInfo.cube.name, cteInfo.cteAlias)
        } else {
          // Failed to build CTE
        }
      }
    }
    
    // Get primary cube's base SQL definition
    const primaryCubeBase = queryPlan.primaryCube.sql(context)
    
    // Build selections using QueryBuilder - but modify for CTEs
    const selections = this.queryBuilder.buildSelections(
      queryPlan.joinCubes.length > 0 
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context
    )
    
    // Replace selections from pre-aggregated cubes with CTE references
    const modifiedSelections = { ...selections }
    if (queryPlan.preAggregationCTEs) {
      for (const cteInfo of queryPlan.preAggregationCTEs) {
        const cubeName = cteInfo.cube.name

        // Handle measures from CTE cubes
        for (const measureName of cteInfo.measures) {
          if (modifiedSelections[measureName]) {
            const [, fieldName] = measureName.split('.')
            const cube = this.getCubesFromPlan(queryPlan).get(cubeName)
            if (cube && cube.measures && cube.measures[fieldName]) {
              const measure = cube.measures[fieldName]
              const cteColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`

              // For aggregate CTEs, use appropriate Drizzle aggregate function based on measure type
              // Since CTE is already pre-aggregated, we need to aggregate the pre-aggregated values
              let aggregatedExpr: SQL

              if (measure.type === 'calculated' && measure.calculatedSql) {
                // Use QueryBuilder's helper to build calculated measure from CTE columns
                const allCubes = this.getCubesFromPlan(queryPlan)
                aggregatedExpr = this.queryBuilder.buildCTECalculatedMeasure(
                  measure,
                  cube,
                  cteInfo,
                  allCubes,
                  context
                )
              } else {
                // For non-calculated measures, aggregate the CTE column directly
                switch (measure.type) {
                  case 'count':
                  case 'countDistinct':
                  case 'sum':
                    aggregatedExpr = sum(cteColumn)
                    break
                  case 'avg':
                    // For average of averages, we should use a weighted average, but for now use simple avg
                    aggregatedExpr = this.databaseAdapter.buildAvg(cteColumn)
                    break
                  case 'min':
                    aggregatedExpr = min(cteColumn)
                    break
                  case 'max':
                    aggregatedExpr = max(cteColumn)
                    break
                  case 'number':
                    // For number type, use sum to combine values
                    aggregatedExpr = sum(cteColumn)
                    break
                  default:
                    aggregatedExpr = sum(cteColumn)
                }
              }

              modifiedSelections[measureName] = sql`${aggregatedExpr}`.as(measureName) as unknown as SQL
            }
          }
        }
        
        // Handle dimensions from CTE cubes (these need to reference join keys in CTE)
        for (const selectionName in modifiedSelections) {
          const [selectionCubeName, fieldName] = selectionName.split('.')
          if (selectionCubeName === cubeName) {
            // This is a dimension/time dimension from a CTE cube
            const cube = this.getCubesFromPlan(queryPlan).get(cubeName)
            
            // Check if this is a dimension or time dimension from this cube
            const isDimension = cube && cube.dimensions?.[fieldName]
            const isTimeDimension = selectionName.startsWith(cubeName + '.')
            
            if (isDimension || isTimeDimension) {
              // Check if this is one of the join keys that's already in the CTE
              // First try exact name match
              let matchingJoinKey = cteInfo.joinKeys.find((jk: JoinKeyInfo) => jk.targetColumn === fieldName)
              
              // If no exact match, check if the dimension SQL matches any join key target column
              if (!matchingJoinKey && cube?.dimensions?.[fieldName]) {
                const dimensionSql = cube.dimensions[fieldName].sql
                matchingJoinKey = cteInfo.joinKeys.find((jk: any) => {
                  // Check if the dimension's SQL column matches the join key's target column object
                  return jk.targetColumnObj === dimensionSql
                })
              }
              
              if (matchingJoinKey) {
                // Reference the join key from the CTE using the dimension name
                modifiedSelections[selectionName] = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`.as(selectionName) as unknown as SQL
              } else if (isTimeDimension && cube?.dimensions?.[fieldName]) {
                // This is a time dimension that should be available in the CTE
                modifiedSelections[selectionName] = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`.as(selectionName) as unknown as SQL
              }
              // For non-join-key dimensions from CTE cubes that aren't handled above,
              // the original selection will be kept (which may cause SQL errors if not properly handled)
            }
          }
        }
      }
    }

    // Handle post-aggregation window functions
    // These window functions reference a base measure and operate on aggregated data
    if (query.measures) {
      const allCubes = this.getCubesFromPlan(queryPlan)

      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = allCubes.get(cubeName)

        if (cube?.measures?.[fieldName]) {
          const measure = cube.measures[fieldName]

          // Check if this is a post-aggregation window function
          if (MeasureBuilder.isPostAggregationWindow(measure)) {
            const baseMeasureName = MeasureBuilder.getWindowBaseMeasure(measure, cubeName)

            if (baseMeasureName) {
              // Build the base measure expression fresh (without alias)
              // We can't use modifiedSelections because those are aliased and SQL doesn't
              // allow referencing SELECT aliases in the same SELECT clause
              const [baseCubeName, baseFieldName] = baseMeasureName.split('.')
              const baseCube = allCubes.get(baseCubeName)

              if (baseCube?.measures?.[baseFieldName]) {
                const baseMeasure = baseCube.measures[baseFieldName]

                // Check if the base measure is from a CTE cube (hasMany relationship)
                // If so, we should reference the CTE column with re-aggregation
                // because the main query has its own GROUP BY
                const cteInfo = queryPlan.preAggregationCTEs?.find(
                  (cte: any) => cte.cube?.name === baseCubeName && cte.measures?.includes(baseMeasureName)
                )

                let baseMeasureExpr: SQL
                if (cteInfo) {
                  // Base measure is from a CTE - reference the CTE column
                  // The CTE already contains the aggregated value (e.g., totalLinesOfCode)
                  // But the main query may have additional GROUP BY, so we need to re-aggregate
                  const cteColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(baseFieldName)}`
                  // Apply sum() to the CTE column to re-aggregate for the main query's GROUP BY
                  baseMeasureExpr = sql`sum(${cteColumn})`
                } else {
                  // Not from a CTE - build the raw aggregation expression (e.g., SUM(column))
                  baseMeasureExpr = this.queryBuilder.buildMeasureExpression(baseMeasure, context, baseCube)
                }

                // Ensure the base measure is also in the selections (for display)
                if (!modifiedSelections[baseMeasureName]) {
                  modifiedSelections[baseMeasureName] = sql`${baseMeasureExpr}`.as(baseMeasureName) as unknown as SQL
                }

                // Build the window function expression
                const windowExpr = this.buildPostAggregationWindowExpression(
                  measure,
                  baseMeasureExpr,
                  query,
                  context,
                  cube,
                  queryPlan
                )

                if (windowExpr) {
                  modifiedSelections[measureName] = sql`${windowExpr}`.as(measureName) as unknown as SQL
                }
              }
            }
          }
        }
      }
    }

    // Collect all WHERE conditions (declared early for junction table security)
    const allWhereConditions: SQL[] = []

    // Start building the query from the primary cube
    let drizzleQuery = context.db
      .select(modifiedSelections)
      .from(primaryCubeBase.from)

    // Add CTEs to the query - Drizzle CTEs are added at the start
    if (ctes.length > 0) {
      drizzleQuery = context.db
        .with(...ctes)
        .select(modifiedSelections)
        .from(primaryCubeBase.from)
    }

    // Add joins from primary cube base (intra-cube joins)
    if (primaryCubeBase.joins) {
      for (const join of primaryCubeBase.joins) {
        switch (join.type || 'left') {
          case 'left':
            drizzleQuery = drizzleQuery.leftJoin(join.table, join.on)
            break
          case 'inner':
            drizzleQuery = drizzleQuery.innerJoin(join.table, join.on)
            break
          case 'right':
            drizzleQuery = drizzleQuery.rightJoin(join.table, join.on)
            break
          case 'full':
            drizzleQuery = drizzleQuery.fullJoin(join.table, join.on)
            break
        }
      }
    }

    // Add multi-cube joins (inter-cube joins)
    if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
      for (const joinCube of queryPlan.joinCubes) {
        // Check if this cube has been pre-aggregated into a CTE
        const cteAlias = cteAliasMap.get(joinCube.cube.name)

        // Handle belongsToMany junction table first if present
        if (joinCube.junctionTable) {
          const junctionTable = joinCube.junctionTable

          // Collect all WHERE conditions for junction table including security context
          const junctionWhereConditions: SQL[] = []
          if (junctionTable.securitySql) {
            const junctionSecurity = junctionTable.securitySql(context.securityContext)
            if (Array.isArray(junctionSecurity)) {
              junctionWhereConditions.push(...junctionSecurity)
            } else {
              junctionWhereConditions.push(junctionSecurity)
            }
          }

          // Add junction table join (source -> junction)
          try {
            switch (junctionTable.joinType || 'left') {
              case 'left':
                drizzleQuery = drizzleQuery.leftJoin(junctionTable.table, junctionTable.joinCondition)
                break
              case 'inner':
                drizzleQuery = drizzleQuery.innerJoin(junctionTable.table, junctionTable.joinCondition)
                break
              case 'right':
                drizzleQuery = drizzleQuery.rightJoin(junctionTable.table, junctionTable.joinCondition)
                break
              case 'full':
                drizzleQuery = drizzleQuery.fullJoin(junctionTable.table, junctionTable.joinCondition)
                break
            }

            // Add junction table security conditions to WHERE clause
            if (junctionWhereConditions.length > 0) {
              allWhereConditions.push(...junctionWhereConditions)
            }
          } catch {
            // Junction table join failed, continuing
          }
        }

        let joinTarget: any
        let joinCondition: any

        if (cteAlias) {
          // Join to CTE instead of base table - use sql table reference
          joinTarget = sql`${sql.identifier(cteAlias)}`
          // Build CTE join condition using the CTE alias
          joinCondition = this.cteBuilder.buildCTEJoinCondition(joinCube, cteAlias, queryPlan)
        } else {
          // Regular join to base table
          const joinCubeBase = joinCube.cube.sql(context)
          joinTarget = joinCubeBase.from
          joinCondition = joinCube.joinCondition
        }

        try {
          switch (joinCube.joinType || 'left') {
            case 'left':
              drizzleQuery = drizzleQuery.leftJoin(joinTarget, joinCondition)
              break
            case 'inner':
              drizzleQuery = drizzleQuery.innerJoin(joinTarget, joinCondition)
              break
            case 'right':
              drizzleQuery = drizzleQuery.rightJoin(joinTarget, joinCondition)
              break
            case 'full':
              drizzleQuery = drizzleQuery.fullJoin(joinTarget, joinCondition)
              break
          }
        } catch {
          // If join fails (e.g., duplicate alias), log and continue
          // Multi-cube join failed, continuing
        }
      }
    }

    // Add base WHERE conditions from primary cube
    if (primaryCubeBase.where) {
      allWhereConditions.push(primaryCubeBase.where)
    }

    // Add WHERE conditions from all joined cubes (including their security context filters)
    if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
      for (const joinCube of queryPlan.joinCubes) {
        // Skip if this cube is handled by a CTE (WHERE conditions are applied within the CTE)
        const cteAlias = cteAliasMap.get(joinCube.cube.name)
        if (cteAlias) {
          continue
        }
        
        // Get the base query definition for this joined cube to access its WHERE conditions
        const joinCubeBase = joinCube.cube.sql(context)
        if (joinCubeBase.where) {
          allWhereConditions.push(joinCubeBase.where)
        }
      }
    }

    // Add query-specific WHERE conditions using QueryBuilder
    // Pass preBuiltFilterMap to reuse filter SQL and deduplicate parameters
    const queryWhereConditions = this.queryBuilder.buildWhereConditions(
      queryPlan.joinCubes.length > 0
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context,
      queryPlan, // Pass the queryPlan to handle CTE scenarios
      preBuiltFilterMap // Reuse pre-built filters for parameter deduplication
    )
    if (queryWhereConditions.length > 0) {
      allWhereConditions.push(...queryWhereConditions)
    }

    // Apply combined WHERE conditions
    if (allWhereConditions.length > 0) {
      const combinedWhere = allWhereConditions.length === 1 
        ? allWhereConditions[0] 
        : and(...allWhereConditions) as SQL
      drizzleQuery = drizzleQuery.where(combinedWhere)
    }

    // Add GROUP BY using QueryBuilder
    const groupByFields = this.queryBuilder.buildGroupByFields(
      queryPlan.joinCubes.length > 0 
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context,
      queryPlan // Pass the queryPlan to handle CTE scenarios
    )
    if (groupByFields.length > 0) {
      drizzleQuery = drizzleQuery.groupBy(...groupByFields)
    }

    // Add HAVING conditions using QueryBuilder (after GROUP BY)
    const havingConditions = this.queryBuilder.buildHavingConditions(
      queryPlan.joinCubes.length > 0 
        ? this.getCubesFromPlan(queryPlan) // Multi-cube
        : queryPlan.primaryCube, // Single cube
      query,
      context,
      queryPlan // Pass the queryPlan to handle CTE scenarios
    )
    if (havingConditions.length > 0) {
      const combinedHaving = havingConditions.length === 1 
        ? havingConditions[0] 
        : and(...havingConditions) as SQL
      drizzleQuery = drizzleQuery.having(combinedHaving)
    }

    // Add ORDER BY using QueryBuilder
    const orderByFields = this.queryBuilder.buildOrderBy(query)
    if (orderByFields.length > 0) {
      drizzleQuery = drizzleQuery.orderBy(...orderByFields)
    }

    // Add LIMIT and OFFSET using QueryBuilder
    drizzleQuery = this.queryBuilder.applyLimitAndOffset(drizzleQuery, query)

    return drizzleQuery
  }

  /**
   * Convert query plan to cube map for QueryBuilder methods
   */
  private getCubesFromPlan(queryPlan: any): Map<string, Cube> {
    const cubes = new Map<string, Cube>()
    cubes.set(queryPlan.primaryCube.name, queryPlan.primaryCube)
    
    if (queryPlan.joinCubes) {
      for (const joinCube of queryPlan.joinCubes) {
        cubes.set(joinCube.cube.name, joinCube.cube)
      }
    }
    
    return cubes
  }





  /**
   * Generate raw SQL for debugging (without execution) - unified approach
   */
  async generateSQL(
    cube: Cube, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const cubes = new Map<string, Cube>()
    cubes.set(cube.name, cube)
    return this.generateUnifiedSQL(cubes, query, securityContext)
  }

  /**
   * Generate raw SQL for multi-cube queries without execution - unified approach
   */
  async generateMultiCubeSQL(
    cubes: Map<string, Cube>,
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    return this.generateUnifiedSQL(cubes, query, securityContext)
  }

  /**
   * Generate SQL using unified approach (works for both single and multi-cube)
   */
  private async generateUnifiedSQL(
    cubes: Map<string, Cube>,
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema!,
      securityContext
    }

    // Create unified query plan
    const queryPlan = this.queryPlanner.createQueryPlan(cubes, query, context)
    
    // Build the query using unified approach
    const builtQuery = this.buildUnifiedQuery(queryPlan, query, context)
    
    // Extract SQL from the built query
    const sqlObj = builtQuery.toSQL()
    
    return {
      sql: sqlObj.sql,
      params: sqlObj.params
    }
  }

  /**
   * Generate annotations for UI metadata - unified approach
   */
  private generateAnnotations(
    queryPlan: any,
    query: SemanticQuery
  ) {
    const measures: Record<string, MeasureAnnotation> = {}
    const dimensions: Record<string, DimensionAnnotation> = {}
    const timeDimensions: Record<string, TimeDimensionAnnotation> = {}
    
    // Get all cubes involved (primary + join cubes)
    const allCubes = [queryPlan.primaryCube].filter(Boolean)
    if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
      allCubes.push(...queryPlan.joinCubes.map((jc: any) => jc.cube).filter(Boolean))
    }

    // Generate measure annotations from all cubes
    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = allCubes.find(c => c?.name === cubeName)
        if (cube && cube.measures[fieldName]) {
          const measure = cube.measures[fieldName]
          measures[measureName] = {
            title: measure.title || fieldName,
            shortTitle: measure.title || fieldName,
            type: measure.type
          }
        }
      }
    }
    
    // Generate dimension annotations from all cubes
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        const cube = allCubes.find(c => c?.name === cubeName)
        if (cube && cube.dimensions?.[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          dimensions[dimensionName] = {
            title: dimension.title || fieldName,
            shortTitle: dimension.title || fieldName,
            type: dimension.type
          }
        }
      }
    }

    // Generate time dimension annotations from all cubes
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        const cube = allCubes.find(c => c?.name === cubeName)
        if (cube && cube.dimensions?.[fieldName]) {
          const dimension = cube.dimensions[fieldName]
          timeDimensions[timeDim.dimension] = {
            title: dimension.title || fieldName,
            shortTitle: dimension.title || fieldName,
            type: dimension.type,
            granularity: timeDim.granularity
          }
        }
      }
    }
    
    return {
      measures,
      dimensions,
      segments: {},
      timeDimensions
    }
  }

  /**
   * Pre-build filter SQL and store in cache for reuse across CTEs and main query
   * This enables parameter deduplication - the same filter values are shared
   * rather than appearing as separate parameters in different parts of the query
   */
  private preloadFilterCache(
    query: SemanticQuery,
    filterCache: FilterCacheManager,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): void {
    // Pre-build regular filters
    if (query.filters && query.filters.length > 0) {
      // Flatten nested AND/OR filters to get individual conditions
      const flatFilters = flattenFilters(query.filters)

      for (const filter of flatFilters) {
        const key = getFilterKey(filter)

        // Skip if already cached (from a previous filter in the same query)
        if (filterCache.has(key)) continue

        // Find the cube for this filter's member
        const [cubeName, fieldName] = filter.member.split('.')
        const cube = cubes.get(cubeName)
        if (!cube) continue

        const dimension = cube.dimensions?.[fieldName]
        if (!dimension) continue

        // For array operators, we need the raw column (not isolated SQL)
        // because Drizzle's array functions need column type metadata for proper encoding
        const isArrayOperator = ['arrayContains', 'arrayOverlaps', 'arrayContained'].includes(filter.operator)
        if (isArrayOperator) {
          // Skip caching array operator filters - they require special column handling
          // and will be built fresh each time to ensure proper array encoding
          continue
        }

        // Build the filter SQL using the query builder
        const fieldExpr = resolveSqlExpression(dimension.sql, context)
        const filterSQL = this.queryBuilder.buildFilterConditionPublic(
          fieldExpr,
          filter.operator,
          filter.values,
          dimension,
          filter.dateRange
        )

        if (filterSQL) {
          filterCache.set(key, filterSQL)
        }
      }

      // NOTE: We do NOT cache logical filters (AND/OR) because they can contain
      // mixed cube references. When some cubes are in CTEs, the cached version
      // would reference wrong table contexts. Individual simple filters within
      // logical filters are still cached for deduplication.
    }

    // Pre-build time dimension date range filters
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        if (timeDim.dateRange) {
          const key = getTimeDimensionFilterKey(timeDim.dimension, timeDim.dateRange)

          // Skip if already cached
          if (filterCache.has(key)) continue

          const [cubeName, fieldName] = timeDim.dimension.split('.')
          const cube = cubes.get(cubeName)
          if (!cube) continue

          const dimension = cube.dimensions?.[fieldName]
          if (!dimension) continue

          const fieldExpr = resolveSqlExpression(dimension.sql, context)
          const dateCondition = this.queryBuilder.buildDateRangeCondition(fieldExpr, timeDim.dateRange)

          if (dateCondition) {
            filterCache.set(key, dateCondition)
          }
        }
      }
    }
  }

  /**
   * Build post-aggregation window function expression
   *
   * Post-aggregation windows operate on already-aggregated data:
   * 1. The base measure is aggregated (e.g., SUM(revenue))
   * 2. The window function is applied (e.g., LAG(...) OVER ORDER BY date)
   * 3. An optional operation is applied (e.g., current - previous)
   *
   * @param measure - The window function measure definition
   * @param baseMeasureExpr - The aggregated base measure expression
   * @param query - The semantic query (for dimension context)
   * @param context - Query context
   * @param cube - The cube containing this measure
   * @returns SQL expression for the window function
   */
  private buildPostAggregationWindowExpression(
    measure: any,
    baseMeasureExpr: any,
    query: SemanticQuery,
    context: QueryContext,
    cube: Cube,
    queryPlan?: any
  ): SQL | null {
    const windowConfig = measure.windowConfig || {}

    // Helper to check if a dimension's cube is in a CTE
    // If so, return the CTE's pre-computed column reference instead of re-computing
    const getCTEDimensionExpr = (dimCubeName: string, fieldName: string): SQL | null => {
      if (!queryPlan?.preAggregationCTEs) return null
      const cteInfo = queryPlan.preAggregationCTEs.find((cte: any) => cte.cube?.name === dimCubeName)
      if (cteInfo && cteInfo.cteAlias) {
        // Check if this dimension is in the CTE's selections (time dimensions are included)
        // We reference the CTE's pre-computed column directly
        return sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`
      }
      return null
    }

    // Build ORDER BY expression for the window function
    // Use time dimensions or specified orderBy fields
    type OrderByExpr = { field: any; direction: 'asc' | 'desc' }
    let orderByExprs: OrderByExpr[] | undefined

    if (windowConfig.orderBy && windowConfig.orderBy.length > 0) {
      orderByExprs = windowConfig.orderBy
        .map((orderSpec: { field: string; direction: 'asc' | 'desc' }): OrderByExpr | null => {
          const fieldName = orderSpec.field.includes('.') ? orderSpec.field.split('.')[1] : orderSpec.field

          // First check if it's a time dimension in the query (with granularity)
          // This takes priority because time dimensions need the granularity-applied expression
          if (query.timeDimensions) {
            for (const timeDim of query.timeDimensions) {
              const [timeDimCubeName, timeDimField] = timeDim.dimension.split('.')
              if (timeDimField === fieldName) {
                // Check if this dimension's cube is in a CTE
                // If so, use the CTE's pre-computed date column
                const cteExpr = getCTEDimensionExpr(timeDimCubeName, fieldName)
                if (cteExpr) {
                  return {
                    field: cteExpr,
                    direction: orderSpec.direction
                  }
                }

                // Not from CTE - build the time dimension expression with granularity
                const timeDimension = cube.dimensions?.[timeDimField]
                if (timeDimension) {
                  return {
                    field: this.queryBuilder.buildTimeDimensionExpression(
                      timeDimension.sql,
                      timeDim.granularity,
                      context
                    ),
                    direction: orderSpec.direction
                  }
                }
              }
            }
          }

          // Fall back to regular dimensions if not a time dimension
          const dimension = cube.dimensions?.[fieldName]
          if (dimension) {
            return {
              field: resolveSqlExpression(dimension.sql, context),
              direction: orderSpec.direction
            }
          }

          // Check if the ORDER BY field references the base measure itself
          // This is common for RANK/DENSE_RANK where we order by the aggregated value
          const baseMeasureFieldName = windowConfig.measure?.includes('.')
            ? windowConfig.measure.split('.')[1]
            : windowConfig.measure

          if (fieldName === baseMeasureFieldName || orderSpec.field === windowConfig.measure) {
            // Use the base measure expression for ordering
            return {
              field: baseMeasureExpr,
              direction: orderSpec.direction
            }
          }

          return null
        })
        .filter((expr: OrderByExpr | null): expr is OrderByExpr => expr !== null)
    } else if (query.timeDimensions && query.timeDimensions.length > 0) {
      // Default to first time dimension for ordering
      const timeDim = query.timeDimensions[0]
      const [timeCubeName, timeDimField] = timeDim.dimension.split('.')

      // Check if the time dimension's cube is in a CTE
      const cteExpr = getCTEDimensionExpr(timeCubeName, timeDimField)
      if (cteExpr) {
        orderByExprs = [{
          field: cteExpr,
          direction: 'asc' as const
        }]
      } else {
        const timeCube = cube.name === timeCubeName ? cube : undefined

        if (timeCube?.dimensions?.[timeDimField]) {
          const timeDimension = timeCube.dimensions[timeDimField]
          orderByExprs = [{
            field: this.queryBuilder.buildTimeDimensionExpression(
              timeDimension.sql,
              timeDim.granularity,
              context
            ),
            direction: 'asc' as const
          }]
        }
      }
    }

    // Build PARTITION BY expression if specified
    let partitionByExprs: any[] | undefined
    if (windowConfig.partitionBy && windowConfig.partitionBy.length > 0) {
      partitionByExprs = windowConfig.partitionBy
        .map((dimRef: string) => {
          const dimName = dimRef.includes('.') ? dimRef.split('.')[1] : dimRef
          const dimension = cube.dimensions?.[dimName]
          if (dimension) {
            return resolveSqlExpression(dimension.sql, context)
          }
          return null
        })
        .filter((expr: any): expr is any => expr !== null)
    }

    // Build the base window function using the database adapter
    const windowResult = this.databaseAdapter.buildWindowFunction(
      measure.type,
      baseMeasureExpr,
      partitionByExprs,
      orderByExprs,
      {
        offset: windowConfig.offset,
        defaultValue: windowConfig.defaultValue,
        nTile: windowConfig.nTile,
        frame: windowConfig.frame
      }
    )

    if (!windowResult) {
      return null
    }

    // Apply the operation (difference, ratio, percentChange)
    const operation = windowConfig.operation || MeasureBuilder.getDefaultWindowOperation(measure.type)

    switch (operation) {
      case 'difference':
        // For LAG: current - previous (baseMeasure - LAG(baseMeasure))
        // For LEAD: current - next (baseMeasure - LEAD(baseMeasure))
        return sql`${baseMeasureExpr} - ${windowResult}`

      case 'ratio':
        // current / window (with NULL protection)
        return sql`${baseMeasureExpr} / NULLIF(${windowResult}, 0)`

      case 'percentChange':
        // ((current - window) / window) * 100
        return sql`((${baseMeasureExpr} - ${windowResult}) / NULLIF(${windowResult}, 0)) * 100`

      case 'raw':
      default:
        // Return the window function result directly
        return windowResult
    }
  }





















}
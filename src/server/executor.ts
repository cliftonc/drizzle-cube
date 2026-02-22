/**
 * Unified Drizzle Query Executor
 * Handles both single and multi-cube queries through a unified execution path
 * Uses DrizzleSqlBuilder for SQL generation and LogicalPlanner for query planning
 */

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
  PhysicalQueryPlan,
  CacheConfig,
  ExplainOptions,
  ExplainResult,
  ExecutionOptions,
  QueryAnalysis
} from './types'

import { resolveSqlExpression } from './cube-utils'
import { FilterCacheManager, getFilterKey, getTimeDimensionFilterKey, flattenFilters } from './filter-cache'
import { generateCacheKey } from './cache-utils'
import { DrizzleSqlBuilder } from './physical-plan/drizzle-sql-builder'
import { LogicalPlanner } from './logical-plan/logical-planner'
import { CTEBuilder } from './builders/cte-builder'
import { validateQueryAgainstCubes } from './compiler'
import { applyGapFilling } from './gap-filler'
import type { DatabaseAdapter } from './adapters/base-adapter'
import { ComparisonQueryBuilder } from './builders/comparison-query-builder'
import { FunnelQueryBuilder } from './builders/funnel-query-builder'
import { FlowQueryBuilder } from './builders/flow-query-builder'
import { RetentionQueryBuilder } from './builders/retention-query-builder'
import { LogicalPlanBuilder, IdentityOptimiser } from './logical-plan'
import type { PlanOptimiser, QueryNode } from './logical-plan'
import { DrizzlePlanBuilder } from './physical-plan'

type QueryExecutionMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention'

export class QueryExecutor {
  private queryBuilder: DrizzleSqlBuilder
  private drizzlePlanBuilder: DrizzlePlanBuilder
  private databaseAdapter: DatabaseAdapter
  private comparisonQueryBuilder: ComparisonQueryBuilder
  private funnelQueryBuilder: FunnelQueryBuilder
  private flowQueryBuilder: FlowQueryBuilder
  private retentionQueryBuilder: RetentionQueryBuilder
  private cacheConfig?: CacheConfig
  private logicalPlanBuilder: LogicalPlanBuilder
  private planOptimiser: PlanOptimiser

  constructor(private dbExecutor: DatabaseExecutor, cacheConfig?: CacheConfig) {
    // Get the database adapter from the executor
    this.databaseAdapter = dbExecutor.databaseAdapter
    if (!this.databaseAdapter) {
      throw new Error('DatabaseExecutor must have a databaseAdapter property')
    }
    this.queryBuilder = new DrizzleSqlBuilder(this.databaseAdapter)
    const queryPlanner = new LogicalPlanner()
    const cteBuilder = new CTEBuilder(this.queryBuilder)
    this.drizzlePlanBuilder = new DrizzlePlanBuilder(this.queryBuilder, cteBuilder, this.databaseAdapter)
    this.comparisonQueryBuilder = new ComparisonQueryBuilder(this.databaseAdapter)
    this.funnelQueryBuilder = new FunnelQueryBuilder(this.databaseAdapter)
    this.flowQueryBuilder = new FlowQueryBuilder(this.databaseAdapter)
    this.retentionQueryBuilder = new RetentionQueryBuilder(this.databaseAdapter)
    this.logicalPlanBuilder = new LogicalPlanBuilder(queryPlanner)
    this.planOptimiser = new IdentityOptimiser()
    this.cacheConfig = cacheConfig
  }

  /**
   * Unified query execution method that handles both single and multi-cube queries
   * @param options.skipCache - Skip cache lookup (but still cache the fresh result)
   */
  async execute(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    options?: ExecutionOptions
  ): Promise<QueryResult> {
    try {
      const mode = this.resolveQueryMode(query)
      this.validateQueryForMode(mode, cubes, query)

      // Check cache BEFORE expensive operations (after validation, includes security context)
      // Skip cache lookup if options.skipCache is true (but still cache the result later)
      let cacheKey: string | undefined
      if (this.cacheConfig?.enabled !== false && this.cacheConfig?.provider) {
        cacheKey = generateCacheKey(query, securityContext, this.cacheConfig)

        // Only do cache lookup if not explicitly bypassing cache
        if (!options?.skipCache) {
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
                      hit: true,
                      cachedAt: new Date(cacheResult.metadata.cachedAt).toISOString(),
                      ttlMs: cacheResult.metadata.ttlMs,
                      ttlRemainingMs: cacheResult.metadata.ttlRemainingMs
                    }
                  : {
                      hit: true,
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
        } else {
          // skipCache requested - emit a bypass event if handler exists
          this.cacheConfig.onCacheEvent?.({
            type: 'miss',
            key: cacheKey,
            durationMs: 0
          })
        }
      }

      return await this.executeQueryByModeWithCache(mode, cubes, query, securityContext, cacheKey)
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
   * Build a logical plan for a query without executing it.
   * Useful for testing, debugging, and plan inspection.
   */
  buildLogicalPlan(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): import('./logical-plan').QueryNode {
    const filterCache = new FilterCacheManager()
    const context = this.createQueryContext(securityContext, filterCache)
    this.preloadFilterCache(query, filterCache, cubes, context)
    return this.buildRegularQueryArtifacts(cubes, query, context).optimisedPlan
  }

  /**
   * Analyze planning decisions for a regular query using the same logical
   * planning path as execution and dry-run SQL generation.
   */
  analyzeQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): QueryAnalysis {
    const filterCache = new FilterCacheManager()
    const context = this.createQueryContext(securityContext, filterCache)
    this.preloadFilterCache(query, filterCache, cubes, context)
    return this.buildRegularQueryArtifacts(cubes, query, context).analysis
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
    await this.cacheResult(cacheKey, result)
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
   * Execute a funnel query with caching support
   */
  private async executeFunnelQueryWithCache(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey: string | undefined
  ): Promise<QueryResult> {
    const result = await this.executeFunnelQuery(cubes, query, securityContext)
    await this.cacheResult(cacheKey, result)

    // Return result with cache metadata (miss - freshly computed)
    return {
      ...result,
      cache: {
        hit: false
      }
    }
  }

  /**
   * Execute a funnel analysis query
   */
  private async executeFunnelQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    const config = query.funnel!

    // Validate funnel configuration
    const validation = this.funnelQueryBuilder.validateConfig(config, cubes)
    if (!validation.isValid) {
      throw new Error(`Funnel validation failed: ${validation.errors.join(', ')}`)
    }

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build funnel query using Drizzle query builder
    // The refactored buildFunnelQuery returns a query builder with .toSQL() support
    const funnelQuery = this.funnelQueryBuilder.buildFunnelQuery(config, cubes, context)

    // Execute the query builder directly
    const rawResult = await funnelQuery as unknown as Record<string, unknown>[]

    // Transform to step rows
    const funnelRows = this.funnelQueryBuilder.transformResult(rawResult, config)

    // Build annotation with funnel metadata
    // Note: Funnel queries have a different annotation structure
    // The funnel property contains the funnel-specific metadata
    const annotation: QueryResult['annotation'] & { funnel?: unknown } = {
      measures: {} as Record<string, MeasureAnnotation>,
      dimensions: {} as Record<string, DimensionAnnotation>,
      segments: {},
      timeDimensions: {} as Record<string, TimeDimensionAnnotation>
    }

    // Add funnel metadata to annotation (as additional property)
    ;(annotation as any).funnel = {
      config,
      steps: config.steps.map((step, index) => ({
        name: step.name,
        index,
        timeToConvert: step.timeToConvert
      }))
    }

    return {
      data: funnelRows as unknown as Record<string, unknown>[],
      annotation
    }
  }

  /**
   * Execute a flow query with caching support
   */
  private async executeFlowQueryWithCache(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey: string | undefined
  ): Promise<QueryResult> {
    const result = await this.executeFlowQuery(cubes, query, securityContext)
    await this.cacheResult(cacheKey, result)

    // Return result with cache metadata (miss - freshly computed)
    return {
      ...result,
      cache: {
        hit: false
      }
    }
  }

  /**
   * Execute a flow analysis query
   * Produces Sankey diagram data (nodes and links)
   */
  private async executeFlowQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    const config = query.flow!

    // Validate flow configuration
    const validation = this.flowQueryBuilder.validateConfig(config, cubes)
    if (!validation.isValid) {
      throw new Error(`Flow validation failed: ${validation.errors.join(', ')}`)
    }

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build flow query using Drizzle query builder
    const flowQuery = this.flowQueryBuilder.buildFlowQuery(config, cubes, context)

    // Execute the query
    const rawResult = await flowQuery as unknown as Record<string, unknown>[]

    // Transform to FlowResultRow (nodes and links)
    const flowData = this.flowQueryBuilder.transformResult(rawResult)

    // Build annotation with flow metadata
    const annotation: QueryResult['annotation'] & { flow?: unknown } = {
      measures: {} as Record<string, MeasureAnnotation>,
      dimensions: {} as Record<string, DimensionAnnotation>,
      segments: {},
      timeDimensions: {} as Record<string, TimeDimensionAnnotation>
    }

    // Add flow metadata to annotation
    ;(annotation as any).flow = {
      config,
      startingStep: {
        name: config.startingStep.name,
      },
      stepsBefore: config.stepsBefore,
      stepsAfter: config.stepsAfter,
    }

    return {
      data: [flowData] as unknown as Record<string, unknown>[],
      annotation
    }
  }

  /**
   * Execute a retention query with caching support
   */
  private async executeRetentionQueryWithCache(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey: string | undefined
  ): Promise<QueryResult> {
    const result = await this.executeRetentionQuery(cubes, query, securityContext)
    await this.cacheResult(cacheKey, result)

    // Return result with cache metadata (miss - freshly computed)
    return {
      ...result,
      cache: {
        hit: false
      }
    }
  }

  /**
   * Execute a retention analysis query
   * Calculates cohort-based retention rates
   */
  private async executeRetentionQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    const config = query.retention!

    // Validate retention configuration
    const validation = this.retentionQueryBuilder.validateConfig(config, cubes)
    if (!validation.isValid) {
      throw new Error(`Retention validation failed: ${validation.errors.join(', ')}`)
    }

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build retention query using Drizzle query builder
    const retentionQuery = this.retentionQueryBuilder.buildRetentionQuery(config, cubes, context)

    // Execute the query
    const rawResult = await retentionQuery as unknown as Record<string, unknown>[]

    // Transform to RetentionResultRow
    const retentionRows = this.retentionQueryBuilder.transformResult(rawResult, config)

    // Build annotation with retention metadata
    const annotation: QueryResult['annotation'] & { retention?: unknown } = {
      measures: {} as Record<string, MeasureAnnotation>,
      dimensions: {} as Record<string, DimensionAnnotation>,
      segments: {},
      timeDimensions: {} as Record<string, TimeDimensionAnnotation>
    }

    // Add retention metadata to annotation
    ;(annotation as any).retention = {
      config,
      granularity: config.granularity,
      periods: config.periods,
      retentionType: config.retentionType,
      breakdownDimensions: config.breakdownDimensions
    }

    return {
      data: retentionRows as unknown as Record<string, unknown>[],
      annotation
    }
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
    const context = this.createQueryContext(securityContext, filterCache)

    // Pre-build filter SQL for reuse across CTEs and main query
    this.preloadFilterCache(query, filterCache, cubes, context)

    // Create unified query plan via shared logical pipeline
    const { optimisedPlan } = this.buildRegularQueryArtifacts(cubes, query, context)
    const physicalPlan = this.drizzlePlanBuilder.derivePhysicalPlanContext(optimisedPlan)

    // Build the query using unified approach
    const builtQuery = this.drizzlePlanBuilder.build(physicalPlan, query, context)

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
    const annotation = this.generateAnnotations(physicalPlan, query)

    return {
      data: filledData,
      annotation
    }
  }

  /**
   * Create a query context with optional filter cache.
   */
  private createQueryContext(
    securityContext: SecurityContext,
    filterCache?: FilterCacheManager
  ): QueryContext {
    return {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext,
      filterCache
    }
  }

  /**
   * Normalize engine type for optimiser passes.
   * SingleStore follows MySQL SQL semantics for planner choices.
   */
  private getOptimiserEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'duckdb' {
    const engine = this.dbExecutor.getEngineType?.()
    if (engine === 'singlestore') {
      return 'mysql'
    }
    return (engine ?? 'postgres') as 'postgres' | 'mysql' | 'sqlite' | 'duckdb'
  }

  /**
   * Shared regular-query planning pipeline used by execute, dry-run SQL,
   * and analysis. This is the single source of planning truth.
   */
  private buildRegularQueryArtifacts(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    context: QueryContext
  ): {
    logicalPlan: QueryNode
    analysis: QueryAnalysis
    optimisedPlan: QueryNode
  } {
    const planning = this.logicalPlanBuilder.planWithAnalysis(cubes, query, context)
    const optimised = this.planOptimiser.optimise(planning.plan, {
      engineType: this.getOptimiserEngineType()
    }) as QueryNode
    return {
      logicalPlan: planning.plan,
      analysis: planning.analysis,
      optimisedPlan: optimised
    }
  }

  /**
   * Validate that all cubes in the query plan have proper security filtering.
   * Emits a warning if a cube's sql() function doesn't return a WHERE clause.
   *
   * Security is critical in multi-tenant applications - this validation helps
   * detect cubes that may leak data across tenants.
   */
  private validateSecurityContext(queryPlan: PhysicalQueryPlan, context: QueryContext): void {
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
        // Skip warning for cubes explicitly marked as public
        if (cube.public) continue

        const securityResult = cube.sql(context)

        // A properly secured cube should have a 'where' clause that filters by security context
        // If no 'where' clause is present, the cube might be returning all data
        if (!securityResult.where) {
          console.warn(
            `[drizzle-cube] WARNING: Cube '${cube.name}' has no security filtering. ` +
            `If this cube contains public data, add 'public: true' to suppress this warning. ` +
            `Otherwise, ensure sql() returns: { from: table, where: eq(table.orgId, ctx.securityContext.orgId) }`
          )
        }
      } catch {
        // If calling sql() throws, skip validation for this cube
        // The actual execution will catch the error with better context
      }
    }
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
   * Generate SQL for a funnel query without execution (dry-run)
   * Returns the actual CTE-based SQL that would be executed
   */
  async dryRunFunnel(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    // Validate funnel query
    if (!this.funnelQueryBuilder.hasFunnel(query)) {
      throw new Error('Query does not contain a valid funnel configuration')
    }

    const config = query.funnel!

    // Validate funnel configuration
    const validation = this.funnelQueryBuilder.validateConfig(config, cubes)
    if (!validation.isValid) {
      throw new Error(`Funnel validation failed: ${validation.errors.join(', ')}`)
    }

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build funnel query using Drizzle query builder
    // The refactored buildFunnelQuery returns a query builder with .toSQL() support
    const funnelQuery = this.funnelQueryBuilder.buildFunnelQuery(config, cubes, context)

    // Use .toSQL() to get the SQL string and parameters
    // This now works because buildFunnelQuery returns a Drizzle query builder
    const sqlObj = funnelQuery.toSQL()

    return {
      sql: sqlObj.sql,
      params: sqlObj.params
    }
  }

  /**
   * Generate SQL for a flow query without execution (dry-run)
   * Returns the actual CTE-based SQL that would be executed
   */
  async dryRunFlow(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    // Validate flow query
    if (!this.flowQueryBuilder.hasFlow(query)) {
      throw new Error('Query does not contain a valid flow configuration')
    }

    const config = query.flow!

    // Validate flow configuration
    const validation = this.flowQueryBuilder.validateConfig(config, cubes)
    if (!validation.isValid) {
      throw new Error(`Flow validation failed: ${validation.errors.join(', ')}`)
    }

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build flow query using Drizzle query builder
    const flowQuery = this.flowQueryBuilder.buildFlowQuery(config, cubes, context)

    // Use .toSQL() to get the SQL string and parameters
    const sqlObj = flowQuery.toSQL()

    return {
      sql: sqlObj.sql,
      params: sqlObj.params
    }
  }

  /**
   * Generate SQL for a retention query without execution (dry-run)
   * Returns the actual CTE-based SQL that would be executed
   */
  async dryRunRetention(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    // Validate retention query
    if (!this.retentionQueryBuilder.hasRetention(query)) {
      throw new Error('Query does not contain a valid retention configuration')
    }

    const config = query.retention!

    // Validate retention configuration
    const validation = this.retentionQueryBuilder.validateConfig(config, cubes)
    if (!validation.isValid) {
      throw new Error(`Retention validation failed: ${validation.errors.join(', ')}`)
    }

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build retention query using Drizzle query builder
    const retentionQuery = this.retentionQueryBuilder.buildRetentionQuery(config, cubes, context)

    // Use .toSQL() to get the SQL string and parameters
    const sqlObj = retentionQuery.toSQL()

    return {
      sql: sqlObj.sql,
      params: sqlObj.params
    }
  }

  /**
   * Execute EXPLAIN on a query to get the execution plan
   * Generates the SQL using the same secure path as execute/generateSQL,
   * then runs EXPLAIN on the database.
   */
  async explainQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    options?: ExplainOptions
  ): Promise<ExplainResult> {
    const sqlResult = await this.dryRunSQL(cubes, query, securityContext)

    // Execute EXPLAIN using the database executor
    return this.dbExecutor.explainQuery(
      sqlResult.sql,
      sqlResult.params || [],
      options
    )
  }

  /**
   * Generate SQL for any query mode without execution.
   * This is the canonical dry-run SQL entrypoint used by explain/adapters.
   */
  async dryRunSQL(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const mode = this.resolveQueryMode(query)
    this.validateQueryForMode(mode, cubes, query)
    return this.generateSqlForMode(mode, cubes, query, securityContext)
  }

  /**
   * Generate SQL using unified approach (works for both single and multi-cube)
   */
  private async generateUnifiedSQL(
    cubes: Map<string, Cube>,
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const filterCache = new FilterCacheManager()
    const context = this.createQueryContext(securityContext, filterCache)
    this.preloadFilterCache(query, filterCache, cubes, context)

    // Create unified query plan from shared logical planning pipeline
    const { optimisedPlan } = this.buildRegularQueryArtifacts(cubes, query, context)
    const physicalPlan = this.drizzlePlanBuilder.derivePhysicalPlanContext(optimisedPlan)
    
    // Build the query using unified approach
    const builtQuery = this.drizzlePlanBuilder.build(physicalPlan, query, context)
    
    // Extract SQL from the built query
    const sqlObj = builtQuery.toSQL()
    
    return {
      sql: sqlObj.sql,
      params: sqlObj.params
    }
  }

  private resolveQueryMode(query: SemanticQuery): QueryExecutionMode {
    const activeModes: QueryExecutionMode[] = []

    if (this.comparisonQueryBuilder.hasComparison(query)) {
      activeModes.push('comparison')
    }
    if (this.funnelQueryBuilder.hasFunnel(query)) {
      activeModes.push('funnel')
    }
    if (this.flowQueryBuilder.hasFlow(query)) {
      activeModes.push('flow')
    }
    if (this.retentionQueryBuilder.hasRetention(query)) {
      activeModes.push('retention')
    }

    if (activeModes.length === 0) {
      return 'regular'
    }

    if (activeModes.length > 1) {
      throw new Error(`Query contains multiple query modes: ${activeModes.join(', ')}`)
    }

    return activeModes[0]
  }

  private validateQueryForMode(
    mode: QueryExecutionMode,
    cubes: Map<string, Cube>,
    query: SemanticQuery
  ): void {
    const validateStandard = () => {
      const validation = validateQueryAgainstCubes(cubes, query)
      if (!validation.isValid) {
        throw new Error(`Query validation failed: ${validation.errors.join(', ')}`)
      }
    }

    const validators: Record<QueryExecutionMode, () => void> = {
      regular: validateStandard,
      comparison: validateStandard,
      funnel: () => {
        const validation = this.funnelQueryBuilder.validateConfig(query.funnel!, cubes)
        if (!validation.isValid) {
          throw new Error(`Funnel validation failed: ${validation.errors.join(', ')}`)
        }
      },
      flow: () => {
        const validation = this.flowQueryBuilder.validateConfig(query.flow!, cubes)
        if (!validation.isValid) {
          throw new Error(`Flow validation failed: ${validation.errors.join(', ')}`)
        }
      },
      retention: () => {
        const validation = this.retentionQueryBuilder.validateConfig(query.retention!, cubes)
        if (!validation.isValid) {
          throw new Error(`Retention validation failed: ${validation.errors.join(', ')}`)
        }
      }
    }

    validators[mode]()
  }

  private async executeQueryByModeWithCache(
    mode: QueryExecutionMode,
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey: string | undefined
  ): Promise<QueryResult> {
    const executors: Record<QueryExecutionMode, () => Promise<QueryResult>> = {
      regular: () => this.executeRegularQueryWithCache(cubes, query, securityContext, cacheKey),
      comparison: () => this.executeComparisonQueryWithCache(cubes, query, securityContext, cacheKey),
      funnel: () => this.executeFunnelQueryWithCache(cubes, query, securityContext, cacheKey),
      flow: () => this.executeFlowQueryWithCache(cubes, query, securityContext, cacheKey),
      retention: () => this.executeRetentionQueryWithCache(cubes, query, securityContext, cacheKey)
    }

    return executors[mode]()
  }

  private async executeRegularQueryWithCache(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey: string | undefined
  ): Promise<QueryResult> {
    // Create filter cache for parameter deduplication across CTEs
    const filterCache = new FilterCacheManager()

    // Create query context with filter cache
    const context = this.createQueryContext(securityContext, filterCache)

    // Pre-build filter SQL for reuse across CTEs and main query
    this.preloadFilterCache(query, filterCache, cubes, context)

    // Create query plan via shared logical plan pipeline
    const { optimisedPlan } = this.buildRegularQueryArtifacts(cubes, query, context)
    const physicalPlan = this.drizzlePlanBuilder.derivePhysicalPlanContext(optimisedPlan)

    // Validate security context is applied to all cubes in the query plan
    this.validateSecurityContext(physicalPlan, context)

    // Build the query using unified approach
    const builtQuery = this.drizzlePlanBuilder.build(physicalPlan, query, context)

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
    const annotation = this.generateAnnotations(physicalPlan, query)

    const result: QueryResult = {
      data: filledData,
      annotation,
      // Include warnings from query planning (e.g., fan-out without dimensions)
      warnings: optimisedPlan.warnings?.length ? optimisedPlan.warnings : undefined
    }

    await this.cacheResult(cacheKey, result)
    return result
  }

  private async cacheResult(cacheKey: string | undefined, result: QueryResult): Promise<void> {
    if (!cacheKey || !this.cacheConfig?.provider) {
      return
    }

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

  private async generateSqlForMode(
    mode: QueryExecutionMode,
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const sqlGenerators: Record<QueryExecutionMode, () => Promise<{ sql: string; params?: any[] }>> = {
      regular: () => this.generateUnifiedSQL(cubes, query, securityContext),
      comparison: () => this.generateUnifiedSQL(cubes, query, securityContext),
      funnel: () => this.dryRunFunnel(cubes, query, securityContext),
      flow: () => this.dryRunFlow(cubes, query, securityContext),
      retention: () => this.dryRunRetention(cubes, query, securityContext)
    }

    return sqlGenerators[mode]()
  }

  /**
   * Generate annotations for UI metadata - unified approach
   */
  private generateAnnotations(
    queryPlan: PhysicalQueryPlan,
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
    if (queryPlan.multiFactMerge?.groups?.length) {
      for (const group of queryPlan.multiFactMerge.groups) {
        if (group.queryPlan.primaryCube) {
          allCubes.push(group.queryPlan.primaryCube)
        }
        if (group.queryPlan.joinCubes?.length) {
          allCubes.push(...group.queryPlan.joinCubes.map((jc: any) => jc.cube).filter(Boolean))
        }
      }
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

}

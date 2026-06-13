/**
 * Unified Drizzle Query Executor
 * Handles both single and multi-cube queries through a unified execution path
 * Uses DrizzleSqlBuilder for SQL generation and LogicalPlanner for query planning
 */

import type {
  SecurityContext,
  SemanticQuery,
  TimeDimension,
  TimeGranularity,
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
  QueryAnalysis,
  RLSSetupFn
} from './types'

import { safeKey } from './cube-utils'
import { FilterCacheManager } from './filter-cache'
import { DrizzleSqlBuilder } from './physical-plan/drizzle-sql-builder'
import { LogicalPlanner } from './logical-plan/logical-planner'
import { CTEBuilder } from './builders/cte-builder'
import type { DatabaseAdapter } from './adapters/base-adapter'
import { buildAnnotations } from './execution/annotation-builder'
import { postProcessResultRows } from './execution/result-post-processor'
import { FilterCachePreloader } from './execution/filter-cache-preloader'
import { ModeRouter } from './execution/mode-router'
import type { QueryExecutionMode } from './execution/mode-router'
import { QueryResultCache } from './execution/query-result-cache'
import { ComparisonQueryBuilder } from './builders/comparison-query-builder'
import type { NormalizedPeriod } from './builders/comparison-query-builder'
import { FunnelQueryBuilder } from './builders/funnel-query-builder'
import { FlowQueryBuilder } from './builders/flow-query-builder'
import { RetentionQueryBuilder } from './builders/retention-query-builder'
import { LogicalPlanBuilder, IdentityOptimiser } from './logical-plan'
import type { PlanOptimiser, QueryNode } from './logical-plan'
import { DrizzlePlanBuilder } from './physical-plan'
import { t } from '../i18n/runtime'
import type { TranslationKey } from '../i18n/types'

/** Log SQL when DC_DEBUG=true or DC_DEBUG=sql */
function debugSql(label: string, query: { toSQL(): { sql: string; params: unknown[] } }) {
  if (typeof process === 'undefined' || !process.env?.DC_DEBUG) return
  try {
    const { sql: sqlStr, params } = query.toSQL()
    console.log(`\n[DC_DEBUG] ${label}`)
    console.log(sqlStr)
    if (params.length > 0) {
      console.log('params:', params)
    }
    console.log()
  } catch {
    // toSQL() not available on this query object
  }
}

interface ComparisonExecutionPlan {
  timeDimension: TimeDimension
  granularity: TimeGranularity
  periods: NormalizedPeriod[]
  periodQueries: SemanticQuery[]
}

export class QueryExecutor {
  private queryBuilder: DrizzleSqlBuilder
  private drizzlePlanBuilder: DrizzlePlanBuilder
  private databaseAdapter: DatabaseAdapter
  private comparisonQueryBuilder: ComparisonQueryBuilder
  private funnelQueryBuilder: FunnelQueryBuilder
  private flowQueryBuilder: FlowQueryBuilder
  private retentionQueryBuilder: RetentionQueryBuilder
  private logicalPlanBuilder: LogicalPlanBuilder
  private planOptimiser: PlanOptimiser
  private modeRouter: ModeRouter
  private resultCache: QueryResultCache
  private filterCachePreloader: FilterCachePreloader

  private rlsSetup?: RLSSetupFn

  constructor(private dbExecutor: DatabaseExecutor, cacheConfig?: CacheConfig, rlsSetup?: RLSSetupFn) {
    // Get the database adapter from the executor
    this.databaseAdapter = dbExecutor.databaseAdapter
    if (!this.databaseAdapter) {
      throw new Error(t('server.errors.dbAdapterRequired'))
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
    this.rlsSetup = rlsSetup
    this.modeRouter = new ModeRouter({
      comparison: this.comparisonQueryBuilder,
      funnel: this.funnelQueryBuilder,
      flow: this.flowQueryBuilder,
      retention: this.retentionQueryBuilder
    })
    this.resultCache = new QueryResultCache(cacheConfig)
    this.filterCachePreloader = new FilterCachePreloader(this.queryBuilder)
  }

  /**
   * Execute a function within a RLS-configured transaction context.
   * If no rlsSetup function is configured, the function is called directly.
   * Otherwise, opens a transaction, calls rlsSetup to configure RLS, then
   * runs fn with this.dbExecutor replaced by a transaction-scoped executor.
   *
   * Concurrency-safe: the dbExecutor is per-request (created fresh by
   * SemanticLayerCompiler.createQueryExecutor), so reassigning this.dbExecutor
   * only affects this request.
   */
  private async withRLSContext<T>(
    securityContext: SecurityContext,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.rlsSetup) {
      return fn()
    }

    const db = this.dbExecutor.db
    if (!db.transaction) {
      throw new Error(t('server.errors.rlsRequiresTransactions'))
    }

    const rlsSetup = this.rlsSetup

    return db.transaction(async (tx: any) => {
      await rlsSetup(tx, securityContext)

      // Create a transaction-scoped executor: inherits all methods from the
      // original but routes queries through the transaction connection.
      const txExecutor = Object.create(this.dbExecutor) as DatabaseExecutor
      txExecutor.db = tx
      this.dbExecutor = txExecutor
      return fn()
    })
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
      const mode = this.modeRouter.resolveMode(query)
      this.modeRouter.validateForMode(mode, cubes, query)

      // Check cache BEFORE expensive operations (after validation, includes security context)
      // Skip cache lookup if options.skipCache is true (but still cache the result later)
      const cacheKey = this.resultCache.generateKey(query, securityContext)
      const cached = await this.resultCache.lookup(cacheKey, options?.skipCache ?? false)
      if (cached) {
        return cached
      }

      // Execute inside RLS transaction context if configured.
      // Cache writes happen inside the transaction for simplicity; they are
      // fire-and-forget with swallowed errors so won't block the transaction
      // meaningfully. A future optimisation could split them out.
      return await this.withRLSContext(securityContext, () =>
        this.executeQueryByModeWithCache(mode, cubes, query, securityContext, cacheKey)
      )
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

        error.message = t('server.errors.queryExecutionFailed', { message })
        throw error
      }
      throw new Error(t('server.errors.queryExecutionUnknown'), { cause: error })
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
    const context = this.createQueryContext(securityContext, filterCache, query)
    this.filterCachePreloader.preload(query, filterCache, cubes, context)
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
    const context = this.createQueryContext(securityContext, filterCache, query)
    this.filterCachePreloader.preload(query, filterCache, cubes, context)
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
    await this.resultCache.store(cacheKey, result)
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
    const comparisonPlan = this.buildComparisonExecutionPlan(query)
    const { timeDimension, periods, granularity, periodQueries } = comparisonPlan

    // Execute query for each period in parallel
    const periodResultPromises = periodQueries.map(async (periodQuery, periodIndex) => {
      // Execute using the standard path (this.execute handles the rest)
      // Note: We call executeStandardQuery to avoid recursion
      const result = await this.executeStandardQuery(cubes, periodQuery, securityContext)

      return { result, period: periods[periodIndex] }
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

  private buildComparisonExecutionPlan(query: SemanticQuery): ComparisonExecutionPlan {
    const timeDimension = this.comparisonQueryBuilder.getComparisonTimeDimension(query)
    if (!timeDimension || !timeDimension.compareDateRange) {
      throw new Error(t('server.errors.noCompareDateRange'))
    }

    const periods = this.comparisonQueryBuilder.normalizePeriods(
      timeDimension.compareDateRange
    )
    if (periods.length < 2) {
      throw new Error(t('server.errors.compareDateRangeInvalid'))
    }

    const periodQueries = periods.map(period =>
      this.comparisonQueryBuilder.createPeriodQuery(query, period)
    )

    return {
      timeDimension,
      granularity: timeDimension.granularity || 'day',
      periods,
      periodQueries
    }
  }

  /**
   * Execute an analysis query (funnel/flow/retention) with caching support.
   * Wraps the inner execute callback with cache-set logic; the three analysis
   * modes share identical wrapper behaviour, differing only in which inner
   * execute method they invoke.
   *
   * Cache metadata is intentionally NOT attached here: fresh results across all
   * query modes (regular, comparison, and analysis) uniformly carry no `cache`
   * field — only cache *hits* (handled in execute()) carry cache metadata.
   */
  private async executeAnalysisQueryWithCache(
    innerExecute: () => Promise<QueryResult>,
    cacheKey: string | undefined
  ): Promise<QueryResult> {
    const result = await innerExecute()
    await this.resultCache.store(cacheKey, result)
    return result
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

    // Config already validated once on the execute path via validateQueryForMode.

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build funnel query using Drizzle query builder
    // The refactored buildFunnelQuery returns a query builder with .toSQL() support
    const funnelQuery = this.funnelQueryBuilder.buildFunnelQuery(config, cubes, context)

    debugSql('funnel query', funnelQuery)

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
   * Execute a flow analysis query
   * Produces Sankey diagram data (nodes and links)
   */
  private async executeFlowQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    const config = query.flow!

    // Config already validated once on the execute path via validateQueryForMode.

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build flow query using Drizzle query builder
    const flowQuery = this.flowQueryBuilder.buildFlowQuery(config, cubes, context)

    debugSql('flow query', flowQuery)

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
   * Execute a retention analysis query
   * Calculates cohort-based retention rates
   */
  private async executeRetentionQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    const config = query.retention!

    // Config already validated once on the execute path via validateQueryForMode.

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build retention query using Drizzle query builder
    const retentionQuery = this.retentionQueryBuilder.buildRetentionQuery(config, cubes, context)

    debugSql('retention query', retentionQuery)

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
   * Standard (regular/non-comparison) query execution.
   *
   * This is the single core execution path used by both the regular query mode
   * and comparison-mode period sub-queries. It always runs the dev-time
   * security-context validation and propagates planner warnings; the optional
   * `cacheKey` controls whether the fresh result is written to the cache.
   *
   * @param cacheKey - When provided (and a cache provider is configured), the
   *   fresh result is written to the cache. Pass `undefined` to skip caching
   *   (e.g. comparison period sub-queries cache at the comparison level).
   */
  private async executeStandardQuery(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey?: string | undefined
  ): Promise<QueryResult> {
    // Create filter cache for parameter deduplication across CTEs
    const filterCache = new FilterCacheManager()

    // Create query context with filter cache
    const context = this.createQueryContext(securityContext, filterCache, query)

    // Pre-build filter SQL for reuse across CTEs and main query
    this.filterCachePreloader.preload(query, filterCache, cubes, context)

    // Create unified query plan via shared logical pipeline
    const { optimisedPlan } = this.buildRegularQueryArtifacts(cubes, query, context)
    const physicalPlan = this.drizzlePlanBuilder.derivePhysicalPlanContext(optimisedPlan)

    // Validate security context is applied to all cubes in the query plan.
    // This is a dev-time warning only (no-op outside development unless
    // DRIZZLE_CUBE_WARN_SECURITY is set), so it is safe to run on every path,
    // including comparison-mode period sub-queries.
    this.validateSecurityContext(physicalPlan, context)

    // Build the query using unified approach
    const builtQuery = this.drizzlePlanBuilder.build(physicalPlan, query, context)

    debugSql('query', builtQuery)

    // Execute query - pass numeric field names for selective conversion
    const numericFields = this.queryBuilder.collectNumericFields(cubes, query)
    const data = await this.dbExecutor.execute(builtQuery, numericFields)

    // Normalise time-dimension date values (adapter-specific) and apply gap filling
    const filledData = postProcessResultRows(data, query, this.databaseAdapter)

    // Generate annotations for UI
    const annotation = buildAnnotations(physicalPlan, query)

    const result: QueryResult = {
      data: filledData,
      annotation,
      // Include warnings from query planning (e.g., fan-out without dimensions)
      warnings: optimisedPlan.warnings?.length ? optimisedPlan.warnings : undefined
    }

    await this.resultCache.store(cacheKey, result)
    return result
  }

  /**
   * Create a query context with optional filter cache.
   */
  private createQueryContext(
    securityContext: SecurityContext,
    filterCache?: FilterCacheManager,
    query?: SemanticQuery
  ): QueryContext {
    return {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext,
      filterCache,
      ungrouped: query?.ungrouped
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

        // Skip warning when rlsSetup is configured — security is enforced at
        // the database level via transaction-scoped commands (e.g. SET LOCAL
        // and SET ROLE in PostgreSQL). The rlsSetup hook runs session-level
        // commands before each query; not all databases support this pattern.
        if (this.rlsSetup) continue

        const securityResult = cube.sql(context)

        // A properly secured cube should have a 'where' clause that filters by security context
        // If no 'where' clause is present, the cube might be returning all data
        if (!securityResult.where) {
          console.warn(
            `[drizzle-cube] WARNING: Cube '${cube.name}' has no security filtering. ` +
            `If this cube contains public data, add 'public: true' to suppress this warning. ` +
            `Otherwise, ensure sql() returns: { from: table, where: eq(table.orgId, ctx.securityContext.orgId) }. ` +
            `For databases that support Row Level Security (e.g. PostgreSQL), you can ` +
            `configure rlsSetup to run session-level commands (SET LOCAL, SET ROLE) instead.`
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
    return this.dryRunAnalysis(query, securityContext, {
      has: q => this.funnelQueryBuilder.hasFunnel(q),
      invalidConfigKey: 'server.errors.invalidFunnelConfig',
      getConfig: q => q.funnel!,
      validate: config => this.funnelQueryBuilder.validateConfig(config, cubes),
      validationFailedKey: 'server.errors.funnelValidationFailed',
      build: (config, context) => this.funnelQueryBuilder.buildFunnelQuery(config, cubes, context)
    })
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
    return this.dryRunAnalysis(query, securityContext, {
      has: q => this.flowQueryBuilder.hasFlow(q),
      invalidConfigKey: 'server.errors.invalidFlowConfig',
      getConfig: q => q.flow!,
      validate: config => this.flowQueryBuilder.validateConfig(config, cubes),
      validationFailedKey: 'server.errors.flowValidationFailed',
      build: (config, context) => this.flowQueryBuilder.buildFlowQuery(config, cubes, context)
    })
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
    return this.dryRunAnalysis(query, securityContext, {
      has: q => this.retentionQueryBuilder.hasRetention(q),
      invalidConfigKey: 'server.errors.invalidRetentionConfig',
      getConfig: q => q.retention!,
      validate: config => this.retentionQueryBuilder.validateConfig(config, cubes),
      validationFailedKey: 'server.errors.retentionValidationFailed',
      build: (config, context) => this.retentionQueryBuilder.buildRetentionQuery(config, cubes, context)
    })
  }

  /**
   * Generic dry-run SQL generator for analysis modes (funnel/flow/retention).
   * The three modes share an identical shape (mode guard → config validation →
   * build query → toSQL()), differing only in which builder/config they use.
   */
  private async dryRunAnalysis<TConfig>(
    query: SemanticQuery,
    securityContext: SecurityContext,
    handlers: {
      has: (query: SemanticQuery) => boolean
      invalidConfigKey: TranslationKey
      getConfig: (query: SemanticQuery) => TConfig
      validate: (config: TConfig) => { isValid: boolean; errors: string[] }
      validationFailedKey: TranslationKey
      build: (config: TConfig, context: QueryContext) => { toSQL(): { sql: string; params: unknown[] } }
    }
  ): Promise<{ sql: string; params?: any[] }> {
    // Validate the query has the expected analysis config
    if (!handlers.has(query)) {
      throw new Error(t(handlers.invalidConfigKey))
    }

    const config = handlers.getConfig(query)

    // Validate the analysis configuration
    const validation = handlers.validate(config)
    if (!validation.isValid) {
      throw new Error(t(handlers.validationFailedKey, { errors: validation.errors.join(', ') }))
    }

    // Create query context
    const context: QueryContext = {
      db: this.dbExecutor.db,
      schema: this.dbExecutor.schema,
      securityContext
    }

    // Build the analysis query using its Drizzle query builder, then extract
    // the SQL string and parameters via .toSQL().
    const builtQuery = handlers.build(config, context)
    const sqlObj = builtQuery.toSQL()

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

    // Execute EXPLAIN using the database executor (within RLS context if configured)
    return this.withRLSContext(securityContext, () =>
      this.dbExecutor.explainQuery(
        sqlResult.sql,
        sqlResult.params || [],
        options
      )
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
    const mode = this.modeRouter.resolveMode(query)
    this.modeRouter.validateForMode(mode, cubes, query)
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
    const context = this.createQueryContext(securityContext, filterCache, query)
    this.filterCachePreloader.preload(query, filterCache, cubes, context)

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

  private async executeQueryByModeWithCache(
    mode: QueryExecutionMode,
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext,
    cacheKey: string | undefined
  ): Promise<QueryResult> {
    const executors: Record<QueryExecutionMode, () => Promise<QueryResult>> = {
      regular: () => this.executeStandardQuery(cubes, query, securityContext, cacheKey),
      comparison: () => this.executeComparisonQueryWithCache(cubes, query, securityContext, cacheKey),
      funnel: () => this.executeAnalysisQueryWithCache(
        () => this.executeFunnelQuery(cubes, query, securityContext), cacheKey),
      flow: () => this.executeAnalysisQueryWithCache(
        () => this.executeFlowQuery(cubes, query, securityContext), cacheKey),
      retention: () => this.executeAnalysisQueryWithCache(
        () => this.executeRetentionQuery(cubes, query, securityContext), cacheKey)
    }

    return executors[safeKey(mode) as QueryExecutionMode]()
  }

  private async generateSqlForMode(
    mode: QueryExecutionMode,
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const sqlGenerators: Record<QueryExecutionMode, () => Promise<{ sql: string; params?: any[] }>> = {
      regular: () => this.generateUnifiedSQL(cubes, query, securityContext),
      comparison: () => this.generateComparisonSQL(cubes, query, securityContext),
      funnel: () => this.dryRunFunnel(cubes, query, securityContext),
      flow: () => this.dryRunFlow(cubes, query, securityContext),
      retention: () => this.dryRunRetention(cubes, query, securityContext)
    }

    return sqlGenerators[safeKey(mode) as QueryExecutionMode]()
  }

  private async generateComparisonSQL(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    securityContext: SecurityContext
  ): Promise<{ sql: string; params?: any[] }> {
    const comparisonPlan = this.buildComparisonExecutionPlan(query)
    const firstPeriodQuery = comparisonPlan.periodQueries[0]
    return this.generateUnifiedSQL(cubes, firstPeriodQuery, securityContext)
  }
}

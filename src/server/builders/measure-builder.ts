/**
 * Measure Builder
 * Handles all measure-related SQL generation:
 * - Measure expression building with aggregations (count, sum, avg, etc.)
 * - Statistical functions (stddev, variance, percentile)
 * - Window functions (lag, lead, rank, etc.)
 * - Calculated measure resolution and template substitution
 * - CTE-specific measure handling
 */

import {
  sql,
  and,
  count,
  sum,
  min,
  max,
  countDistinct,
  SQL,
  type AnyColumn
} from 'drizzle-orm'

import type {
  Cube,
  QueryContext,
  PhysicalQueryPlan
} from '../types'

import { resolveSqlExpression } from '../cube-utils'
import type { DatabaseAdapter } from '../adapters/base-adapter'
import {
  WINDOW_FUNCTION_TYPES,
  isWindowFunction as isWindowFunctionFn,
  isPostAggregationWindow as isPostAggregationWindowFn,
  getWindowBaseMeasure as getWindowBaseMeasureFn,
  getDefaultWindowOperation as getDefaultWindowOperationFn,
  categorizeForPostAggregation as categorizeForPostAggregationFn,
  hasPostAggregationWindows as hasPostAggregationWindowsFn
} from '../measure-classification'
import { CalculatedMeasureResolver } from '../resolvers/calculated-measure-resolver'
import { substituteTemplate, getMemberReferences, type ResolvedMeasures } from '../template-substitution'

export class MeasureBuilder {
  constructor(private databaseAdapter: DatabaseAdapter) {}

  /**
   * Build resolvedMeasures map for a set of measures
   * This centralizes the logic for building both regular and calculated measures
   * in dependency order, avoiding duplication across main queries and CTEs
   *
   * @param measureNames - Array of measure names to resolve (e.g., ["Employees.count", "Employees.activePercentage"])
   * @param cubeMap - Map of all cubes involved in the query
   * @param context - Query context with database and security context
   * @param customMeasureBuilder - Optional function to override how individual measures are built
   * @returns Map of measure names to SQL builder functions
   */
  buildResolvedMeasures(
    measureNames: string[],
    cubeMap: Map<string, Cube>,
    context: QueryContext,
    customMeasureBuilder?: (measureName: string, measure: any, cube: Cube) => SQL
  ): ResolvedMeasures {
    const resolvedMeasures: ResolvedMeasures = new Map()
    const regularMeasures: string[] = []
    const calculatedMeasures: string[] = []
    const allMeasuresToResolve = new Set<string>(measureNames)

    // Build dependency graph
    const resolver = new CalculatedMeasureResolver(cubeMap)
    for (const cube of cubeMap.values()) {
      resolver.buildGraph(cube)
    }

    // First pass: classify user-requested measures and collect dependencies
    // Post-aggregation window measures are handled separately in the executor
    for (const measureName of measureNames) {
      this.classifyRequestedMeasure(
        measureName, cubeMap, resolver, regularMeasures, calculatedMeasures, allMeasuresToResolve
      )
    }

    // Second pass: classify all measures that need to be resolved (including dependencies)
    // Skip post-aggregation window measures - they're handled separately
    for (const measureName of allMeasuresToResolve) {
      this.classifyDependencyMeasure(measureName, cubeMap, regularMeasures, calculatedMeasures)
    }

    // Build regular measures first
    for (const measureName of regularMeasures) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)!
      const measure = cube.measures[fieldName]

      // Use custom builder if provided, otherwise use default
      if (customMeasureBuilder) {
        const builtExpr = customMeasureBuilder(measureName, measure, cube)
        resolvedMeasures.set(measureName, () => builtExpr)
      } else {
        // Store a FUNCTION that builds the SQL expression to avoid mutation issues
        // Pass cube for window function dimension resolution
        resolvedMeasures.set(measureName, () => this.buildMeasureExpression(measure, context, cube))
      }
    }

    // Build calculated measures in dependency order
    if (calculatedMeasures.length > 0) {
      const sortedCalculated = resolver.topologicalSort(calculatedMeasures)

      for (const measureName of sortedCalculated) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = cubeMap.get(cubeName)!
        const measure = cube.measures[fieldName]

        // Store a FUNCTION that builds the calculated measure SQL
        resolvedMeasures.set(measureName, () => this.buildCalculatedMeasure(
          measure,
          cube,
          cubeMap,
          resolvedMeasures,
          context
        ))
      }
    }

    return resolvedMeasures
  }

  /**
   * First-pass classification of a user-requested measure: sorts it into the
   * regular/calculated buckets and seeds `allMeasuresToResolve` with its
   * (transitive) dependencies. Post-aggregation windows only contribute their
   * base measure as a dependency.
   */
  private classifyRequestedMeasure(
    measureName: string,
    cubeMap: Map<string, Cube>,
    resolver: CalculatedMeasureResolver,
    regularMeasures: string[],
    calculatedMeasures: string[],
    allMeasuresToResolve: Set<string>
  ): void {
    const [cubeName, fieldName] = measureName.split('.')
    const measure = cubeMap.get(cubeName)?.measures?.[fieldName]
    if (!measure) return

    // Post-aggregation window functions are handled separately (not via buildMeasureExpression)
    if (MeasureBuilder.isPostAggregationWindow(measure)) {
      const baseMeasure = MeasureBuilder.getWindowBaseMeasure(measure, cubeName)
      if (baseMeasure) {
        allMeasuresToResolve.add(baseMeasure)
      }
      return
    }

    if (!CalculatedMeasureResolver.isCalculatedMeasure(measure)) {
      regularMeasures.push(measureName)
      return
    }

    calculatedMeasures.push(measureName)
    this.collectCalculatedDependencies(measureName, measure, cubeName, cubeMap, resolver, allMeasuresToResolve)
  }

  /** Seed `allMeasuresToResolve` with the direct + transitive deps of a calculated measure. */
  private collectCalculatedDependencies(
    measureName: string,
    measure: any,
    cubeName: string,
    cubeMap: Map<string, Cube>,
    resolver: CalculatedMeasureResolver,
    allMeasuresToResolve: Set<string>
  ): void {
    // Add all direct dependencies
    getMemberReferences(measure.calculatedSql!, cubeName).forEach(dep => allMeasuresToResolve.add(dep))

    // Also add transitive calculated measure dependencies
    for (const dep of resolver.getAllDependencies(measureName)) {
      const [depCubeName, depFieldName] = dep.split('.')
      const depMeasure = cubeMap.get(depCubeName)?.measures?.[depFieldName]
      if (depMeasure && CalculatedMeasureResolver.isCalculatedMeasure(depMeasure)) {
        getMemberReferences(depMeasure.calculatedSql!, depCubeName)
          .forEach(nestedDep => allMeasuresToResolve.add(nestedDep))
      }
    }
  }

  /** Second-pass classification of a dependency measure into the regular/calculated buckets. */
  private classifyDependencyMeasure(
    measureName: string,
    cubeMap: Map<string, Cube>,
    regularMeasures: string[],
    calculatedMeasures: string[]
  ): void {
    const [cubeName, fieldName] = measureName.split('.')
    const measure = cubeMap.get(cubeName)?.measures?.[fieldName]
    if (!measure) return

    // Skip post-aggregation window measures - they're handled separately
    if (MeasureBuilder.isPostAggregationWindow(measure)) return

    if (!CalculatedMeasureResolver.isCalculatedMeasure(measure)) {
      if (!regularMeasures.includes(measureName)) {
        regularMeasures.push(measureName)
      }
    } else if (!calculatedMeasures.includes(measureName)) {
      calculatedMeasures.push(measureName)
    }
  }

  /**
   * Build calculated measure expression by substituting {member} references
   * with resolved SQL expressions
   */
  buildCalculatedMeasure(
    measure: any,
    cube: Cube,
    allCubes: Map<string, Cube>,
    resolvedMeasures: ResolvedMeasures,
    context: QueryContext
  ): SQL {
    if (!measure.calculatedSql) {
      throw new Error(
        `Calculated measure '${cube.name}.${measure.name}' missing calculatedSql property`
      )
    }

    // Preprocess template for database-specific transformations (e.g., SQLite float division)
    const preprocessedSql = this.databaseAdapter.preprocessCalculatedTemplate(measure.calculatedSql)

    // Substitute {member} references with resolved SQL
    const substitutedSql = substituteTemplate(preprocessedSql, {
      cube,
      allCubes,
      resolvedMeasures,
      queryContext: context
    })

    return substitutedSql
  }

  /**
   * Build resolved measures map for a calculated measure from CTE columns
   * This handles re-aggregating pre-aggregated CTE columns for calculated measures
   *
   * IMPORTANT: For calculated measures in CTEs, we cannot sum/avg pre-computed ratios.
   * We must recalculate from the base measures that were pre-aggregated in the CTE.
   *
   * @param measure - The calculated measure to build
   * @param cube - The cube containing this measure
   * @param cteInfo - CTE metadata (alias, measures, cube reference)
   * @param allCubes - Map of all cubes in the query
   * @param context - Query context
   * @returns SQL expression for the calculated measure using CTE column references
   */
  buildCTECalculatedMeasure(
    measure: any,
    cube: Cube,
    cteInfo: { cteAlias: string; measures: string[]; cube: Cube },
    allCubes: Map<string, Cube>,
    context: QueryContext
  ): SQL {
    if (!measure.calculatedSql) {
      throw new Error(
        `Calculated measure '${cube.name}.${measure.name || 'unknown'}' missing calculatedSql property`
      )
    }

    // Build a resolvedMeasures map with CTE column references
    const cteResolvedMeasures = new Map<string, () => SQL>()

    // Get all dependencies for this calculated measure
    const deps = getMemberReferences(measure.calculatedSql, cube.name)

    for (const depMeasureName of deps) {
      const [depCubeName, depFieldName] = depMeasureName.split('.')
      const depCube = allCubes.get(depCubeName)

      if (depCube && depCube.measures[depFieldName]) {
        const depMeasure = depCube.measures[depFieldName]

        // Check if this dependency is also in the CTE
        if (cteInfo.measures.includes(depMeasureName)) {
          // Reference the CTE column and apply appropriate aggregation
          const cteDepColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(depFieldName)}`
          const aggregatedDep = this.reAggregateCteColumn(depMeasure.type, cteDepColumn)
          // Store the aggregated CTE column as a builder function
          cteResolvedMeasures.set(depMeasureName, () => aggregatedDep)
        }
      }
    }

    // Re-apply the calculated measure template with CTE-based dependencies
    return this.buildCalculatedMeasure(
      measure,
      cube,
      allCubes,
      cteResolvedMeasures,
      context
    )
  }

  /**
   * Re-aggregate a pre-aggregated CTE column based on the original measure type.
   * For pre-aggregated values in CTEs we re-aggregate properly:
   * - count/sum/number → SUM
   * - avg → AVG (ideally a weighted average, but simple AVG for now)
   * - min/max → MIN/MAX
   * - anything else → SUM
   */
  private reAggregateCteColumn(measureType: string, cteColumn: SQL): SQL {
    switch (measureType) {
      case 'avg':
        return this.databaseAdapter.buildAvg(cteColumn)
      case 'min':
        return min(cteColumn)
      case 'max':
        return max(cteColumn)
      // count / countDistinct / sum / number / default
      default:
        return sum(cteColumn)
    }
  }

  /**
   * Build measure expression for HAVING clause, handling CTE references correctly
   */
  buildHavingMeasureExpression(
    cubeName: string,
    fieldKey: string,
    measure: any,
    context: QueryContext,
    queryPlan?: PhysicalQueryPlan
  ): SQL {
    // Check if this measure is from a CTE cube - reference the CTE alias instead of the table
    const cteInfo = queryPlan?.preAggregationCTEs?.find(cte => cte.cube.name === cubeName)
    if (cteInfo && cteInfo.measures.includes(`${cubeName}.${fieldKey}`) && queryPlan) {
      return this.buildHavingCteMeasure(cubeName, fieldKey, measure, context, queryPlan, cteInfo)
    }

    // Not from CTE - use regular measure expression
    return this.buildMeasureExpression(measure, context)
  }

  /** Build a HAVING measure expression that references a pre-aggregation CTE column. */
  private buildHavingCteMeasure(
    cubeName: string,
    fieldKey: string,
    measure: any,
    context: QueryContext,
    queryPlan: PhysicalQueryPlan,
    cteInfo: { cteAlias: string; measures: string[]; cube: Cube }
  ): SQL {
    if (measure.type === 'calculated' && measure.calculatedSql) {
      // Get the cube for this measure
      const cube = queryPlan.primaryCube.name === cubeName
        ? queryPlan.primaryCube
        : queryPlan.joinCubes?.find(jc => jc.cube.name === cubeName)?.cube

      if (!cube) {
        throw new Error(`Cube ${cubeName} not found in query plan`)
      }

      // Build a cubeMap for the calculated measure builder
      const cubeMap = new Map<string, Cube>([[queryPlan.primaryCube.name, queryPlan.primaryCube]])
      if (queryPlan.joinCubes) {
        for (const jc of queryPlan.joinCubes) {
          cubeMap.set(jc.cube.name, jc.cube)
        }
      }

      // Use the shared helper to build calculated measure from CTE columns
      return this.buildCTECalculatedMeasure(measure, cube, cteInfo, cubeMap, context)
    }

    // For non-calculated measures, aggregate the CTE column directly
    const cteColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldKey)}`
    return this.reAggregateCteColumn(measure.type, cteColumn)
  }

  /**
   * Build measure expression with aggregation and filters
   * Note: This should NOT be called for calculated measures
   *
   * @param measure - The measure definition
   * @param context - Query context with security context and database info
   * @param cube - Optional cube reference for resolving dimension references (window functions)
   */
  buildMeasureExpression(
    measure: any,
    context: QueryContext,
    cube?: Cube
  ): SQL {
    // Calculated measures should be built via buildCalculatedMeasure
    if (measure.type === 'calculated') {
      throw new Error(
        `Cannot build calculated measure '${measure.name}' directly. ` +
        `Use buildCalculatedMeasure instead.`
      )
    }

    // Post-aggregation window functions don't use sql property - they reference another measure
    // These are handled in the executor's buildPostAggregationWindowExpression method
    if (MeasureBuilder.isPostAggregationWindow(measure)) {
      throw new Error(
        `Post-aggregation window measure '${measure.name}' should be built via ` +
        `buildPostAggregationWindowExpression, not buildMeasureExpression.`
      )
    }

    // Non-calculated, non-post-agg-window measures must have sql property
    if (!measure.sql) {
      throw new Error(
        `Measure '${measure.name}' of type '${measure.type}' is missing required 'sql' property. ` +
        `Only calculated measures and post-aggregation window functions can omit 'sql'.`
      )
    }

    // resolveSqlExpression already applies isolation via isolateSqlExpression()
    // This protects against Drizzle SQL object mutation during reuse
    const baseExpr = resolveSqlExpression(measure.sql, context)

    // Ungrouped queries return raw column expressions without aggregation wrappers
    if (context.ungrouped) {
      return baseExpr as SQL
    }

    // Apply measure filters (conditional aggregation via CASE WHEN) if they exist
    const aggExpr = this.applyMeasureFilters(measure, baseExpr, context)

    return this.applyAggregation(measure, aggExpr, context, cube)
  }

  /**
   * Wrap a base expression in a CASE WHEN for measures carrying `filters`,
   * producing conditional aggregation. Returns the original expression when
   * there are no filters.
   */
  private applyMeasureFilters(
    measure: any,
    baseExpr: SQL | AnyColumn,
    context: QueryContext
  ): SQL | AnyColumn {
    if (!measure.filters || measure.filters.length === 0) {
      return baseExpr
    }

    const filterConditions = measure.filters.map((filter: (ctx: QueryContext) => SQL) => {
      const filterResult = filter(context)
      // Single wrap is OK here - we're creating fresh SQL for grouping in parentheses
      // The filter function itself should handle isolation if needed
      return filterResult ? sql`(${filterResult})` : undefined
    }).filter(Boolean) // Remove any undefined conditions

    if (filterConditions.length === 0) {
      return baseExpr
    }

    // Use CASE WHEN for conditional aggregation via adapter
    const andCondition = filterConditions.length === 1 ? filterConditions[0] : and(...filterConditions)
    return this.databaseAdapter.buildCaseWhen([
      { when: andCondition!, then: baseExpr }
    ])
  }

  /** Apply the aggregation function implied by `measure.type` to `baseExpr`. */
  private applyAggregation(
    measure: any,
    baseExpr: SQL | AnyColumn,
    context: QueryContext,
    cube?: Cube
  ): SQL {
    switch (measure.type) {
      case 'count':
        return count(baseExpr)
      case 'countDistinct':
        return countDistinct(baseExpr)
      case 'sum':
        return sum(baseExpr)
      case 'avg':
        return this.databaseAdapter.buildAvg(baseExpr)
      case 'min':
        return min(baseExpr)
      case 'max':
        return max(baseExpr)
      case 'number':
        return baseExpr as SQL

      // Statistical functions (Phase 1)
      case 'stddev':
      case 'stddevSamp':
        return this.buildStatistical(measure, baseExpr, () =>
          this.databaseAdapter.buildStddev(
            baseExpr,
            measure.type === 'stddevSamp' || measure.statisticalConfig?.useSample
          ))

      case 'variance':
      case 'varianceSamp':
        return this.buildStatistical(measure, baseExpr, () =>
          this.databaseAdapter.buildVariance(
            baseExpr,
            measure.type === 'varianceSamp' || measure.statisticalConfig?.useSample
          ))

      case 'percentile':
      case 'median':
      case 'p95':
      case 'p99':
        return this.buildStatistical(measure, baseExpr, () =>
          this.databaseAdapter.buildPercentile(baseExpr, this.resolvePercentile(measure)))

      // Window functions (Phase 2) - now with dimension resolution
      case 'lag':
      case 'lead':
      case 'rank':
      case 'denseRank':
      case 'rowNumber':
      case 'ntile':
      case 'firstValue':
      case 'lastValue':
      case 'movingAvg':
      case 'movingSum':
        return this.buildWindowMeasure(measure, baseExpr, context, cube)

      default:
        return count(baseExpr)
    }
  }

  /**
   * Run a statistical-function builder, falling back to MAX(NULL) with a warning
   * when the engine doesn't support it (shared by stddev/variance/percentile).
   */
  private buildStatistical(
    measure: any,
    _baseExpr: SQL | AnyColumn,
    build: () => SQL | null
  ): SQL {
    const result = build()
    if (result === null) {
      console.warn(`[drizzle-cube] ${measure.type} not supported on ${this.databaseAdapter.getEngineType()}, returning NULL`)
      // Use MAX(NULL) to ensure proper aggregation behavior
      return sql`MAX(NULL)`
    }
    return result
  }

  /** Resolve the percentile value implied by a percentile-family measure type. */
  private resolvePercentile(measure: any): number {
    switch (measure.type) {
      case 'median':
        return 50
      case 'p95':
        return 95
      case 'p99':
        return 99
      default:
        return measure.statisticalConfig?.percentile ?? 50
    }
  }

  /** Build a (per-row) window-function measure expression. */
  private buildWindowMeasure(
    measure: any,
    baseExpr: SQL | AnyColumn,
    context: QueryContext,
    cube?: Cube
  ): SQL {
    const windowConfig = measure.windowConfig || {}

    const partitionByExprs = this.resolveWindowPartitions(windowConfig, context, cube)
    const orderByExprs = this.resolveWindowOrder(windowConfig, context, cube)

    const result = this.databaseAdapter.buildWindowFunction(
      measure.type,
      ['rank', 'denseRank', 'rowNumber'].includes(measure.type) ? null : baseExpr,
      partitionByExprs,
      orderByExprs,
      {
        offset: windowConfig.offset,
        defaultValue: windowConfig.defaultValue,
        nTile: windowConfig.nTile,
        frame: windowConfig.frame
      }
    )
    if (result === null) {
      console.warn(`[drizzle-cube] ${measure.type} not supported on ${this.databaseAdapter.getEngineType()}, returning NULL`)
      return sql`NULL`
    }
    return result
  }

  /** Resolve a window function's partitionBy dimension references to SQL expressions. */
  private resolveWindowPartitions(
    windowConfig: any,
    context: QueryContext,
    cube?: Cube
  ): (AnyColumn | SQL)[] | undefined {
    if (!windowConfig.partitionBy || windowConfig.partitionBy.length === 0 || !cube) {
      return undefined
    }

    const resolvedPartitions = windowConfig.partitionBy
      .map((dimRef: string) => {
        // Handle both "dimensionName" and "CubeName.dimensionName" formats
        const dimName = dimRef.includes('.') ? dimRef.split('.')[1] : dimRef
        const dimension = cube.dimensions?.[dimName]
        if (dimension) {
          return resolveSqlExpression(dimension.sql, context)
        }
        console.warn(`[drizzle-cube] Window function partition dimension '${dimRef}' not found in cube '${cube.name}'`)
        return null
      })
      .filter((expr: AnyColumn | SQL | null): expr is AnyColumn | SQL => expr !== null)

    return resolvedPartitions.length > 0 ? resolvedPartitions : undefined
  }

  /** Resolve a window function's orderBy dimension/measure references to SQL expressions. */
  private resolveWindowOrder(
    windowConfig: any,
    context: QueryContext,
    cube?: Cube
  ): { field: AnyColumn | SQL; direction: 'asc' | 'desc' }[] | undefined {
    type OrderByExpr = { field: AnyColumn | SQL; direction: 'asc' | 'desc' }
    if (!windowConfig.orderBy || windowConfig.orderBy.length === 0 || !cube) {
      return undefined
    }

    const resolvedOrders = windowConfig.orderBy
      .map((orderSpec: { field: string; direction: 'asc' | 'desc' }): OrderByExpr | null => {
        // Handle both "fieldName" and "CubeName.fieldName" formats
        const fieldName = orderSpec.field.includes('.') ? orderSpec.field.split('.')[1] : orderSpec.field

        // First check dimensions, then measures
        const dimension = cube.dimensions?.[fieldName]
        if (dimension) {
          return {
            field: resolveSqlExpression(dimension.sql, context),
            direction: orderSpec.direction
          }
        }

        const measureDef = cube.measures?.[fieldName]
        if (measureDef && measureDef.sql) {
          return {
            field: resolveSqlExpression(measureDef.sql, context),
            direction: orderSpec.direction
          }
        }

        console.warn(`[drizzle-cube] Window function order field '${orderSpec.field}' not found in cube '${cube.name}'`)
        return null
      })
      .filter((expr: OrderByExpr | null): expr is OrderByExpr => expr !== null)

    return resolvedOrders.length > 0 ? resolvedOrders : undefined
  }

  /**
   * List of measure types that are window functions
   * Window functions require special handling in CTEs:
   * - No GROUP BY in the CTE
   * - No re-aggregation in outer query
   * - Return individual rows, not grouped results
   */
  static WINDOW_FUNCTION_TYPES = WINDOW_FUNCTION_TYPES

  /**
   * Check if a measure type is a window function
   * @param measureType - The measure type string
   * @returns true if this is a window function type
   */
  static isWindowFunction(measureType: string): boolean {
    return isWindowFunctionFn(measureType)
  }

  /**
   * Categorize measures into window functions and regular aggregates
   * Used by query planner to create separate CTEs for each category
   *
   * @param measureNames - Array of measure names (e.g., ["Productivity.rank", "Productivity.totalLines"])
   * @param cubeMap - Map of cubes to look up measure definitions
   * @returns Object with windowMeasures and aggregateMeasures arrays
   */
  static categorizeMeasures(
    measureNames: string[],
    cubeMap: Map<string, Cube>
  ): { windowMeasures: string[]; aggregateMeasures: string[] } {
    const windowMeasures: string[] = []
    const aggregateMeasures: string[] = []

    for (const measureName of measureNames) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)

      if (cube?.measures?.[fieldName]) {
        const measure = cube.measures[fieldName]
        if (MeasureBuilder.isWindowFunction(measure.type)) {
          windowMeasures.push(measureName)
        } else {
          aggregateMeasures.push(measureName)
        }
      }
    }

    return { windowMeasures, aggregateMeasures }
  }

  /**
   * Check if a query contains any window function measures
   * @param measureNames - Array of measure names
   * @param cubeMap - Map of cubes
   * @returns true if any measure is a window function
   */
  static hasWindowFunctions(
    measureNames: string[],
    cubeMap: Map<string, Cube>
  ): boolean {
    const { windowMeasures } = MeasureBuilder.categorizeMeasures(measureNames, cubeMap)
    return windowMeasures.length > 0
  }

  // ============================================================================
  // Post-Aggregation Window Functions
  // ============================================================================

  /**
   * Check if a measure is a post-aggregation window function.
   * Post-aggregation windows have a `measure` reference in their windowConfig,
   * indicating they should operate on aggregated data rather than raw rows.
   *
   * @param measure - The measure definition
   * @returns true if this is a post-aggregation window function
   */
  static isPostAggregationWindow(measure: any): boolean {
    return isPostAggregationWindowFn(measure)
  }

  /**
   * Get the base measure reference for a post-aggregation window function.
   * Resolves simple names (e.g., 'totalRevenue') to fully qualified names ('Sales.totalRevenue').
   *
   * @param measure - The measure definition
   * @param cubeName - The name of the cube containing this measure
   * @returns Fully qualified base measure name, or null if not a post-agg window
   */
  static getWindowBaseMeasure(measure: any, cubeName: string): string | null {
    return getWindowBaseMeasureFn(measure, cubeName)
  }

  /**
   * Get the default operation for a window function type.
   * - lag/lead default to 'difference' (compare current vs previous/next)
   * - rank/rowNumber/ntile/firstValue/lastValue default to 'raw'
   * - movingAvg/movingSum default to 'raw'
   *
   * @param windowType - The window function type
   * @returns Default operation for the window type
   */
  static getDefaultWindowOperation(windowType: string): 'raw' | 'difference' | 'ratio' | 'percentChange' {
    return getDefaultWindowOperationFn(windowType)
  }

  /**
   * Categorize measures for post-aggregation window function handling.
   * Separates measures into:
   * - aggregateMeasures: Regular aggregates (count, sum, avg, etc.)
   * - postAggWindowMeasures: Window functions that reference a base measure
   * - requiredBaseMeasures: Base measures needed by window functions (auto-added to query)
   *
   * @param measureNames - Array of measure names from the query
   * @param cubeMap - Map of cubes to look up measure definitions
   * @returns Categorized measures with base measure dependencies
   */
  static categorizeForPostAggregation(
    measureNames: string[],
    cubeMap: Map<string, Cube>
  ): {
    aggregateMeasures: string[]
    postAggWindowMeasures: string[]
    requiredBaseMeasures: Set<string>
  } {
    return categorizeForPostAggregationFn(measureNames, cubeMap)
  }

  /**
   * Check if any measures in the query are post-aggregation window functions.
   *
   * @param measureNames - Array of measure names
   * @param cubeMap - Map of cubes
   * @returns true if any measure is a post-aggregation window function
   */
  static hasPostAggregationWindows(
    measureNames: string[],
    cubeMap: Map<string, Cube>
  ): boolean {
    return hasPostAggregationWindowsFn(measureNames, cubeMap)
  }
}

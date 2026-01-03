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
  QueryPlan
} from '../types'

import { resolveSqlExpression } from '../cube-utils'
import type { DatabaseAdapter } from '../adapters/base-adapter'
import { CalculatedMeasureResolver } from '../calculated-measure-resolver'
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
    const postAggWindowMeasures: string[] = []

    for (const measureName of measureNames) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)
      if (cube && cube.measures && cube.measures[fieldName]) {
        const measure = cube.measures[fieldName]

        // Post-aggregation window functions are handled separately
        // They don't go through buildMeasureExpression
        if (MeasureBuilder.isPostAggregationWindow(measure)) {
          postAggWindowMeasures.push(measureName)
          // Add the base measure as a dependency
          const baseMeasure = MeasureBuilder.getWindowBaseMeasure(measure, cubeName)
          if (baseMeasure) {
            allMeasuresToResolve.add(baseMeasure)
          }
          continue
        }

        if (CalculatedMeasureResolver.isCalculatedMeasure(measure)) {
          calculatedMeasures.push(measureName)
          // Add all dependencies to measures that need to be resolved
          const deps = getMemberReferences(measure.calculatedSql!, cubeName)
          deps.forEach(dep => allMeasuresToResolve.add(dep))

          // Also add transitive calculated measure dependencies
          const calculatedDeps = resolver.getAllDependencies(measureName)
          calculatedDeps.forEach(dep => {
            const [depCubeName, depFieldName] = dep.split('.')
            const depCube = cubeMap.get(depCubeName)
            if (depCube && depCube.measures[depFieldName]) {
              const depMeasure = depCube.measures[depFieldName]
              if (CalculatedMeasureResolver.isCalculatedMeasure(depMeasure)) {
                const nestedDeps = getMemberReferences(depMeasure.calculatedSql!, depCubeName)
                nestedDeps.forEach(nestedDep => allMeasuresToResolve.add(nestedDep))
              }
            }
          })
        } else {
          regularMeasures.push(measureName)
        }
      }
    }

    // Second pass: classify all measures that need to be resolved (including dependencies)
    // Skip post-aggregation window measures - they're handled separately
    for (const measureName of allMeasuresToResolve) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)
      if (cube && cube.measures && cube.measures[fieldName]) {
        const measure = cube.measures[fieldName]

        // Skip post-aggregation window measures
        if (MeasureBuilder.isPostAggregationWindow(measure)) {
          continue
        }

        if (!CalculatedMeasureResolver.isCalculatedMeasure(measure)) {
          if (!regularMeasures.includes(measureName)) {
            regularMeasures.push(measureName)
          }
        } else {
          if (!calculatedMeasures.includes(measureName)) {
            calculatedMeasures.push(measureName)
          }
        }
      }
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

          // Apply aggregation based on the dependency's type
          // For pre-aggregated values in CTEs, we need to re-aggregate them properly:
          // - count/sum values should be summed
          // - avg values should be averaged (though ideally weighted average)
          // - min/max values should take min/max
          let aggregatedDep: SQL
          switch (depMeasure.type) {
            case 'count':
            case 'countDistinct':
            case 'sum':
              aggregatedDep = sum(cteDepColumn)
              break
            case 'avg':
              aggregatedDep = this.databaseAdapter.buildAvg(cteDepColumn)
              break
            case 'min':
              aggregatedDep = min(cteDepColumn)
              break
            case 'max':
              aggregatedDep = max(cteDepColumn)
              break
            case 'number':
              aggregatedDep = sum(cteDepColumn)
              break
            default:
              aggregatedDep = sum(cteDepColumn)
          }

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
   * Build measure expression for HAVING clause, handling CTE references correctly
   */
  buildHavingMeasureExpression(
    cubeName: string,
    fieldKey: string,
    measure: any,
    context: QueryContext,
    queryPlan?: QueryPlan
  ): SQL {
    // Check if this measure is from a CTE cube
    if (queryPlan && queryPlan.preAggregationCTEs) {
      const cteInfo = queryPlan.preAggregationCTEs.find(cte => cte.cube.name === cubeName)
      if (cteInfo && cteInfo.measures.includes(`${cubeName}.${fieldKey}`)) {
        // This measure is from a CTE - reference the CTE alias instead of the original table

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
          return this.buildCTECalculatedMeasure(
            measure,
            cube,
            cteInfo,
            cubeMap,
            context
          )
        } else {
          // For non-calculated measures, aggregate the CTE column directly
          const cteColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldKey)}`

          // Apply aggregation function based on measure type
          switch (measure.type) {
            case 'count':
            case 'countDistinct':
            case 'sum':
              return sum(cteColumn)
            case 'avg':
              // For average of averages, we should use a weighted average, but for now use simple avg
              return this.databaseAdapter.buildAvg(cteColumn)
            case 'min':
              return min(cteColumn)
            case 'max':
              return max(cteColumn)
            case 'number':
              // For number type, use sum to combine values
              return sum(cteColumn)
            default:
              return sum(cteColumn)
          }
        }
      }
    }

    // Not from CTE - use regular measure expression
    return this.buildMeasureExpression(measure, context)
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
    let baseExpr = resolveSqlExpression(measure.sql, context)

    // Apply measure filters if they exist
    if (measure.filters && measure.filters.length > 0) {
      const filterConditions = measure.filters.map((filter: (ctx: QueryContext) => SQL) => {
        const filterResult = filter(context)
        // Single wrap is OK here - we're creating fresh SQL for grouping in parentheses
        // The filter function itself should handle isolation if needed
        return filterResult ? sql`(${filterResult})` : undefined
      }).filter(Boolean) // Remove any undefined conditions

      if (filterConditions.length > 0) {
        // Use CASE WHEN for conditional aggregation via adapter
        const andCondition = filterConditions.length === 1 ? filterConditions[0] : and(...filterConditions)
        const caseExpr = this.databaseAdapter.buildCaseWhen([
          { when: andCondition!, then: baseExpr }
        ])
        baseExpr = caseExpr
      }
    }

    // Apply aggregation function based on measure type
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
      case 'stddevSamp': {
        const useSample = measure.type === 'stddevSamp' || measure.statisticalConfig?.useSample
        const result = this.databaseAdapter.buildStddev(baseExpr, useSample)
        if (result === null) {
          console.warn(`[drizzle-cube] ${measure.type} not supported on ${this.databaseAdapter.getEngineType()}, returning NULL`)
          // Use MAX(NULL) to ensure proper aggregation behavior
          return sql`MAX(NULL)`
        }
        return result
      }

      case 'variance':
      case 'varianceSamp': {
        const useSample = measure.type === 'varianceSamp' || measure.statisticalConfig?.useSample
        const result = this.databaseAdapter.buildVariance(baseExpr, useSample)
        if (result === null) {
          console.warn(`[drizzle-cube] ${measure.type} not supported on ${this.databaseAdapter.getEngineType()}, returning NULL`)
          // Use MAX(NULL) to ensure proper aggregation behavior
          return sql`MAX(NULL)`
        }
        return result
      }

      case 'percentile':
      case 'median':
      case 'p95':
      case 'p99': {
        // Determine percentile value based on type
        let pct: number
        switch (measure.type) {
          case 'median':
            pct = 50
            break
          case 'p95':
            pct = 95
            break
          case 'p99':
            pct = 99
            break
          default:
            pct = measure.statisticalConfig?.percentile ?? 50
        }
        const result = this.databaseAdapter.buildPercentile(baseExpr, pct)
        if (result === null) {
          console.warn(`[drizzle-cube] ${measure.type} not supported on ${this.databaseAdapter.getEngineType()}, returning NULL`)
          // Use MAX(NULL) to ensure proper aggregation behavior
          return sql`MAX(NULL)`
        }
        return result
      }

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
      case 'movingSum': {
        const windowConfig = measure.windowConfig || {}

        // Resolve partitionBy dimension references to SQL expressions
        let partitionByExprs: (AnyColumn | SQL)[] | undefined
        if (windowConfig.partitionBy && windowConfig.partitionBy.length > 0 && cube) {
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

          if (resolvedPartitions.length > 0) {
            partitionByExprs = resolvedPartitions
          }
        }

        // Resolve orderBy dimension/measure references to SQL expressions
        type OrderByExpr = { field: AnyColumn | SQL; direction: 'asc' | 'desc' }
        let orderByExprs: OrderByExpr[] | undefined
        if (windowConfig.orderBy && windowConfig.orderBy.length > 0 && cube) {
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

          if (resolvedOrders.length > 0) {
            orderByExprs = resolvedOrders
          }
        }

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

      default:
        return count(baseExpr)
    }
  }

  /**
   * List of measure types that are window functions
   * Window functions require special handling in CTEs:
   * - No GROUP BY in the CTE
   * - No re-aggregation in outer query
   * - Return individual rows, not grouped results
   */
  static WINDOW_FUNCTION_TYPES = [
    'lag', 'lead', 'rank', 'denseRank', 'rowNumber',
    'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum'
  ] as const

  /**
   * Check if a measure type is a window function
   * @param measureType - The measure type string
   * @returns true if this is a window function type
   */
  static isWindowFunction(measureType: string): boolean {
    return (MeasureBuilder.WINDOW_FUNCTION_TYPES as readonly string[]).includes(measureType)
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
    return (
      MeasureBuilder.isWindowFunction(measure.type) &&
      measure.windowConfig?.measure !== undefined
    )
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
    if (!measure.windowConfig?.measure) {
      return null
    }
    const ref = measure.windowConfig.measure
    return ref.includes('.') ? ref : `${cubeName}.${ref}`
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
    switch (windowType) {
      case 'lag':
      case 'lead':
        return 'difference'
      default:
        return 'raw'
    }
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
    const aggregateMeasures: string[] = []
    const postAggWindowMeasures: string[] = []
    const requiredBaseMeasures = new Set<string>()

    for (const measureName of measureNames) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)

      if (cube?.measures?.[fieldName]) {
        const measure = cube.measures[fieldName]

        if (MeasureBuilder.isPostAggregationWindow(measure)) {
          postAggWindowMeasures.push(measureName)

          // Extract and add the base measure as a required dependency
          const baseMeasure = MeasureBuilder.getWindowBaseMeasure(measure, cubeName)
          if (baseMeasure) {
            requiredBaseMeasures.add(baseMeasure)
          }
        } else if (!MeasureBuilder.isWindowFunction(measure.type)) {
          // Regular aggregate measure (not a window function)
          aggregateMeasures.push(measureName)
        }
        // Note: Pre-aggregation window functions (no windowConfig.measure) are no longer supported
        // They should be updated to use the new post-aggregation pattern
      }
    }

    return { aggregateMeasures, postAggWindowMeasures, requiredBaseMeasures }
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
    const { postAggWindowMeasures } = MeasureBuilder.categorizeForPostAggregation(
      measureNames,
      cubeMap
    )
    return postAggWindowMeasures.length > 0
  }
}

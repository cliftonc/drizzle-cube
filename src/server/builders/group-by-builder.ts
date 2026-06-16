/**
 * Group By Builder
 * Handles GROUP BY clause construction:
 * - Dimension grouping
 * - Time dimension grouping with granularity
 * - CTE-aware grouping
 * - Aggregate vs window function detection
 */

import {
  sql,
  SQL,
  type AnyColumn
} from 'drizzle-orm'

import type {
  Cube,
  SemanticQuery,
  QueryContext,
  JoinKeyInfo,
  PhysicalQueryPlan
} from '../types/index.js'

import { resolveSqlExpression } from '../cube-utils.js'
import { DateTimeBuilder } from './date-time-builder.js'
import { MeasureBuilder } from './measure-builder.js'

export class GroupByBuilder {
  constructor(private dateTimeBuilder: DateTimeBuilder) {}

  /**
   * Check if a measure type is a window function
   */
  isWindowFunctionType(measureType: string): boolean {
    const windowTypes = ['lag', 'lead', 'rank', 'denseRank', 'rowNumber',
                         'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum']
    return windowTypes.includes(measureType)
  }

  /**
   * Check if a measure type is an aggregate function (requires GROUP BY)
   *
   * Note: 'number' is included because users commonly define measures with raw SQL
   * aggregations (e.g., sql`COUNT(DISTINCT ...)`) and set type: 'number' for the output.
   * These measures still require GROUP BY when used with time dimensions.
   */
  isAggregateFunctionType(measureType: string): boolean {
    const aggTypes = ['count', 'countDistinct', 'sum', 'avg', 'min', 'max',
                      'stddev', 'stddevSamp', 'variance', 'varianceSamp',
                      'median', 'p95', 'p99', 'percentile',
                      'number']
    return aggTypes.includes(measureType)
  }

  /**
   * Build GROUP BY fields from dimensions and time dimensions
   * Works for both single and multi-cube queries
   *
   * NOTE: GROUP BY is only added when there are AGGREGATE measures.
   * Window functions do not require GROUP BY and operate on individual rows.
   */
  buildGroupByFields(
    cubes: Map<string, Cube> | Cube,
    query: SemanticQuery,
    context: QueryContext,
    queryPlan?: PhysicalQueryPlan
  ): (SQL | AnyColumn)[] {
    // Ungrouped queries skip GROUP BY entirely — return raw rows
    if (query.ungrouped) {
      return []
    }

    const groupFields: (SQL | AnyColumn)[] = []

    // Convert single cube to map for consistent handling
    const cubeMap = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])

    // Determine if GROUP BY is needed:
    // 1. When there are aggregate measures
    // 2. When there are dimensions but NO measures (distinct values query)
    // This also includes post-aggregation window functions that reference aggregate base measures
    const hasDimensions = (query.dimensions && query.dimensions.length > 0) ||
                          (query.timeDimensions && query.timeDimensions.length > 0)
    const hasMeasures = query.measures && query.measures.length > 0

    // For dimension-only queries (no measures), we need GROUP BY for DISTINCT behavior
    const isDimensionOnlyQuery = hasDimensions && !hasMeasures

    const hasAggregateMeasures = this.hasAggregateMeasures(query, cubeMap)

    // Skip GROUP BY only if we have measures that aren't aggregates (pure window functions)
    if (!hasAggregateMeasures && !isDimensionOnlyQuery) {
      return []
    }

    // Add dimensions to GROUP BY
    for (const dimensionName of query.dimensions || []) {
      const field = this.resolveDimensionGroupField(dimensionName, cubeMap, context, queryPlan)
      if (field) groupFields.push(field)
    }

    // Add time dimensions to GROUP BY
    for (const timeDim of query.timeDimensions || []) {
      const field = this.resolveTimeDimensionGroupField(timeDim, cubeMap, context, queryPlan)
      if (field) groupFields.push(field)
    }

    // Note: We used to add join keys from CTEs to GROUP BY, but this is unnecessary
    // Join keys are only needed for the JOIN condition, not for grouping
    // The GROUP BY should only contain columns that are actually selected or used for aggregation

    return groupFields
  }

  /**
   * Determine whether the query contains at least one aggregate (or calculated,
   * or post-aggregation window over an aggregate) measure — which forces GROUP BY.
   */
  private hasAggregateMeasures(
    query: SemanticQuery,
    cubeMap: Map<string, Cube>
  ): boolean {
    for (const measureName of query.measures || []) {
      const [cubeName, fieldName] = measureName.split('.')
      const measure = cubeMap.get(cubeName)?.measures?.[fieldName]
      if (!measure) continue

      if (this.isAggregateFunctionType(measure.type) || measure.type === 'calculated') {
        return true
      }

      // Check for post-aggregation window functions (e.g., RANK ordered by aggregated measure)
      // These require GROUP BY because they operate on aggregated data
      if (this.isWindowOverAggregate(measure, cubeName, cubeMap)) {
        return true
      }
    }
    return false
  }

  /** True when `measure` is a post-aggregation window over an aggregate base measure. */
  private isWindowOverAggregate(
    measure: any,
    cubeName: string,
    cubeMap: Map<string, Cube>
  ): boolean {
    if (!MeasureBuilder.isPostAggregationWindow(measure)) return false
    const baseMeasureName = MeasureBuilder.getWindowBaseMeasure(measure, cubeName)
    if (!baseMeasureName) return false
    const [baseCubeName, baseFieldName] = baseMeasureName.split('.')
    const baseMeasure = cubeMap.get(baseCubeName)?.measures?.[baseFieldName]
    return !!baseMeasure && this.isAggregateFunctionType(baseMeasure.type)
  }

  /** Resolve a single dimension into its GROUP BY expression (CTE-aware). */
  private resolveDimensionGroupField(
    dimensionName: string,
    cubeMap: Map<string, Cube>,
    context: QueryContext,
    queryPlan?: PhysicalQueryPlan
  ): SQL | AnyColumn | null {
    const [cubeName, fieldName] = dimensionName.split('.')
    const cube = cubeMap.get(cubeName)
    if (!cube?.dimensions?.[fieldName]) return null

    const cteInfo = queryPlan?.preAggregationCTEs?.find((cte: any) => cte.cube.name === cubeName)
    if (cteInfo) {
      const matchingJoinKey = cteInfo.joinKeys.find((jk: JoinKeyInfo) => jk.targetColumn === fieldName)
      if (matchingJoinKey && matchingJoinKey.sourceColumnObj) {
        // Use the source column from the main table for GROUP BY instead of the CTE dimension
        return matchingJoinKey.sourceColumnObj
      }
      // This dimension from CTE cube is not a join key - reference it from the CTE
      return sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`
    }

    // Regular dimension from non-CTE cube
    return resolveSqlExpression(cube.dimensions[fieldName].sql, context)
  }

  /** Resolve a single time dimension into its GROUP BY expression (CTE-aware). */
  private resolveTimeDimensionGroupField(
    timeDim: { dimension: string; granularity?: string },
    cubeMap: Map<string, Cube>,
    context: QueryContext,
    queryPlan?: PhysicalQueryPlan
  ): SQL | AnyColumn | null {
    const [cubeName, fieldName] = timeDim.dimension.split('.')
    const cube = cubeMap.get(cubeName)
    if (!cube?.dimensions?.[fieldName]) return null

    const cteInfo = queryPlan?.preAggregationCTEs?.find((cte: any) => cte.cube.name === cubeName)
    if (cteInfo) {
      const matchingJoinKey = cteInfo.joinKeys.find((jk: JoinKeyInfo) => jk.targetColumn === fieldName)
      if (matchingJoinKey && matchingJoinKey.sourceColumnObj) {
        // Use the source column from the main table for GROUP BY with time granularity
        return this.dateTimeBuilder.buildTimeDimensionExpression(
          matchingJoinKey.sourceColumnObj,
          timeDim.granularity,
          context
        )
      }
      // This time dimension from CTE cube is not a join key - reference it from the CTE.
      // The CTE already has the time dimension expression applied, so just reference the column
      return sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`
    }

    // Regular time dimension from non-CTE cube
    return this.dateTimeBuilder.buildTimeDimensionExpression(
      cube.dimensions[fieldName].sql,
      timeDim.granularity,
      context
    )
  }
}

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
  JoinKeyInfo
} from '../types'

import { resolveSqlExpression } from '../cube-utils'
import { DateTimeBuilder } from './date-time-builder'
import { MeasureBuilder } from './measure-builder'

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
   */
  isAggregateFunctionType(measureType: string): boolean {
    const aggTypes = ['count', 'countDistinct', 'sum', 'avg', 'min', 'max',
                      'stddev', 'stddevSamp', 'variance', 'varianceSamp',
                      'median', 'p95', 'p99', 'percentile']
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
    queryPlan?: any // Optional QueryPlan for CTE handling
  ): (SQL | AnyColumn)[] {
    const groupFields: (SQL | AnyColumn)[] = []

    // Convert single cube to map for consistent handling
    const cubeMap = cubes instanceof Map ? cubes : new Map([[cubes.name, cubes]])

    // Only add GROUP BY if we have AGGREGATE measures
    // This also includes post-aggregation window functions that reference aggregate base measures
    let hasAggregateMeasures = false

    for (const measureName of query.measures || []) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = cubeMap.get(cubeName)
      if (cube && cube.measures && cube.measures[fieldName]) {
        const measure = cube.measures[fieldName]
        if (this.isAggregateFunctionType(measure.type) || measure.type === 'calculated') {
          hasAggregateMeasures = true
          break
        }

        // Check for post-aggregation window functions (e.g., RANK ordered by aggregated measure)
        // These require GROUP BY because they operate on aggregated data
        if (MeasureBuilder.isPostAggregationWindow(measure)) {
          const baseMeasureName = MeasureBuilder.getWindowBaseMeasure(measure, cubeName)
          if (baseMeasureName) {
            const [baseCubeName, baseFieldName] = baseMeasureName.split('.')
            const baseCube = cubeMap.get(baseCubeName)
            const baseMeasure = baseCube?.measures?.[baseFieldName]
            if (baseMeasure && this.isAggregateFunctionType(baseMeasure.type)) {
              hasAggregateMeasures = true
              break
            }
          }
        }
      }
    }

    if (!hasAggregateMeasures) {
      return []
    }

    // Add dimensions to GROUP BY
    if (query.dimensions) {
      for (const dimensionName of query.dimensions) {
        const [cubeName, fieldName] = dimensionName.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube && cube.dimensions && cube.dimensions[fieldName]) {

          // Check if this dimension is from a CTE cube
          const isFromCTE = queryPlan?.preAggregationCTEs?.some((cte: any) => cte.cube.name === cubeName)

          if (isFromCTE) {
            // For dimensions from CTE cubes, check if this is a join key that maps to the main table
            const cteInfo = queryPlan.preAggregationCTEs.find((cte: any) => cte.cube.name === cubeName)
            const matchingJoinKey = cteInfo.joinKeys.find((jk: JoinKeyInfo) => jk.targetColumn === fieldName)

            if (matchingJoinKey && matchingJoinKey.sourceColumnObj) {
              // Use the source column from the main table for GROUP BY instead of the CTE dimension
              groupFields.push(matchingJoinKey.sourceColumnObj)
            } else {
              // This dimension from CTE cube is not a join key - we need to reference it from the CTE
              // But only if it was included in the CTE selections
              const cteDimensionExpr = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`
              groupFields.push(cteDimensionExpr)
            }
          } else {
            // Regular dimension from non-CTE cube
            const dimension = cube.dimensions[fieldName]
            const dimensionExpr = resolveSqlExpression(dimension.sql, context)
            groupFields.push(dimensionExpr)
          }
        }
      }
    }

    // Add time dimensions to GROUP BY
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        const [cubeName, fieldName] = timeDim.dimension.split('.')
        const cube = cubeMap.get(cubeName)
        if (cube && cube.dimensions && cube.dimensions[fieldName]) {

          // Check if this time dimension is from a CTE cube
          const isFromCTE = queryPlan?.preAggregationCTEs?.some((cte: any) => cte.cube.name === cubeName)

          if (isFromCTE) {
            // For time dimensions from CTE cubes, check if this is a join key that maps to the main table
            const cteInfo = queryPlan.preAggregationCTEs.find((cte: any) => cte.cube.name === cubeName)
            const matchingJoinKey = cteInfo.joinKeys.find((jk: JoinKeyInfo) => jk.targetColumn === fieldName)

            if (matchingJoinKey && matchingJoinKey.sourceColumnObj) {
              // Use the source column from the main table for GROUP BY with time granularity
              const timeExpr = this.dateTimeBuilder.buildTimeDimensionExpression(
                matchingJoinKey.sourceColumnObj,
                timeDim.granularity,
                context
              )
              groupFields.push(timeExpr)
            } else {
              // This time dimension from CTE cube is not a join key - reference it from the CTE
              // The CTE already has the time dimension expression applied, so just reference the column
              const cteDimensionExpr = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`
              groupFields.push(cteDimensionExpr)
            }
          } else {
            // Regular time dimension from non-CTE cube
            const dimension = cube.dimensions[fieldName]
            const timeExpr = this.dateTimeBuilder.buildTimeDimensionExpression(
              dimension.sql,
              timeDim.granularity,
              context
            )
            groupFields.push(timeExpr)
          }
        }
      }
    }

    // Note: We used to add join keys from CTEs to GROUP BY, but this is unnecessary
    // Join keys are only needed for the JOIN condition, not for grouping
    // The GROUP BY should only contain columns that are actually selected or used for aggregation

    return groupFields
  }
}

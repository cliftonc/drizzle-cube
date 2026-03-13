import { sql, SQL } from 'drizzle-orm'

import { resolveSqlExpression, safeKey } from '../../cube-utils'
import { MeasureBuilder } from '../../builders/measure-builder'
import type {
  Cube,
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../../types'
import type { PhysicalBuildDependencies, SelectionMap } from './shared'

/**
 * Applies post-aggregation window measures to the selection map.
 */
export function applyPostAggregationWindows(
  modifiedSelections: SelectionMap,
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  allCubes: Map<string, Cube>,
  deps: Pick<PhysicalBuildDependencies, 'queryBuilder' | 'databaseAdapter'>
): void {
  if (!query.measures) {
    return
  }

  for (const measureName of query.measures) {
    const [cubeName, fieldName] = measureName.split('.')
    const cube = allCubes.get(cubeName)

    if (!cube?.measures?.[fieldName]) {
      continue
    }

    const measure = cube.measures[fieldName]

    // Check if this is a post-aggregation window function
    if (!MeasureBuilder.isPostAggregationWindow(measure)) {
      continue
    }

    const baseMeasureName = MeasureBuilder.getWindowBaseMeasure(measure, cubeName)
    if (!baseMeasureName) {
      continue
    }

    // Build the base measure expression fresh (without alias)
    // We can't use modifiedSelections because those are aliased and SQL doesn't
    // allow referencing SELECT aliases in the same SELECT clause
    const [baseCubeName, baseFieldName] = baseMeasureName.split('.')
    const baseCube = allCubes.get(baseCubeName)

    if (!baseCube?.measures?.[baseFieldName]) {
      continue
    }

    const baseMeasure = baseCube.measures[baseFieldName]

    // Check if the base measure is from a CTE cube (hasMany relationship)
    // If so, we should reference the CTE column with re-aggregation
    // because the main query has its own GROUP BY
    const cteInfo = queryPlan.preAggregationCTEs?.find(
      cte => cte.cube?.name === baseCubeName && cte.measures?.includes(baseMeasureName)
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
      baseMeasureExpr = deps.queryBuilder.buildMeasureExpression(baseMeasure, context, baseCube)
    }

    // Ensure the base measure is also in the selections (for display)
    if (!modifiedSelections[baseMeasureName]) {
      modifiedSelections[safeKey(baseMeasureName)] = sql`${baseMeasureExpr}`.as(baseMeasureName) as unknown as SQL
    }

    // Build the window function expression
    const windowExpr = buildPostAggregationWindowExpression(
      measure,
      baseMeasureExpr,
      query,
      context,
      cube,
      queryPlan,
      deps
    )

    if (windowExpr) {
      modifiedSelections[safeKey(measureName)] = sql`${windowExpr}`.as(measureName) as unknown as SQL
    }
  }
}

/**
 * Build post-aggregation window function expression.
 */
function buildPostAggregationWindowExpression(
  measure: any,
  baseMeasureExpr: any,
  query: SemanticQuery,
  context: QueryContext,
  cube: Cube,
  queryPlan: PhysicalQueryPlan,
  deps: Pick<PhysicalBuildDependencies, 'queryBuilder' | 'databaseAdapter'>
): SQL | null {
  const windowConfig = measure.windowConfig || {}

  // Helper to check if a dimension's cube is in a CTE
  // If so, return the CTE's pre-computed column reference instead of re-computing
  const getCTEDimensionExpr = (dimCubeName: string, fieldName: string): SQL | null => {
    if (!queryPlan.preAggregationCTEs) return null
    const cteInfo = queryPlan.preAggregationCTEs.find(cte => cte.cube?.name === dimCubeName)
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
                  field: deps.queryBuilder.buildTimeDimensionExpression(
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
          field: deps.queryBuilder.buildTimeDimensionExpression(
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
  const windowResult = deps.databaseAdapter.buildWindowFunction(
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

import {
  sql,
  SQL,
  sum,
  min,
  max
} from 'drizzle-orm'

import type {
  Cube,
  JoinKeyInfo,
  PhysicalQueryPlan,
  PreAggregationCTEInfo,
  QueryContext,
  SemanticQuery
} from '../../types'
import { applyPostAggregationWindows } from './window-processor'
import type { PhysicalBuildDependencies, SelectionMap } from './shared'

/**
 * Builds and rewrites selections (including CTE and window handling).
 */
export function buildModifiedSelections(
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  allCubes: Map<string, Cube>,
  deps: Pick<PhysicalBuildDependencies, 'queryBuilder' | 'databaseAdapter'>
): SelectionMap {
  // Build selections using DrizzleSqlBuilder - but modify for CTEs
  const selections = deps.queryBuilder.buildSelections(
    queryPlan.joinCubes.length > 0
      ? allCubes // Multi-cube
      : queryPlan.primaryCube, // Single cube
    query,
    context
  )

  // Replace selections from pre-aggregated cubes with CTE references
  const modifiedSelections: SelectionMap = { ...selections }

  if (queryPlan.preAggregationCTEs) {
    for (const cteInfo of queryPlan.preAggregationCTEs) {
      const cubeName = cteInfo.cube.name

      // Handle measures from CTE cubes
      for (const measureName of cteInfo.measures) {
        if (!modifiedSelections[measureName]) {
          continue
        }

        const [, fieldName] = measureName.split('.')
        const cube = allCubes.get(cubeName)
        if (!cube?.measures?.[fieldName]) {
          continue
        }

        const measure = cube.measures[fieldName]
        const cteColumn = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`

        // For aggregate CTEs, use appropriate Drizzle aggregate function based on measure type
        // Since CTE is already pre-aggregated, we need to aggregate the pre-aggregated values
        let aggregatedExpr: SQL

        if (measure.type === 'calculated' && measure.calculatedSql) {
          // Use DrizzleSqlBuilder's helper to build calculated measure from CTE columns
          aggregatedExpr = deps.queryBuilder.buildCTECalculatedMeasure(
            measure,
            cube,
            cteInfo,
            allCubes,
            context
          )
        } else {
          // For non-calculated measures, aggregate the CTE column based on CTE reason
          // - 'hasMany' CTEs: Multiple rows per join key, so SUM combines them
          // - 'fanOutPrevention' CTEs: One row per key but duplicated by joins, use MAX to retrieve value
          const isFanOutPrevention = cteInfo.cteReason === 'fanOutPrevention'
          // For hasMany CTEs, use MAX (not SUM) when query grain is already at the join key.
          // This prevents duplication when the primary cube is lower-grain than the join key.
          const useMaxAtJoinKeyGrain = shouldUseMaxForHasManyAtJoinKeyGrain(
            cteInfo,
            query,
            allCubes
          )
          const useMax = isFanOutPrevention || useMaxAtJoinKeyGrain

          switch (measure.type) {
            case 'count':
            case 'countDistinct':
            case 'sum':
              // For fan-out prevention, use MAX to get the pre-aggregated value without re-summing
              // For hasMany, use SUM to combine multiple CTE rows
              aggregatedExpr = useMax ? max(cteColumn) : sum(cteColumn)
              break
            case 'avg':
              // For average, use MAX for fanOut (one value), simple avg for hasMany
              // Note: For hasMany, this is an average of averages which isn't technically correct
              // but matches the current behavior
              aggregatedExpr = useMax ? max(cteColumn) : deps.databaseAdapter.buildAvg(cteColumn)
              break
            case 'min':
              aggregatedExpr = min(cteColumn)
              break
            case 'max':
              aggregatedExpr = max(cteColumn)
              break
            case 'number':
              // number type measures contain custom aggregations (PERCENTILE, etc.)
              // already computed in the CTE - use max to retrieve without re-summing
              aggregatedExpr = max(cteColumn)
              break
            default:
              aggregatedExpr = useMax ? max(cteColumn) : sum(cteColumn)
          }
        }

        modifiedSelections[measureName] = sql`${aggregatedExpr}`.as(measureName) as unknown as SQL
      }

      // Handle dimensions from CTE cubes (these need to reference join keys in CTE)
      for (const selectionName in modifiedSelections) {
        const [selectionCubeName, fieldName] = selectionName.split('.')
        if (selectionCubeName !== cubeName) {
          continue
        }

        // This is a dimension/time dimension from a CTE cube
        const cube = allCubes.get(cubeName)

        // Check if this is a dimension or time dimension from this cube
        const isDimension = cube && cube.dimensions?.[fieldName]
        const isTimeDimension = selectionName.startsWith(cubeName + '.')

        if (!isDimension && !isTimeDimension) {
          continue
        }

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

  applyPostAggregationWindows(modifiedSelections, queryPlan, query, context, allCubes, deps)

  return modifiedSelections
}

/**
 * For hasMany CTEs, detect when the outer query grain already matches the CTE join key.
 * In that case, re-aggregation should use MAX (not SUM) to avoid multiplying values by
 * lower-grain primary cube rows.
 */
function shouldUseMaxForHasManyAtJoinKeyGrain(
  cteInfo: PreAggregationCTEInfo,
  query: SemanticQuery,
  cubes: Map<string, Cube>
): boolean {
  if (cteInfo.cteReason !== 'hasMany') {
    return false
  }

  // If CTE includes additional grouping keys, SUM is still required.
  if (cteInfo.downstreamJoinKeys && cteInfo.downstreamJoinKeys.length > 0) {
    return false
  }

  // Multi-hop CTEs can include absorbed intermediate grouping and are not safe for this rule.
  if (cteInfo.intermediateJoins && cteInfo.intermediateJoins.length > 0) {
    return false
  }

  const hasGrouping = Boolean(
    (query.dimensions && query.dimensions.length > 0) ||
    (query.timeDimensions && query.timeDimensions.length > 0)
  )
  if (!hasGrouping) {
    return false
  }

  // If query selects dimensions from the CTE cube itself, CTE grain can exceed join key grain.
  const selectsFromCTECube = Boolean(
    query.dimensions?.some(d => d.startsWith(`${cteInfo.cube.name}.`)) ||
    query.timeDimensions?.some(td => td.dimension.startsWith(`${cteInfo.cube.name}.`))
  )
  if (selectsFromCTECube) {
    return false
  }

  // Safe only when all source-side join keys are present in the query grouping.
  return cteInfo.joinKeys.length > 0 && cteInfo.joinKeys.every(joinKey =>
    Boolean(joinKey.sourceColumnObj) && queryGroupsByColumn(joinKey.sourceColumnObj, query, cubes)
  )
}

/**
 * Checks whether query grouping includes a dimension backed by the given column.
 */
function queryGroupsByColumn(column: any, query: SemanticQuery, cubes: Map<string, Cube>): boolean {
  if (query.dimensions) {
    for (const dimensionName of query.dimensions) {
      const [cubeName, fieldName] = dimensionName.split('.')
      const cube = cubes.get(cubeName)
      if (cube?.dimensions?.[fieldName]?.sql === column) {
        return true
      }
    }
  }

  // Only treat time dimensions as grouping by raw column when no granularity is applied.
  if (query.timeDimensions) {
    for (const timeDim of query.timeDimensions) {
      if (timeDim.granularity) {
        continue
      }
      const [cubeName, fieldName] = timeDim.dimension.split('.')
      const cube = cubes.get(cubeName)
      if (cube?.dimensions?.[fieldName]?.sql === column) {
        return true
      }
    }
  }

  return false
}

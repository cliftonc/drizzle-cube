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
} from '../../types/index.js'
import { applyPostAggregationWindows } from './window-processor.js'
import type { PhysicalBuildDependencies, SelectionMap } from './shared.js'

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
      rewriteCteMeasures(modifiedSelections, cteInfo, query, context, allCubes, deps)
      rewriteCteDimensions(modifiedSelections, cteInfo, allCubes)
    }
  }

  applyPostAggregationWindows(modifiedSelections, queryPlan, query, context, allCubes, deps)

  return modifiedSelections
}

/** Rewrite measure selections from a pre-aggregated CTE to reference its columns. */
function rewriteCteMeasures(
  modifiedSelections: SelectionMap,
  cteInfo: PreAggregationCTEInfo,
  query: SemanticQuery,
  context: QueryContext,
  allCubes: Map<string, Cube>,
  deps: Pick<PhysicalBuildDependencies, 'queryBuilder' | 'databaseAdapter'>
): void {
  const cubeName = cteInfo.cube.name

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
      aggregatedExpr = buildCteMeasureAggregate(measure, cteColumn, cteInfo, query, allCubes, deps)
    }

    modifiedSelections[measureName] = sql`${aggregatedExpr}`.as(measureName) as unknown as SQL
  }
}

/**
 * Aggregate a pre-aggregated CTE column for a non-calculated measure.
 * - 'hasMany' CTEs: multiple rows per join key, so SUM combines them
 * - 'fanOutPrevention' CTEs: one row per key but duplicated by joins, use MAX
 * - hasMany at join-key grain: use MAX to avoid multiplying by lower-grain rows
 */
function buildCteMeasureAggregate(
  measure: any,
  cteColumn: SQL,
  cteInfo: PreAggregationCTEInfo,
  query: SemanticQuery,
  allCubes: Map<string, Cube>,
  deps: Pick<PhysicalBuildDependencies, 'databaseAdapter'>
): SQL {
  const isFanOutPrevention = cteInfo.cteReason === 'fanOutPrevention'
  const useMaxAtJoinKeyGrain = shouldUseMaxForHasManyAtJoinKeyGrain(cteInfo, query, allCubes)
  const useMax = isFanOutPrevention || useMaxAtJoinKeyGrain

  switch (measure.type) {
    case 'count':
    case 'countDistinct':
    case 'sum':
      // For fan-out prevention, use MAX to get the pre-aggregated value without re-summing
      // For hasMany, use SUM to combine multiple CTE rows
      return useMax ? max(cteColumn) : sum(cteColumn)
    case 'avg':
      // For average, use MAX for fanOut (one value), simple avg for hasMany.
      // For hasMany this is an average of averages (matches current behavior).
      return useMax ? max(cteColumn) : deps.databaseAdapter.buildAvg(cteColumn)
    case 'min':
      return min(cteColumn)
    case 'max':
      return max(cteColumn)
    case 'number':
      // number type measures contain custom aggregations (PERCENTILE, etc.)
      // already computed in the CTE - use max to retrieve without re-summing
      return max(cteColumn)
    default:
      return useMax ? max(cteColumn) : sum(cteColumn)
  }
}

/** Rewrite dimension/time-dimension selections from a CTE cube to reference CTE join keys. */
function rewriteCteDimensions(
  modifiedSelections: SelectionMap,
  cteInfo: PreAggregationCTEInfo,
  allCubes: Map<string, Cube>
): void {
  const cubeName = cteInfo.cube.name

  for (const selectionName in modifiedSelections) {
    const [selectionCubeName, fieldName] = selectionName.split('.')
    if (selectionCubeName !== cubeName) {
      continue
    }

    // This is a dimension/time dimension from a CTE cube
    const cube = allCubes.get(cubeName)

    const isDimension = cube && cube.dimensions?.[fieldName]
    const isTimeDimension = selectionName.startsWith(cubeName + '.')
    if (!isDimension && !isTimeDimension) {
      continue
    }

    // Check if this is one of the join keys already in the CTE (exact name match first)
    let matchingJoinKey = cteInfo.joinKeys.find((jk: JoinKeyInfo) => jk.targetColumn === fieldName)

    // If no exact match, check if the dimension SQL matches any join key target column
    if (!matchingJoinKey && cube?.dimensions?.[fieldName]) {
      const dimensionSql = cube.dimensions[fieldName].sql
      matchingJoinKey = cteInfo.joinKeys.find((jk: any) => jk.targetColumnObj === dimensionSql)
    }

    if (matchingJoinKey) {
      // Reference the join key from the CTE using the dimension name
      modifiedSelections[selectionName] = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`.as(selectionName) as unknown as SQL
    } else if (isTimeDimension && cube?.dimensions?.[fieldName]) {
      // This is a time dimension that should be available in the CTE
      modifiedSelections[selectionName] = sql`${sql.identifier(cteInfo.cteAlias)}.${sql.identifier(fieldName)}`.as(selectionName) as unknown as SQL
    }
    // For non-join-key dimensions from CTE cubes that aren't handled above,
    // the original selection is kept (which may cause SQL errors if not properly handled)
  }
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

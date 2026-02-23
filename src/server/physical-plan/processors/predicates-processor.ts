import {
  and,
  SQL
} from 'drizzle-orm'

import type {
  Cube,
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../../types'
import type {
  CTEBuildState,
  JoinBuildState,
  PhysicalBuildDependencies
} from './shared'

/**
 * Applies WHERE/GROUP/HAVING/ORDER/LIMIT phases.
 */
export function applyPredicatesAndFinalize(
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  allCubes: Map<string, Cube>,
  primaryCubeBase: ReturnType<Cube['sql']>,
  cteState: CTEBuildState,
  joinState: JoinBuildState,
  deps: Pick<PhysicalBuildDependencies, 'queryBuilder'>
): any {
  const allWhereConditions = [...joinState.allWhereConditions]

  // Add base WHERE conditions from primary cube
  if (primaryCubeBase.where) {
    allWhereConditions.push(primaryCubeBase.where)
  }

  // Add WHERE conditions from all joined cubes (including their security context filters)
  if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
    for (const joinCube of queryPlan.joinCubes) {
      const cubeName = joinCube.cube.name

      // Skip if this cube is handled by a CTE (WHERE conditions are applied within the CTE)
      const cteAlias = cteState.cteAliasMap.get(cubeName)
      if (cteAlias) {
        continue
      }

      // Skip cubes that were absorbed as intermediates into CTEs
      // Their security is applied within the CTE, not in the main query
      if (joinState.absorbedIntermediateCubes.has(cubeName)) {
        continue
      }

      // Skip cubes whose security is already in JOIN ON clause (for LEFT/RIGHT/FULL JOINs)
      // This prevents duplicate security conditions and preserves NULL rows in LEFT JOINs
      if (joinState.cubesWithSecurityInJoin.has(cubeName)) {
        continue
      }

      // Get the base query definition for this joined cube to access its WHERE conditions
      const joinCubeBase = joinCube.cube.sql(context)
      if (joinCubeBase.where) {
        allWhereConditions.push(joinCubeBase.where)
      }
    }
  }

  // Add query-specific WHERE conditions using DrizzleSqlBuilder
  // Pass preBuiltFilterMap to reuse filter SQL and deduplicate parameters
  const queryWhereConditions = deps.queryBuilder.buildWhereConditions(
    queryPlan.joinCubes.length > 0
      ? allCubes // Multi-cube
      : queryPlan.primaryCube, // Single cube
    query,
    context,
    queryPlan, // Pass the queryPlan to handle CTE scenarios
    cteState.preBuiltFilterMap // Reuse pre-built filters for parameter deduplication
  )
  if (queryWhereConditions.length > 0) {
    allWhereConditions.push(...queryWhereConditions)
  }

  let drizzleQuery = joinState.drizzleQuery

  // Apply combined WHERE conditions
  if (allWhereConditions.length > 0) {
    const combinedWhere = allWhereConditions.length === 1
      ? allWhereConditions[0]
      : and(...allWhereConditions) as SQL
    drizzleQuery = drizzleQuery.where(combinedWhere)
  }

  // Add GROUP BY using DrizzleSqlBuilder
  const groupByFields = deps.queryBuilder.buildGroupByFields(
    queryPlan.joinCubes.length > 0
      ? allCubes // Multi-cube
      : queryPlan.primaryCube, // Single cube
    query,
    context,
    queryPlan // Pass the queryPlan to handle CTE scenarios
  )
  if (groupByFields.length > 0) {
    drizzleQuery = drizzleQuery.groupBy(...groupByFields)
  }

  // Add HAVING conditions using DrizzleSqlBuilder (after GROUP BY)
  const havingConditions = deps.queryBuilder.buildHavingConditions(
    queryPlan.joinCubes.length > 0
      ? allCubes // Multi-cube
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

  // Add ORDER BY using DrizzleSqlBuilder
  const orderByFields = deps.queryBuilder.buildOrderBy(query)
  if (orderByFields.length > 0) {
    drizzleQuery = drizzleQuery.orderBy(...orderByFields)
  }

  // Add LIMIT and OFFSET using DrizzleSqlBuilder
  drizzleQuery = deps.queryBuilder.applyLimitAndOffset(drizzleQuery, query)

  return drizzleQuery
}

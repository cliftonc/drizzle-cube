import {
  and,
  SQL
} from 'drizzle-orm'

import type {
  Cube,
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../../types/index.js'
import type {
  CTEBuildState,
  JoinBuildState,
  PhysicalBuildDependencies
} from './shared.js'

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
  const allWhereConditions = collectWhereConditions(
    queryPlan,
    query,
    context,
    allCubes,
    primaryCubeBase,
    cteState,
    joinState,
    deps
  )

  let drizzleQuery = joinState.drizzleQuery

  // Apply combined WHERE conditions
  if (allWhereConditions.length > 0) {
    const combinedWhere = allWhereConditions.length === 1
      ? allWhereConditions[0]
      : and(...allWhereConditions) as SQL
    drizzleQuery = drizzleQuery.where(combinedWhere)
  }

  return applyGroupingAndPagination(drizzleQuery, queryPlan, query, context, allCubes, deps)
}

/**
 * Collect all WHERE conditions: join-state conditions, the primary cube's
 * security WHERE, joined cubes' security WHERE (excluding CTE/absorbed/
 * security-in-JOIN cubes), and the query's own filters.
 */
function collectWhereConditions(
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  allCubes: Map<string, Cube>,
  primaryCubeBase: ReturnType<Cube['sql']>,
  cteState: CTEBuildState,
  joinState: JoinBuildState,
  deps: Pick<PhysicalBuildDependencies, 'queryBuilder'>
): SQL[] {
  const allWhereConditions = [...joinState.allWhereConditions]

  // Add base WHERE conditions from primary cube
  if (primaryCubeBase.where) {
    allWhereConditions.push(primaryCubeBase.where)
  }

  // Add WHERE conditions from all joined cubes (including their security filters)
  if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
    for (const joinCube of queryPlan.joinCubes) {
      const cubeName = joinCube.cube.name

      // Skip cubes handled by a CTE (WHERE applied within the CTE), cubes
      // absorbed as intermediates into CTEs, and cubes whose security is
      // already in the JOIN ON clause (LEFT/RIGHT/FULL joins — avoids
      // duplicate conditions and preserves NULL rows).
      if (
        cteState.cteAliasMap.get(cubeName) ||
        joinState.absorbedIntermediateCubes.has(cubeName) ||
        joinState.cubesWithSecurityInJoin.has(cubeName)
      ) {
        continue
      }

      // Get the base query definition for this joined cube to access its WHERE
      const joinCubeBase = joinCube.cube.sql(context)
      if (joinCubeBase.where) {
        allWhereConditions.push(joinCubeBase.where)
      }
    }
  }

  // Add query-specific WHERE conditions using DrizzleSqlBuilder.
  // Pass preBuiltFilterMap to reuse filter SQL and deduplicate parameters.
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

  return allWhereConditions
}

/** Apply GROUP BY, HAVING, ORDER BY, and LIMIT/OFFSET to the query. */
function applyGroupingAndPagination(
  drizzleQuery: any,
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  allCubes: Map<string, Cube>,
  deps: Pick<PhysicalBuildDependencies, 'queryBuilder'>
): any {
  // Single cube vs multi-cube target for clause builders
  const clauseCubes = queryPlan.joinCubes.length > 0 ? allCubes : queryPlan.primaryCube

  let query_ = drizzleQuery

  // Add GROUP BY
  const groupByFields = deps.queryBuilder.buildGroupByFields(clauseCubes, query, context, queryPlan)
  if (groupByFields.length > 0) {
    query_ = query_.groupBy(...groupByFields)
  }

  // Add HAVING (after GROUP BY). Skip for ungrouped queries — HAVING operates
  // on aggregated results.
  if (!query.ungrouped) {
    const havingConditions = deps.queryBuilder.buildHavingConditions(clauseCubes, query, context, queryPlan)
    if (havingConditions.length > 0) {
      const combinedHaving = havingConditions.length === 1
        ? havingConditions[0]
        : and(...havingConditions) as SQL
      query_ = query_.having(combinedHaving)
    }
  }

  // Add ORDER BY
  const orderByFields = deps.queryBuilder.buildOrderBy(query)
  if (orderByFields.length > 0) {
    query_ = query_.orderBy(...orderByFields)
  }

  // Add LIMIT and OFFSET
  return deps.queryBuilder.applyLimitAndOffset(query_, query)
}

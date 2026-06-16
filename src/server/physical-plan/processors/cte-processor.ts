import { and, SQL } from 'drizzle-orm'

import type {
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../../types/index.js'
import type { PhysicalBuildDependencies, CTEBuildState } from './shared.js'

/**
 * Builds pre-aggregation CTE state used by selection/join/predicate processors.
 */
export function buildCTEState(
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies
): CTEBuildState {
  // Pre-build filter SQL for propagating filters to enable parameter deduplication.
  // This ensures the same filter values are shared between CTE subqueries and main query.
  const preBuiltFilterMap = buildPropagatingFilterMap(queryPlan, context, deps)

  // Build pre-aggregation CTEs if needed
  const ctes: any[] = []
  const cteAliasMap = new Map<string, string>()
  // Map downstream cubes to their CTE info (for cubes that join THROUGH a CTE)
  const downstreamCubeMap: CTEBuildState['downstreamCubeMap'] = new Map()

  if (queryPlan.preAggregationCTEs && queryPlan.preAggregationCTEs.length > 0) {
    for (const cteInfo of queryPlan.preAggregationCTEs) {
      const cte = deps.cteBuilder.buildPreAggregationCTE(
        cteInfo,
        query,
        context,
        queryPlan,
        preBuiltFilterMap
      )

      if (cte) {
        ctes.push(cte)
        cteAliasMap.set(cteInfo.cube.name, cteInfo.cteAlias)
        registerDownstreamCubes(cteInfo, downstreamCubeMap)
      }
    }
  }

  return {
    preBuiltFilterMap,
    ctes,
    cteAliasMap,
    downstreamCubeMap
  }
}

/**
 * Pre-build propagating-filter SQL per source cube (once each) so the same
 * filter values are shared between CTE subqueries and the main query, and stash
 * the combined SQL back on each propagating filter for reuse.
 */
function buildPropagatingFilterMap(
  queryPlan: PhysicalQueryPlan,
  context: QueryContext,
  deps: PhysicalBuildDependencies
): Map<string, SQL[]> {
  const preBuiltFilterMap = new Map<string, SQL[]>()

  if (!queryPlan.preAggregationCTEs || queryPlan.preAggregationCTEs.length === 0) {
    return preBuiltFilterMap
  }

  for (const cteInfo of queryPlan.preAggregationCTEs) {
    if (!cteInfo.propagatingFilters || cteInfo.propagatingFilters.length === 0) {
      continue
    }
    for (const propFilter of cteInfo.propagatingFilters) {
      const sourceCubeName = propFilter.sourceCube.name

      // Build filter SQL once if not already built for this cube
      if (!preBuiltFilterMap.has(sourceCubeName)) {
        const syntheticQuery: SemanticQuery = { filters: propFilter.filters }
        const cubeMap = new Map([[sourceCubeName, propFilter.sourceCube]])
        const filterSQL = deps.queryBuilder.buildWhereConditions(cubeMap, syntheticQuery, context)
        preBuiltFilterMap.set(sourceCubeName, filterSQL)
      }

      // Store the pre-built SQL in the propagating filter for reuse
      const preBuiltSQL = preBuiltFilterMap.get(sourceCubeName)
      if (preBuiltSQL && preBuiltSQL.length > 0) {
        propFilter.preBuiltFilterSQL = preBuiltSQL.length === 1
          ? preBuiltSQL[0]
          : and(...preBuiltSQL) as SQL
      }
    }
  }

  return preBuiltFilterMap
}

/** Register cubes that should join THROUGH a CTE in the downstream-cube map. */
function registerDownstreamCubes(
  cteInfo: NonNullable<PhysicalQueryPlan['preAggregationCTEs']>[number],
  downstreamCubeMap: CTEBuildState['downstreamCubeMap']
): void {
  if (!cteInfo.downstreamJoinKeys) {
    return
  }
  for (const downstream of cteInfo.downstreamJoinKeys) {
    downstreamCubeMap.set(downstream.targetCubeName, {
      cteAlias: cteInfo.cteAlias,
      joinKeys: downstream.joinKeys
    })
  }
}

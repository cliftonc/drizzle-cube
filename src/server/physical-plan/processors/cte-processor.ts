import { and, SQL } from 'drizzle-orm'

import type {
  PhysicalQueryPlan,
  QueryContext,
  SemanticQuery
} from '../../types'
import type { PhysicalBuildDependencies, CTEBuildState } from './shared'

/**
 * Builds pre-aggregation CTE state used by selection/join/predicate processors.
 */
export function buildCTEState(
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery,
  context: QueryContext,
  deps: PhysicalBuildDependencies
): CTEBuildState {
  // Pre-build filter SQL for propagating filters to enable parameter deduplication
  // This ensures the same filter values are shared between CTE subqueries and main query
  const preBuiltFilterMap = new Map<string, SQL[]>()

  if (queryPlan.preAggregationCTEs && queryPlan.preAggregationCTEs.length > 0) {
    for (const cteInfo of queryPlan.preAggregationCTEs) {
      if (cteInfo.propagatingFilters && cteInfo.propagatingFilters.length > 0) {
        for (const propFilter of cteInfo.propagatingFilters) {
          const sourceCubeName = propFilter.sourceCube.name

          // Build filter SQL once if not already built for this cube
          if (!preBuiltFilterMap.has(sourceCubeName)) {
            const syntheticQuery: SemanticQuery = {
              filters: propFilter.filters
            }
            const cubeMap = new Map([[sourceCubeName, propFilter.sourceCube]])
            const filterSQL = deps.queryBuilder.buildWhereConditions(
              cubeMap,
              syntheticQuery,
              context
            )
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
    }
  }

  // Build pre-aggregation CTEs if needed
  const ctes: any[] = []
  const cteAliasMap = new Map<string, string>()
  // Map downstream cubes to their CTE info (for cubes that join THROUGH a CTE)
  const downstreamCubeMap = new Map<string, {
    cteAlias: string
    joinKeys: Array<{ sourceColumn: string; targetColumn: string; sourceColumnObj?: any; targetColumnObj?: any }>
  }>()

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

        // Build downstream cube map for cubes that should join through this CTE
        if (cteInfo.downstreamJoinKeys) {
          for (const downstream of cteInfo.downstreamJoinKeys) {
            downstreamCubeMap.set(downstream.targetCubeName, {
              cteAlias: cteInfo.cteAlias,
              joinKeys: downstream.joinKeys
            })
          }
        }
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

/**
 * FilterCachePreloader — pre-builds filter SQL and stores it in the per-query
 * FilterCacheManager so the same filter values are shared (deduplicated) across
 * CTEs and the main query rather than emitted as separate parameters.
 *
 * Extracted from QueryExecutor. Depends on DrizzleSqlBuilder for filter SQL.
 */

import type { Cube, SemanticQuery, QueryContext } from '../types'
import { resolveSqlExpression, resolveFilterFieldExpr } from '../cube-utils'
import { FilterCacheManager, getFilterKey, getTimeDimensionFilterKey, flattenFilters } from '../filter-cache'
import type { DrizzleSqlBuilder } from '../physical-plan/drizzle-sql-builder'

export class FilterCachePreloader {
  constructor(private readonly queryBuilder: DrizzleSqlBuilder) {}

  /**
   * Pre-build filter SQL and store in cache for reuse across CTEs and main query
   * This enables parameter deduplication - the same filter values are shared
   * rather than appearing as separate parameters in different parts of the query
   */
  preload(
    query: SemanticQuery,
    filterCache: FilterCacheManager,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): void {
    // Pre-build regular filters
    if (query.filters && query.filters.length > 0) {
      // Flatten nested AND/OR filters to get individual conditions
      const flatFilters = flattenFilters(query.filters)

      for (const filter of flatFilters) {
        const key = getFilterKey(filter)

        // Skip if already cached (from a previous filter in the same query)
        if (filterCache.has(key)) continue

        // Find the cube for this filter's member
        const [cubeName, fieldName] = filter.member.split('.')
        const cube = cubes.get(cubeName)
        if (!cube) continue

        const dimension = cube.dimensions?.[fieldName]
        if (!dimension) continue

        // For array operators, we need the raw column (not isolated SQL)
        // because Drizzle's array functions need column type metadata for proper encoding
        const isArrayOperator = ['arrayContains', 'arrayOverlaps', 'arrayContained'].includes(filter.operator)
        if (isArrayOperator) {
          // Skip caching array operator filters - they require special column handling
          // and will be built fresh each time to ensure proper array encoding
          continue
        }

        const fieldExpr = resolveFilterFieldExpr(dimension, context)
        const filterSQL = this.queryBuilder.buildFilterConditionPublic(
          fieldExpr,
          filter.operator,
          filter.values,
          dimension,
          filter.dateRange
        )

        if (filterSQL) {
          filterCache.set(key, filterSQL)
        }
      }

      // NOTE: We do NOT cache logical filters (AND/OR) because they can contain
      // mixed cube references. When some cubes are in CTEs, the cached version
      // would reference wrong table contexts. Individual simple filters within
      // logical filters are still cached for deduplication.
    }

    // Pre-build time dimension date range filters
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        if (timeDim.dateRange) {
          const key = getTimeDimensionFilterKey(timeDim.dimension, timeDim.dateRange)

          // Skip if already cached
          if (filterCache.has(key)) continue

          const [cubeName, fieldName] = timeDim.dimension.split('.')
          const cube = cubes.get(cubeName)
          if (!cube) continue

          const dimension = cube.dimensions?.[fieldName]
          if (!dimension) continue

          // Time dimension date ranges always use isolated SQL because
          // normalizeDate() returns ISO strings, not Date objects
          const fieldExpr = resolveSqlExpression(dimension.sql, context)
          const dateCondition = this.queryBuilder.buildDateRangeCondition(fieldExpr, timeDim.dateRange)

          if (dateCondition) {
            filterCache.set(key, dateCondition)
          }
        }
      }
    }
  }
}

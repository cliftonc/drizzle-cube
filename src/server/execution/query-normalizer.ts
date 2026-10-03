/**
 * Query normalisation applied before regular-query planning.
 *
 * Cube.js semantics: a timeDimension WITHOUT a granularity is a filter only —
 * its dateRange restricts the rows, but the dimension is neither selected nor
 * grouped by. Without this rewrite the planner grouped by the raw timestamp and
 * returned one row per instant instead of the requested totals.
 *
 * Ungrouped queries are left untouched: there a timeDimension without a
 * granularity selects the raw column value per row, which is what callers of
 * ungrouped (row-level) queries expect.
 */

import type { Filter, SemanticQuery, TimeDimension } from '../types/index.js'

/** Whether a timeDimension only restricts the date range (no granularity, no comparison). */
export function isFilterOnlyTimeDimension(timeDimension: TimeDimension): boolean {
  return !timeDimension.granularity && !(timeDimension.compareDateRange && timeDimension.compareDateRange.length > 0)
}

/**
 * Rewrite granularity-less timeDimensions into equivalent `inDateRange`
 * filters, dropping them from the selection. Returns the query unchanged when
 * there is nothing to rewrite.
 */
export function normalizeFilterOnlyTimeDimensions(query: SemanticQuery): SemanticQuery {
  if (query.ungrouped || !query.timeDimensions?.some(isFilterOnlyTimeDimension)) {
    return query
  }

  const kept = query.timeDimensions.filter(td => !isFilterOnlyTimeDimension(td))
  const dateFilters: Filter[] = query.timeDimensions
    .filter(isFilterOnlyTimeDimension)
    .flatMap((td): Filter[] => td.dateRange === undefined
      ? []
      : [{ member: td.dimension, operator: 'inDateRange', values: [], dateRange: td.dateRange }])

  return {
    ...query,
    timeDimensions: kept.length > 0 ? kept : undefined,
    filters: dateFilters.length > 0 ? [...(query.filters ?? []), ...dateFilters] : query.filters
  }
}

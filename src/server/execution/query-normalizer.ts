/**
 * Time dimension selection normalisation applied before regular-query planning.
 *
 * Cube.js semantics: a timeDimension WITHOUT a granularity is a filter only —
 * its dateRange restricts the rows, but the dimension is neither selected nor
 * grouped by. Without this rewrite the planner grouped by the raw timestamp and
 * returned one row per instant instead of the requested totals.
 *
 * A granular time dimension also replaces the same member in `dimensions`.
 * SELECT already reads that member through the bucket expression, so grouping
 * by the raw column too would split one bucket into many rows.
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
 * filters, and remove raw dimensions replaced by granular selections. Returns
 * the query unchanged when there is nothing to rewrite.
 */
export function normalizeTimeDimensions(query: SemanticQuery): SemanticQuery {
  if (query.ungrouped || !query.timeDimensions?.length) {
    return query
  }

  const filterOnly = query.timeDimensions.filter(isFilterOnlyTimeDimension)
  const kept = query.timeDimensions.filter(td => !isFilterOnlyTimeDimension(td))
  const grouped = new Set(kept.filter(td => td.granularity).map(td => td.dimension))
  const dimensions = query.dimensions?.filter(member => !grouped.has(member))
  if (!filterOnly.length && dimensions?.length === query.dimensions?.length) return query

  const dateFilters: Filter[] = filterOnly
    .flatMap((td): Filter[] => td.dateRange === undefined
      ? []
      : [{ member: td.dimension, operator: 'inDateRange', values: [], dateRange: td.dateRange }])

  return {
    ...query,
    dimensions,
    timeDimensions: kept.length > 0 ? kept : undefined,
    filters: dateFilters.length > 0 ? [...(query.filters ?? []), ...dateFilters] : query.filters
  }
}

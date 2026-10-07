/**
 * Query Building Utilities for AnalysisBuilder
 *
 * Functions for constructing CubeQuery objects from builder state.
 */

import type { CubeQuery, Filter } from '../../../types.js'
import type { MetricItem, BreakdownItem } from '../types.js'
import { removeComparisonDateFilter, buildCompareDateRangeFromFilter } from './filterUtils.js'
import { shouldIncludeFilter } from '../../../utils/filterUtils.js'

/**
 * Convert metrics and breakdowns to CubeQuery format
 * Handles comparison mode by building compareDateRange for time dimensions
 */
export function buildCubeQuery(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[],
  order?: Record<string, 'asc' | 'desc'>,
  preserveComparisonFilters: boolean = false,
  limit?: number,
  /**
   * Record-grain charts list rows rather than aggregates — see
   * `ChartTypeConfig.recordGrain`. Without this, editing a records-table
   * portlet in the builder silently rebuilds its query as a grouped one.
   *
   * The server rejects period comparison and date filling on an ungrouped
   * query, so it leaves both out and keeps the date filter. The breakdowns
   * keep both settings for when the chart switches back.
   */
  ungrouped: boolean = false,
  fillMissingDatesValue?: number | null
): CubeQuery {
  // Find time dimensions with comparison enabled
  const isComparing = (b: BreakdownItem) => b.isTimeDimension && b.enableComparison && !ungrouped
  const comparisonFields = breakdowns
    .filter(isComparing)
    .map((b) => b.field)

  // Remove date filters for comparison-enabled time dimensions
  // (compareDateRange will handle the date ranges instead)
  let filteredFilters = filters
  if (!preserveComparisonFilters) {
    for (const field of comparisonFields) {
      filteredFilters = removeComparisonDateFilter(filteredFilters, field)
    }
  }

  // Strip filters with empty values (e.g., {member: "X.id", values: [], operator: "equals"})
  // These generate AND FALSE conditions on the server
  filteredFilters = filteredFilters.filter(f => shouldIncludeFilter(f))

  const query: CubeQuery = {
    measures: metrics.map((m) => m.field),
    dimensions: breakdowns.filter((b) => !b.isTimeDimension).map((b) => b.field),
    timeDimensions: breakdowns
      .filter((b) => b.isTimeDimension)
      .map((b) => {
        const td: {
          dimension: string
          granularity: string
          compareDateRange?: [string, string][]
        } = {
          dimension: b.field,
          granularity: b.granularity || 'day',
          ...(b.fillMissingDates !== undefined && !ungrouped && { fillMissingDates: b.fillMissingDates })
        }

        // If comparison is enabled, build compareDateRange from the ORIGINAL filter
        if (isComparing(b)) {
          const compareDateRange = buildCompareDateRangeFromFilter(b.field, filters)
          if (compareDateRange) {
            td.compareDateRange = compareDateRange
          }
        }

        return td
      }),
    filters: filteredFilters.length > 0 ? filteredFilters : undefined,
    order: order && Object.keys(order).length > 0 ? order : undefined,
    limit: limit ?? undefined,
    // Set only when true: an explicit `false` is a distinct cache key from an
    // absent flag, and every other chart wants it absent.
    ungrouped: ungrouped || undefined,
    ...(fillMissingDatesValue !== undefined && { fillMissingDatesValue })
  }

  // Clean up empty arrays
  if (query.measures?.length === 0) delete query.measures
  if (query.dimensions?.length === 0) delete query.dimensions
  if (query.timeDimensions?.length === 0) delete query.timeDimensions

  return query
}

/**
 * Check if a query has any content
 */
export function hasQueryContent(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[]
): boolean {
  return metrics.length > 0 || breakdowns.length > 0 || filters.length > 0
}

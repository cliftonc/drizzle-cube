/**
 * Comparison date-range helpers for the AnalysisBuilder.
 *
 * Generic filter-tree operations (find a member's date filter, remove a filter
 * by member) live in the shared filter module. This file keeps only the
 * comparison-specific business logic (period-over-period range building).
 */

import type { Filter } from '../../../types.js'
import { parseDateRange, calculatePriorPeriod, formatDateForCube } from '../../../../shared/date-utils.js'
import { findDateFilterForField, removeFilterForMember } from '../../../shared/filters/index.js'

// Re-exported so existing imports via this module stay stable.
export { findDateFilterForField }

/**
 * Build compareDateRange for a time dimension based on its date filter
 * When comparison is enabled, returns [[currentStart, currentEnd], [priorStart, priorEnd]]
 */
export function buildCompareDateRangeFromFilter(
  timeDimensionField: string,
  filters: Filter[]
): [string, string][] | undefined {
  // Find the date filter for this time dimension
  const dateFilter = findDateFilterForField(filters, timeDimensionField)
  if (!dateFilter?.dateRange) return undefined

  // Parse the current range using shared utility
  const currentPeriod = parseDateRange(dateFilter.dateRange)
  if (!currentPeriod) return undefined

  // Calculate prior period using shared utility
  const priorPeriod = calculatePriorPeriod(currentPeriod.start, currentPeriod.end)

  return [
    [formatDateForCube(currentPeriod.start), formatDateForCube(currentPeriod.end)],
    [formatDateForCube(priorPeriod.start), formatDateForCube(priorPeriod.end)]
  ]
}

/**
 * Remove the inDateRange filter for a specific field from a filters array.
 * Returns a new array with the filter removed (immutable).
 */
export function removeComparisonDateFilter(filters: Filter[], field: string): Filter[] {
  return removeFilterForMember(filters, field, 'inDateRange')
}

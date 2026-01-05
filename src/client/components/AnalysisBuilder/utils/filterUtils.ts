/**
 * Filter Manipulation Utilities for AnalysisBuilder
 *
 * Functions for searching, modifying, and removing filters from filter arrays.
 * These handle both simple filters and nested group filters (AND/OR).
 */

import type { Filter } from '../../../types'
import { parseDateRange, calculatePriorPeriod, formatDateForCube } from '../../../../shared/date-utils'

/**
 * Find date filter for a specific time dimension field
 * Recursively searches filters (including nested and/or groups)
 * Handles both UI format ({type: 'and'/'or', filters: [...]}) and simple filters
 */
export function findDateFilterForField(
  filters: Filter[],
  field: string
): { dateRange: string | string[] } | undefined {
  for (const filter of filters) {
    // Check for UI GroupFilter format: {type: 'and'/'or', filters: [...]}
    if ('type' in filter && 'filters' in filter) {
      const groupFilter = filter as { type: 'and' | 'or'; filters: Filter[] }
      const nested = findDateFilterForField(groupFilter.filters, field)
      if (nested) return nested
    } else if ('member' in filter) {
      // Simple filter with member, operator, dateRange
      const simple = filter as { member: string; operator?: string; dateRange?: string | string[] }
      if (simple.member === field && simple.operator === 'inDateRange' && simple.dateRange) {
        return { dateRange: simple.dateRange }
      }
    }
  }
  return undefined
}

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
 * Remove date filter for a specific field from filters array
 * Returns a new array with the filter removed (immutable)
 */
export function removeComparisonDateFilter(filters: Filter[], field: string): Filter[] {
  return filters.reduce<Filter[]>((acc, filter) => {
    // Check for UI GroupFilter format: {type: 'and'/'or', filters: [...]}
    if ('type' in filter && 'filters' in filter) {
      const groupFilter = filter as { type: 'and' | 'or'; filters: Filter[] }
      const cleanedSubFilters = removeComparisonDateFilter(groupFilter.filters, field)
      // Only keep the group if it still has filters
      if (cleanedSubFilters.length > 0) {
        acc.push({ type: groupFilter.type, filters: cleanedSubFilters } as Filter)
      }
    } else if ('member' in filter) {
      // Simple filter - skip if it's the date filter for this field
      const simple = filter as { member: string; operator?: string; dateRange?: string | string[] }
      if (!(simple.member === field && simple.operator === 'inDateRange')) {
        acc.push(filter)
      }
    } else {
      acc.push(filter)
    }
    return acc
  }, [])
}

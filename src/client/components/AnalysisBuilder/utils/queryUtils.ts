/**
 * Query Building Utilities for AnalysisBuilder
 *
 * Functions for constructing CubeQuery objects from builder state.
 */

import type { CubeQuery, Filter } from '../../../types'
import type { MetricItem, BreakdownItem } from '../types'
import { removeComparisonDateFilter, buildCompareDateRangeFromFilter } from './filterUtils'

/**
 * Convert metrics and breakdowns to CubeQuery format
 * Handles comparison mode by building compareDateRange for time dimensions
 */
export function buildCubeQuery(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[],
  order?: Record<string, 'asc' | 'desc'>
): CubeQuery {
  // Find time dimensions with comparison enabled
  const comparisonFields = breakdowns
    .filter((b) => b.isTimeDimension && b.enableComparison)
    .map((b) => b.field)

  // Remove date filters for comparison-enabled time dimensions
  // (compareDateRange will handle the date ranges instead)
  let filteredFilters = filters
  for (const field of comparisonFields) {
    filteredFilters = removeComparisonDateFilter(filteredFilters, field)
  }

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
          granularity: b.granularity || 'day'
        }

        // If comparison is enabled, build compareDateRange from the ORIGINAL filter
        if (b.enableComparison) {
          const compareDateRange = buildCompareDateRangeFromFilter(b.field, filters)
          if (compareDateRange) {
            td.compareDateRange = compareDateRange
          }
        }

        return td
      }),
    filters: filteredFilters.length > 0 ? filteredFilters : undefined,
    order: order && Object.keys(order).length > 0 ? order : undefined
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

/**
 * Resolves the UI date-range state from a filter's stored `dateRange` value.
 * Extracted from FilterItem's sync effect to keep that effect flat.
 */

import type { DateRangeType } from '../types.js'
import { DATE_RANGE_OPTIONS } from '../types.js'
import { convertDateRangeTypeToValue, requiresNumberInput } from '../utils.js'

export interface ResolvedDateRangeState {
  rangeType: DateRangeType
  customDates?: { startDate: string; endDate: string }
  numberValue?: number
}

/** Resolve an array (custom) date range into UI state. */
function resolveArrayRange(dateRange: string[]): ResolvedDateRangeState {
  return {
    rangeType: 'custom',
    customDates: {
      startDate: dateRange[0] || '',
      endDate: dateRange[1] || dateRange[0] || ''
    }
  }
}

/** Resolve a "last N <unit>" string into UI state, or null if it doesn't match. */
function resolveFlexibleRange(dateRange: string): ResolvedDateRangeState | null {
  const match = dateRange.match(/^last (\d+) (days|weeks|months|quarters|years)$/)
  if (!match) return null

  const [, num, unit] = match
  return {
    rangeType: `last_n_${unit}` as DateRangeType,
    numberValue: parseInt(num) || 1
  }
}

/** Resolve a predefined range string into its DateRangeType, defaulting to custom. */
function resolvePredefinedRange(dateRange: string): ResolvedDateRangeState {
  const match = DATE_RANGE_OPTIONS.find(
    option =>
      option.value !== 'custom' &&
      !requiresNumberInput(option.value) &&
      convertDateRangeTypeToValue(option.value) === dateRange
  )
  return { rangeType: match ? match.value : 'custom' }
}

/**
 * Resolve the UI date-range state for a stored filter dateRange.
 * Returns null when there is nothing to sync.
 */
export function resolveDateRangeState(
  dateRange: string | string[] | undefined
): ResolvedDateRangeState | null {
  if (!dateRange) return null

  if (Array.isArray(dateRange)) {
    return resolveArrayRange(dateRange)
  }

  return resolveFlexibleRange(dateRange) ?? resolvePredefinedRange(dateRange)
}

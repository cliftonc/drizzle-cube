/**
 * dashboardFilterConfigModalUtils
 *
 * Pure helpers extracted from DashboardFilterConfigModal to keep the component's
 * effects and handlers flat. Behaviour is identical to the previous inline logic.
 */

import type { DateRangeType } from '../../shared/types'
import { DATE_RANGE_OPTIONS } from '../../shared/types'
import { convertDateRangeTypeToValue, requiresNumberInput } from '../../shared/utils'

export interface DerivedRange {
  rangeType: DateRangeType
  /** Present only when the range encodes an explicit "last N" count. */
  numberValue?: number
}

const SINGULAR_TO_PLURAL: Record<string, string> = {
  day: 'days',
  week: 'weeks',
  month: 'months',
  quarter: 'quarters',
  year: 'years'
}

/**
 * Resolve the rangeType (and optional numberValue) that corresponds to a
 * filter's stored `dateRange`. Returns `null` when there is nothing to derive.
 */
export function deriveRangeFromDateRange(
  dateRange: string | string[] | undefined
): DerivedRange | null {
  if (!dateRange) return null

  if (Array.isArray(dateRange)) {
    return { rangeType: 'custom' }
  }

  // Match "last N days/weeks/months/quarters/years"
  const flexMatch = dateRange.match(/^last (\d+) (days|weeks|months|quarters|years)$/)
  if (flexMatch) {
    const [, num, unit] = flexMatch
    return { rangeType: `last_n_${unit}` as DateRangeType, numberValue: parseInt(num) || 1 }
  }

  // Match singular forms: "last day/week/month/quarter/year" (when N=1)
  const singularMatch = dateRange.match(/^last (day|week|month|quarter|year)$/)
  if (singularMatch) {
    const [, unit] = singularMatch
    const pluralUnit = SINGULAR_TO_PLURAL[unit] ?? 'years'
    return { rangeType: `last_n_${pluralUnit}` as DateRangeType, numberValue: 1 }
  }

  // Check predefined ranges (only if not a "last N" pattern)
  for (const option of DATE_RANGE_OPTIONS) {
    if (option.value !== 'custom' && !requiresNumberInput(option.value)) {
      if (convertDateRangeTypeToValue(option.value) === dateRange) {
        return { rangeType: option.value }
      }
    }
  }

  return { rangeType: 'custom' }
}

/**
 * Compute the next filter `values` for a direct text/number input change.
 * Mirrors the previous inline `handleDirectInput` logic exactly:
 *  - For number-typed operators: keep numeric values, clear on empty/partial sign.
 *  - For everything else: store the raw string (or clear when empty).
 *
 * Returns `null` when the current values should be left untouched (e.g. an
 * unparseable number that is neither empty nor a lone "-").
 */
export function computeDirectInputValues(
  value: string,
  valueType: string | undefined
): unknown[] | null {
  if (valueType === 'number') {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      return [numValue]
    }
    if (value === '' || value === '-') {
      return []
    }
    return null
  }
  return value ? [value] : []
}

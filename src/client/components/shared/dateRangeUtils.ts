/**
 * Date-range utilities for the compact filter bar.
 *
 * Split out of `shared/utils.ts` by concern. Re-exported from there to keep
 * existing import paths stable.
 */

import { parseRelativeDateRange } from '../../../shared/date-utils.js'
import type { DateRangeType } from '../../shared/types.js'
import { DATE_RANGE_OPTIONS } from '../../shared/types.js'
import { convertDateRangeTypeToValue, requiresNumberInput } from '../../shared/utils.js'

/**
 * Date preset configuration for compact filter bar
 */
export interface DatePreset {
  id: string
  label: string
  value: string
}

export const DATE_PRESETS: DatePreset[] = [
  { id: 'today', label: 'Today', value: 'today' },
  { id: 'yesterday', label: 'Yesterday', value: 'yesterday' },
  { id: '7d', label: '7D', value: 'last 7 days' },
  { id: '30d', label: '30D', value: 'last 30 days' },
  { id: '3m', label: '3M', value: 'last 3 months' },
  { id: '6m', label: '6M', value: 'last 6 months' },
  { id: '12m', label: '12M', value: 'last 12 months' }
]

export const XTD_OPTIONS: DatePreset[] = [
  { id: 'wtd', label: 'Week to Date', value: 'this week' },
  { id: 'mtd', label: 'Month to Date', value: 'this month' },
  { id: 'qtd', label: 'Quarter to Date', value: 'this quarter' },
  { id: 'ytd', label: 'Year to Date', value: 'this year' }
]

type DateRange = { start: Date, end: Date }

/**
 * Calculate the same UTC boundaries used by the query parser.
 * @param preset - A relative date expression.
 * @returns The query boundaries, or null for an unknown expression.
 */
export function calculateDateRange(preset: string): DateRange | null {
  return parseRelativeDateRange(preset)
}

/**
 * Format UTC query dates without shifting their calendar days to local time.
 * @param start - The inclusive start of the query range.
 * @param end - The inclusive end of the query range.
 * @returns A compact UTC date label.
 */
export function formatDateRangeDisplay(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }

  const startStr = start.toLocaleDateString('en-US', options)
  const endStr = end.toLocaleDateString('en-US', options)

  // If same day, just show one date
  if (startStr === endStr) {
    return startStr
  }

  // If same year, omit year from start date
  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    const startNoYear: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
    return `${start.toLocaleDateString('en-US', startNoYear)} - ${endStr}`
  }

  return `${startStr} - ${endStr}`
}

/**
 * Detect preset ID from a date range value
 * Returns the preset ID (e.g., '7d', 'mtd') or 'custom' if not a preset
 */
export function detectPresetFromDateRange(dateRange: string | string[] | undefined): string | null {
  if (!dateRange) return null

  // Custom date range (array of dates)
  if (Array.isArray(dateRange)) {
    return 'custom'
  }

  const normalizedRange = dateRange.toLowerCase().trim()

  // Check regular + XTD presets
  const presetMatch = [...DATE_PRESETS, ...XTD_OPTIONS].find(
    preset => preset.value.toLowerCase() === normalizedRange
  )
  if (presetMatch) {
    return presetMatch.id
  }

  // Anything else (including dynamic "last N units") is treated as custom
  return 'custom'
}

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

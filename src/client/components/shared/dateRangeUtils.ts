/**
 * Date-range utilities for the compact filter bar.
 *
 * Split out of `shared/utils.ts` by concern. Re-exported from there to keep
 * existing import paths stable.
 */

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

/** Start of the current ISO week (Monday) relative to a normalised "today". */
function startOfWeek(today: Date): Date {
  const start = new Date(today)
  const dayOfWeek = start.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday as first day
  start.setDate(start.getDate() - diff)
  return start
}

/** Resolve the named/relative-to-now presets (today, this week, etc.). */
function resolveNamedPreset(preset: string, today: Date, endOfToday: Date): DateRange | null {
  switch (preset) {
    case 'today':
      return { start: today, end: endOfToday }
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const endOfYesterday = new Date(yesterday)
      endOfYesterday.setHours(23, 59, 59, 999)
      return { start: yesterday, end: endOfYesterday }
    }
    case 'this week':
      return { start: startOfWeek(today), end: endOfToday }
    case 'this month':
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: endOfToday }
    case 'this quarter': {
      const quarter = Math.floor(today.getMonth() / 3)
      return { start: new Date(today.getFullYear(), quarter * 3, 1), end: endOfToday }
    }
    case 'this year':
      return { start: new Date(today.getFullYear(), 0, 1), end: endOfToday }
    default:
      return null
  }
}

/** Resolve "last N <unit>" patterns. */
function resolveLastNUnits(preset: string, today: Date, endOfToday: Date): DateRange | null {
  const match = preset.match(/^last\s+(\d+)\s+(day|days|week|weeks|month|months|quarter|quarters|year|years)$/i)
  if (!match) return null

  const num = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()
  const startDate = new Date(today)

  if (unit === 'day' || unit === 'days') {
    startDate.setDate(startDate.getDate() - num + 1)
  } else if (unit === 'week' || unit === 'weeks') {
    startDate.setDate(startDate.getDate() - (num * 7) + 1)
  } else if (unit === 'month' || unit === 'months') {
    startDate.setMonth(startDate.getMonth() - num)
    startDate.setDate(startDate.getDate() + 1)
  } else if (unit === 'quarter' || unit === 'quarters') {
    startDate.setMonth(startDate.getMonth() - (num * 3))
    startDate.setDate(startDate.getDate() + 1)
  } else if (unit === 'year' || unit === 'years') {
    startDate.setFullYear(startDate.getFullYear() - num)
    startDate.setDate(startDate.getDate() + 1)
  }

  return { start: startDate, end: endOfToday }
}

/** Resolve "last <unit>" (no number) patterns. */
function resolveLastUnit(preset: string, today: Date): DateRange | null {
  const match = preset.match(/^last\s+(week|month|quarter|year)$/i)
  if (!match) return null

  const unit = match[1].toLowerCase()

  if (unit === 'week') {
    const endOfLastWeek = new Date(today)
    const dayOfWeek = endOfLastWeek.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    endOfLastWeek.setDate(endOfLastWeek.getDate() - diff - 1)
    endOfLastWeek.setHours(23, 59, 59, 999)

    const startOfLastWeek = new Date(endOfLastWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 6)
    startOfLastWeek.setHours(0, 0, 0, 0)

    return { start: startOfLastWeek, end: endOfLastWeek }
  }
  if (unit === 'month') {
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    endOfLastMonth.setHours(23, 59, 59, 999)
    return { start: startOfLastMonth, end: endOfLastMonth }
  }
  if (unit === 'quarter') {
    const currentQuarter = Math.floor(today.getMonth() / 3)
    const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
    const lastQuarterYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear()
    const startOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3, 1)
    const endOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3 + 3, 0)
    endOfLastQuarter.setHours(23, 59, 59, 999)
    return { start: startOfLastQuarter, end: endOfLastQuarter }
  }
  // year
  const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1)
  const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31)
  endOfLastYear.setHours(23, 59, 59, 999)
  return { start: startOfLastYear, end: endOfLastYear }
}

/**
 * Calculate actual date range from a preset string
 * Returns start and end dates for display purposes
 */
export function calculateDateRange(preset: string): DateRange | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endOfToday = new Date(today)
  endOfToday.setHours(23, 59, 59, 999)

  const normalized = preset.toLowerCase()

  return (
    resolveNamedPreset(normalized, today, endOfToday) ??
    resolveLastNUnits(preset, today, endOfToday) ??
    resolveLastUnit(preset, today)
  )
}

/**
 * Format a date range for display (e.g., "Jan 1, 2024 - Jan 31, 2024")
 */
export function formatDateRangeDisplay(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }

  const startStr = start.toLocaleDateString('en-US', options)
  const endStr = end.toLocaleDateString('en-US', options)

  // If same day, just show one date
  if (startStr === endStr) {
    return startStr
  }

  // If same year, omit year from start date
  if (start.getFullYear() === end.getFullYear()) {
    const startNoYear: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
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

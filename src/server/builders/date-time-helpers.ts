/**
 * Date/Time Helpers
 *
 * Pure, adapter-aware conversions shared by DateTimeBuilder. Extracted to
 * collapse the repeated "convert a Date to the engine's wire format" branch
 * and the relative-date-range parsing. Behaviour is byte-identical to the
 * original inline logic.
 */

import type { DatabaseAdapter } from '../adapters/base-adapter.js'
import { parseRelativeDateRange } from '../../shared/date-utils.js'

/**
 * Convert a millisecond epoch to the engine's wire format:
 * - SQLite: Unix seconds (integer)
 * - other integer-timestamp engines: Unix milliseconds (integer)
 * - PostgreSQL/MySQL: ISO string
 */
export function epochMsToEngineValue(
  databaseAdapter: DatabaseAdapter,
  timeMs: number
): string | number {
  if (databaseAdapter.isTimestampInteger()) {
    return databaseAdapter.getEngineType() === 'sqlite'
      ? Math.floor(timeMs / 1000)
      : timeMs
  }
  // PostgreSQL and MySQL need ISO strings, not Date objects
  return new Date(timeMs).toISOString()
}

/**
 * Convert a Date to the engine's wire format (see epochMsToEngineValue).
 */
export function dateToEngineValue(
  databaseAdapter: DatabaseAdapter,
  date: Date
): string | number {
  return epochMsToEngineValue(databaseAdapter, date.getTime())
}

/**
 * Reconstruct a Date from a normalized value (the output of normalizeDate):
 * a SQLite Unix-seconds integer, a millisecond integer, or an ISO string.
 */
export function engineValueToDate(
  databaseAdapter: DatabaseAdapter,
  value: string | number
): Date {
  return typeof value === 'number'
    ? new Date(value * (databaseAdapter.getEngineType() === 'sqlite' ? 1000 : 1))
    : new Date(value)
}

/** Detect a date-only string (YYYY-MM-DD). */
export function isDateOnlyString(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
}

/** Parse a string/number/Date into a validated Date, or null if invalid. */
function toValidDate(value: any): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'number') {
    // Reasonable Unix timestamp in seconds (10 digits) → ms, else assume ms
    const timestamp = value < 10000000000 ? value * 1000 : value
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string') {
    // Date-only string → parse as UTC midnight to avoid timezone/DST issues
    const parsed = isDateOnlyString(value)
      ? new Date(value + 'T00:00:00Z')
      : new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Normalize a date value to the engine's wire format, or null when falsy or
 * unparseable.
 */
export function normalizeDateValue(
  databaseAdapter: DatabaseAdapter,
  value: any
): string | number | null {
  if (!value) return null
  const date = toValidDate(value)
  if (!date) return null
  return dateToEngineValue(databaseAdapter, date)
}

/**
 * Parse relative date range expressions like "today", "yesterday",
 * "last 7 days", "this month", "next week", etc. Delegates to the shared parser
 * so the server, gap filler and client resolve the same strings identically.
 */
export function parseRelativeDateRangeValue(dateRange: string): { start: Date; end: Date } | null {
  return parseRelativeDateRange(dateRange)
}

/**
 * Whether a value parses as a single absolute date (string, number or Date) —
 * the same test `normalizeDateValue` applies before building SQL.
 */
export function isValidDateValue(value: unknown): boolean {
  return Boolean(value) && toValidDate(value) !== null
}

/**
 * Whether a date-range expression resolves to concrete bounds exactly as
 * `DateTimeBuilder.buildDateRangeCondition` would resolve it:
 * - a relative string ('last 7 days', 'this month', 'next week', ...)
 * - a single absolute date string (that whole day)
 * - a one-element array holding either of the above
 * - a `[start, end]` pair of absolute dates
 */
export function isResolvableDateRange(dateRange: unknown): boolean {
  if (typeof dateRange === 'string') {
    return parseRelativeDateRange(dateRange) !== null || isValidDateValue(dateRange)
  }
  if (!Array.isArray(dateRange)) return false
  if (dateRange.length === 1) return isResolvableDateRange(dateRange[0])
  return dateRange.length >= 2 && isValidDateValue(dateRange[0]) && isValidDateValue(dateRange[1])
}

/**
 * Date/Time Helpers
 *
 * Pure, adapter-aware conversions shared by DateTimeBuilder. Extracted to
 * collapse the repeated "convert a Date to the engine's wire format" branch
 * and the relative-date-range parsing. Behaviour is byte-identical to the
 * original inline logic.
 */

import type { DatabaseAdapter } from '../adapters/base-adapter'

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

type DateRange = { start: Date; end: Date }
type RelativeRangeHandler = (ctx: RelativeRangeContext) => DateRange

interface RelativeRangeContext {
  now: Date
  utcYear: number
  utcMonth: number
  utcDate: number
  utcDay: number
}

const startOfNow = (now: Date): Date => {
  const start = new Date(now)
  start.setUTCHours(0, 0, 0, 0)
  return start
}

const endOfNow = (now: Date): Date => {
  const end = new Date(now)
  end.setUTCHours(23, 59, 59, 999)
  return end
}

/** Fixed (non-parameterised) relative-range expressions. */
const FIXED_RANGES: Record<string, RelativeRangeHandler> = {
  today: ({ now }) => ({ start: startOfNow(now), end: endOfNow(now) }),

  yesterday: ({ now, utcDate }) => {
    const start = new Date(now)
    start.setUTCDate(utcDate - 1)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setUTCDate(utcDate - 1)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  },

  'this week': ({ now, utcDate, utcDay }) => {
    const mondayOffset = utcDay === 0 ? -6 : 1 - utcDay // If Sunday, go back 6 days, otherwise go to Monday
    const start = new Date(now)
    start.setUTCDate(utcDate + mondayOffset)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6) // Sunday
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  },

  'this month': ({ utcYear, utcMonth }) => ({
    start: new Date(Date.UTC(utcYear, utcMonth, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(utcYear, utcMonth + 1, 0, 23, 59, 59, 999))
  }),

  'this quarter': ({ utcYear, utcMonth }) => {
    const quarter = Math.floor(utcMonth / 3)
    return {
      start: new Date(Date.UTC(utcYear, quarter * 3, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(utcYear, quarter * 3 + 3, 0, 23, 59, 59, 999))
    }
  },

  'this year': ({ utcYear }) => ({
    start: new Date(Date.UTC(utcYear, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(utcYear, 11, 31, 23, 59, 59, 999))
  }),

  'last week': ({ now, utcDate, utcDay }) => {
    const lastMondayOffset = utcDay === 0 ? -13 : -6 - utcDay // Go to previous Monday
    const start = new Date(now)
    start.setUTCDate(utcDate + lastMondayOffset)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6) // Previous Sunday
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  },

  'last month': ({ utcYear, utcMonth }) => ({
    start: new Date(Date.UTC(utcYear, utcMonth - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(utcYear, utcMonth, 0, 23, 59, 59, 999))
  }),

  'last quarter': ({ utcYear, utcMonth }) => {
    const currentQuarter = Math.floor(utcMonth / 3)
    const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
    const year = currentQuarter === 0 ? utcYear - 1 : utcYear
    return {
      start: new Date(Date.UTC(year, lastQuarter * 3, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(year, lastQuarter * 3 + 3, 0, 23, 59, 59, 999))
    }
  },

  'last year': ({ utcYear }) => ({
    start: new Date(Date.UTC(utcYear - 1, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(utcYear - 1, 11, 31, 23, 59, 59, 999))
  }),

  'last 12 months': ({ now, utcYear, utcMonth }) => ({
    start: new Date(Date.UTC(utcYear, utcMonth - 11, 1, 0, 0, 0, 0)),
    end: endOfNow(now)
  })
}

/** Parameterised (regex-matched) relative-range expressions. */
const PATTERN_RANGES: Array<{
  re: RegExp
  build: (n: number, ctx: RelativeRangeContext) => DateRange
}> = [
  {
    re: /^last\s+(\d+)\s+days?$/,
    build: (days, { now, utcDate }) => {
      const start = new Date(now)
      start.setUTCDate(utcDate - days + 1) // Include today in the count
      start.setUTCHours(0, 0, 0, 0)
      return { start, end: endOfNow(now) }
    }
  },
  {
    re: /^last\s+(\d+)\s+weeks?$/,
    build: (weeks, { now, utcDate }) => {
      const start = new Date(now)
      start.setUTCDate(utcDate - weeks * 7 + 1) // Include today in the count
      start.setUTCHours(0, 0, 0, 0)
      return { start, end: endOfNow(now) }
    }
  },
  {
    re: /^last\s+(\d+)\s+months?$/,
    build: (months, { now, utcYear, utcMonth }) => ({
      start: new Date(Date.UTC(utcYear, utcMonth - months + 1, 1, 0, 0, 0, 0)),
      end: endOfNow(now)
    })
  },
  {
    re: /^last\s+(\d+)\s+years?$/,
    build: (years, { now, utcYear }) => ({
      start: new Date(Date.UTC(utcYear - years, 0, 1, 0, 0, 0, 0)),
      end: endOfNow(now)
    })
  }
]

/**
 * Parse relative date range expressions like "today", "yesterday",
 * "last 7 days", "this month", etc. Handles all 14 DATE_RANGE_OPTIONS.
 */
export function parseRelativeDateRangeValue(dateRange: string): DateRange | null {
  const now = new Date()
  const lowerRange = dateRange.toLowerCase().trim()

  const ctx: RelativeRangeContext = {
    now,
    utcYear: now.getUTCFullYear(),
    utcMonth: now.getUTCMonth(),
    utcDate: now.getUTCDate(),
    utcDay: now.getUTCDay()
  }

  const fixed = FIXED_RANGES[lowerRange]
  if (fixed) return fixed(ctx)

  for (const { re, build } of PATTERN_RANGES) {
    const match = lowerRange.match(re)
    if (match) return build(parseInt(match[1], 10), ctx)
  }

  return null
}

/**
 * Shared date range parsing utilities
 * Used by both server (DateTimeBuilder) and client (comparison feature)
 *
 * These utilities handle:
 * - Relative date range parsing (today, yesterday, last 7 days, this month, etc.)
 * - Prior period calculation for comparison features
 * - Date formatting for cube queries
 */

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
    // Like "last N months": includes the current quarter
    re: /^last\s+(\d+)\s+quarters?$/,
    build: (quarters, { now, utcYear, utcMonth }) => ({
      start: new Date(Date.UTC(utcYear, (Math.floor(utcMonth / 3) - quarters + 1) * 3, 1, 0, 0, 0, 0)),
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

/** First Monday of the week containing `now` (UTC), at midnight. */
const startOfWeek = ({ now, utcDate, utcDay }: RelativeRangeContext): Date => {
  const start = new Date(now)
  start.setUTCDate(utcDate + (utcDay === 0 ? -6 : 1 - utcDay))
  start.setUTCHours(0, 0, 0, 0)
  return start
}

/** Forward-looking ranges (Cube.js-compatible 'next ...' expressions). */
const FORWARD_RANGES: Record<string, RelativeRangeHandler> = {
  tomorrow: ({ now, utcDate }) => {
    const start = new Date(now)
    start.setUTCDate(utcDate + 1)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  },

  'next week': (ctx) => {
    const start = startOfWeek(ctx)
    start.setUTCDate(start.getUTCDate() + 7)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  },

  'next month': ({ utcYear, utcMonth }) => ({
    start: new Date(Date.UTC(utcYear, utcMonth + 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(utcYear, utcMonth + 2, 0, 23, 59, 59, 999))
  }),

  'next quarter': ({ utcYear, utcMonth }) => {
    const nextQuarterStartMonth = (Math.floor(utcMonth / 3) + 1) * 3
    return {
      start: new Date(Date.UTC(utcYear, nextQuarterStartMonth, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(utcYear, nextQuarterStartMonth + 3, 0, 23, 59, 59, 999))
    }
  },

  'next year': ({ utcYear }) => ({
    start: new Date(Date.UTC(utcYear + 1, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(utcYear + 1, 11, 31, 23, 59, 59, 999))
  })
}

/**
 * Parse relative date range expressions like "today", "yesterday", "last 7 days",
 * "this month", "next week", etc. Returns start/end dates in UTC, or null when
 * the string is not a recognised relative expression.
 *
 * Supported:
 * - today, yesterday, tomorrow
 * - this week/month/quarter/year
 * - last week/month/quarter/year, last 12 months
 * - next week/month/quarter/year
 * - last N days/weeks/months/quarters/years
 */
export function parseRelativeDateRange(dateRange: string): DateRange | null {
  const now = new Date()
  const lowerRange = dateRange.toLowerCase().trim()

  const ctx: RelativeRangeContext = {
    now,
    utcYear: now.getUTCFullYear(),
    utcMonth: now.getUTCMonth(),
    utcDate: now.getUTCDate(),
    utcDay: now.getUTCDay()
  }

  const fixed = Object.prototype.hasOwnProperty.call(FIXED_RANGES, lowerRange)
    ? FIXED_RANGES[lowerRange]
    : Object.prototype.hasOwnProperty.call(FORWARD_RANGES, lowerRange)
      ? FORWARD_RANGES[lowerRange]
      : undefined
  if (fixed) return fixed(ctx)

  for (const { re, build } of PATTERN_RANGES) {
    const match = lowerRange.match(re)
    if (match) return build(parseInt(match[1], 10), ctx)
  }

  return null
}

/**
 * Parse a date range (string or array) to start/end dates
 * Handles both relative date expressions and explicit date arrays
 */
export function parseDateRange(dateRange: string | string[]): { start: Date; end: Date } | null {
  if (Array.isArray(dateRange)) {
    if (dateRange.length < 2) return null
    const start = new Date(dateRange[0])
    const end = new Date(dateRange[1])
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
    // Normalize end to end of day
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }
  return parseRelativeDateRange(dateRange)
}

/**
 * Format date as YYYY-MM-DD for cube queries
 */
export function formatDateForCube(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Calculate the prior period (same length, immediately before the current period)
 *
 * Example:
 *   Current: Jan 1-7 (7 days)
 *   Prior: Dec 25-31 (7 days)
 */
export function calculatePriorPeriod(currentStart: Date, currentEnd: Date): { start: Date; end: Date } {
  // Calculate period length in days (inclusive of both start and end dates)
  const periodLengthMs = currentEnd.getTime() - currentStart.getTime()
  const periodLengthDays = Math.ceil(periodLengthMs / (1000 * 60 * 60 * 24))

  // Prior period ends the day before current period starts
  const priorEnd = new Date(currentStart)
  priorEnd.setUTCDate(priorEnd.getUTCDate() - 1)
  priorEnd.setUTCHours(23, 59, 59, 999)

  // Prior period starts (periodLengthDays - 1) days before priorEnd
  const priorStart = new Date(priorEnd)
  priorStart.setUTCDate(priorStart.getUTCDate() - periodLengthDays + 1)
  priorStart.setUTCHours(0, 0, 0, 0)

  return { start: priorStart, end: priorEnd }
}

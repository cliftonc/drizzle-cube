/**
 * Shared date range parsing utilities
 * Used by both server (DateTimeBuilder) and client (comparison feature)
 *
 * These utilities handle:
 * - Relative date range parsing (today, yesterday, last 7 days, this month, etc.)
 * - Prior period calculation for comparison features
 * - Date formatting for cube queries
 */

/**
 * Parse relative date range expressions like "today", "yesterday", "last 7 days", "this month", etc.
 * Returns start/end dates in UTC
 *
 * Handles all 14 DATE_RANGE_OPTIONS from the client:
 * - today, yesterday
 * - last 7 days, last 14 days, last 30 days
 * - last N days/weeks/months/years (legacy patterns)
 * - this week, last week
 * - this month, last month
 * - this quarter, last quarter
 * - this year, last year
 * - last 12 months
 */
export function parseRelativeDateRange(dateRange: string): { start: Date; end: Date } | null {
  const now = new Date()
  const lowerRange = dateRange.toLowerCase().trim()

  // Extract UTC date components for consistent calculations
  const utcYear = now.getUTCFullYear()
  const utcMonth = now.getUTCMonth()
  const utcDate = now.getUTCDate()
  const utcDay = now.getUTCDay()

  // Handle "today"
  if (lowerRange === 'today') {
    const start = new Date(now)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }

  // Handle "yesterday"
  if (lowerRange === 'yesterday') {
    const start = new Date(now)
    start.setUTCDate(utcDate - 1)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setUTCDate(utcDate - 1)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }

  // Handle "this week" (Monday to Sunday)
  if (lowerRange === 'this week') {
    const mondayOffset = utcDay === 0 ? -6 : 1 - utcDay // If Sunday, go back 6 days, otherwise go to Monday
    const start = new Date(now)
    start.setUTCDate(utcDate + mondayOffset)
    start.setUTCHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6) // Sunday
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }

  // Handle "this month"
  if (lowerRange === 'this month') {
    const start = new Date(Date.UTC(utcYear, utcMonth, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(utcYear, utcMonth + 1, 0, 23, 59, 59, 999))
    return { start, end }
  }

  // Handle "this quarter"
  if (lowerRange === 'this quarter') {
    const quarter = Math.floor(utcMonth / 3)
    const start = new Date(Date.UTC(utcYear, quarter * 3, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(utcYear, quarter * 3 + 3, 0, 23, 59, 59, 999))
    return { start, end }
  }

  // Handle "this year"
  if (lowerRange === 'this year') {
    const start = new Date(Date.UTC(utcYear, 0, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(utcYear, 11, 31, 23, 59, 59, 999))
    return { start, end }
  }

  // Handle "last N days" pattern
  const lastDaysMatch = lowerRange.match(/^last\s+(\d+)\s+days?$/)
  if (lastDaysMatch) {
    const days = parseInt(lastDaysMatch[1], 10)
    const start = new Date(now)
    start.setUTCDate(utcDate - days + 1) // Include today in the count
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }

  // Handle "last N weeks" pattern
  const lastWeeksMatch = lowerRange.match(/^last\s+(\d+)\s+weeks?$/)
  if (lastWeeksMatch) {
    const weeks = parseInt(lastWeeksMatch[1], 10)
    const days = weeks * 7
    const start = new Date(now)
    start.setUTCDate(utcDate - days + 1) // Include today in the count
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }

  // Handle "last week" (previous Monday to Sunday)
  if (lowerRange === 'last week') {
    const lastMondayOffset = utcDay === 0 ? -13 : -6 - utcDay // Go to previous Monday
    const start = new Date(now)
    start.setUTCDate(utcDate + lastMondayOffset)
    start.setUTCHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6) // Previous Sunday
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }

  // Handle "last month"
  if (lowerRange === 'last month') {
    const start = new Date(Date.UTC(utcYear, utcMonth - 1, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(utcYear, utcMonth, 0, 23, 59, 59, 999))
    return { start, end }
  }

  // Handle "last quarter"
  if (lowerRange === 'last quarter') {
    const currentQuarter = Math.floor(utcMonth / 3)
    const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
    const year = currentQuarter === 0 ? utcYear - 1 : utcYear
    const start = new Date(Date.UTC(year, lastQuarter * 3, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(year, lastQuarter * 3 + 3, 0, 23, 59, 59, 999))
    return { start, end }
  }

  // Handle "last year"
  if (lowerRange === 'last year') {
    const start = new Date(Date.UTC(utcYear - 1, 0, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(utcYear - 1, 11, 31, 23, 59, 59, 999))
    return { start, end }
  }

  // Handle "last 12 months" (rolling 12 months)
  if (lowerRange === 'last 12 months') {
    const start = new Date(Date.UTC(utcYear, utcMonth - 11, 1, 0, 0, 0, 0))
    const end = new Date(now)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }

  // Handle "last N months" pattern (legacy support)
  const lastMonthsMatch = lowerRange.match(/^last\s+(\d+)\s+months?$/)
  if (lastMonthsMatch) {
    const months = parseInt(lastMonthsMatch[1], 10)
    const start = new Date(Date.UTC(utcYear, utcMonth - months + 1, 1, 0, 0, 0, 0))
    const end = new Date(now)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
  }

  // Handle "last N years" pattern (legacy support)
  const lastYearsMatch = lowerRange.match(/^last\s+(\d+)\s+years?$/)
  if (lastYearsMatch) {
    const years = parseInt(lastYearsMatch[1], 10)
    const start = new Date(Date.UTC(utcYear - years, 0, 1, 0, 0, 0, 0))
    const end = new Date(now)
    end.setUTCHours(23, 59, 59, 999)
    return { start, end }
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

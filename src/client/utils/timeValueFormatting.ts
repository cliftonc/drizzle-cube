/**
 * Helpers for `formatTimeValue` — parsing timestamp strings and formatting
 * them by known or inferred granularity. Split out of chartUtils to keep
 * each unit small.
 */

/**
 * Components of a parsed UTC timestamp used for granularity formatting.
 */
export interface TimestampParts {
  date: Date
  year: number
  month: string
  day: string
  hours: number
  minutes: number
}

/**
 * Parse a timestamp string (ISO or PostgreSQL format) into UTC parts.
 * Returns null if the string isn't a recognizable timestamp or is invalid.
 */
export function parseTimestampParts(str: string): TimestampParts | null {
  // Handles formats like: "2025-04-01T00:00:00.000" or "2023-02-01 00:00:00+00"
  if (!str.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/)) {
    return null
  }

  // Convert PostgreSQL format to ISO format if needed
  let isoStr = str
  if (str.includes(' ')) {
    // Convert "2023-02-01 00:00:00+00" to "2023-02-01T00:00:00Z"
    isoStr = str.replace(' ', 'T').replace('+00', 'Z').replace(/\+\d{2}:\d{2}$/, 'Z')
  }
  // Ensure the timestamp ends with 'Z' if not present
  if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
    isoStr = isoStr + 'Z'
  }

  const date = new Date(isoStr)

  // Ensure we're working with valid date
  if (isNaN(date.getTime())) {
    return null
  }

  // Use UTC methods on the properly UTC-parsed date
  return {
    date,
    year: date.getUTCFullYear(),
    month: String(date.getUTCMonth() + 1).padStart(2, '0'),
    day: String(date.getUTCDate()).padStart(2, '0'),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
  }
}

/**
 * Format parsed timestamp parts using an explicit granularity.
 * Returns null for an unknown granularity so the caller can fall back to the
 * heuristic formatter.
 */
export function formatByGranularity(parts: TimestampParts, granularity: string): string | null {
  const { date, year, month, day, hours, minutes } = parts

  switch (granularity.toLowerCase()) {
    case 'year':
      return `${year}`
    case 'quarter': {
      const quarter = Math.floor(date.getUTCMonth() / 3) + 1
      return `${year}-Q${quarter}`
    }
    case 'month':
      return `${year}-${month}`
    case 'week':
      // For week, we could calculate week number, but let's use date for simplicity
      return `${year}-${month}-${day}`
    case 'day':
      return `${year}-${month}-${day}`
    case 'hour':
      return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:00`
    case 'minute':
      return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    default:
      // Unknown granularity, fall back to heuristic
      return null
  }
}

/**
 * Infer a display string for parsed timestamp parts when no explicit
 * granularity is known, based on which time components are non-zero.
 */
export function formatByHeuristic(parts: TimestampParts): string {
  const { date, year, month, day, hours, minutes } = parts
  const seconds = date.getUTCSeconds()
  const milliseconds = date.getUTCMilliseconds()
  const atMidnight = hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0

  // If it's the first day of the month at exactly midnight UTC, it's likely a month granularity
  if (day === '01' && atMidnight) {
    // Check if it's also first month of a quarter (quarter granularity)
    if (month === '01' || month === '04' || month === '07' || month === '10') {
      const quarter = Math.floor(date.getUTCMonth() / 3) + 1
      return `${year}-Q${quarter}`
    }
    // Month granularity
    return `${year}-${month}`
  }

  // If it's exactly midnight UTC, it's likely a day granularity
  if (atMidnight) {
    return `${year}-${month}-${day}`
  }

  // If it has time components, include them (hour/minute granularity)
  if (minutes === 0 && seconds === 0 && milliseconds === 0) {
    // Hour granularity
    return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:00`
  }

  // Full timestamp
  return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

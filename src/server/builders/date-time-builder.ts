/**
 * Date/Time Builder
 * Handles all date and time related SQL generation:
 * - Relative date range parsing (today, last 7 days, etc.)
 * - Date normalization across database engines
 * - Date range condition building
 * - Time dimension expression building with granularity
 */

import {
  sql,
  and,
  gte,
  lte,
  SQL,
  type AnyColumn
} from 'drizzle-orm'

import type { TimeGranularity, QueryContext } from '../types'
import { resolveSqlExpression } from '../cube-utils'
import type { DatabaseAdapter } from '../adapters/base-adapter'

export class DateTimeBuilder {
  constructor(private databaseAdapter: DatabaseAdapter) {}

  /**
   * Build time dimension expression with granularity using database adapter
   */
  buildTimeDimensionExpression(
    dimensionSql: any,
    granularity: string | undefined,
    context: QueryContext
  ): SQL {
    const baseExpr = resolveSqlExpression(dimensionSql, context)

    if (!granularity) {
      // Ensure we return SQL even when no granularity is applied
      return baseExpr instanceof SQL ? baseExpr : sql`${baseExpr}`
    }

    // Use database adapter for database-specific time dimension building
    return this.databaseAdapter.buildTimeDimension(granularity as TimeGranularity, baseExpr)
  }

  /**
   * Build date range condition for time dimensions
   */
  buildDateRangeCondition(
    fieldExpr: AnyColumn | SQL,
    dateRange: string | string[]
  ): SQL | null {
    if (!dateRange) return null

    // Handle array date range first
    if (Array.isArray(dateRange) && dateRange.length >= 2) {
      const startDate = this.normalizeDate(dateRange[0])
      let endDate = this.normalizeDate(dateRange[1])

      if (!startDate || !endDate) return null

      // For date-only strings, treat end date as end-of-day (23:59:59.999)
      // to include all records on that day
      if (typeof dateRange[1] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateRange[1].trim())) {
        const endDateObj = typeof endDate === 'number'
          ? new Date(endDate * (this.databaseAdapter.getEngineType() === 'sqlite' ? 1000 : 1))
          : new Date(endDate)
        const endOfDay = new Date(endDateObj)
        endOfDay.setUTCHours(23, 59, 59, 999)
        if (this.databaseAdapter.isTimestampInteger()) {
          endDate = this.databaseAdapter.getEngineType() === 'sqlite'
            ? Math.floor(endOfDay.getTime() / 1000)
            : endOfDay.getTime()
        } else {
          // PostgreSQL and MySQL need ISO strings
          endDate = endOfDay.toISOString()
        }
      }

      return and(
        gte(fieldExpr as AnyColumn, startDate),
        lte(fieldExpr as AnyColumn, endDate)
      ) as SQL
    }

    // Handle string date range
    if (typeof dateRange === 'string') {
      // Handle relative date expressions
      const relativeDates = this.parseRelativeDateRange(dateRange)
      if (relativeDates) {
        // Convert Date objects to appropriate format for the database
        let start: string | number
        let end: string | number

        if (this.databaseAdapter.isTimestampInteger()) {
          if (this.databaseAdapter.getEngineType() === 'sqlite') {
            start = Math.floor(relativeDates.start.getTime() / 1000)
            end = Math.floor(relativeDates.end.getTime() / 1000)
          } else {
            start = relativeDates.start.getTime()
            end = relativeDates.end.getTime()
          }
        } else {
          // PostgreSQL and MySQL need ISO strings
          start = relativeDates.start.toISOString()
          end = relativeDates.end.toISOString()
        }

        return and(
          gte(fieldExpr as AnyColumn, start),
          lte(fieldExpr as AnyColumn, end)
        ) as SQL
      }

      // Handle absolute date (single date)
      const normalizedDate = this.normalizeDate(dateRange)
      if (!normalizedDate) return null

      // For single date, create range for the whole day
      // normalizedDate might be a timestamp (number) or ISO string depending on database
      const dateObj = typeof normalizedDate === 'number'
        ? new Date(normalizedDate * (this.databaseAdapter.getEngineType() === 'sqlite' ? 1000 : 1))
        : new Date(normalizedDate)
      const startOfDay = new Date(dateObj)
      startOfDay.setUTCHours(0, 0, 0, 0)  // Ensure we start at midnight UTC
      const endOfDay = new Date(dateObj)
      endOfDay.setUTCHours(23, 59, 59, 999)  // Ensure we end at 11:59:59.999 UTC

      // Convert to appropriate format for the database
      let startValue: string | number
      let endValue: string | number

      if (this.databaseAdapter.isTimestampInteger()) {
        if (this.databaseAdapter.getEngineType() === 'sqlite') {
          startValue = Math.floor(startOfDay.getTime() / 1000)
          endValue = Math.floor(endOfDay.getTime() / 1000)
        } else {
          startValue = startOfDay.getTime()
          endValue = endOfDay.getTime()
        }
      } else {
        // PostgreSQL and MySQL need ISO strings
        startValue = startOfDay.toISOString()
        endValue = endOfDay.toISOString()
      }

      return and(
        gte(fieldExpr as AnyColumn, startValue),
        lte(fieldExpr as AnyColumn, endValue)
      ) as SQL
    }

    return null
  }

  /**
   * Parse relative date range expressions like "today", "yesterday", "last 7 days", "this month", etc.
   * Handles all 14 DATE_RANGE_OPTIONS from the client
   */
  parseRelativeDateRange(dateRange: string): { start: Date; end: Date } | null {
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
   * Normalize date values to handle strings, numbers, and Date objects
   * Returns ISO string for PostgreSQL/MySQL, Unix timestamp for SQLite, or null
   * Ensures dates are in the correct format for each database engine
   */
  normalizeDate(value: any): string | number | null {
    if (!value) return null

    // If it's already a Date object, validate and convert to appropriate format
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return null
      // Return timestamp for integer-based databases, ISO string for others
      // SQLite stores timestamps as Unix seconds (not milliseconds)
      if (this.databaseAdapter.isTimestampInteger()) {
        return this.databaseAdapter.getEngineType() === 'sqlite'
          ? Math.floor(value.getTime() / 1000)
          : value.getTime()
      }
      // PostgreSQL and MySQL need ISO strings, not Date objects
      return value.toISOString()
    }

    // If it's a number, assume it's a timestamp
    if (typeof value === 'number') {
      // If it's a reasonable Unix timestamp in seconds (10 digits), convert to milliseconds
      // Otherwise assume it's already in milliseconds
      const timestamp = value < 10000000000 ? value * 1000 : value
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return null
      // Return timestamp for integer-based databases, ISO string for others
      // SQLite stores timestamps as Unix seconds (not milliseconds)
      if (this.databaseAdapter.isTimestampInteger()) {
        return this.databaseAdapter.getEngineType() === 'sqlite'
          ? Math.floor(timestamp / 1000)
          : timestamp
      }
      // PostgreSQL and MySQL need ISO strings, not Date objects
      return date.toISOString()
    }

    // If it's a string, try to parse it as a Date
    if (typeof value === 'string') {
      // Check if it's a date-only string (YYYY-MM-DD format)
      // Parse as UTC midnight to avoid timezone/DST issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        const parsed = new Date(value + 'T00:00:00Z')
        if (isNaN(parsed.getTime())) return null
        // Return timestamp for integer-based databases, ISO string for others
        // SQLite stores timestamps as Unix seconds (not milliseconds)
        if (this.databaseAdapter.isTimestampInteger()) {
          return this.databaseAdapter.getEngineType() === 'sqlite'
            ? Math.floor(parsed.getTime() / 1000)
            : parsed.getTime()
        }
        // PostgreSQL and MySQL need ISO strings, not Date objects
        return parsed.toISOString()
      }

      // For other formats (with time components), use default parsing
      const parsed = new Date(value)
      if (isNaN(parsed.getTime())) return null
      // Return timestamp for integer-based databases, ISO string for others
      // SQLite stores timestamps as Unix seconds (not milliseconds)
      if (this.databaseAdapter.isTimestampInteger()) {
        return this.databaseAdapter.getEngineType() === 'sqlite'
          ? Math.floor(parsed.getTime() / 1000)
          : parsed.getTime()
      }
      // PostgreSQL and MySQL need ISO strings, not Date objects
      return parsed.toISOString()
    }

    // Try to parse any other type as date
    const parsed = new Date(value)
    if (isNaN(parsed.getTime())) return null
    // Return timestamp for integer-based databases, ISO string for others
    // SQLite stores timestamps as Unix seconds (not milliseconds)
    if (this.databaseAdapter.isTimestampInteger()) {
      return this.databaseAdapter.getEngineType() === 'sqlite'
        ? Math.floor(parsed.getTime() / 1000)
        : parsed.getTime()
    }
    // PostgreSQL and MySQL need ISO strings, not Date objects
    return parsed.toISOString()
  }
}

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

import type { TimeGranularity, QueryContext } from '../types/index.js'
import { resolveSqlExpression } from '../cube-utils.js'
import type { DatabaseAdapter } from '../adapters/base-adapter.js'
import {
  dateToEngineValue,
  engineValueToDate,
  isDateOnlyString,
  normalizeDateValue,
  parseRelativeDateRangeValue
} from './date-time-helpers.js'

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

    if (Array.isArray(dateRange)) {
      return this.buildArrayDateRangeCondition(fieldExpr, dateRange)
    }

    if (typeof dateRange === 'string') {
      return this.buildStringDateRangeCondition(fieldExpr, dateRange)
    }

    return null
  }

  private rangeBetween(
    fieldExpr: AnyColumn | SQL,
    start: string | number,
    end: string | number
  ): SQL {
    return and(
      gte(fieldExpr as AnyColumn, start),
      lte(fieldExpr as AnyColumn, end)
    ) as SQL
  }

  /** Shift a normalized end value to end-of-day when its source was a date-only string. */
  private endOfDayValue(endValue: string | number): string | number {
    const endOfDay = engineValueToDate(this.databaseAdapter, endValue)
    endOfDay.setUTCHours(23, 59, 59, 999)
    return dateToEngineValue(this.databaseAdapter, endOfDay)
  }

  private buildArrayDateRangeCondition(
    fieldExpr: AnyColumn | SQL,
    dateRange: string[]
  ): SQL | null {
    if (dateRange.length < 2) return null

    const startDate = this.normalizeDate(dateRange[0])
    let endDate = this.normalizeDate(dateRange[1])

    if (!startDate || !endDate) return null

    // For date-only strings, treat end date as end-of-day (23:59:59.999)
    // to include all records on that day
    if (isDateOnlyString(dateRange[1])) {
      endDate = this.endOfDayValue(endDate)
    }

    return this.rangeBetween(fieldExpr, startDate, endDate)
  }

  private buildStringDateRangeCondition(
    fieldExpr: AnyColumn | SQL,
    dateRange: string
  ): SQL | null {
    // Handle relative date expressions
    const relativeDates = this.parseRelativeDateRange(dateRange)
    if (relativeDates) {
      const start = dateToEngineValue(this.databaseAdapter, relativeDates.start)
      const end = dateToEngineValue(this.databaseAdapter, relativeDates.end)
      return this.rangeBetween(fieldExpr, start, end)
    }

    // Handle absolute date (single date)
    const normalizedDate = this.normalizeDate(dateRange)
    if (!normalizedDate) return null

    // For single date, create range for the whole day
    const dateObj = engineValueToDate(this.databaseAdapter, normalizedDate)
    const startOfDay = new Date(dateObj)
    startOfDay.setUTCHours(0, 0, 0, 0)  // Ensure we start at midnight UTC
    const endOfDay = new Date(dateObj)
    endOfDay.setUTCHours(23, 59, 59, 999)  // Ensure we end at 11:59:59.999 UTC

    return this.rangeBetween(
      fieldExpr,
      dateToEngineValue(this.databaseAdapter, startOfDay),
      dateToEngineValue(this.databaseAdapter, endOfDay)
    )
  }

  /**
   * Parse relative date range expressions like "today", "yesterday", "last 7 days", "this month", etc.
   * Handles all 14 DATE_RANGE_OPTIONS from the client
   */
  parseRelativeDateRange(dateRange: string): { start: Date; end: Date } | null {
    return parseRelativeDateRangeValue(dateRange)
  }

  /**
   * Normalize date values to handle strings, numbers, and Date objects
   * Returns ISO string for PostgreSQL/MySQL, Unix timestamp for SQLite, or null
   * Ensures dates are in the correct format for each database engine
   */
  normalizeDate(value: any): string | number | null {
    return normalizeDateValue(this.databaseAdapter, value)
  }
}

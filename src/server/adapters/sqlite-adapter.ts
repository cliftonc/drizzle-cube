/**
 * SQLite Database Adapter
 * Implements SQLite-specific SQL generation for time dimensions, string matching, and type casting
 * Supports local SQLite with better-sqlite3 driver
 *
 * SQLite is the biggest outlier: timestamps are stored as integer milliseconds, there is no
 * native ILIKE/STDDEV/VARIANCE, booleans are 1/0, and CASE WHEN must handle embedded SQL objects.
 * It therefore overrides more of BaseDatabaseAdapter's shared defaults than any other engine.
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types/index.js'
import { BaseDatabaseAdapter, type DatabaseCapabilities } from './base-adapter.js'

export class SQLiteAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'sqlite' {
    return 'sqlite'
  }

  // ============================================
  // Funnel Analysis Methods
  // ============================================

  /**
   * Build SQLite INTERVAL from ISO 8601 duration
   * SQLite doesn't have native interval types, so we convert to seconds
   * for arithmetic operations on Unix timestamps
   */
  buildIntervalFromISO(duration: string): SQL {
    const totalSeconds = this.durationToSeconds(duration)
    return sql`${totalSeconds}`
  }

  /**
   * Build SQLite time difference in seconds
   * SQLite timestamps are stored as Unix seconds, so simple subtraction works
   * Returns (end - start) as seconds
   */
  buildTimeDifferenceSeconds(end: SQL, start: SQL): SQL {
    return sql`(${end} - ${start})`
  }

  /**
   * Build SQLite timestamp + interval expression
   * Since SQLite stores timestamps as Unix seconds, just add the seconds
   */
  buildDateAddInterval(timestamp: SQL, duration: string): SQL {
    const totalSeconds = this.durationToSeconds(duration)
    return sql`(${timestamp} + ${totalSeconds})`
  }

  /**
   * Build SQLite date difference in periods
   * SQLite uses Julian day calculations for date arithmetic
   * Note: SQLite timestamps are stored as Unix seconds
   */
  buildDateDiffPeriods(startDate: SQL, endDate: SQL, unit: 'day' | 'week' | 'month'): SQL {
    switch (unit) {
      case 'day':
        // Calculate day difference using Julian day
        return sql`CAST((julianday(datetime(${endDate}, 'unixepoch')) - julianday(datetime(${startDate}, 'unixepoch'))) AS INTEGER)`
      case 'week':
        // Calculate week difference
        return sql`CAST((julianday(datetime(${endDate}, 'unixepoch')) - julianday(datetime(${startDate}, 'unixepoch'))) / 7 AS INTEGER)`
      case 'month':
        // Calculate month difference using string manipulation
        return sql`((CAST(strftime('%Y', datetime(${endDate}, 'unixepoch')) AS INTEGER) - CAST(strftime('%Y', datetime(${startDate}, 'unixepoch')) AS INTEGER)) * 12 + (CAST(strftime('%m', datetime(${endDate}, 'unixepoch')) AS INTEGER) - CAST(strftime('%m', datetime(${startDate}, 'unixepoch')) AS INTEGER)))`
      default:
        throw new Error(`Unsupported date diff unit for SQLite: ${unit}`)
    }
  }

  /**
   * Build SQLite period series using recursive CTE
   * SQLite 3.8.3+ supports recursive CTEs for generating sequences
   */
  buildPeriodSeriesSubquery(maxPeriod: number): SQL {
    return sql`(
      WITH RECURSIVE periods(period_number) AS (
        SELECT 0
        UNION ALL
        SELECT period_number + 1 FROM periods WHERE period_number < ${maxPeriod}
      )
      SELECT period_number FROM periods
    ) p`
  }

  /**
   * Build SQLite time dimension using date/datetime functions with modifiers
   * For integer timestamp columns (milliseconds), first convert to datetime
   * SQLite doesn't have DATE_TRUNC like PostgreSQL, so we use strftime and date modifiers
   * Returns datetime strings for consistency with other databases
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    // For SQLite with Drizzle's { mode: 'timestamp' }, timestamps are stored as Unix seconds
    // The datetime() function with 'unixepoch' expects seconds, so no conversion needed
    // For SQLite, we need to apply modifiers directly in the datetime conversion
    // to avoid nested datetime() calls which don't work properly

    switch (granularity) {
      case 'year':
        // Start of year: 2023-01-01 00:00:00
        return sql`datetime(${fieldExpr}, 'unixepoch', 'start of year')`
      case 'quarter': {
        // Calculate quarter start date using SQLite's date arithmetic
        // First convert to datetime, then calculate quarter
        const dateForQuarter = sql`datetime(${fieldExpr}, 'unixepoch')`
        return sql`datetime(${dateForQuarter}, 'start of year',
          '+' || (((CAST(strftime('%m', ${dateForQuarter}) AS INTEGER) - 1) / 3) * 3) || ' months')`
      }
      case 'month':
        // Start of month: 2023-05-01 00:00:00
        return sql`datetime(${fieldExpr}, 'unixepoch', 'start of month')`
      case 'week':
        // Start of week (Monday): Use SQLite's weekday modifier
        // weekday 1 = Monday, so go to Monday then back 6 days to get start of week
        return sql`date(datetime(${fieldExpr}, 'unixepoch'), 'weekday 1', '-6 days')`
      case 'day':
        // Start of day: 2023-05-15 00:00:00
        return sql`datetime(${fieldExpr}, 'unixepoch', 'start of day')`
      case 'hour': {
        // Truncate to hour: 2023-05-15 14:00:00
        const dateForHour = sql`datetime(${fieldExpr}, 'unixepoch')`
        return sql`datetime(strftime('%Y-%m-%d %H:00:00', ${dateForHour}))`
      }
      case 'minute': {
        // Truncate to minute: 2023-05-15 14:30:00
        const dateForMinute = sql`datetime(${fieldExpr}, 'unixepoch')`
        return sql`datetime(strftime('%Y-%m-%d %H:%M:00', ${dateForMinute}))`
      }
      case 'second': {
        // Already at second precision: 2023-05-15 14:30:25
        const dateForSecond = sql`datetime(${fieldExpr}, 'unixepoch')`
        return sql`datetime(strftime('%Y-%m-%d %H:%M:%S', ${dateForSecond}))`
      }
      default:
        // Fallback to converting the timestamp to datetime without truncation
        return sql`datetime(${fieldExpr}, 'unixepoch')`
    }
  }

  /**
   * SQLite has no ILIKE — use LOWER()+LIKE with the pattern lowercased in JS.
   */
  protected caseInsensitiveLike(fieldExpr: AnyColumn | SQL, pattern: string, negated: boolean): SQL {
    const lowered = pattern.toLowerCase()
    return negated
      ? sql`LOWER(${fieldExpr}) NOT LIKE ${lowered}`
      : sql`LOWER(${fieldExpr}) LIKE ${lowered}`
  }

  /**
   * SQLite regex requires loading an extension, so GLOB is used as a fallback.
   */
  protected regexCondition(fieldExpr: AnyColumn | SQL, value: string, negated: boolean): SQL {
    return negated
      ? sql`${fieldExpr} NOT GLOB ${value}`
      : sql`${fieldExpr} GLOB ${value}`
  }

  /**
   * Build SQLite type casting using CAST() function
   * SQLite has dynamic typing but supports CAST for consistency
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL {
    switch (targetType) {
      case 'timestamp':
        // For integer timestamp columns, convert to datetime
        // Assumes millisecond Unix timestamps
        return sql`datetime(${fieldExpr} / 1000, 'unixepoch')`
      case 'decimal':
        // Cast to REAL for decimal numbers
        return sql`CAST(${fieldExpr} AS REAL)`
      case 'integer':
        return sql`CAST(${fieldExpr} AS INTEGER)`
      default:
        throw new Error(`Unsupported cast type: ${targetType}`)
    }
  }

  /**
   * SQLite AVG uses IFNULL rather than COALESCE for null-to-zero handling.
   */
  protected nullToZero(expr: SQL): SQL {
    return sql`IFNULL(${expr}, 0)`
  }

  /**
   * Build SQLite CASE WHEN conditional expression.
   * Unlike the base implementation, SQLite must detect embedded SQL objects in THEN/ELSE
   * and inline them rather than binding them as parameters.
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL {
    // Check if 'then' values are SQL objects (they have queryChunks property)
    // If so, we need to treat them as SQL expressions, not bound parameters
    const cases = conditions.map(c => {
      // Check if it's a SQL object by checking for SQL-like properties
      const isSqlObject = c.then && typeof c.then === 'object' &&
                         (c.then.queryChunks || c.then._ || c.then.sql);

      if (isSqlObject) {
        // It's a SQL expression, embed it directly without parameterization
        return sql`WHEN ${c.when} THEN ${sql.raw('(') }${c.then}${sql.raw(')')}`
      } else {
        // It's a regular value, parameterize it
        return sql`WHEN ${c.when} THEN ${c.then}`
      }
    }).reduce((acc, curr) => sql`${acc} ${curr}`)

    if (elseValue !== undefined) {
      const isElseSqlObject = elseValue && typeof elseValue === 'object' &&
                              (elseValue.queryChunks || elseValue._ || elseValue.sql);
      if (isElseSqlObject) {
        return sql`CASE ${cases} ELSE ${sql.raw('(')}${elseValue}${sql.raw(')')} END`
      } else {
        return sql`CASE ${cases} ELSE ${elseValue} END`
      }
    }
    return sql`CASE ${cases} END`
  }

  /**
   * Build SQLite boolean literal
   * SQLite uses 1/0 for true/false
   */
  buildBooleanLiteral(value: boolean): SQL {
    return value ? sql`1` : sql`0`
  }

  /**
   * Preprocess calculated measure templates for SQLite-specific handling
   *
   * SQLite performs integer division by default (5/2 = 2 instead of 2.5).
   * This method wraps division operands with CAST to REAL to ensure float division.
   *
   * Pattern matched: {measure1} / {measure2} or {measure1} / NULLIF({measure2}, 0)
   * Transforms to: CAST({measure1} AS REAL) / ...
   *
   * @param calculatedSql - Template string with {member} references
   * @returns Preprocessed template with CAST for division operations
   */
  preprocessCalculatedTemplate(calculatedSql: string): string {
    // Guard against excessive input length to prevent ReDoS
    if (calculatedSql.length > 1000) return calculatedSql
    // Match division patterns: {anything} / {anything} or {anything} / NULLIF(...)
    // We need to cast the numerator to REAL to ensure float division
    // Pattern: captures the opening brace and content before division operator
    const divisionPattern = /(\{[^}]+\})\s*\/\s*/g

    return calculatedSql.replace(divisionPattern, (_match, numerator) => {
      // Replace {measure} with CAST({measure} AS REAL)
      const castNumerator = numerator.replace(/\{([^}]+)\}/, 'CAST({$1} AS REAL)')
      return `${castNumerator} / `
    })
  }

  /**
   * Convert filter values to SQLite-compatible types
   * SQLite doesn't support boolean types - convert boolean to integer (1/0)
   * Convert Date objects to milliseconds for integer timestamp columns
   */
  convertFilterValue(value: any): any {
    if (typeof value === 'boolean') {
      return value ? 1 : 0
    }
    if (value instanceof Date) {
      return value.getTime()
    }
    if (Array.isArray(value)) {
      return value.map(v => this.convertFilterValue(v))
    }
    // If it's already a number (likely already converted timestamp), return as-is
    if (typeof value === 'number') {
      return value
    }
    return value
  }

  /**
   * Prepare date value for SQLite integer timestamp storage
   * Convert Date objects to milliseconds (Unix timestamp * 1000)
   */
  prepareDateValue(date: Date): any {
    if (!(date instanceof Date)) {
      // prepareDateValue called with non-Date value
      // Try to handle it gracefully
      if (typeof date === 'number') return date
      if (typeof date === 'string') return new Date(date).getTime()
      throw new Error(`prepareDateValue expects a Date object, got ${typeof date}`)
    }
    return date.getTime()
  }

  /**
   * SQLite stores timestamps as integers (milliseconds)
   */
  isTimestampInteger(): boolean {
    return true
  }

  // ============================================
  // Statistical & Window Function Methods
  // ============================================

  /**
   * SQLite has limited statistical support (no native STDDEV/VARIANCE/PERCENTILE)
   * but supports window functions since SQLite 3.25
   */
  getCapabilities(): DatabaseCapabilities {
    return {
      supportsPercentile: false,  // Requires extension
      supportsLateralJoins: false, // SQLite does not support LATERAL
      supportsPercentileSubqueries: false, // No percentile support anyway
      supportsLateralSubqueriesInCTE: false // SQLite doesn't support LATERAL at all
    }
  }

  /**
   * SQLite does not have native STDDEV
   * Returns null for graceful degradation
   */
  buildStddev(_fieldExpr: AnyColumn | SQL, _useSample = false): SQL | null {
    // SQLite doesn't have native STDDEV functions
    // Return null to trigger graceful degradation
    return null
  }

  /**
   * SQLite does not have native VARIANCE
   * Returns null for graceful degradation
   */
  buildVariance(_fieldExpr: AnyColumn | SQL, _useSample = false): SQL | null {
    // SQLite doesn't have native VARIANCE functions
    // Return null to trigger graceful degradation
    return null
  }

  /**
   * SQLite does not have native PERCENTILE
   * Returns null for graceful degradation
   */
  buildPercentile(_fieldExpr: AnyColumn | SQL, _percentile: number): SQL | null {
    // SQLite doesn't have native PERCENTILE functions
    // Return null to trigger graceful degradation
    return null
  }
}

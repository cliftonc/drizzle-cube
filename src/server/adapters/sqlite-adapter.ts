/**
 * SQLite Database Adapter
 * Implements SQLite-specific SQL generation for time dimensions, string matching, and type casting
 * Supports local SQLite with better-sqlite3 driver
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter, type DatabaseCapabilities, type WindowFunctionType, type WindowFunctionConfig } from './base-adapter'

export class SQLiteAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'sqlite' {
    return 'sqlite'
  }

  /**
   * SQLite does not support LATERAL joins
   * Flow queries require LATERAL for efficient execution and are not supported on SQLite
   */
  supportsLateralJoins(): boolean {
    return false
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
   * Build SQLite conditional aggregation using CASE WHEN
   * SQLite doesn't support FILTER clause, so we use CASE WHEN pattern
   * Example: AVG(CASE WHEN step_1_time IS NOT NULL THEN time_diff END)
   */
  buildConditionalAggregation(
    aggFn: 'count' | 'avg' | 'min' | 'max' | 'sum',
    expr: SQL | null,
    condition: SQL
  ): SQL {
    const fnName = aggFn.toUpperCase()
    if (aggFn === 'count' && !expr) {
      // COUNT(*) with condition -> COUNT(CASE WHEN condition THEN 1 END)
      return sql`COUNT(CASE WHEN ${condition} THEN 1 END)`
    }
    // AVG/MIN/MAX/SUM -> AGG(CASE WHEN condition THEN expr END)
    return sql`${sql.raw(fnName)}(CASE WHEN ${condition} THEN ${expr} END)`
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
   * Build SQLite string matching conditions using LOWER() + LIKE for case-insensitive matching
   * SQLite LIKE is case-insensitive by default, but LOWER() ensures consistency
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex', value: string): SQL {
    switch (operator) {
      case 'contains':
        return sql`LOWER(${fieldExpr}) LIKE ${`%${value.toLowerCase()}%`}`
      case 'notContains':
        return sql`LOWER(${fieldExpr}) NOT LIKE ${`%${value.toLowerCase()}%`}`
      case 'startsWith':
        return sql`LOWER(${fieldExpr}) LIKE ${`${value.toLowerCase()}%`}`
      case 'endsWith':
        return sql`LOWER(${fieldExpr}) LIKE ${`%${value.toLowerCase()}`}`
      case 'like':
        return sql`${fieldExpr} LIKE ${value}`
      case 'notLike':
        return sql`${fieldExpr} NOT LIKE ${value}`
      case 'ilike':
        // SQLite doesn't have ILIKE, use LOWER() + LIKE for case-insensitive
        return sql`LOWER(${fieldExpr}) LIKE ${value.toLowerCase()}`
      case 'regex':
        // SQLite regex requires loading extension, use GLOB as fallback
        return sql`${fieldExpr} GLOB ${value}`
      case 'notRegex':
        // SQLite regex requires loading extension, use NOT GLOB as fallback
        return sql`${fieldExpr} NOT GLOB ${value}`
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
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
   * Build SQLite AVG aggregation with IFNULL for NULL handling
   * SQLite AVG returns NULL for empty sets, using IFNULL for consistency
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return sql`IFNULL(AVG(${fieldExpr}), 0)`
  }


  /**
   * Build SQLite CASE WHEN conditional expression
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

  /**
   * Convert SQLite time dimension results back to Date objects
   * SQLite time dimensions return datetime strings, but clients expect Date objects
   */
  convertTimeDimensionResult(value: any): any {
    return value
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
      supportsStddev: false,      // Requires extension
      supportsVariance: false,    // Requires extension
      supportsPercentile: false,  // Requires extension
      supportsWindowFunctions: true, // SQLite 3.25+
      supportsFrameClause: true,
      supportsLateralJoins: false, // SQLite does not support LATERAL
      supportsPercentileSubqueries: false // No percentile support anyway
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

  /**
   * Build SQLite window function expression
   * SQLite 3.25+ supports window functions
   */
  buildWindowFunction(
    type: WindowFunctionType,
    fieldExpr: AnyColumn | SQL | null,
    partitionBy?: (AnyColumn | SQL)[],
    orderBy?: Array<{ field: AnyColumn | SQL; direction: 'asc' | 'desc' }>,
    config?: WindowFunctionConfig
  ): SQL {
    // Build OVER clause components
    const partitionClause = partitionBy && partitionBy.length > 0
      ? sql`PARTITION BY ${sql.join(partitionBy, sql`, `)}`
      : sql``

    const orderClause = orderBy && orderBy.length > 0
      ? sql`ORDER BY ${sql.join(orderBy.map(o =>
          o.direction === 'desc' ? sql`${o.field} DESC` : sql`${o.field} ASC`
        ), sql`, `)}`
      : sql``

    // Build frame clause if specified
    let frameClause = sql``
    if (config?.frame) {
      const { type: frameType, start, end } = config.frame
      const frameTypeStr = frameType.toUpperCase()

      const startStr = start === 'unbounded' ? 'UNBOUNDED PRECEDING'
        : typeof start === 'number' ? `${start} PRECEDING`
        : 'CURRENT ROW'

      const endStr = end === 'unbounded' ? 'UNBOUNDED FOLLOWING'
        : end === 'current' ? 'CURRENT ROW'
        : typeof end === 'number' ? `${end} FOLLOWING`
        : 'CURRENT ROW'

      frameClause = sql`${sql.raw(frameTypeStr)} BETWEEN ${sql.raw(startStr)} AND ${sql.raw(endStr)}`
    }

    // Combine OVER clause
    const overParts: SQL[] = []
    if (partitionBy && partitionBy.length > 0) overParts.push(partitionClause)
    if (orderBy && orderBy.length > 0) overParts.push(orderClause)
    if (config?.frame) overParts.push(frameClause)

    const overContent = overParts.length > 0 ? sql.join(overParts, sql` `) : sql``
    const over = sql`OVER (${overContent})`

    // Build the window function based on type
    switch (type) {
      case 'lag':
        return sql`LAG(${fieldExpr}, ${config?.offset ?? 1}${config?.defaultValue !== undefined ? sql`, ${config.defaultValue}` : sql``}) ${over}`
      case 'lead':
        return sql`LEAD(${fieldExpr}, ${config?.offset ?? 1}${config?.defaultValue !== undefined ? sql`, ${config.defaultValue}` : sql``}) ${over}`
      case 'rank':
        return sql`RANK() ${over}`
      case 'denseRank':
        return sql`DENSE_RANK() ${over}`
      case 'rowNumber':
        return sql`ROW_NUMBER() ${over}`
      case 'ntile':
        return sql`NTILE(${config?.nTile ?? 4}) ${over}`
      case 'firstValue':
        return sql`FIRST_VALUE(${fieldExpr}) ${over}`
      case 'lastValue':
        return sql`LAST_VALUE(${fieldExpr}) ${over}`
      case 'movingAvg':
        return sql`AVG(${fieldExpr}) ${over}`
      case 'movingSum':
        return sql`SUM(${fieldExpr}) ${over}`
      default:
        throw new Error(`Unsupported window function: ${type}`)
    }
  }
}
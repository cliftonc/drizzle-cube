/**
 * SQLite Database Adapter
 * Implements SQLite-specific SQL generation for time dimensions, string matching, and type casting
 * Supports local SQLite with better-sqlite3 driver
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter } from './base-adapter'

export class SQLiteAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'sqlite' {
    return 'sqlite'
  }

  /**
   * Build SQLite time dimension using date/datetime functions with modifiers
   * For integer timestamp columns (milliseconds), first convert to datetime
   * SQLite doesn't have DATE_TRUNC like PostgreSQL, so we use strftime and date modifiers
   * Returns datetime strings for consistency with other databases
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    // For SQLite, we need to apply modifiers directly in the datetime conversion
    // to avoid nested datetime() calls which don't work properly
    
    switch (granularity) {
      case 'year':
        // Start of year: 2023-01-01 00:00:00
        return sql`datetime(${fieldExpr}, 'unixepoch', 'start of year')`
      case 'quarter':
        // Calculate quarter start date using SQLite's date arithmetic
        // First convert to datetime, then calculate quarter
        const dateForQuarter = sql`datetime(${fieldExpr}, 'unixepoch')`
        return sql`datetime(${dateForQuarter}, 'start of year', 
          '+' || (((CAST(strftime('%m', ${dateForQuarter}) AS INTEGER) - 1) / 3) * 3) || ' months')`
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
      case 'hour':
        // Truncate to hour: 2023-05-15 14:00:00
        const dateForHour = sql`datetime(${fieldExpr}, 'unixepoch')`
        return sql`datetime(strftime('%Y-%m-%d %H:00:00', ${dateForHour}))`
      case 'minute':
        // Truncate to minute: 2023-05-15 14:30:00
        const dateForMinute = sql`datetime(${fieldExpr}, 'unixepoch')`
        return sql`datetime(strftime('%Y-%m-%d %H:%M:00', ${dateForMinute}))`
      case 'second':
        // Already at second precision: 2023-05-15 14:30:25
        const dateForSecond = sql`datetime(${fieldExpr}, 'unixepoch')`
        return sql`datetime(strftime('%Y-%m-%d %H:%M:%S', ${dateForSecond}))`
      default:
        // Fallback to converting the timestamp to datetime without truncation
        return sql`datetime(${fieldExpr}, 'unixepoch')`
    }
  }

  /**
   * Build SQLite string matching conditions using LOWER() + LIKE for case-insensitive matching
   * SQLite LIKE is case-insensitive by default, but LOWER() ensures consistency
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith', value: string): SQL {
    const pattern = this.buildPattern(operator, value.toLowerCase())

    switch (operator) {
      case 'contains':
        return sql`LOWER(${fieldExpr}) LIKE ${pattern}`
      case 'notContains':
        return sql`LOWER(${fieldExpr}) NOT LIKE ${pattern}`
      case 'startsWith':
        return sql`LOWER(${fieldExpr}) LIKE ${pattern}`
      case 'endsWith':
        return sql`LOWER(${fieldExpr}) LIKE ${pattern}`
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
      console.error('prepareDateValue called with non-Date value:', date, typeof date)
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
}
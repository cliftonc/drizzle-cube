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
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    // Convert integer timestamp (milliseconds) to datetime
    // The SQLite schema uses integer timestamps in milliseconds
    const dateExpr = sql`datetime(${fieldExpr} / 1000, 'unixepoch')`
    
    switch (granularity) {
      case 'year':
        // Start of year: 2023-01-01 00:00:00
        return sql`datetime(${dateExpr}, 'start of year')`
      case 'quarter':
        // Calculate quarter start date using complex SQLite logic
        // Get year, calculate quarter number, then create start date
        return sql`datetime(${dateExpr}, 'start of year', 
          '+' || ((CAST((strftime('%m', ${dateExpr}) - 1) AS INTEGER) / 3) * 3) || ' months')`
      case 'month':
        // Start of month: 2023-05-01 00:00:00
        return sql`datetime(${dateExpr}, 'start of month')`
      case 'week':
        // Start of week (Monday): SQLite considers Sunday as 0, Monday as 1
        // We want Monday-based weeks, so we adjust accordingly
        return sql`date(${dateExpr}, 'weekday 1', '-6 days')`
      case 'day':
        // Start of day: 2023-05-15 00:00:00
        return sql`datetime(${dateExpr}, 'start of day')`
      case 'hour':
        // Truncate to hour: 2023-05-15 14:00:00
        return sql`datetime(strftime('%Y-%m-%d %H:00:00', ${dateExpr}))`
      case 'minute':
        // Truncate to minute: 2023-05-15 14:30:00
        return sql`datetime(strftime('%Y-%m-%d %H:%M:00', ${dateExpr}))`
      case 'second':
        // Already at second precision: 2023-05-15 14:30:25
        return sql`datetime(strftime('%Y-%m-%d %H:%M:%S', ${dateExpr}))`
      default:
        // Fallback to the original expression if granularity is not recognized
        return fieldExpr as SQL
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
    const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)
    
    if (elseValue !== undefined) {
      return sql`CASE ${cases} ELSE ${elseValue} END`
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
   * Leave Date objects as-is - Drizzle ORM handles timestamp conversion automatically
   */
  convertFilterValue(value: any): any {
    if (typeof value === 'boolean') {
      return value ? 1 : 0
    }
    return value
  }
}
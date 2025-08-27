/**
 * MySQL Database Adapter  
 * Implements MySQL-specific SQL generation for time dimensions, string matching, and type casting
 * Provides MySQL equivalents to PostgreSQL functions
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'
import { BaseDatabaseAdapter } from './base-adapter'

export class MySQLAdapter extends BaseDatabaseAdapter {
  getEngineType(): 'mysql' {
    return 'mysql'
  }

  /**
   * Build MySQL time dimension using DATE_FORMAT function
   * MySQL equivalent to PostgreSQL's DATE_TRUNC
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL {
    // MySQL uses DATE_FORMAT with specific format strings for truncation
    const formatMap: Record<TimeGranularity, string> = {
      year: '%Y-01-01 00:00:00',
      quarter: '%Y-%q-01 00:00:00', // %q gives quarter (1,2,3,4), but we need to map this properly
      month: '%Y-%m-01 00:00:00', 
      week: '%Y-%u-01 00:00:00', // %u gives week of year
      day: '%Y-%m-%d 00:00:00',
      hour: '%Y-%m-%d %H:00:00',
      minute: '%Y-%m-%d %H:%i:00',
      second: '%Y-%m-%d %H:%i:%s'
    }

    // Special handling for quarter and week since MySQL doesn't have direct equivalents to PostgreSQL
    switch (granularity) {
      case 'quarter':
        // Calculate quarter start date using QUARTER() function
        return sql`DATE_ADD(MAKEDATE(YEAR(${fieldExpr}), 1), INTERVAL (QUARTER(${fieldExpr}) - 1) * 3 MONTH)`
      case 'week':
        // Get start of week (Monday) using MySQL's week functions
        return sql`DATE_SUB(${fieldExpr}, INTERVAL WEEKDAY(${fieldExpr}) DAY)`
      default:
        const format = formatMap[granularity]
        if (!format) {
          // Fallback to original expression if granularity not recognized
          return fieldExpr as SQL
        }
        return sql`STR_TO_DATE(DATE_FORMAT(${fieldExpr}, ${format}), '%Y-%m-%d %H:%i:%s')`
    }
  }

  /**
   * Build MySQL string matching conditions using LIKE
   * MySQL LIKE is case-insensitive by default (depending on collation)
   * For guaranteed case-insensitive matching, we use LOWER() functions
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
        // MySQL doesn't have ILIKE, use LOWER() + LIKE for case-insensitive
        return sql`LOWER(${fieldExpr}) LIKE ${value.toLowerCase()}`
      case 'regex':
        return sql`${fieldExpr} REGEXP ${value}`
      case 'notRegex':
        return sql`${fieldExpr} NOT REGEXP ${value}`
      default:
        throw new Error(`Unsupported string operator: ${operator}`)
    }
  }

  /**
   * Build MySQL type casting using CAST() function
   * MySQL equivalent to PostgreSQL's :: casting syntax
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL {
    switch (targetType) {
      case 'timestamp':
        return sql`CAST(${fieldExpr} AS DATETIME)`
      case 'decimal':
        return sql`CAST(${fieldExpr} AS DECIMAL(10,2))`
      case 'integer':
        return sql`CAST(${fieldExpr} AS SIGNED INTEGER)`
      default:
        throw new Error(`Unsupported cast type: ${targetType}`)
    }
  }


  /**
   * Build MySQL AVG aggregation with IFNULL for NULL handling
   * MySQL AVG returns NULL for empty sets, using IFNULL for consistency
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL {
    return sql`IFNULL(AVG(${fieldExpr}), 0)`
  }


  /**
   * Build MySQL CASE WHEN conditional expression
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL {
    const cases = conditions.map(c => sql`WHEN ${c.when} THEN ${c.then}`).reduce((acc, curr) => sql`${acc} ${curr}`)
    
    if (elseValue !== undefined) {
      return sql`CASE ${cases} ELSE ${elseValue} END`
    }
    return sql`CASE ${cases} END`
  }

  /**
   * Build MySQL boolean literal
   * MySQL uses TRUE/FALSE keywords (equivalent to 1/0)
   */
  buildBooleanLiteral(value: boolean): SQL {
    return value ? sql`TRUE` : sql`FALSE`
  }

  /**
   * Convert filter values - MySQL uses native types
   * No conversion needed for MySQL
   */
  convertFilterValue(value: any): any {
    return value
  }

  /**
   * Prepare date value for MySQL
   * MySQL accepts Date objects directly
   */
  prepareDateValue(date: Date): any {
    return date
  }

  /**
   * MySQL stores timestamps as native timestamp types
   */
  isTimestampInteger(): boolean {
    return false
  }

  /**
   * MySQL time dimensions already return proper values
   * No conversion needed
   */
  convertTimeDimensionResult(value: any): any {
    return value
  }

}
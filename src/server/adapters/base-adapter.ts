/**
 * Base Database Adapter Interface
 * Defines the contract for database-specific SQL generation
 * Each database adapter must implement these methods to handle SQL dialect differences
 */

import type { SQL, AnyColumn } from 'drizzle-orm'
import type { TimeGranularity } from '../types'

export interface DatabaseAdapter {
  /**
   * Get the database engine type this adapter supports
   */
  getEngineType(): 'postgres' | 'mysql' | 'sqlite'

  /**
   * Build time dimension expression with granularity truncation
   * @param granularity - Time granularity (day, month, year, etc.)
   * @param fieldExpr - The date/timestamp field expression
   * @returns SQL expression for truncated time dimension
   */
  buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build string matching condition
   * @param fieldExpr - The field to search in
   * @param operator - The string matching operator
   * @param value - The value to match
   * @returns SQL expression for string matching
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex', value: string): SQL

  /**
   * Cast expression to specific database type
   * @param fieldExpr - The field expression to cast
   * @param targetType - Target database type
   * @returns SQL expression with type casting
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL

  /**
   * Build AVG aggregation expression with database-specific null handling
   * @param fieldExpr - The field expression to average
   * @returns SQL expression for AVG aggregation (COALESCE vs IFNULL for null handling)
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build CASE WHEN conditional expression
   * @param conditions - Array of condition/result pairs
   * @param elseValue - Optional ELSE clause value
   * @returns SQL expression for CASE WHEN statement
   */
  buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL

  /**
   * Build boolean literal expression
   * @param value - Boolean value to represent
   * @returns SQL expression for boolean literal (TRUE/FALSE/1/0 depending on database)
   */
  buildBooleanLiteral(value: boolean): SQL

  /**
   * Convert filter values to database-compatible types
   * @param value - The filter value to convert
   * @returns Converted value for database queries
   */
  convertFilterValue(value: any): any

  /**
   * Prepare date value for database-specific storage format
   * @param date - Date value to prepare
   * @returns Database-compatible date representation
   */
  prepareDateValue(date: Date): any

  /**
   * Check if this database stores timestamps as integers
   * @returns True if timestamps are stored as integers (milliseconds), false for native timestamps
   */
  isTimestampInteger(): boolean

  /**
   * Convert time dimension result values back to Date objects for consistency
   * @param value - The time dimension value from query results
   * @returns Date object or original value if not a time dimension
   */
  convertTimeDimensionResult(value: any): any
}

/**
 * Abstract base class for database adapters
 * Provides common functionality that can be shared across database implementations
 */
export abstract class BaseDatabaseAdapter implements DatabaseAdapter {
  abstract getEngineType(): 'postgres' | 'mysql' | 'sqlite'
  abstract buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL
  abstract buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'like' | 'notLike' | 'ilike' | 'regex' | 'notRegex', value: string): SQL
  abstract castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL
  abstract buildAvg(fieldExpr: AnyColumn | SQL): SQL
  abstract buildCaseWhen(conditions: Array<{ when: SQL; then: any }>, elseValue?: any): SQL
  abstract buildBooleanLiteral(value: boolean): SQL
  abstract convertFilterValue(value: any): any
  abstract prepareDateValue(date: Date): any
  abstract isTimestampInteger(): boolean
  abstract convertTimeDimensionResult(value: any): any

  /**
   * Helper method to build pattern for string matching
   * Can be overridden by specific adapters if needed
   */
  protected buildPattern(operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith', value: string): string {
    switch (operator) {
      case 'contains':
      case 'notContains':
        return `%${value}%`
      case 'startsWith':
        return `${value}%`
      case 'endsWith':
        return `%${value}`
      default:
        return value
    }
  }
}
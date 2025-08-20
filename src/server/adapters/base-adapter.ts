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
   * Build case-insensitive string matching condition
   * @param fieldExpr - The field to search in
   * @param operator - The string matching operator
   * @param value - The value to match
   * @returns SQL expression for string matching
   */
  buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith', value: string): SQL

  /**
   * Cast expression to specific database type
   * @param fieldExpr - The field expression to cast
   * @param targetType - Target database type
   * @returns SQL expression with type casting
   */
  castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL

  /**
   * Build COUNT aggregation expression
   * @param fieldExpr - The field expression to count
   * @returns SQL expression for COUNT aggregation
   */
  buildCount(fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build COUNT DISTINCT aggregation expression
   * @param fieldExpr - The field expression to count distinct values
   * @returns SQL expression for COUNT DISTINCT aggregation
   */
  buildCountDistinct(fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build SUM aggregation expression
   * @param fieldExpr - The field expression to sum
   * @returns SQL expression for SUM aggregation
   */
  buildSum(fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build AVG aggregation expression
   * @param fieldExpr - The field expression to average
   * @returns SQL expression for AVG aggregation
   */
  buildAvg(fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build MIN aggregation expression
   * @param fieldExpr - The field expression to find minimum
   * @returns SQL expression for MIN aggregation
   */
  buildMin(fieldExpr: AnyColumn | SQL): SQL

  /**
   * Build MAX aggregation expression
   * @param fieldExpr - The field expression to find maximum
   * @returns SQL expression for MAX aggregation
   */
  buildMax(fieldExpr: AnyColumn | SQL): SQL
}

/**
 * Abstract base class for database adapters
 * Provides common functionality that can be shared across database implementations
 */
export abstract class BaseDatabaseAdapter implements DatabaseAdapter {
  abstract getEngineType(): 'postgres' | 'mysql' | 'sqlite'
  abstract buildTimeDimension(granularity: TimeGranularity, fieldExpr: AnyColumn | SQL): SQL
  abstract buildStringCondition(fieldExpr: AnyColumn | SQL, operator: 'contains' | 'notContains' | 'startsWith' | 'endsWith', value: string): SQL
  abstract castToType(fieldExpr: AnyColumn | SQL, targetType: 'timestamp' | 'decimal' | 'integer'): SQL
  abstract buildCount(fieldExpr: AnyColumn | SQL): SQL
  abstract buildCountDistinct(fieldExpr: AnyColumn | SQL): SQL
  abstract buildSum(fieldExpr: AnyColumn | SQL): SQL
  abstract buildAvg(fieldExpr: AnyColumn | SQL): SQL
  abstract buildMin(fieldExpr: AnyColumn | SQL): SQL
  abstract buildMax(fieldExpr: AnyColumn | SQL): SQL

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
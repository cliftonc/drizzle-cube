/**
 * MySQL database executor
 * Works with mysql2 driver
 */

import type { SQL } from 'drizzle-orm'
import type { DrizzleDatabase } from '../types'
import { BaseDatabaseExecutor } from './base-executor'

export class MySQLExecutor extends BaseDatabaseExecutor {
  async execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T> {
    // Handle Drizzle query objects directly
    if (query && typeof query === 'object' && typeof query.execute === 'function') {
      // This is a Drizzle query object, execute it directly
      const result = await query.execute()
      if (Array.isArray(result)) {
        return result.map(row => this.convertNumericFields(row, numericFields)) as T
      }
      return result as T
    }
    
    if (!this.db.execute) {
      throw new Error('MySQL database instance must have an execute method')
    }
    const result = await this.db.execute(query)
    if (Array.isArray(result)) {
      return result.map(row => this.convertNumericFields(row, numericFields)) as T
    }
    return result as T
  }

  /**
   * Convert numeric string fields to numbers (measure fields + numeric dimensions)
   */
  private convertNumericFields(row: any, numericFields?: string[]): any {
    if (!row || typeof row !== 'object') return row
    
    const converted: any = {}
    for (const [key, value] of Object.entries(row)) {
      // Only convert specified numeric fields (measures + numeric dimensions)
      // Other dimensions and time dimensions keep their original types
      if (numericFields && numericFields.includes(key)) {
        converted[key] = this.coerceToNumber(value)
      } else {
        converted[key] = value
      }
    }
    return converted
  }

  /**
   * Coerce a value to a number if it represents a numeric type
   */
  private coerceToNumber(value: any): any {
    // Handle null/undefined - preserve null values for aggregations
    if (value == null) return value
    
    // Already a number
    if (typeof value === 'number') return value
    
    // Handle string representations of numbers
    if (typeof value === 'string') {
      // Check for exact numeric strings
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return value.includes('.') ? parseFloat(value) : parseInt(value, 10)
      }
      
      // Check for other numeric formats (scientific notation, etc.)
      if (!isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
        return parseFloat(value)
      }
    }
    
    // Return as-is for non-numeric values
    return value
  }

  getEngineType(): 'mysql' {
    return 'mysql'
  }
}

/**
 * Factory function for creating MySQL executors
 */
export function createMySQLExecutor(
  db: DrizzleDatabase,
  schema?: any
): MySQLExecutor {
  return new MySQLExecutor(db, schema, 'mysql')
}
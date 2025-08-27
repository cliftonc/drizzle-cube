/**
 * SQLite database executor  
 * Works with better-sqlite3 driver
 */

import type { SQL } from 'drizzle-orm'
import type { DrizzleDatabase } from '../types'
import { BaseDatabaseExecutor } from './base-executor'

export class SQLiteExecutor extends BaseDatabaseExecutor {
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
    
    // SQLite is synchronous, but we wrap in Promise for consistency
    try {
      // For SQLite with better-sqlite3, we need to execute through the Drizzle instance
      // The query is already a prepared Drizzle SQL object that handles parameter binding
      if (this.db.all) {
        const result = this.db.all(query)
        if (Array.isArray(result)) {
          return result.map(row => this.convertNumericFields(row, numericFields)) as T
        }
        return result as T
      } else if (this.db.run) {
        // Fallback to run method if all is not available
        const result = this.db.run(query)
        return result as T
      } else {
        throw new Error('SQLite database instance must have an all() or run() method')
      }
    } catch (error) {
      throw new Error(`SQLite execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert numeric string fields to numbers (only for measure fields)
   */
  private convertNumericFields(row: any, numericFields?: string[]): any {
    if (!row || typeof row !== 'object') return row
    
    const converted: any = {}
    for (const [key, value] of Object.entries(row)) {
      // Only convert measure fields to numbers
      // Dimensions and time dimensions should keep their original types
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

  getEngineType(): 'sqlite' {
    return 'sqlite'
  }
}

/**
 * Factory function for creating SQLite executors
 */
export function createSQLiteExecutor(
  db: DrizzleDatabase,
  schema?: any
): SQLiteExecutor {
  return new SQLiteExecutor(db, schema, 'sqlite')
}
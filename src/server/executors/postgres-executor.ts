/**
 * PostgreSQL database executor
 * Works with postgres.js and Neon drivers
 */

import type { SQL } from 'drizzle-orm'
import type { DrizzleDatabase } from '../types'
import { BaseDatabaseExecutor } from './base-executor'

export class PostgresExecutor extends BaseDatabaseExecutor {
  async execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T> {
    // Handle Drizzle query objects directly
    if (query && typeof query === 'object') {
      // Check for various execution methods that Drizzle queries might have
      if (typeof query.execute === 'function') {
        const result = await query.execute()
        if (Array.isArray(result)) {
          return result.map(row => this.convertNumericFields(row, numericFields)) as T
        }
        return result as T
      }
      
      // Try to execute through the database instance if it's a query builder
      if (this.db && typeof this.db.execute === 'function') {
        try {
          const result = await this.db.execute(query)
          if (Array.isArray(result)) {
            return result.map(row => this.convertNumericFields(row, numericFields)) as T
          }
          return result as T
        } catch (error) {
          // If that fails, try to get SQL and execute it
          if (typeof query.getSQL === 'function') {
            const sqlResult = query.getSQL()
            const result = await this.db.execute(sqlResult)
            if (Array.isArray(result)) {
              return result.map(row => this.convertNumericFields(row, numericFields)) as T
            }
            return result as T
          }
          throw error
        }
      }
    }
    
    // Handle raw SQL objects
    if (!this.db.execute) {
      throw new Error('PostgreSQL database instance must have an execute method')
    }
    const result = await this.db.execute(query)
    
    // Convert numeric strings to numbers for PostgreSQL results
    if (Array.isArray(result)) {
      return result.map(row => this.convertNumericFields(row, numericFields)) as T
    }
    
    return result as T
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
    
    // Handle BigInt values from COUNT operations
    if (typeof value === 'bigint') return Number(value)
    
    // Handle PostgreSQL-specific types (numeric, decimal objects)
    if (value && typeof value === 'object') {
      // Check if it has a numeric toString() method
      if (typeof value.toString === 'function') {
        const stringValue = value.toString()
        if (/^-?\d+(\.\d+)?$/.test(stringValue)) {
          return stringValue.includes('.') ? parseFloat(stringValue) : parseInt(stringValue, 10)
        }
      }
      
      // Check for common PostgreSQL numeric type properties
      if (value.constructor?.name === 'Numeric' || 
          value.constructor?.name === 'Decimal' ||
          'digits' in value || 
          'sign' in value) {
        const stringValue = value.toString()
        return parseFloat(stringValue)
      }
      
      // If it's an object but doesn't look numeric, return as-is
      return value
    }
    
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

  getEngineType(): 'postgres' {
    return 'postgres'
  }
}

/**
 * Factory function for creating PostgreSQL executors
 */
export function createPostgresExecutor(
  db: DrizzleDatabase,
  schema?: any
): PostgresExecutor {
  return new PostgresExecutor(db, schema, 'postgres')
}
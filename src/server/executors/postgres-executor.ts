/**
 * PostgreSQL database executor
 * Works with postgres.js and Neon drivers
 */

import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types'
import { BaseDatabaseExecutor } from './base-executor'
import { parsePostgresExplain } from '../explain/postgres-parser'

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

  /**
   * Execute EXPLAIN on a SQL query to get the execution plan
   */
  async explainQuery(
    sqlString: string,
    params: unknown[],
    options?: ExplainOptions
  ): Promise<ExplainResult> {
    // Build EXPLAIN command
    const explainPrefix = options?.analyze ? 'EXPLAIN ANALYZE' : 'EXPLAIN'

    // Execute EXPLAIN with parameters
    if (!this.db.execute) {
      throw new Error('PostgreSQL database instance must have an execute method')
    }

    // For postgres.js, we need to pass parameters separately
    // The sql string already has $1, $2 placeholders from Drizzle
    const result = await this.db.execute(
      sql`${sql.raw(explainPrefix)} ${sql.raw(sqlString.replace(/\$(\d+)/g, (_, n) => {
        const paramIndex = parseInt(n, 10) - 1
        const value = params[paramIndex]
        // Escape and quote the value appropriately
        if (value === null) return 'NULL'
        if (typeof value === 'number') return String(value)
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
        if (value instanceof Date) return `'${value.toISOString()}'`
        // String: escape single quotes
        return `'${String(value).replace(/'/g, "''")}'`
      }))}`
    )

    // PostgreSQL returns EXPLAIN output as rows with 'QUERY PLAN' column
    const rawLines: string[] = []
    if (Array.isArray(result)) {
      for (const row of result) {
        if (row && typeof row === 'object') {
          // Handle different column name cases
          const planLine =
            (row as Record<string, unknown>)['QUERY PLAN'] ||
            (row as Record<string, unknown>)['query plan'] ||
            (row as Record<string, unknown>)['queryplan']
          if (typeof planLine === 'string') {
            rawLines.push(planLine)
          }
        }
      }
    }

    // Parse the output using the PostgreSQL parser
    return parsePostgresExplain(rawLines, { sql: sqlString, params })
  }

  /**
   * Get existing indexes for the specified tables
   */
  async getTableIndexes(tableNames: string[]): Promise<IndexInfo[]> {
    if (!tableNames || tableNames.length === 0) {
      return []
    }

    if (!this.db.execute) {
      throw new Error('PostgreSQL database instance must have an execute method')
    }

    try {
      // Build table list for SQL IN clause
      const tableList = tableNames.map(t => `'${t.toLowerCase()}'`).join(',')

      const result = await this.db.execute(sql`
        SELECT
          t.relname as table_name,
          i.relname as index_name,
          array_to_string(array_agg(a.attname ORDER BY k.n), ',') as columns,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary
        FROM pg_index ix
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n) ON true
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
        WHERE n.nspname = 'public'
          AND t.relname IN (${sql.raw(tableList)})
        GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary
        ORDER BY t.relname, i.relname
      `)

      if (!Array.isArray(result)) {
        return []
      }

      return result.map((row: any) => ({
        table_name: row.table_name,
        index_name: row.index_name,
        columns: row.columns.split(','),
        is_unique: row.is_unique,
        is_primary: row.is_primary
      }))
    } catch (err) {
      console.warn('Failed to get table indexes:', err)
      return []
    }
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
/**
 * DuckDB database executor
 * Works with drizzle-duckdb drivers
 */

import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types'
import { BaseDatabaseExecutor } from './base-executor'
import { parseDuckDBExplain } from '../explain/duckdb-parser'

export class DuckDBExecutor extends BaseDatabaseExecutor {
  async execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T> {
    // Handle Drizzle query objects directly
    if (query && typeof query === 'object') {
      // Check for various execution methods that Drizzle queries might have
      if (typeof query.execute === 'function') {
        try {
          const result = await query.execute()
          if (Array.isArray(result)) {
            return result.map(row => this.convertNumericFields(row, numericFields)) as T
          }
          return result as T
        } catch (err) {
          // Extract SQL for better error logging
          const sqlInfo = this.extractSqlFromQuery(query)
          console.error('[DuckDB] Query execution failed:', {
            error: err instanceof Error ? err.message : String(err),
            sql: sqlInfo.sql,
            params: sqlInfo.params,
          })
          throw err
        }
      }
    }

    // Handle raw SQL objects
    if (!this.db.execute) {
      throw new Error('DuckDB database instance must have an execute method')
    }

    try {
      const result = await this.db.execute(query)

      // Convert numeric strings to numbers for DuckDB results
      if (Array.isArray(result)) {
        return result.map(row => this.convertNumericFields(row, numericFields)) as T
      }

      return result as T
    } catch (err) {
      // Extract SQL for better error logging
      const sqlInfo = this.extractSqlFromQuery(query)
      console.error('[DuckDB] Query execution failed:', {
        error: err instanceof Error ? err.message : String(err),
        sql: sqlInfo.sql,
        params: sqlInfo.params,
      })
      throw err
    }
  }

  /**
   * Extract SQL string and params from a query object for error logging
   */
  private extractSqlFromQuery(query: any): { sql: string; params: unknown[] } {
    try {
      // Drizzle SQL objects have toSQL() method
      if (query && typeof query.toSQL === 'function') {
        const { sql: sqlStr, params } = query.toSQL()
        return { sql: sqlStr, params }
      }
      // Try getSQL for older Drizzle versions
      if (query && typeof query.getSQL === 'function') {
        const sqlObj = query.getSQL()
        if (sqlObj && typeof sqlObj.toSQL === 'function') {
          const { sql: sqlStr, params } = sqlObj.toSQL()
          return { sql: sqlStr, params }
        }
      }
      // Fallback: stringify the query
      return { sql: String(query), params: [] }
    } catch {
      return { sql: '[unable to extract SQL]', params: [] }
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

    // Handle BigInt values from COUNT operations
    if (typeof value === 'bigint') return Number(value)

    // Handle DuckDB-specific types
    if (value && typeof value === 'object') {
      // Check if it has a numeric toString() method
      if (typeof value.toString === 'function') {
        const stringValue = value.toString()
        if (/^-?\d+(\.\d+)?$/.test(stringValue)) {
          return stringValue.includes('.') ? parseFloat(stringValue) : parseInt(stringValue, 10)
        }
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

  getEngineType(): 'duckdb' {
    return 'duckdb'
  }

  /**
   * Execute EXPLAIN on a SQL query to get the execution plan
   * DuckDB supports EXPLAIN and EXPLAIN ANALYZE
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
      throw new Error('DuckDB database instance must have an execute method')
    }

    // For DuckDB, we need to replace parameters with values
    // DuckDB uses $1, $2 style placeholders like PostgreSQL
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

    // DuckDB returns EXPLAIN output as rows
    const rawLines: string[] = []
    if (Array.isArray(result)) {
      for (const row of result) {
        if (row && typeof row === 'object') {
          // DuckDB might return different column names for EXPLAIN output
          const planLine =
            (row as Record<string, unknown>)['explain_value'] ||
            (row as Record<string, unknown>)['QUERY PLAN'] ||
            (row as Record<string, unknown>)['query_plan'] ||
            (row as Record<string, unknown>)['Plan'] ||
            Object.values(row as Record<string, unknown>)[0]
          if (typeof planLine === 'string') {
            rawLines.push(planLine)
          }
        }
      }
    }

    // Parse the output using the DuckDB parser
    return parseDuckDBExplain(rawLines, { sql: sqlString, params })
  }

  /**
   * Get existing indexes for the specified tables
   * DuckDB uses duckdb_indexes() table function
   */
  async getTableIndexes(tableNames: string[]): Promise<IndexInfo[]> {
    if (!tableNames || tableNames.length === 0) {
      return []
    }

    if (!this.db.execute) {
      throw new Error('DuckDB database instance must have an execute method')
    }

    try {
      // Build table list for SQL IN clause
      const tableList = tableNames.map(t => `'${t.toLowerCase()}'`).join(',')

      const result = await this.db.execute(sql`
        SELECT
          table_name,
          index_name,
          LISTAGG(column_name, ',') WITHIN GROUP (ORDER BY index_oid) as columns,
          is_unique,
          is_primary
        FROM duckdb_indexes()
        WHERE LOWER(table_name) IN (${sql.raw(tableList)})
        GROUP BY table_name, index_name, is_unique, is_primary
        ORDER BY table_name, index_name
      `)

      if (!Array.isArray(result)) {
        return []
      }

      return result.map((row: any) => ({
        table_name: row.table_name,
        index_name: row.index_name,
        columns: typeof row.columns === 'string' ? row.columns.split(',') : [],
        is_unique: Boolean(row.is_unique),
        is_primary: Boolean(row.is_primary)
      }))
    } catch (err) {
      console.warn('Failed to get table indexes:', err)
      return []
    }
  }
}

/**
 * Factory function for creating DuckDB executors
 */
export function createDuckDBExecutor(
  db: DrizzleDatabase,
  schema?: any
): DuckDBExecutor {
  return new DuckDBExecutor(db, schema, 'duckdb')
}

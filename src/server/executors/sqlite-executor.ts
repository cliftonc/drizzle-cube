/**
 * SQLite database executor
 * Works with better-sqlite3 driver
 */

import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types'
import { BaseDatabaseExecutor } from './base-executor'
import { parseSQLiteExplain } from '../explain/sqlite-parser'

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

  /**
   * Execute EXPLAIN QUERY PLAN on a SQL query to get the execution plan
   * Note: SQLite doesn't support EXPLAIN ANALYZE
   */
  async explainQuery(
    sqlString: string,
    params: unknown[],
    _options?: ExplainOptions
  ): Promise<ExplainResult> {
    // SQLite uses ? placeholders, replace with values
    let queryWithValues = sqlString
    let paramIndex = 0
    queryWithValues = queryWithValues.replace(/\?/g, () => {
      const value = params[paramIndex++]
      if (value === null) return 'NULL'
      if (typeof value === 'number') return String(value)
      if (typeof value === 'boolean') return value ? '1' : '0'
      if (value instanceof Date) return `'${value.toISOString()}'`
      // String: escape single quotes
      return `'${String(value).replace(/'/g, "''")}'`
    })

    // SQLite uses EXPLAIN QUERY PLAN (not EXPLAIN ANALYZE)
    const explainSql = `EXPLAIN QUERY PLAN ${queryWithValues}`

    // Execute through the database
    let result: any[] = []
    if (this.db.all) {
      result = this.db.all(sql.raw(explainSql))
    } else {
      throw new Error('SQLite database instance must have an all() method for EXPLAIN')
    }

    // SQLite EXPLAIN QUERY PLAN returns rows with: id, parent, notused, detail
    const rows: any[] = []
    if (Array.isArray(result)) {
      for (const row of result) {
        if (row && typeof row === 'object') {
          rows.push({
            id: Number((row as Record<string, unknown>).id) || 0,
            parent: Number((row as Record<string, unknown>).parent) || 0,
            notused: Number((row as Record<string, unknown>).notused) || 0,
            detail: String((row as Record<string, unknown>).detail || ''),
          })
        }
      }
    }

    // Parse the output using the SQLite parser
    return parseSQLiteExplain(rows, { sql: sqlString, params })
  }

  /**
   * Get existing indexes for the specified tables
   */
  async getTableIndexes(tableNames: string[]): Promise<IndexInfo[]> {
    if (!tableNames || tableNames.length === 0) {
      return []
    }

    if (!this.db.all) {
      throw new Error('SQLite database instance must have an all() method')
    }

    try {
      const indexes: IndexInfo[] = []

      for (const tableName of tableNames) {
        // Get indexes for this table using pragma_index_list
        const indexList = this.db.all(
          sql.raw(`SELECT name, "unique", origin FROM pragma_index_list('${tableName.toLowerCase()}')`)
        )

        if (!Array.isArray(indexList)) continue

        for (const idx of indexList) {
          const indexName = (idx as Record<string, unknown>).name as string
          const isUnique = Boolean((idx as Record<string, unknown>).unique)
          const origin = (idx as Record<string, unknown>).origin as string

          // Get columns for this index using pragma_index_info
          const columnList = this.db.all(
            sql.raw(`SELECT name FROM pragma_index_info('${indexName}') ORDER BY seqno`)
          )

          const columns: string[] = []
          if (Array.isArray(columnList)) {
            for (const col of columnList) {
              const colName = (col as Record<string, unknown>).name
              if (typeof colName === 'string') {
                columns.push(colName)
              }
            }
          }

          indexes.push({
            table_name: tableName.toLowerCase(),
            index_name: indexName,
            columns,
            is_unique: isUnique,
            is_primary: origin === 'pk'
          })
        }
      }

      return indexes
    } catch (err) {
      console.warn('Failed to get table indexes:', err)
      return []
    }
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
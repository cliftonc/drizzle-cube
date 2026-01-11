/**
 * MySQL database executor
 * Works with mysql2 driver
 */

import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types'
import { BaseDatabaseExecutor } from './base-executor'
import { parseMySQLExplain } from '../explain/mysql-parser'

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

  getEngineType(): 'mysql' | 'singlestore' {
    return 'mysql'
  }

  /**
   * Execute EXPLAIN on a SQL query to get the execution plan
   */
  async explainQuery(
    sqlString: string,
    params: unknown[],
    options?: ExplainOptions
  ): Promise<ExplainResult> {
    // MySQL uses ? placeholders, replace with values
    let queryWithValues = sqlString
    let paramIndex = 0
    queryWithValues = queryWithValues.replace(/\?/g, () => {
      const value = params[paramIndex++]
      if (value === null) return 'NULL'
      if (typeof value === 'number') return String(value)
      if (typeof value === 'boolean') return value ? '1' : '0'
      if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`
      // String: escape single quotes
      return `'${String(value).replace(/'/g, "''")}'`
    })

    // Build EXPLAIN command
    // Note: EXPLAIN ANALYZE is only available in MySQL 8.0.18+
    const explainPrefix = options?.analyze ? 'EXPLAIN ANALYZE' : 'EXPLAIN'

    if (!this.db.execute) {
      throw new Error('MySQL database instance must have an execute method')
    }

    // Execute EXPLAIN
    const result = await this.db.execute(
      sql.raw(`${explainPrefix} ${queryWithValues}`)
    )

    // MySQL returns EXPLAIN output as rows with specific columns
    // Standard columns: id, select_type, table, partitions, type, possible_keys, key, key_len, ref, rows, filtered, Extra
    const rows: any[] = []
    if (Array.isArray(result)) {
      for (const row of result) {
        if (row && typeof row === 'object') {
          rows.push({
            id: (row as Record<string, unknown>).id || 1,
            select_type: (row as Record<string, unknown>).select_type || 'SIMPLE',
            table: (row as Record<string, unknown>).table || null,
            partitions: (row as Record<string, unknown>).partitions || null,
            type: (row as Record<string, unknown>).type || 'ALL',
            possible_keys: (row as Record<string, unknown>).possible_keys || null,
            key: (row as Record<string, unknown>).key || null,
            key_len: (row as Record<string, unknown>).key_len || null,
            ref: (row as Record<string, unknown>).ref || null,
            rows: Number((row as Record<string, unknown>).rows) || 0,
            filtered: Number((row as Record<string, unknown>).filtered) || 100,
            Extra: (row as Record<string, unknown>).Extra || null,
          })
        }
      }
    }

    // Parse the output using the MySQL parser
    return parseMySQLExplain(rows, { sql: sqlString, params })
  }

  /**
   * Get existing indexes for the specified tables
   */
  async getTableIndexes(tableNames: string[]): Promise<IndexInfo[]> {
    if (!tableNames || tableNames.length === 0) {
      return []
    }

    if (!this.db.execute) {
      throw new Error('MySQL database instance must have an execute method')
    }

    try {
      // Build table list for SQL IN clause
      const tableList = tableNames.map(t => `'${t.toLowerCase()}'`).join(',')

      const result = await this.db.execute(sql`
        SELECT
          TABLE_NAME as table_name,
          INDEX_NAME as index_name,
          GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns,
          CASE WHEN NON_UNIQUE = 0 THEN TRUE ELSE FALSE END as is_unique,
          CASE WHEN INDEX_NAME = 'PRIMARY' THEN TRUE ELSE FALSE END as is_primary
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND LOWER(TABLE_NAME) IN (${sql.raw(tableList)})
        GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
        ORDER BY TABLE_NAME, INDEX_NAME
      `)

      if (!Array.isArray(result)) {
        return []
      }

      return result.map((row: any) => ({
        table_name: row.table_name,
        index_name: row.index_name,
        columns: row.columns.split(','),
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
 * Factory function for creating MySQL executors
 */
export function createMySQLExecutor(
  db: DrizzleDatabase,
  schema?: any
): MySQLExecutor {
  return new MySQLExecutor(db, schema, 'mysql')
}
/**
 * Snowflake database executor
 * Works with drizzle-snowflake drivers
 */

import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types'
import { BaseDatabaseExecutor } from './base-executor'
import { parseSnowflakeExplain } from '../explain/snowflake-parser'

export class SnowflakeExecutor extends BaseDatabaseExecutor {
  async execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T> {
    // Handle Drizzle query objects directly
    if (query && typeof query === 'object') {
      if (typeof query.execute === 'function') {
        try {
          const result = await query.execute()
          if (Array.isArray(result)) {
            return result.map(row => this.convertNumericFields(row, numericFields)) as T
          }
          return result as T
        } catch (err) {
          const sqlInfo = this.extractSqlFromQuery(query)
          console.error('[Snowflake] Query execution failed:', {
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
      throw new Error('Snowflake database instance must have an execute method')
    }

    try {
      const result = await this.db.execute(query)

      if (Array.isArray(result)) {
        return result.map(row => this.convertNumericFields(row, numericFields)) as T
      }

      return result as T
    } catch (err) {
      const sqlInfo = this.extractSqlFromQuery(query)
      console.error('[Snowflake] Query execution failed:', {
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
      if (query && typeof query.toSQL === 'function') {
        const { sql: sqlStr, params } = query.toSQL()
        return { sql: sqlStr, params }
      }
      if (query && typeof query.getSQL === 'function') {
        const sqlObj = query.getSQL()
        if (sqlObj && typeof sqlObj.toSQL === 'function') {
          const { sql: sqlStr, params } = sqlObj.toSQL()
          return { sql: sqlStr, params }
        }
      }
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
    if (value == null) return value
    if (typeof value === 'number') return value
    if (typeof value === 'bigint') return Number(value)

    if (value && typeof value === 'object') {
      if (typeof value.toString === 'function') {
        const stringValue = value.toString()
        if (/^-?\d+(\.\d+)?$/.test(stringValue)) {
          return stringValue.includes('.') ? parseFloat(stringValue) : parseInt(stringValue, 10)
        }
      }
      return value
    }

    if (typeof value === 'string') {
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return value.includes('.') ? parseFloat(value) : parseInt(value, 10)
      }
      if (!isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
        return parseFloat(value)
      }
    }

    return value
  }

  getEngineType(): 'snowflake' {
    return 'snowflake'
  }

  /**
   * Execute EXPLAIN on a SQL query to get the execution plan
   * Snowflake supports EXPLAIN and EXPLAIN USING TEXT/JSON/TABULAR
   */
  async explainQuery(
    sqlString: string,
    params: unknown[],
    options?: ExplainOptions
  ): Promise<ExplainResult> {
    const explainPrefix = options?.analyze ? 'EXPLAIN' : 'EXPLAIN'

    if (!this.db.execute) {
      throw new Error('Snowflake database instance must have an execute method')
    }

    // Snowflake uses ? for parameter placeholders
    const result = await this.db.execute(
      sql`${sql.raw(explainPrefix)} ${sql.raw(sqlString.replace(/\?/g, () => {
        const value = params.shift()
        if (value === null) return 'NULL'
        if (typeof value === 'number') return String(value)
        if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
        if (value instanceof Date) return `'${value.toISOString()}'`
        return `'${String(value).replace(/'/g, "''")}'`
      }))}`
    )

    const rawLines: string[] = []
    if (Array.isArray(result)) {
      for (const row of result) {
        if (row && typeof row === 'object') {
          const planLine =
            (row as Record<string, unknown>)['content'] ||
            (row as Record<string, unknown>)['QUERY PLAN'] ||
            (row as Record<string, unknown>)['plan'] ||
            Object.values(row as Record<string, unknown>)[0]
          if (typeof planLine === 'string') {
            rawLines.push(planLine)
          }
        }
      }
    }

    return parseSnowflakeExplain(rawLines, { sql: sqlString, params })
  }

  /**
   * Get existing indexes for the specified tables
   * Snowflake doesn't use traditional indexes (it uses micro-partitioning)
   */
  async getTableIndexes(_tableNames: string[]): Promise<IndexInfo[]> {
    return []
  }
}

/**
 * Factory function for creating Snowflake executors
 */
export function createSnowflakeExecutor(
  db: DrizzleDatabase,
  schema?: any
): SnowflakeExecutor {
  return new SnowflakeExecutor(db, schema, 'snowflake')
}

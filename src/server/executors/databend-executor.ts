/**
 * Databend database executor
 * Works with drizzle-databend drivers
 */

import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types'
import { BaseDatabaseExecutor } from './base-executor'
import { parseDatabendExplain } from '../explain/databend-parser'

export class DatabendExecutor extends BaseDatabaseExecutor {
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
          console.error('[Databend] Query execution failed:', {
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
      throw new Error('Databend database instance must have an execute method')
    }

    try {
      const result = await this.db.execute(query)

      if (Array.isArray(result)) {
        return result.map(row => this.convertNumericFields(row, numericFields)) as T
      }

      return result as T
    } catch (err) {
      const sqlInfo = this.extractSqlFromQuery(query)
      console.error('[Databend] Query execution failed:', {
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

  getEngineType(): 'databend' {
    return 'databend'
  }

  /**
   * Execute EXPLAIN on a SQL query to get the execution plan
   * Databend supports EXPLAIN and EXPLAIN ANALYZE
   */
  async explainQuery(
    sqlString: string,
    params: unknown[],
    options?: ExplainOptions
  ): Promise<ExplainResult> {
    const explainPrefix = options?.analyze ? 'EXPLAIN ANALYZE' : 'EXPLAIN'

    if (!this.db.execute) {
      throw new Error('Databend database instance must have an execute method')
    }

    // Replace $1, $2 style placeholders with actual values for EXPLAIN
    const result = await this.db.execute(
      sql`${sql.raw(explainPrefix)} ${sql.raw(sqlString.replace(/\$(\d+)/g, (_, n) => {
        const paramIndex = parseInt(n, 10) - 1
        const value = params[paramIndex]
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
            (row as Record<string, unknown>)['explain'] ||
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

    return parseDatabendExplain(rawLines, { sql: sqlString, params })
  }

  /**
   * Get existing indexes for the specified tables
   * Databend uses system tables for index information
   */
  async getTableIndexes(tableNames: string[]): Promise<IndexInfo[]> {
    if (!tableNames || tableNames.length === 0) {
      return []
    }

    // Databend has limited index support compared to traditional RDBMS
    // Return empty for now - can be enhanced when Databend adds more index types
    return []
  }
}

/**
 * Factory function for creating Databend executors
 */
export function createDatabendExecutor(
  db: DrizzleDatabase,
  schema?: any
): DatabendExecutor {
  return new DatabendExecutor(db, schema, 'databend')
}

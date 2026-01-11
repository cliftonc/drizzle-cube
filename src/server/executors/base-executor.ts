/**
 * Base database executor implementation
 * Abstract class for database-specific executors
 */

import type { SQL } from 'drizzle-orm'
import type { DrizzleDatabase, DatabaseExecutor, ExplainOptions, ExplainResult, IndexInfo } from '../types'
import type { DatabaseAdapter } from '../adapters/base-adapter'
import { createDatabaseAdapter } from '../database-utils'

/**
 * Abstract base class for database executors
 */
export abstract class BaseDatabaseExecutor implements DatabaseExecutor {
  public databaseAdapter: DatabaseAdapter
  
  constructor(
    public db: DrizzleDatabase,
    public schema?: any,
    engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore'
  ) {
    // Create database adapter based on engine type or auto-detect
    const actualEngineType = engineType || this.getEngineType()
    this.databaseAdapter = createDatabaseAdapter(actualEngineType)
  }

  abstract execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T>
  abstract getEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'singlestore'
  abstract explainQuery(sqlString: string, params: unknown[], options?: ExplainOptions): Promise<ExplainResult>
  abstract getTableIndexes(tableNames: string[]): Promise<IndexInfo[]>
}
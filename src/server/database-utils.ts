/**
 * Database Adapter Factory
 * Creates appropriate database adapters based on engine type
 * Provides centralized adapter management and instantiation
 */

import type { DatabaseAdapter } from './adapters/base-adapter'
import { PostgresAdapter } from './adapters/postgres-adapter'
import { MySQLAdapter } from './adapters/mysql-adapter'
import { SQLiteAdapter } from './adapters/sqlite-adapter'
import { SingleStoreAdapter } from './adapters/singlestore-adapter'
import { DuckDBAdapter } from './adapters/duckdb-adapter'

/**
 * Create a database adapter for the specified engine type
 * @param engineType - The database engine type
 * @returns Database adapter instance
 */
export function createDatabaseAdapter(engineType: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb'): DatabaseAdapter {
  switch (engineType) {
    case 'postgres':
      return new PostgresAdapter()
    case 'mysql':
      return new MySQLAdapter()
    case 'sqlite':
      return new SQLiteAdapter()
    case 'singlestore':
      return new SingleStoreAdapter()
    case 'duckdb':
      return new DuckDBAdapter()
    default:
      throw new Error(`Unsupported database engine: ${engineType}`)
  }
}

/**
 * Get available database adapters
 * @returns Array of supported engine types
 */
export function getSupportedEngines(): ('postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb')[] {
  return ['postgres', 'mysql', 'sqlite', 'singlestore', 'duckdb']
}

/**
 * Check if an engine type is supported
 * @param engineType - Engine type to check
 * @returns True if supported, false otherwise
 */
export function isEngineSupported(engineType: string): engineType is 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' {
  return ['postgres', 'mysql', 'sqlite', 'singlestore', 'duckdb'].includes(engineType)
}
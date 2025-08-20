/**
 * Database Adapter Factory
 * Creates appropriate database adapters based on engine type
 * Provides centralized adapter management and instantiation
 */

import type { DatabaseAdapter } from './adapters/base-adapter'
import { PostgresAdapter } from './adapters/postgres-adapter'
import { MySQLAdapter } from './adapters/mysql-adapter'

/**
 * Create a database adapter for the specified engine type
 * @param engineType - The database engine type
 * @returns Database adapter instance
 */
export function createDatabaseAdapter(engineType: 'postgres' | 'mysql' | 'sqlite'): DatabaseAdapter {
  switch (engineType) {
    case 'postgres':
      return new PostgresAdapter()
    case 'mysql':
      return new MySQLAdapter()
    case 'sqlite':
      // TODO: Implement SQLiteAdapter when adding SQLite support
      throw new Error('SQLite adapter not yet implemented')
    default:
      throw new Error(`Unsupported database engine: ${engineType}`)
  }
}

/**
 * Get available database adapters
 * @returns Array of supported engine types
 */
export function getSupportedEngines(): ('postgres' | 'mysql' | 'sqlite')[] {
  return ['postgres', 'mysql'] // SQLite will be added later
}

/**
 * Check if an engine type is supported
 * @param engineType - Engine type to check
 * @returns True if supported, false otherwise
 */
export function isEngineSupported(engineType: string): engineType is 'postgres' | 'mysql' | 'sqlite' {
  return ['postgres', 'mysql'].includes(engineType)
}
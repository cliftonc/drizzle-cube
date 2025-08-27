/**
 * Database executors for different database engines
 * Handles SQL execution with proper type coercion
 */

export { BaseDatabaseExecutor } from './base-executor'
export { PostgresExecutor, createPostgresExecutor } from './postgres-executor'
export { MySQLExecutor, createMySQLExecutor } from './mysql-executor'
export { SQLiteExecutor, createSQLiteExecutor } from './sqlite-executor'

// Re-export factory function for auto-detection
import type { DrizzleDatabase, DatabaseExecutor } from '../types'
import { createPostgresExecutor } from './postgres-executor'
import { createMySQLExecutor } from './mysql-executor'
import { createSQLiteExecutor } from './sqlite-executor'

/**
 * Auto-detect database type and create appropriate executor
 * @param db - Drizzle database instance
 * @param schema - Optional schema for type inference
 * @param engineType - Optional explicit engine type override
 * @returns Appropriate database executor
 */
export function createDatabaseExecutor(
  db: DrizzleDatabase,
  schema?: any,
  engineType?: 'postgres' | 'mysql' | 'sqlite'
): DatabaseExecutor {
  // If engine type is explicitly provided, use it
  if (engineType) {
    switch (engineType) {
      case 'postgres':
        return createPostgresExecutor(db, schema)
      case 'mysql':
        return createMySQLExecutor(db, schema)
      case 'sqlite':
        return createSQLiteExecutor(db, schema)
    }
  }

  // Auto-detect based on available methods
  if (db.all && db.run) {
    // SQLite has synchronous methods
    return createSQLiteExecutor(db, schema)
  } else if (db.execute) {
    // PostgreSQL and MySQL have async execute method
    // We default to PostgreSQL since it's more common
    return createPostgresExecutor(db, schema)
  } else {
    throw new Error('Unable to determine database engine type. Please specify engineType parameter.')
  }
}
/**
 * Database executors for different database engines
 * Handles SQL execution with proper type coercion
 */

export { BaseDatabaseExecutor } from './base-executor.js'
export { PostgresExecutor, createPostgresExecutor } from './postgres-executor.js'
export { MySQLExecutor, createMySQLExecutor } from './mysql-executor.js'
export { SQLiteExecutor, createSQLiteExecutor } from './sqlite-executor.js'
export { SingleStoreExecutor, createSingleStoreExecutor } from './singlestore-executor.js'
export { DuckDBExecutor, createDuckDBExecutor } from './duckdb-executor.js'
export { DatabendExecutor, createDatabendExecutor } from './databend-executor.js'
export { SnowflakeExecutor, createSnowflakeExecutor } from './snowflake-executor.js'

// Re-export factory function for auto-detection
import type { DrizzleDatabase, DatabaseExecutor } from '../types/index.js'
import { createPostgresExecutor } from './postgres-executor.js'
import { createMySQLExecutor } from './mysql-executor.js'
import { createSQLiteExecutor } from './sqlite-executor.js'
import { createSingleStoreExecutor } from './singlestore-executor.js'
import { createDuckDBExecutor } from './duckdb-executor.js'
import { createDatabendExecutor } from './databend-executor.js'
import { createSnowflakeExecutor } from './snowflake-executor.js'

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
  engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'
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
      case 'singlestore':
        return createSingleStoreExecutor(db, schema)
      case 'duckdb':
        return createDuckDBExecutor(db, schema)
      case 'databend':
        return createDatabendExecutor(db, schema)
      case 'snowflake':
        return createSnowflakeExecutor(db, schema)
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
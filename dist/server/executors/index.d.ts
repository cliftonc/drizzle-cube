import { DrizzleDatabase, DatabaseExecutor } from '../types/index.js';
/**
 * Database executors for different database engines
 * Handles SQL execution with proper type coercion
 */
export { BaseDatabaseExecutor } from './base-executor.js';
export { PostgresExecutor, createPostgresExecutor } from './postgres-executor.js';
export { MySQLExecutor, createMySQLExecutor } from './mysql-executor.js';
export { SQLiteExecutor, createSQLiteExecutor } from './sqlite-executor.js';
export { SingleStoreExecutor, createSingleStoreExecutor } from './singlestore-executor.js';
export { DuckDBExecutor, createDuckDBExecutor } from './duckdb-executor.js';
export { DatabendExecutor, createDatabendExecutor } from './databend-executor.js';
export { SnowflakeExecutor, createSnowflakeExecutor } from './snowflake-executor.js';
/**
 * Auto-detect database type and create appropriate executor
 * @param db - Drizzle database instance
 * @param schema - Optional schema for type inference
 * @param engineType - Optional explicit engine type override
 * @returns Appropriate database executor
 */
export declare function createDatabaseExecutor(db: DrizzleDatabase, schema?: any, engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'): DatabaseExecutor;

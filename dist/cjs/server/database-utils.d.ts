import { DatabaseAdapter } from './adapters/base-adapter.js';
/**
 * Create a database adapter for the specified engine type
 * @param engineType - The database engine type
 * @returns Database adapter instance
 */
export declare function createDatabaseAdapter(engineType: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake'): DatabaseAdapter;
/**
 * Get available database adapters
 * @returns Array of supported engine types
 */
export declare function getSupportedEngines(): ('postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake')[];
/**
 * Check if an engine type is supported
 * @param engineType - Engine type to check
 * @returns True if supported, false otherwise
 */
export declare function isEngineSupported(engineType: string): engineType is 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake';

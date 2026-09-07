import { SQL } from 'drizzle-orm';
import { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types/index.js';
import { BaseDatabaseExecutor } from './base-executor.js';
export declare class SQLiteExecutor extends BaseDatabaseExecutor {
    execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T>;
    /**
     * Convert numeric string fields to numbers (only for measure fields), in place.
     *
     * Hot path for large result sets: this runs once per returned row. Rather than
     * rebuild a fresh object per row (Object.entries + full-key copy), we mutate
     * the driver-produced row — which we exclusively own — touching only the
     * measure columns. Dimensions/time dimensions keep their original types.
     * When there are no numeric fields, the rows are returned untouched.
     */
    private convertNumericFieldsInPlace;
    /**
     * Coerce a value to a number if it represents a numeric type
     */
    private coerceToNumber;
    getEngineType(): 'sqlite';
    /**
     * Execute EXPLAIN QUERY PLAN on a SQL query to get the execution plan
     * Note: SQLite doesn't support EXPLAIN ANALYZE
     */
    explainQuery(sqlString: string, params: unknown[], _options?: ExplainOptions): Promise<ExplainResult>;
    /**
     * Get existing indexes for the specified tables
     */
    getTableIndexes(tableNames: string[]): Promise<IndexInfo[]>;
}
/**
 * Factory function for creating SQLite executors
 */
export declare function createSQLiteExecutor(db: DrizzleDatabase, schema?: any): SQLiteExecutor;

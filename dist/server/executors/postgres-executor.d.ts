import { SQL } from 'drizzle-orm';
import { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types/index.js';
import { BaseDatabaseExecutor } from './base-executor.js';
export declare class PostgresExecutor extends BaseDatabaseExecutor {
    execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T>;
    /**
     * Convert numeric string fields to numbers (only for measure fields)
     */
    private convertNumericFields;
    /**
     * Coerce a value to a number if it represents a numeric type
     */
    private coerceToNumber;
    getEngineType(): 'postgres';
    /**
     * Execute EXPLAIN on a SQL query to get the execution plan
     */
    explainQuery(sqlString: string, params: unknown[], options?: ExplainOptions): Promise<ExplainResult>;
    /**
     * Get existing indexes for the specified tables
     */
    getTableIndexes(tableNames: string[]): Promise<IndexInfo[]>;
}
/**
 * Factory function for creating PostgreSQL executors
 */
export declare function createPostgresExecutor(db: DrizzleDatabase, schema?: any): PostgresExecutor;

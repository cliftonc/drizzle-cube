import { SQL } from 'drizzle-orm';
import { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types/index.js';
import { BaseDatabaseExecutor } from './base-executor.js';
export declare class DatabendExecutor extends BaseDatabaseExecutor {
    execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T>;
    /**
     * Extract SQL string and params from a query object for error logging
     */
    private extractSqlFromQuery;
    /**
     * Convert numeric string fields to numbers (only for measure fields)
     */
    private convertNumericFields;
    /**
     * Coerce a value to a number if it represents a numeric type
     */
    private coerceToNumber;
    getEngineType(): 'databend';
    /**
     * Execute EXPLAIN on a SQL query to get the execution plan
     * Databend supports EXPLAIN and EXPLAIN ANALYZE
     */
    explainQuery(sqlString: string, params: unknown[], options?: ExplainOptions): Promise<ExplainResult>;
    /**
     * Get existing indexes for the specified tables
     * Databend uses system tables for index information
     */
    getTableIndexes(tableNames: string[]): Promise<IndexInfo[]>;
}
/**
 * Factory function for creating Databend executors
 */
export declare function createDatabendExecutor(db: DrizzleDatabase, schema?: any): DatabendExecutor;

import { SQL } from 'drizzle-orm';
import { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types/index.js';
import { BaseDatabaseExecutor } from './base-executor.js';
export declare class SnowflakeExecutor extends BaseDatabaseExecutor {
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
    getEngineType(): 'snowflake';
    /**
     * Execute EXPLAIN on a SQL query to get the execution plan
     * Snowflake supports EXPLAIN and EXPLAIN USING TEXT/JSON/TABULAR
     */
    explainQuery(sqlString: string, params: unknown[], options?: ExplainOptions): Promise<ExplainResult>;
    /**
     * Get existing indexes for the specified tables
     * Snowflake doesn't use traditional indexes (it uses micro-partitioning)
     */
    getTableIndexes(_tableNames: string[]): Promise<IndexInfo[]>;
}
/**
 * Factory function for creating Snowflake executors
 */
export declare function createSnowflakeExecutor(db: DrizzleDatabase, schema?: any): SnowflakeExecutor;

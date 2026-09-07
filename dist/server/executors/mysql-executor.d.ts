import { SQL } from 'drizzle-orm';
import { DrizzleDatabase, ExplainOptions, ExplainResult, IndexInfo } from '../types/index.js';
import { BaseDatabaseExecutor } from './base-executor.js';
export declare class MySQLExecutor extends BaseDatabaseExecutor {
    execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T>;
    /**
     * Convert numeric string fields to numbers (measure fields + numeric dimensions)
     */
    private convertNumericFields;
    /**
     * Coerce a value to a number if it represents a numeric type
     */
    private coerceToNumber;
    getEngineType(): 'mysql' | 'singlestore';
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
 * Factory function for creating MySQL executors
 */
export declare function createMySQLExecutor(db: DrizzleDatabase, schema?: any): MySQLExecutor;

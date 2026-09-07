import { SQL } from 'drizzle-orm';
import { DrizzleDatabase, DatabaseExecutor, ExplainOptions, ExplainResult, IndexInfo } from '../types/index.js';
import { DatabaseAdapter } from '../adapters/base-adapter.js';
/**
 * Abstract base class for database executors
 */
export declare abstract class BaseDatabaseExecutor implements DatabaseExecutor {
    db: DrizzleDatabase;
    schema?: any | undefined;
    databaseAdapter: DatabaseAdapter;
    constructor(db: DrizzleDatabase, schema?: any | undefined, engineType?: 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake');
    abstract execute<T = any[]>(query: SQL | any, numericFields?: string[]): Promise<T>;
    abstract getEngineType(): 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake';
    abstract explainQuery(sqlString: string, params: unknown[], options?: ExplainOptions): Promise<ExplainResult>;
    abstract getTableIndexes(tableNames: string[]): Promise<IndexInfo[]>;
}

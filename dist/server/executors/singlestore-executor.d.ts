import { DrizzleDatabase } from '../types/index.js';
import { MySQLExecutor } from './mysql-executor.js';
export declare class SingleStoreExecutor extends MySQLExecutor {
    getEngineType(): 'singlestore';
}
/**
 * Factory function for creating SingleStore executors
 */
export declare function createSingleStoreExecutor(db: DrizzleDatabase, schema?: any): SingleStoreExecutor;

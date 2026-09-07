import { ExplainResult } from '../types/executor.js';
/**
 * Parse Snowflake EXPLAIN output
 *
 * Snowflake EXPLAIN output shows the query plan as indented text.
 * Example:
 * "GlobalStats:"
 * "    partitionsTotal=1"
 * "    partitionsAssigned=1"
 * "1:0     ->Result"
 * "1:1         ->Filter"
 * "1:2             ->TableScan"
 */
export declare function parseSnowflakeExplain(rawOutput: string[], sqlQuery: {
    sql: string;
    params?: unknown[];
}): ExplainResult;

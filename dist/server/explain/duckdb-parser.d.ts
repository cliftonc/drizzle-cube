import { ExplainResult } from '../types/executor.js';
/**
 * Parse DuckDB EXPLAIN output
 *
 * Example DuckDB EXPLAIN output:
 * "┌───────────────────────────┐"
 * "│      EXPLANATION OF       │"
 * "│     QUERY PLAN            │"
 * "└───────────────────────────┘"
 * "┌─────────────────────────────────────────────────────────────────────┐"
 * "│                     QUERY PLAN                                      │"
 * "├─────────────────────────────────────────────────────────────────────┤"
 * "│  HASH_JOIN                                                          │"
 * "│  ├──SEQ_SCAN employees                                              │"
 * "│  │  (cost=100.0 rows=1000)                                          │"
 * "│  └──SEQ_SCAN departments                                            │"
 * "│     (cost=50.0 rows=500)                                            │"
 * "└─────────────────────────────────────────────────────────────────────┘"
 *
 * Or simpler format:
 * "HASH_JOIN"
 * "├──SEQ_SCAN employees"
 * "└──SEQ_SCAN departments"
 */
export declare function parseDuckDBExplain(rawOutput: string[], sqlQuery: {
    sql: string;
    params?: unknown[];
}): ExplainResult;

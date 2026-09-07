import { ExplainResult } from '../types/executor.js';
/**
 * Parse Databend EXPLAIN output
 *
 * Databend EXPLAIN output is typically indented text showing the query plan tree.
 * Example:
 * "Filter"
 * "├── filters: [employees.organisation_id = 1]"
 * "├── TableScan"
 * "│   ├── table: employees"
 * "│   ├── estimated rows: 1000"
 */
export declare function parseDatabendExplain(rawOutput: string[], sqlQuery: {
    sql: string;
    params?: unknown[];
}): ExplainResult;

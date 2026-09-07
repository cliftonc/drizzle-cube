import { ExplainResult } from '../types/executor.js';
/**
 * SQLite EXPLAIN QUERY PLAN row structure
 */
interface SQLiteExplainRow {
    id: number;
    parent: number;
    notused: number;
    detail: string;
}
/**
 * Parse SQLite EXPLAIN QUERY PLAN output
 *
 * SQLite EXPLAIN QUERY PLAN returns rows with columns:
 * id, parent, notused, detail
 *
 * The 'detail' column contains human-readable operation descriptions
 */
export declare function parseSQLiteExplain(rows: SQLiteExplainRow[], sqlQuery: {
    sql: string;
    params?: unknown[];
}): ExplainResult;
export {};

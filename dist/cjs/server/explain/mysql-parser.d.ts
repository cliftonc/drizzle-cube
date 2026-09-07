import { ExplainResult } from '../types/executor.js';
/**
 * MySQL EXPLAIN row structure
 * Standard columns returned by EXPLAIN
 */
interface MySQLExplainRow {
    id: number;
    select_type: string;
    table: string | null;
    partitions: string | null;
    type: string;
    possible_keys: string | null;
    key: string | null;
    key_len: string | null;
    ref: string | null;
    rows: number;
    filtered: number;
    Extra: string | null;
}
/**
 * Parse MySQL EXPLAIN output
 *
 * MySQL EXPLAIN returns rows with columns:
 * id, select_type, table, partitions, type, possible_keys, key, key_len, ref, rows, filtered, Extra
 *
 * The 'type' column indicates access method:
 * - ALL: Full table scan (like Seq Scan)
 * - index: Full index scan
 * - range: Index range scan
 * - ref: Index lookup using non-unique index
 * - eq_ref: Index lookup using unique index
 * - const: Single row lookup
 */
export declare function parseMySQLExplain(rows: MySQLExplainRow[], sqlQuery: {
    sql: string;
    params?: unknown[];
}): ExplainResult;
export {};

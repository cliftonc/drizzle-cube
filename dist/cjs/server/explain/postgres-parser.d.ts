import { ExplainResult } from '../types/executor.js';
/**
 * Parse PostgreSQL EXPLAIN output (text format)
 *
 * Example input:
 * "Hash Join  (cost=1.09..2.19 rows=1 width=68)"
 * "  Hash Cond: (e.department_id = d.id)"
 * "  ->  Seq Scan on employees e  (cost=0.00..1.05 rows=5 width=44)"
 * "        Filter: (organisation_id = 'org-1'::text)"
 * "  ->  Hash  (cost=1.04..1.04 rows=4 width=36)"
 * "        ->  Seq Scan on departments d  (cost=0.00..1.04 rows=4 width=36)"
 * "Planning Time: 0.123 ms"
 * "Execution Time: 0.456 ms"  (only with ANALYZE)
 */
export declare function parsePostgresExplain(rawOutput: string[], sqlQuery: {
    sql: string;
    params?: unknown[];
}): ExplainResult;

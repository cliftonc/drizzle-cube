import { SQL } from 'drizzle-orm';
/**
 * Rebuild a parameterized SQL string into a Drizzle SQL object with `params`
 * bound as real driver parameters.
 *
 * @param sqlString - SQL produced by Drizzle's `.toSQL()`, containing either `?`
 *   placeholders (mysql/sqlite/singlestore/snowflake) or `$n` placeholders
 *   (postgres/duckdb/databend)
 * @param params - Bound parameter values, in order
 * @param style - Placeholder style used by `sqlString`
 */
export declare function buildBoundSql(sqlString: string, params: unknown[], style: 'question' | 'dollar'): SQL;
/**
 * Normalize raw MySQL EXPLAIN result rows into the column shape the MySQL parser
 * expects. Extracted from MySQLExecutor.explainQuery to keep that method simple.
 */
export declare function normalizeMySQLExplainRows(result: unknown): any[];
/**
 * Normalize raw SQLite EXPLAIN QUERY PLAN result rows into the column shape the
 * SQLite parser expects. Extracted from SQLiteExecutor.explainQuery.
 */
export declare function normalizeSQLiteExplainRows(result: unknown): any[];
/**
 * Extract the textual plan lines from PostgreSQL EXPLAIN result rows. Handles the
 * differing column-name casing across drivers. Extracted from
 * PostgresExecutor.explainQuery.
 */
export declare function extractPostgresExplainLines(rows: any[]): string[];

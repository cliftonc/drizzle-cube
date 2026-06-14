/**
 * Shared EXPLAIN helpers
 *
 * Re-inlining bound parameter values into a raw SQL string is unsafe: dialects
 * that treat backslash as a string escape (MySQL, MariaDB, SingleStore, Snowflake)
 * can be tricked out of a quoted literal even with quote-doubling, allowing SQL
 * injection through filter values. Instead, rebuild the parameterized SQL into a
 * Drizzle `SQL` object whose values are passed to the driver as real bind
 * parameters, so EXPLAIN runs the exact statement the query would run with no
 * string interpolation of user input.
 */

import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

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
export function buildBoundSql(
  sqlString: string,
  params: unknown[],
  style: 'question' | 'dollar'
): SQL {
  const chunks: SQL[] = []

  if (style === 'question') {
    // Split on `?`; Drizzle parameterizes every value, so `?` only appears as a
    // placeholder. segments.length === (placeholder count) + 1.
    const segments = sqlString.split('?')
    chunks.push(sql.raw(segments[0]))
    for (let i = 1; i < segments.length; i++) {
      chunks.push(sql`${params[i - 1]}`)
      chunks.push(sql.raw(segments[i]))
    }
  } else {
    // `$n` placeholders may repeat or appear out of order; index into params by n.
    const re = /\$(\d+)/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = re.exec(sqlString)) !== null) {
      chunks.push(sql.raw(sqlString.slice(lastIndex, match.index)))
      const paramIndex = parseInt(match[1], 10) - 1
      chunks.push(sql`${params[paramIndex]}`)
      lastIndex = match.index + match[0].length
    }
    chunks.push(sql.raw(sqlString.slice(lastIndex)))
  }

  return sql.join(chunks)
}

/** Coerce a result-set value to an object record, or null if it isn't one. */
function asRecord(row: unknown): Record<string, unknown> | null {
  if (row && typeof row === 'object') {
    return row as Record<string, unknown>
  }
  return null
}

/**
 * Normalize raw MySQL EXPLAIN result rows into the column shape the MySQL parser
 * expects. Extracted from MySQLExecutor.explainQuery to keep that method simple.
 */
export function normalizeMySQLExplainRows(result: unknown): any[] {
  if (!Array.isArray(result)) return []
  const rows: Record<string, unknown>[] = []
  for (const raw of result) {
    const row = asRecord(raw)
    if (!row) continue
    rows.push({
      id: row.id || 1,
      select_type: row.select_type || 'SIMPLE',
      table: row.table || null,
      partitions: row.partitions || null,
      type: row.type || 'ALL',
      possible_keys: row.possible_keys || null,
      key: row.key || null,
      key_len: row.key_len || null,
      ref: row.ref || null,
      rows: Number(row.rows) || 0,
      filtered: Number(row.filtered) || 100,
      Extra: row.Extra || null,
    })
  }
  return rows
}

/**
 * Normalize raw SQLite EXPLAIN QUERY PLAN result rows into the column shape the
 * SQLite parser expects. Extracted from SQLiteExecutor.explainQuery.
 */
export function normalizeSQLiteExplainRows(result: unknown): any[] {
  if (!Array.isArray(result)) return []
  const rows: Record<string, unknown>[] = []
  for (const raw of result) {
    const row = asRecord(raw)
    if (!row) continue
    rows.push({
      id: Number(row.id) || 0,
      parent: Number(row.parent) || 0,
      notused: Number(row.notused) || 0,
      detail: String(row.detail || ''),
    })
  }
  return rows
}

/**
 * Extract the textual plan lines from PostgreSQL EXPLAIN result rows. Handles the
 * differing column-name casing across drivers. Extracted from
 * PostgresExecutor.explainQuery.
 */
export function extractPostgresExplainLines(rows: any[]): string[] {
  const rawLines: string[] = []
  for (const raw of rows) {
    const row = asRecord(raw)
    if (!row) continue
    const planLine = row['QUERY PLAN'] || row['query plan'] || row['queryplan']
    if (typeof planLine === 'string') {
      rawLines.push(planLine)
    }
  }
  return rawLines
}

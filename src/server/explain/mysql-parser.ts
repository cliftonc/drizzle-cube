/**
 * MySQL EXPLAIN output parser
 * Parses MySQL EXPLAIN output and normalizes to common structure
 */

import type { ExplainOperation, ExplainResult, ExplainSummary } from '../types/executor'

/**
 * MySQL EXPLAIN row structure
 * Standard columns returned by EXPLAIN
 */
interface MySQLExplainRow {
  id: number
  select_type: string
  table: string | null
  partitions: string | null
  type: string // ALL, index, range, ref, eq_ref, const, system, NULL
  possible_keys: string | null
  key: string | null
  key_len: string | null
  ref: string | null
  rows: number
  filtered: number
  Extra: string | null
}

/**
 * Map MySQL access types to normalized operation types
 */
function mapMySQLAccessType(type: string, extra: string | null): string {
  const extraLower = extra?.toLowerCase() || ''

  switch (type.toLowerCase()) {
    case 'all':
      return 'Seq Scan' // Full table scan
    case 'index':
      return extraLower.includes('using index')
        ? 'Index Only Scan'
        : 'Index Scan'
    case 'range':
      return 'Index Range Scan'
    case 'ref':
    case 'eq_ref':
      return 'Index Lookup'
    case 'const':
    case 'system':
      return 'Const Lookup'
    case 'null':
      return 'No Table'
    default:
      return `MySQL ${type}`
  }
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
export function parseMySQLExplain(
  rows: MySQLExplainRow[],
  sqlQuery: { sql: string; params?: unknown[] }
): ExplainResult {
  const operations: ExplainOperation[] = []
  const usedIndexes: string[] = []
  let hasSequentialScans = false
  let totalCost = 0

  for (const row of rows) {
    const operationType = mapMySQLAccessType(row.type, row.Extra)

    // Track sequential scans
    if (row.type.toLowerCase() === 'all') {
      hasSequentialScans = true
    }

    // Track used indexes
    if (row.key) {
      usedIndexes.push(row.key)
    }

    // Build operation
    const operation: ExplainOperation = {
      type: operationType,
      table: row.table || undefined,
      index: row.key || undefined,
      estimatedRows: row.rows,
      // MySQL doesn't have direct cost, estimate from rows
      estimatedCost: row.rows,
    }

    // Add filter info from Extra column
    if (row.Extra) {
      const filters: string[] = []

      if (row.Extra.includes('Using where')) {
        filters.push('WHERE filter applied')
      }
      if (row.Extra.includes('Using filesort')) {
        filters.push('Filesort required')
      }
      if (row.Extra.includes('Using temporary')) {
        filters.push('Temporary table required')
      }
      if (row.Extra.includes('Using join buffer')) {
        filters.push('Join buffer used')
      }

      if (filters.length > 0) {
        operation.details = filters.join('; ')
      }

      // Full Extra as filter for detailed info
      operation.filter = row.Extra
    }

    operations.push(operation)
    totalCost += row.rows
  }

  const summary: ExplainSummary = {
    database: 'mysql',
    planningTime: undefined, // MySQL doesn't report planning time in standard EXPLAIN
    executionTime: undefined, // Only available with EXPLAIN ANALYZE in MySQL 8.0.18+
    totalCost,
    hasSequentialScans,
    usedIndexes: [...new Set(usedIndexes)],
  }

  // Format raw output as a table-like string
  const rawLines = [
    'id\tselect_type\ttable\ttype\tpossible_keys\tkey\trows\tExtra',
    ...rows.map(
      (r) =>
        `${r.id}\t${r.select_type}\t${r.table || 'NULL'}\t${r.type}\t${r.possible_keys || 'NULL'}\t${r.key || 'NULL'}\t${r.rows}\t${r.Extra || ''}`
    ),
  ]

  return {
    operations,
    summary,
    raw: rawLines.join('\n'),
    sql: sqlQuery,
  }
}

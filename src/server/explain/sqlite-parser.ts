/**
 * SQLite EXPLAIN QUERY PLAN output parser
 * Parses SQLite EXPLAIN QUERY PLAN output and normalizes to common structure
 */

import type { ExplainOperation, ExplainResult, ExplainSummary } from '../types/executor'

/**
 * SQLite EXPLAIN QUERY PLAN row structure
 */
interface SQLiteExplainRow {
  id: number
  parent: number
  notused: number
  detail: string
}

/**
 * Parse SQLite EXPLAIN QUERY PLAN detail string
 *
 * Examples:
 * "SCAN employees"
 * "SEARCH employees USING INDEX idx_org_id (organisation_id=?)"
 * "SEARCH departments USING INTEGER PRIMARY KEY (rowid=?)"
 * "USE TEMP B-TREE FOR ORDER BY"
 * "COMPOUND QUERY"
 */
function parseSQLiteDetail(detail: string): {
  type: string
  table?: string
  index?: string
  filter?: string
} {
  const detailLower = detail.toLowerCase()

  // SCAN = sequential scan
  const scanMatch = detail.match(/^SCAN\s+(\S+)/i)
  if (scanMatch) {
    return {
      type: 'Seq Scan',
      table: scanMatch[1],
    }
  }

  // SEARCH USING INDEX = index scan
  const indexMatch = detail.match(
    /^SEARCH\s+(\S+)\s+USING\s+(?:COVERING\s+)?INDEX\s+(\S+)(?:\s+\((.+)\))?/i
  )
  if (indexMatch) {
    return {
      type: 'Index Scan',
      table: indexMatch[1],
      index: indexMatch[2],
      filter: indexMatch[3],
    }
  }

  // SEARCH USING INTEGER PRIMARY KEY = primary key lookup
  const pkMatch = detail.match(
    /^SEARCH\s+(\S+)\s+USING\s+INTEGER\s+PRIMARY\s+KEY\s+\((.+)\)/i
  )
  if (pkMatch) {
    return {
      type: 'Primary Key Lookup',
      table: pkMatch[1],
      filter: pkMatch[2],
    }
  }

  // SEARCH without index = partial scan
  const searchMatch = detail.match(/^SEARCH\s+(\S+)/i)
  if (searchMatch) {
    return {
      type: 'Search',
      table: searchMatch[1],
    }
  }

  // USE TEMP B-TREE = sorting/grouping
  if (detailLower.includes('temp b-tree')) {
    if (detailLower.includes('order by')) {
      return { type: 'Sort' }
    }
    if (detailLower.includes('group by')) {
      return { type: 'Group' }
    }
    if (detailLower.includes('distinct')) {
      return { type: 'Distinct' }
    }
    return { type: 'Temp B-Tree' }
  }

  // COMPOUND QUERY = UNION/INTERSECT/EXCEPT
  if (detailLower.includes('compound')) {
    return { type: 'Compound Query' }
  }

  // SUBQUERY = subquery
  if (detailLower.includes('subquery')) {
    return { type: 'Subquery' }
  }

  // CO-ROUTINE = CTE or view materialization
  if (detailLower.includes('co-routine')) {
    return { type: 'Coroutine' }
  }

  // Default: use the detail as type
  return { type: detail }
}

/**
 * Parse SQLite EXPLAIN QUERY PLAN output
 *
 * SQLite EXPLAIN QUERY PLAN returns rows with columns:
 * id, parent, notused, detail
 *
 * The 'detail' column contains human-readable operation descriptions
 */
export function parseSQLiteExplain(
  rows: SQLiteExplainRow[],
  sqlQuery: { sql: string; params?: unknown[] }
): ExplainResult {
  const operations: ExplainOperation[] = []
  const usedIndexes: string[] = []
  let hasSequentialScans = false

  // Build a map of id -> operation for parent lookup
  const opMap = new Map<number, ExplainOperation>()

  for (const row of rows) {
    const parsed = parseSQLiteDetail(row.detail)

    // Track sequential scans
    if (parsed.type === 'Seq Scan') {
      hasSequentialScans = true
    }

    // Track used indexes
    if (parsed.index) {
      usedIndexes.push(parsed.index)
    }

    const operation: ExplainOperation = {
      type: parsed.type,
      table: parsed.table,
      index: parsed.index,
      filter: parsed.filter,
      details: row.detail, // Keep original detail for reference
    }

    opMap.set(row.id, operation)

    // Find parent and add as child, or add to root
    if (row.parent === 0) {
      operations.push(operation)
    } else {
      const parent = opMap.get(row.parent)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(operation)
      } else {
        // Parent not found, add to root
        operations.push(operation)
      }
    }
  }

  const summary: ExplainSummary = {
    database: 'sqlite',
    planningTime: undefined, // SQLite doesn't report timing
    executionTime: undefined,
    totalCost: undefined, // SQLite doesn't report costs
    hasSequentialScans,
    usedIndexes: [...new Set(usedIndexes)],
  }

  // Format raw output
  const rawLines = [
    'id\tparent\tdetail',
    ...rows.map((r) => `${r.id}\t${r.parent}\t${r.detail}`),
  ]

  return {
    operations,
    summary,
    raw: rawLines.join('\n'),
    sql: sqlQuery,
  }
}

/**
 * DuckDB EXPLAIN output parser
 * DuckDB uses a similar format to PostgreSQL but with some differences
 * Parses text format EXPLAIN output and normalizes to common structure
 */

import type { ExplainOperation, ExplainResult, ExplainSummary } from '../types/executor'

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
export function parseDuckDBExplain(
  rawOutput: string[],
  sqlQuery: { sql: string; params?: unknown[] }
): ExplainResult {
  const operations: ExplainOperation[] = []
  const usedIndexes: string[] = []
  let hasSequentialScans = false
  let totalCost: number | undefined

  // Stack for building hierarchical structure
  const stack: { indent: number; op: ExplainOperation }[] = []

  for (const line of rawOutput) {
    // Skip decorative lines (box drawing characters)
    if (/^[┌├└│─┐┤┘]+$/.test(line.trim())) continue
    if (/EXPLANATION|QUERY PLAN/i.test(line)) continue

    // Parse operation lines
    const operation = parseDuckDBOperationLine(line)
    if (operation) {
      // Track sequential scans and indexes
      if (operation.type.includes('SEQ_SCAN') || operation.type.includes('TABLE_SCAN')) {
        hasSequentialScans = true
      }
      if (operation.type.includes('INDEX_SCAN') && operation.index) {
        usedIndexes.push(operation.index)
      }

      // Track total cost (from root operation)
      if (operations.length === 0 && operation.estimatedCost !== undefined) {
        totalCost = operation.estimatedCost
      }

      // Calculate indentation level (count tree characters)
      const indent = countTreeIndent(line)

      // Pop stack until we find a parent with less indentation
      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop()
      }

      if (stack.length === 0) {
        // Root level operation
        operations.push(operation)
      } else {
        // Child operation
        const parent = stack[stack.length - 1].op
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(operation)
      }

      stack.push({ indent, op: operation })
    }
  }

  const summary: ExplainSummary = {
    database: 'duckdb',
    planningTime: undefined,
    executionTime: undefined,
    totalCost,
    hasSequentialScans,
    usedIndexes: [...new Set(usedIndexes)],
  }

  return {
    operations,
    summary,
    raw: rawOutput.join('\n'),
    sql: sqlQuery,
  }
}

/**
 * Count indentation level based on tree drawing characters
 */
function countTreeIndent(line: string): number {
  let indent = 0
  for (const char of line) {
    if (char === ' ' || char === '│' || char === '├' || char === '└' || char === '─') {
      indent++
    } else {
      break
    }
  }
  return indent
}

/**
 * Parse a single DuckDB EXPLAIN line
 */
function parseDuckDBOperationLine(line: string): ExplainOperation | null {
  // Remove tree drawing characters and trim
  const trimmed = line
    .replace(/[┌├└│─┐┤┘]/g, '')
    .replace(/^\s*/, '')
    .trim()

  if (!trimmed) return null

  // Match DuckDB operation pattern
  // Examples:
  // "HASH_JOIN"
  // "SEQ_SCAN employees"
  // "INDEX_SCAN idx_employees_org on employees"
  // "FILTER (organisation_id = 'org-1')"
  // "(cost=100.0 rows=1000)"

  // Check for cost line
  const costMatch = trimmed.match(/^\(cost=([\d.]+)\s+rows=(\d+)\)$/i)
  if (costMatch) {
    // This is a cost annotation, not an operation
    return null
  }

  // Match operation with optional table/index
  const opMatch = trimmed.match(
    /^([A-Z_]+)(?:\s+(\S+))?(?:\s+on\s+(\S+))?(?:\s+\(cost=([\d.]+)\s+rows=(\d+)\))?/i
  )

  if (!opMatch) {
    // Check for filter pattern
    const filterMatch = trimmed.match(/^FILTER\s+(.+)$/i)
    if (filterMatch) {
      return {
        type: 'FILTER',
        filter: filterMatch[1],
      }
    }
    return null
  }

  const type = opMatch[1].toUpperCase()
  let table = opMatch[2] || undefined
  let index = opMatch[3] || undefined
  const cost = opMatch[4] ? parseFloat(opMatch[4]) : undefined
  const rows = opMatch[5] ? parseInt(opMatch[5], 10) : undefined

  // For INDEX_SCAN format: "INDEX_SCAN <index_name>" or "INDEX_SCAN <index_name> on <table_name>"
  // opMatch[2] is the index name, opMatch[3] (after "on") is the table name
  if (type === 'INDEX_SCAN') {
    // Swap: what was captured as 'table' is actually the index name
    // and what was captured as 'index' (after "on") is actually the table name
    const actualIndex = table
    const actualTable = index
    index = actualIndex
    table = actualTable
  }

  const operation: ExplainOperation = {
    type,
    table,
    index,
    estimatedRows: rows,
    estimatedCost: cost,
  }

  return operation
}

/**
 * DuckDB EXPLAIN output parser
 * DuckDB uses a similar format to PostgreSQL but with some differences
 * Parses text format EXPLAIN output and normalizes to common structure
 */

import type { ExplainOperation, ExplainResult, ExplainSummary } from '../types/executor.js'
import { type ExplainStackEntry, countTreeIndent, pushOperationToTree } from './explain-tree.js'

/** Mutable accumulator for summary stats gathered while walking the plan. */
interface DuckDBPlanState {
  operations: ExplainOperation[]
  usedIndexes: string[]
  hasSequentialScans: boolean
  totalCost: number | undefined
  stack: ExplainStackEntry[]
}

/**
 * Process a single output line, updating plan state in place.
 * Skips decorative/header lines, then nests parsed operations into the tree.
 */
function processDuckDBLine(line: string, state: DuckDBPlanState): void {
  // Skip decorative lines (box drawing characters)
  if (/^[┌├└│─┐┤┘]+$/.test(line.trim())) return
  if (/EXPLANATION|QUERY PLAN/i.test(line)) return

  const operation = parseDuckDBOperationLine(line)
  if (!operation) return

  if (operation.type.includes('SEQ_SCAN') || operation.type.includes('TABLE_SCAN')) {
    state.hasSequentialScans = true
  }
  if (operation.type.includes('INDEX_SCAN') && operation.index) {
    state.usedIndexes.push(operation.index)
  }
  if (state.operations.length === 0 && operation.estimatedCost !== undefined) {
    state.totalCost = operation.estimatedCost
  }

  const indent = countTreeIndent(line)
  pushOperationToTree(state.stack, state.operations, operation, indent)
}

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
  const state: DuckDBPlanState = {
    operations: [],
    usedIndexes: [],
    hasSequentialScans: false,
    totalCost: undefined,
    stack: [],
  }

  for (const line of rawOutput) {
    processDuckDBLine(line, state)
  }

  const summary: ExplainSummary = {
    database: 'duckdb',
    planningTime: undefined,
    executionTime: undefined,
    totalCost: state.totalCost,
    hasSequentialScans: state.hasSequentialScans,
    usedIndexes: [...new Set(state.usedIndexes)],
  }

  return {
    operations: state.operations,
    summary,
    raw: rawOutput.join('\n'),
    sql: sqlQuery,
  }
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

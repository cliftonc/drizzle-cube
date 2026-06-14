/**
 * Databend EXPLAIN output parser
 * Parses text format EXPLAIN output and normalizes to common structure
 */

import type { ExplainOperation, ExplainResult, ExplainSummary } from '../types/executor'
import { type ExplainStackEntry, countTreeIndent, pushOperationToTree } from './explain-tree'

/** Mutable accumulator for summary stats gathered while walking the plan. */
interface DatabendPlanState {
  operations: ExplainOperation[]
  usedIndexes: string[]
  hasSequentialScans: boolean
  totalCost: number | undefined
  stack: ExplainStackEntry[]
}

/**
 * Process a single output line, updating plan state in place.
 */
function processDatabendLine(line: string, state: DatabendPlanState): void {
  if (!line.trim()) return

  const operation = parseDatabendOperationLine(line)
  if (!operation) return

  if (operation.type.includes('TableScan') || operation.type.includes('SCAN')) {
    state.hasSequentialScans = true
  }
  if (operation.type.includes('IndexScan') && operation.index) {
    state.usedIndexes.push(operation.index)
  }
  if (state.operations.length === 0 && operation.estimatedCost !== undefined) {
    state.totalCost = operation.estimatedCost
  }

  const indent = countTreeIndent(line)
  pushOperationToTree(state.stack, state.operations, operation, indent)
}

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
export function parseDatabendExplain(
  rawOutput: string[],
  sqlQuery: { sql: string; params?: unknown[] }
): ExplainResult {
  const state: DatabendPlanState = {
    operations: [],
    usedIndexes: [],
    hasSequentialScans: false,
    totalCost: undefined,
    stack: [],
  }

  for (const line of rawOutput) {
    processDatabendLine(line, state)
  }

  const summary: ExplainSummary = {
    database: 'databend',
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
 * Parse a single Databend EXPLAIN line
 */
function parseDatabendOperationLine(line: string): ExplainOperation | null {
  const trimmed = line
    .replace(/[┌├└│─┐┤┘]/g, '')
    .replace(/^\s*/, '')
    .trim()

  if (!trimmed) return null

  // Skip metadata lines (key: value format that aren't operations)
  if (/^(filters|table|estimated rows|output columns|push downs):/.test(trimmed)) {
    return null
  }

  // Match operation names (PascalCase or UPPER_CASE patterns)
  const opMatch = trimmed.match(
    /^([A-Z][A-Za-z_]+(?:\s+[A-Z][A-Za-z_]+)*)(?:\s+(\S+))?/
  )

  if (!opMatch) return null

  const type = opMatch[1]
  const table = opMatch[2] || undefined

  const rowsMatch = trimmed.match(/estimated rows:\s*(\d+)/i)
  const rows = rowsMatch ? parseInt(rowsMatch[1], 10) : undefined

  const operation: ExplainOperation = {
    type,
    table,
    estimatedRows: rows,
  }

  return operation
}

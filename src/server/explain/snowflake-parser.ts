/**
 * Snowflake EXPLAIN output parser
 * Parses text format EXPLAIN output and normalizes to common structure
 */

import type { ExplainOperation, ExplainResult, ExplainSummary } from '../types/executor'
import { type ExplainStackEntry, pushOperationToTree } from './explain-tree'

/** Mutable accumulator for summary stats gathered while walking the plan. */
interface SnowflakePlanState {
  operations: ExplainOperation[]
  usedIndexes: string[]
  hasSequentialScans: boolean
  totalCost: number | undefined
  stack: ExplainStackEntry[]
}

/**
 * Process a single output line, updating plan state in place.
 */
function processSnowflakeLine(line: string, state: SnowflakePlanState): void {
  if (!line.trim()) return

  const operation = parseSnowflakeOperationLine(line)
  if (!operation) return

  if (operation.type.includes('TableScan') || operation.type.includes('SCAN')) {
    state.hasSequentialScans = true
  }
  if (state.operations.length === 0 && operation.estimatedCost !== undefined) {
    state.totalCost = operation.estimatedCost
  }

  const indent = countIndent(line)
  pushOperationToTree(state.stack, state.operations, operation, indent)
}

/**
 * Parse Snowflake EXPLAIN output
 *
 * Snowflake EXPLAIN output shows the query plan as indented text.
 * Example:
 * "GlobalStats:"
 * "    partitionsTotal=1"
 * "    partitionsAssigned=1"
 * "1:0     ->Result"
 * "1:1         ->Filter"
 * "1:2             ->TableScan"
 */
export function parseSnowflakeExplain(
  rawOutput: string[],
  sqlQuery: { sql: string; params?: unknown[] }
): ExplainResult {
  const state: SnowflakePlanState = {
    operations: [],
    usedIndexes: [],
    hasSequentialScans: false,
    totalCost: undefined,
    stack: [],
  }

  for (const line of rawOutput) {
    processSnowflakeLine(line, state)
  }

  const summary: ExplainSummary = {
    database: 'snowflake',
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
 * Count indentation level
 */
function countIndent(line: string): number {
  let indent = 0
  for (const char of line) {
    if (char === ' ' || char === '-' || char === '>') {
      indent++
    } else {
      break
    }
  }
  return indent
}

/**
 * Parse a single Snowflake EXPLAIN line
 */
function parseSnowflakeOperationLine(line: string): ExplainOperation | null {
  const trimmed = line
    .replace(/^[\s\d:]*->/, '')
    .trim()

  if (!trimmed) return null

  // Skip metadata lines
  if (/^(GlobalStats|partitions|bytes):/i.test(trimmed)) {
    return null
  }
  if (/^\w+=\d+/.test(trimmed)) {
    return null
  }

  // Match operation names
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

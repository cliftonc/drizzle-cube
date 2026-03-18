/**
 * Snowflake EXPLAIN output parser
 * Parses text format EXPLAIN output and normalizes to common structure
 */

import type { ExplainOperation, ExplainResult, ExplainSummary } from '../types/executor'

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
  const operations: ExplainOperation[] = []
  const usedIndexes: string[] = []
  let hasSequentialScans = false
  let totalCost: number | undefined

  const stack: { indent: number; op: ExplainOperation }[] = []

  for (const line of rawOutput) {
    if (!line.trim()) continue

    const operation = parseSnowflakeOperationLine(line)
    if (operation) {
      if (operation.type.includes('TableScan') || operation.type.includes('SCAN')) {
        hasSequentialScans = true
      }

      if (operations.length === 0 && operation.estimatedCost !== undefined) {
        totalCost = operation.estimatedCost
      }

      const indent = countIndent(line)

      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop()
      }

      if (stack.length === 0) {
        operations.push(operation)
      } else {
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
    database: 'snowflake',
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

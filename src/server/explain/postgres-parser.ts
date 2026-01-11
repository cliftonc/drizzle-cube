/**
 * PostgreSQL EXPLAIN output parser
 * Parses text format EXPLAIN output and normalizes to common structure
 */

import type { ExplainOperation, ExplainResult, ExplainSummary } from '../types/executor'

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
export function parsePostgresExplain(
  rawOutput: string[],
  sqlQuery: { sql: string; params?: unknown[] }
): ExplainResult {
  const operations: ExplainOperation[] = []
  const usedIndexes: string[] = []
  let hasSequentialScans = false
  let planningTime: number | undefined
  let executionTime: number | undefined
  let totalCost: number | undefined

  // Stack for building hierarchical structure based on indentation
  const stack: { indent: number; op: ExplainOperation }[] = []

  for (const line of rawOutput) {
    // Check for timing information
    const planningMatch = line.match(/Planning Time:\s*([\d.]+)\s*ms/i)
    if (planningMatch) {
      planningTime = parseFloat(planningMatch[1])
      continue
    }

    const executionMatch = line.match(/Execution Time:\s*([\d.]+)\s*ms/i)
    if (executionMatch) {
      executionTime = parseFloat(executionMatch[1])
      continue
    }

    // Parse operation lines
    const operation = parsePostgresOperationLine(line)
    if (operation) {
      // Track sequential scans and indexes
      if (operation.type.includes('Seq Scan')) {
        hasSequentialScans = true
      }
      if (operation.index) {
        usedIndexes.push(operation.index)
      }

      // Track total cost (from root operation)
      if (operations.length === 0 && operation.estimatedCost !== undefined) {
        totalCost = operation.estimatedCost
      }

      // Calculate indentation level
      const indent = line.search(/\S/)

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
    database: 'postgres',
    planningTime,
    executionTime,
    totalCost,
    hasSequentialScans,
    usedIndexes: [...new Set(usedIndexes)], // Deduplicate
  }

  return {
    operations,
    summary,
    raw: rawOutput.join('\n'),
    sql: sqlQuery,
  }
}

/**
 * Parse a single PostgreSQL EXPLAIN line
 */
function parsePostgresOperationLine(line: string): ExplainOperation | null {
  // Skip empty lines and arrow prefixes
  const trimmed = line.replace(/^[\s->]+/, '').trim()
  if (!trimmed) return null

  // Match operation pattern: "Operation Type on table (cost=X..Y rows=N width=W)"
  // Examples:
  // "Seq Scan on employees e  (cost=0.00..1.05 rows=5 width=44)"
  // "Index Scan using idx_name on table  (cost=0.00..1.05 rows=5 width=44)"
  // "Hash Join  (cost=1.09..2.19 rows=1 width=68)"

  const opMatch = trimmed.match(
    /^([A-Za-z][A-Za-z0-9 ]+?)(?:\s+using\s+(\S+))?(?:\s+on\s+(\S+))?(?:\s+\w+)?(?:\s+\(cost=([\d.]+)\.\.([\d.]+)\s+rows=(\d+)(?:\s+width=\d+)?\))?(?:\s+\(actual time=([\d.]+)\.\.([\d.]+)\s+rows=(\d+)\s+loops=(\d+)\))?/i
  )

  if (!opMatch) {
    // Check for filter lines
    const filterMatch = trimmed.match(/^Filter:\s*(.+)$/i)
    if (filterMatch) {
      return null // Filters are attached to operations, not standalone
    }

    // Check for hash/join condition lines
    const condMatch = trimmed.match(/^(Hash Cond|Join Filter|Index Cond):\s*(.+)$/i)
    if (condMatch) {
      return null // Conditions are attached to operations
    }

    return null
  }

  const type = opMatch[1].trim()
  const index = opMatch[2] || undefined
  const table = opMatch[3] || undefined
  // opMatch[4] is startCost, opMatch[7] is actualTime - captured but not used currently
  const endCost = opMatch[5] ? parseFloat(opMatch[5]) : undefined
  const estimatedRows = opMatch[6] ? parseInt(opMatch[6], 10) : undefined
  const actualRows = opMatch[9] ? parseInt(opMatch[9], 10) : undefined

  const operation: ExplainOperation = {
    type,
    table,
    index,
    estimatedRows,
    estimatedCost: endCost, // Use end cost as the operation cost
  }

  if (actualRows !== undefined) {
    operation.actualRows = actualRows
  }

  // Look for filter in the same line or nearby
  const filterMatch = line.match(/Filter:\s*(.+?)(?:\)|$)/i)
  if (filterMatch) {
    operation.filter = filterMatch[1].trim()
  }

  return operation
}

/**
 * Window function expression construction helpers.
 *
 * Extracted from BaseDatabaseAdapter.buildWindowFunction to keep the per-branch
 * frame/OVER assembly and the per-type expression switch out of a single
 * high-complexity method. Standard SQL:2003 window syntax — identical across all
 * supported engines.
 */

import { sql, type SQL, type AnyColumn } from 'drizzle-orm'
import type { WindowFunctionType, WindowFunctionConfig } from './base-adapter.js'

type FieldExpr = AnyColumn | SQL | null

/** Build the PARTITION BY clause (empty SQL when no partitions). */
function buildPartitionClause(partitionBy?: (AnyColumn | SQL)[]): SQL {
  return partitionBy && partitionBy.length > 0
    ? sql`PARTITION BY ${sql.join(partitionBy, sql`, `)}`
    : sql``
}

/** Build the ORDER BY clause (empty SQL when no ordering). */
function buildOrderClause(
  orderBy?: Array<{ field: AnyColumn | SQL; direction: 'asc' | 'desc' }>
): SQL {
  return orderBy && orderBy.length > 0
    ? sql`ORDER BY ${sql.join(orderBy.map(o =>
        o.direction === 'desc' ? sql`${o.field} DESC` : sql`${o.field} ASC`
      ), sql`, `)}`
    : sql``
}

/** Render a frame boundary keyword for the start position. */
function frameStartKeyword(start: number | 'unbounded'): string {
  if (start === 'unbounded') return 'UNBOUNDED PRECEDING'
  if (typeof start === 'number') return `${start} PRECEDING`
  return 'CURRENT ROW'
}

/** Render a frame boundary keyword for the end position. */
function frameEndKeyword(end: number | 'current' | 'unbounded'): string {
  if (end === 'unbounded') return 'UNBOUNDED FOLLOWING'
  if (end === 'current') return 'CURRENT ROW'
  if (typeof end === 'number') return `${end} FOLLOWING`
  return 'CURRENT ROW'
}

/** Build the frame clause (ROWS/RANGE BETWEEN ...) when a frame is configured. */
function buildFrameClause(frame?: WindowFunctionConfig['frame']): SQL {
  if (!frame) return sql``
  const frameTypeStr = frame.type.toUpperCase()
  const startStr = frameStartKeyword(frame.start)
  const endStr = frameEndKeyword(frame.end)
  return sql`${sql.raw(frameTypeStr)} BETWEEN ${sql.raw(startStr)} AND ${sql.raw(endStr)}`
}

/** Build the full `OVER (...)` clause from partition/order/frame components. */
export function buildWindowOverClause(
  partitionBy?: (AnyColumn | SQL)[],
  orderBy?: Array<{ field: AnyColumn | SQL; direction: 'asc' | 'desc' }>,
  config?: WindowFunctionConfig
): SQL {
  const overParts: SQL[] = []
  if (partitionBy && partitionBy.length > 0) overParts.push(buildPartitionClause(partitionBy))
  if (orderBy && orderBy.length > 0) overParts.push(buildOrderClause(orderBy))
  if (config?.frame) overParts.push(buildFrameClause(config.frame))

  const overContent = overParts.length > 0 ? sql.join(overParts, sql` `) : sql``
  return sql`OVER (${overContent})`
}

/** Build a LAG/LEAD expression with optional offset and default value. */
function buildOffsetExpression(
  fn: 'LAG' | 'LEAD',
  fieldExpr: FieldExpr,
  over: SQL,
  config?: WindowFunctionConfig
): SQL {
  const defaultClause = config?.defaultValue !== undefined ? sql`, ${config.defaultValue}` : sql``
  return sql`${sql.raw(fn)}(${fieldExpr}, ${config?.offset ?? 1}${defaultClause}) ${over}`
}

/** Map of zero-argument window functions to their SQL function name. */
const SIMPLE_WINDOW_FNS: Partial<Record<WindowFunctionType, string>> = {
  rank: 'RANK',
  denseRank: 'DENSE_RANK',
  rowNumber: 'ROW_NUMBER'
}

/** Map of single-field-argument window functions to their SQL function name. */
const FIELD_WINDOW_FNS: Partial<Record<WindowFunctionType, string>> = {
  firstValue: 'FIRST_VALUE',
  lastValue: 'LAST_VALUE',
  movingAvg: 'AVG',
  movingSum: 'SUM'
}

/** Build the window function expression for a given type and pre-built OVER clause. */
export function buildWindowExpression(
  type: WindowFunctionType,
  fieldExpr: FieldExpr,
  over: SQL,
  config?: WindowFunctionConfig
): SQL {
  if (type === 'lag' || type === 'lead') {
    return buildOffsetExpression(type === 'lag' ? 'LAG' : 'LEAD', fieldExpr, over, config)
  }
  if (type === 'ntile') {
    return sql`NTILE(${config?.nTile ?? 4}) ${over}`
  }

  const simpleFn = SIMPLE_WINDOW_FNS[type]
  if (simpleFn) return sql`${sql.raw(simpleFn)}() ${over}`

  const fieldFn = FIELD_WINDOW_FNS[type]
  if (fieldFn) return sql`${sql.raw(fieldFn)}(${fieldExpr}) ${over}`

  throw new Error(`Unsupported window function: ${type}`)
}

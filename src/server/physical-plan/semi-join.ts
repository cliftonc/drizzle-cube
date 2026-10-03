/**
 * Semi-join subqueries — `outer.col IN (SELECT inner.col FROM cube WHERE ...)`,
 * or a correlated `EXISTS` for composite keys.
 *
 * Used wherever a condition on one cube must be evaluated from a query that
 * does not have that cube's rows in scope: filters propagating into a
 * pre-aggregation CTE, and cross-cube OR groups whose branches live on opposite
 * sides of a CTE boundary. Security scoping is the caller's responsibility —
 * pass the cube's `where` (from `cube.sql(context)`) in `conditions`.
 */

import { and, eq, sql, SQL, type AnyColumn } from 'drizzle-orm'
import type { BaseQueryDefinition, QueryContext } from '../types/index.js'

/** One key pair linking the outer query's column to the subquery cube's column. */
export interface SemiJoinKeyPair {
  /** Column already in scope in the outer query */
  outer: AnyColumn
  /** Column on the subquery cube's table */
  inner: AnyColumn
}

/**
 * Apply a cube's BaseQueryDefinition.joins (intra-cube table-level joins)
 * to a Drizzle query/subquery built from cubeBase.from, so joined-table columns
 * are in scope for SELECTs and WHEREs.
 */
export function applyBaseJoins(
  query: any,
  cubeBase: Pick<BaseQueryDefinition, 'joins'>
): any {
  if (!cubeBase.joins) return query
  for (const join of cubeBase.joins) {
    switch (join.type || 'left') {
      case 'left':
        query = query.leftJoin(join.table, join.on)
        break
      case 'inner':
        query = query.innerJoin(join.table, join.on)
        break
      case 'right':
        query = query.rightJoin(join.table, join.on)
        break
      case 'full':
        query = query.fullJoin(join.table, join.on)
        break
    }
  }
  return query
}

/**
 * Build `outer IN (SELECT inner FROM cube WHERE conditions)` for a single key,
 * or `EXISTS (SELECT 1 FROM cube WHERE inner = outer AND ... AND conditions)`
 * for composite keys (portable across all engines).
 */
export function buildSemiJoinCondition(
  context: QueryContext,
  cubeBase: BaseQueryDefinition,
  keyPairs: SemiJoinKeyPair[],
  conditions: SQL[]
): SQL {
  if (keyPairs.length === 1) {
    const [{ outer, inner }] = keyPairs
    let subquery: any = context.db.select({ pk: inner }).from(cubeBase.from)
    subquery = applyBaseJoins(subquery, cubeBase)
    if (conditions.length > 0) {
      subquery = subquery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    }
    return sql`${outer} IN ${subquery}`
  }

  const existsWhere = and(
    ...keyPairs.map(({ outer, inner }) => eq(inner, outer)),
    ...conditions
  )
  let existsSubquery: any = context.db.select({ one: sql`1` }).from(cubeBase.from)
  existsSubquery = applyBaseJoins(existsSubquery, cubeBase)
  existsSubquery = existsSubquery.where(existsWhere)
  return sql`EXISTS ${existsSubquery}`
}

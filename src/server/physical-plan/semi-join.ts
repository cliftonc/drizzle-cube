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

import { and, eq, getTableName, sql, SQL, type AnyColumn } from 'drizzle-orm'
import { resolveCubeBase } from '../cube-utils.js'
import type { BaseQueryDefinition, Cube, QueryContext } from '../types/index.js'

/** One key pair linking the outer query's column to the subquery cube's column. */
export interface SemiJoinKeyPair {
  /** Column already in scope in the outer query */
  outer: AnyColumn
  /** Column on the subquery cube's table */
  inner: AnyColumn
  /** True when the join declares the inner column first */
  reversed: boolean
}

/** How a semi-join compares its keys. */
export interface SemiJoinOptions {
  /** Compare a single key in the order the join declares it, as composite keys always are */
  inDeclaredOrder?: boolean
}

export function toKeyPairs(
  keys: Array<{ source: AnyColumn; target: AnyColumn }>,
  reversed = false
): SemiJoinKeyPair[] {
  return keys.map(key => reversed
    ? { outer: key.target, inner: key.source, reversed }
    : { outer: key.source, inner: key.target, reversed })
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
 * or, for composite keys, `EXISTS` over a derived table of the matching rows'
 * keys, compared with the outer keys outside it (portable across all engines).
 * The outer keys stay outside the subquery's own tables, so they refer to the
 * outer row even when both sides read the same table. Composite keys compare
 * in the order the join declares them, as the row-level join does, because
 * SQLite takes a comparison's collation from its left column. `IN` compares
 * with the outer column on the left, so with `inDeclaredOrder` a single key
 * that the join declares inner column first takes the `EXISTS` form too.
 */
export function buildSemiJoinCondition(
  context: QueryContext,
  cubeBase: BaseQueryDefinition,
  keyPairs: SemiJoinKeyPair[],
  conditions: SQL[],
  { inDeclaredOrder = false }: SemiJoinOptions = {}
): SQL {
  if (keyPairs.length === 1 && !(inDeclaredOrder && keyPairs[0].reversed)) {
    const [{ outer, inner }] = keyPairs
    let subquery: any = context.db.select({ pk: inner }).from(cubeBase.from)
    subquery = applyBaseJoins(subquery, cubeBase)
    if (conditions.length > 0) {
      subquery = subquery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    }
    return sql`${outer} IN ${subquery}`
  }

  let keys: any = context.db
    .select(Object.fromEntries(keyPairs.map(({ inner }, index) => [`key${index}`, sql`${inner}`.as(`key${index}`)])))
    .from(cubeBase.from)
  keys = applyBaseJoins(keys, cubeBase)
  if (conditions.length > 0) {
    keys = keys.where(and(...conditions))
  }
  const outerNames = new Set(keyPairs.map(({ outer }) => getTableName(outer.table).toLowerCase()))
  let alias = 'semi_join_keys'
  for (let suffix = 1; outerNames.has(alias); suffix++) alias = `semi_join_keys_${suffix}`
  keys = keys.as(alias)
  const correlated = context.db
    .select({ one: sql`1` })
    .from(keys)
    .where(and(...keyPairs.map(({ outer, reversed }, index) =>
      reversed ? eq(keys[`key${index}`], outer) : eq(outer, keys[`key${index}`])
    )))
  return sql`EXISTS ${correlated}`
}

/**
 * Link the outer row to a cube's rows that meet `conditions` and the cube's
 * security condition.
 *
 * @param context - Query context that supplies the database and security context
 * @param cube - Cube whose rows the subquery reads
 * @param keyPairs - Columns that link the subquery to the outer row
 * @param conditions - Conditions on the cube's rows
 * @param options - How to compare the keys
 * @returns The condition
 */
export function buildCubeSemiJoin(
  context: QueryContext,
  cube: Cube,
  keyPairs: SemiJoinKeyPair[],
  conditions: SQL[],
  options?: SemiJoinOptions
): SQL {
  const cubeBase = resolveCubeBase(cube, context)
  return buildSemiJoinCondition(context, cubeBase, keyPairs, cubeBase.where ? [cubeBase.where, ...conditions] : conditions, options)
}

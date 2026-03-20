/**
 * Utility functions for cube definitions and query processing
 * Runtime utilities for working with cubes and SQL expressions
 */

import type { SQL, AnyColumn } from 'drizzle-orm'
import { and, eq, sql } from 'drizzle-orm'
import type {
  Cube,
  CubeJoin,
  QueryContext,
  MultiCubeQueryContext,
  SqlExpression,
  SecurityContext
} from './types'

/**
 * Resolve cube reference (handles direct, lazy, and string name references)
 *
 * String references are resolved from the optional `cubes` registry map.
 * Returns `null` when a string ref cannot be resolved (logs a warning).
 */
export function resolveCubeReference(
  ref: Cube | (() => Cube) | string,
  cubes?: Map<string, Cube>
): Cube | null {
  if (typeof ref === 'string') {
    if (!cubes) {
      console.warn(
        `[drizzle-cube] Cannot resolve string cube reference '${ref}': no cube registry provided. Join will be skipped.`
      )
      return null
    }
    const cube = cubes.get(ref)
    if (!cube) {
      console.warn(
        `[drizzle-cube] Cannot resolve cube reference '${ref}': no cube with that name is registered. ` +
        `Registered cubes: ${Array.from(cubes.keys()).join(', ') || '(none)'}. Join will be skipped.`
      )
      return null
    }
    return cube
  }
  return typeof ref === 'function' ? ref() : ref
}

/**
 * Reverse a semantic relationship type for bidirectional join path resolution.
 * When traversing a join edge in reverse (target→source instead of source→target),
 * the relationship semantics flip: belongsTo↔hasMany, hasOne stays hasOne,
 * belongsToMany stays belongsToMany (symmetric).
 */
export function reverseRelationship(relationship: string): string {
  switch (relationship) {
    case 'belongsTo':     return 'hasMany'
    case 'hasMany':       return 'belongsTo'
    case 'hasOne':        return 'hasOne'
    case 'belongsToMany': return 'belongsToMany'
    default:              return relationship
  }
}

/**
 * Derive SQL join type from semantic relationship
 */
export function getJoinType(relationship: string, override?: string): string {
  if (override) return override

  switch (relationship) {
    case 'belongsTo':      return 'inner'  // FK should exist
    case 'hasOne':         return 'left'   // Parent may have no child
    case 'hasMany':        return 'left'   // Parent may have no children
    case 'belongsToMany':  return 'left'   // Many-to-many through junction table
    default:               return 'left'   // Safe default
  }
}

/**
 * DRIZZLE ORM LIMITATION: SQL Object Mutation Protection
 *
 * Create an isolated copy of a SQL expression to prevent mutation issues
 * when the expression will be reused across multiple query contexts.
 *
 * ## Background
 *
 * Drizzle SQL objects are mutable - their internal `queryChunks` array can be
 * modified during query construction. When column objects (like employees.id)
 * are reused across multiple parts of a query (SELECT, WHERE, GROUP BY), this
 * mutation can cause:
 * - Duplicate SQL fragments in generated queries
 * - Incorrect parameter binding order
 * - Query execution failures
 *
 * ## Evidence from Drizzle Source Code
 *
 * Investigation of Drizzle ORM source code (/tmp/drizzle-orm/drizzle-orm/src/sql/sql.ts)
 * revealed:
 *
 * 1. SQL objects have a mutable `queryChunks` array (line 133)
 * 2. The `append()` method directly mutates this array
 * 3. No public `clone()` method exists (only internal SQL.Aliased.clone())
 * 4. The `sql` template function creates NEW arrays but chunks are pushed by reference
 *
 * ## The Double Wrapping Pattern
 *
 * `sql`${sql`${expr}`}`` creates two layers of SQL isolation:
 *
 * **Single wrap** (`sql`${expr}``):
 * - Creates a new SQL object
 * - But queryChunks contains REFERENCES to original objects
 * - Original objects can still be mutated
 *
 * **Double wrap** (`sql`${sql`${expr}`}``):
 * - Inner wrap: Creates fresh SQL from original expression
 * - Outer wrap: Creates complete isolation from shared state
 * - When Drizzle processes nested SQL, it recursively builds from inner chunks
 * - This prevents corruption when SQL expressions are reused
 *
 * ## When to Use
 *
 * - **resolveSqlExpression()**: ALWAYS (expressions may be reused)
 * - **buildMeasureExpression()**: ALWAYS (after resolveSqlExpression)
 * - **New aggregations**: Single wrap OK (creating fresh SQL for first time)
 *
 * ## Alternatives Investigated
 *
 * - ❌ Use Drizzle's clone() - Doesn't exist publicly
 * - ❌ Store SQL factory functions - Still returns same column objects
 * - ❌ Create fresh column references - Impossible, columns are singletons
 * - ❌ Avoid SQL reuse - Unavoidable (same dimension in SELECT, WHERE, GROUP BY)
 *
 * ## Performance Impact
 *
 * - Memory: ~200 bytes per wrap (negligible)
 * - CPU: Two function calls during query building (microseconds)
 * - No runtime query performance impact
 *
 * @param expr - SQL expression that may be reused across query contexts
 * @returns Isolated SQL expression safe for reuse
 */
export function isolateSqlExpression(expr: AnyColumn | SQL): SQL {
  if (expr && typeof expr === 'object') {
    return sql`${sql`${expr}`}`
  }
  return expr as SQL
}

/**
 * Sanitize a property key to prevent prototype pollution.
 * Keys in this codebase come from validated cube field names (e.g., "Cube.measure")
 * but CodeQL cannot trace that validation across module boundaries.
 */
export function safeKey(key: string): string {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    throw new Error(`Unsafe property key: ${key}`)
  }
  return key
}

/**
 * Helper to resolve SQL expressions with mutation protection
 *
 * Evaluates function-based SQL expressions and applies isolation to prevent
 * Drizzle's internal mutation from corrupting reused SQL objects.
 *
 * @param expr - Column, SQL object, or function that returns one
 * @param ctx - Query context for function evaluation
 * @returns Isolated SQL expression safe for reuse
 */
export function resolveSqlExpression(
  expr: AnyColumn | SQL | ((ctx: QueryContext) => AnyColumn | SQL),
  ctx: QueryContext
): AnyColumn | SQL {
  const result = typeof expr === 'function' ? expr(ctx) : expr
  return isolateSqlExpression(result)
}

/**
 * Helper to create multi-cube query context
 */
export function createMultiCubeContext(
  baseContext: QueryContext,
  cubes: Map<string, Cube>,
  currentCube: Cube
): MultiCubeQueryContext {
  return {
    ...baseContext,
    cubes,
    currentCube
  }
}

/**
 * Type guard to check if value is a function-based SQL expression
 */
export function isFunctionSqlExpression(
  expr: SqlExpression
): expr is (ctx: QueryContext) => AnyColumn | SQL {
  return typeof expr === 'function'
}

/**
 * Helper function to create cubes
 */
export function defineCube(
  name: string,
  definition: Omit<Cube, 'name'>
): Cube {
  return {
    name,
    ...definition
  }
}

/**
 * Expanded join information for belongsToMany relationships
 */
export interface ExpandedBelongsToManyJoin {
  /** Junction table joins */
  junctionJoins: Array<{
    joinType: 'inner' | 'left' | 'right' | 'full'
    table: any
    condition: SQL
  }>
  /** Security conditions for junction table (if any) */
  junctionSecurityConditions?: SQL[]
}

/**
 * Expand a belongsToMany join into junction table joins
 * This converts a many-to-many relationship into two separate joins:
 * 1. Source cube -> Junction table
 * 2. Junction table -> Target cube
 */
export function expandBelongsToManyJoin(
  joinDef: CubeJoin,
  securityContext: SecurityContext
): ExpandedBelongsToManyJoin {
  if (joinDef.relationship !== 'belongsToMany' || !joinDef.through) {
    throw new Error('expandBelongsToManyJoin can only be called on belongsToMany relationships with through configuration')
  }

  const { table, sourceKey, targetKey, securitySql } = joinDef.through

  // Build join conditions
  const sourceConditions: SQL[] = []
  for (const joinOn of sourceKey) {
    const comparator = joinOn.as || eq
    sourceConditions.push(comparator(joinOn.source as any, joinOn.target as any))
  }

  const targetConditions: SQL[] = []
  for (const joinOn of targetKey) {
    const comparator = joinOn.as || eq
    targetConditions.push(comparator(joinOn.source as any, joinOn.target as any))
  }

  // Get security conditions for junction table
  let junctionSecurityConditions: SQL[] | undefined
  if (securitySql) {
    const securityResult = securitySql(securityContext)
    junctionSecurityConditions = Array.isArray(securityResult) ? securityResult : [securityResult]
  }

  // Derive join type (belongsToMany uses LEFT joins)
  const joinType = getJoinType('belongsToMany', joinDef.sqlJoinType) as 'inner' | 'left' | 'right' | 'full'

  return {
    junctionJoins: [
      {
        joinType,
        table,
        condition: and(...sourceConditions)!
      },
      {
        joinType,
        table, // This will be replaced with target cube table in query planner
        condition: and(...targetConditions)!
      }
    ],
    junctionSecurityConditions
  }
}
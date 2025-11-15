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
 * Resolve cube reference (handles both direct and lazy references)
 */
export function resolveCubeReference(
  ref: Cube | (() => Cube)
): Cube {
  return typeof ref === 'function' ? ref() : ref
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
 * Helper to resolve SQL expressions
 *
 * IMPORTANT: SQL Wrapping Pattern - Why Double Wrapping?
 *
 * Drizzle SQL objects are internally mutable and share state through their `queryChunks` array.
 * When an SQL object is reused across multiple query contexts (e.g., in measure definitions
 * that get evaluated multiple times), the internal state can become corrupted, leading to:
 * - Duplicate SQL fragments
 * - Incorrect parameter ordering
 * - Query execution failures
 *
 * The double wrapping pattern `sql`${sql`${result}`}`` creates complete isolation by:
 * 1. Inner wrap: Creates a new SQL object with fresh queryChunks
 * 2. Outer wrap: Ensures the reference is completely independent
 *
 * This pattern is used consistently in:
 * - resolveSqlExpression() - Wraps all resolved SQL expressions (double wrap)
 * - buildMeasureExpression() - Wraps base measure expressions (single wrap, already fresh)
 *
 * When to use double vs single wrapping:
 * - Double wrap: When SQL objects may be reused/shared (e.g., cube SQL definitions)
 * - Single wrap: When creating fresh SQL for the first time (e.g., new aggregations)
 *
 * This is a defensive programming pattern to work around Drizzle's internal mutation behavior.
 * If Drizzle's SQL object handling changes in future versions, this pattern may be simplified.
 */
export function resolveSqlExpression(
  expr: AnyColumn | SQL | ((ctx: QueryContext) => AnyColumn | SQL),
  ctx: QueryContext
): AnyColumn | SQL {
  const result = typeof expr === 'function' ? expr(ctx) : expr

  // Apply double wrapping for complete SQL object isolation
  if (result && typeof result === 'object') {
    return sql`${sql`${result}`}`
  }

  return result
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
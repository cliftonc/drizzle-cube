/**
 * Utility functions for cube definitions and query processing
 * Runtime utilities for working with cubes and SQL expressions
 */

import type { SQL, AnyColumn } from 'drizzle-orm'
import type { 
  Cube, 
  QueryContext, 
  MultiCubeQueryContext,
  SqlExpression 
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
    case 'belongsTo': return 'inner'  // FK should exist
    case 'hasOne':    return 'left'   // Parent may have no child
    case 'hasMany':   return 'left'   // Parent may have no children
    default:          return 'left'   // Safe default
  }
}

/**
 * Helper to resolve SQL expressions
 */
export function resolveSqlExpression(
  expr: AnyColumn | SQL | ((ctx: QueryContext) => AnyColumn | SQL),
  ctx: QueryContext
): AnyColumn | SQL {
  if (typeof expr === 'function') {
    return expr(ctx)
  }
  return expr
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
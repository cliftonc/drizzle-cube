/**
 * Type utility helpers and type-level operations
 * Pure type definitions and type-level utilities
 */

import type { SQL, AnyColumn } from 'drizzle-orm'
import type { QueryContext } from './cube'

/**
 * Type-level utility to extract the schema type from a cube reference
 * Since we removed generics, this now returns 'any'
 */
export type ExtractSchemaFromCubeRef = any

/**
 * Type for SQL expressions that can be functions or direct values
 */
export type SqlExpression = 
  | AnyColumn 
  | SQL 
  | ((ctx: QueryContext) => AnyColumn | SQL)

/**
 * Type guard to check if value is a function-based SQL expression
 */
export function isFunctionSqlExpression(
  expr: SqlExpression
): expr is (ctx: QueryContext) => AnyColumn | SQL {
  return typeof expr === 'function'
}
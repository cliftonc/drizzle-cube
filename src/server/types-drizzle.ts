/**
 * Type definitions for dynamic Drizzle query building
 * This approach starts with a minimal base query and dynamically adds fields
 */

import type { SQL, AnyColumn } from 'drizzle-orm'
import type { 
  SecurityContext,
  MeasureType,
  DimensionType,
  SemanticQuery,
  QueryResult,
  DrizzleDatabase
} from './types'

/**
 * Base query definition that can be extended dynamically
 * Returns just the FROM/JOIN/WHERE setup, not a complete SELECT
 */
export interface BaseQueryDefinition {
  /** Main table to query from */
  from: any
  /** Optional joins to other tables */
  joins?: Array<{
    table: any
    on: SQL
    type?: 'left' | 'right' | 'inner' | 'full'
  }>
  /** Base WHERE conditions (typically security context filtering) */
  where?: SQL
}

/**
 * Query context for dynamic building
 */
export interface QueryContext<TSchema extends Record<string, any> = Record<string, any>> {
  /** Drizzle database instance */
  db: DrizzleDatabase<TSchema>
  /** Database schema */
  schema: TSchema
  /** Security context for filtering */
  securityContext: SecurityContext
}

/**
 * Cube definition focused on dynamic query building
 */
export interface Cube<TSchema extends Record<string, any> = Record<string, any>> {
  name: string
  title?: string
  description?: string
  
  /** 
   * Base query setup - returns the foundation that can be extended
   * Should return FROM/JOIN/WHERE setup, NOT a complete SELECT
   */
  sql: (ctx: QueryContext<TSchema>) => BaseQueryDefinition
  
  /** Cube dimensions using direct column references */
  dimensions: Record<string, Dimension<TSchema>>
  
  /** Cube measures using direct column references */
  measures: Record<string, Measure<TSchema>>
  
  /** Optional joins to other cubes for multi-cube queries */
  joins?: Record<string, CubeJoin<TSchema>>
}

/**
 * Dimension definition
 */
export interface Dimension<TSchema extends Record<string, any> = Record<string, any>> {
  name: string
  title?: string
  description?: string
  type: DimensionType
  
  /** Direct column reference or SQL expression */
  sql: AnyColumn | SQL | ((ctx: QueryContext<TSchema>) => AnyColumn | SQL)
  
  /** Whether this is a primary key */
  primaryKey?: boolean
  
  /** Display format */
  format?: string
}

/**
 * Measure definition
 */
export interface Measure<TSchema extends Record<string, any> = Record<string, any>> {
  name: string
  title?: string
  description?: string
  type: MeasureType
  
  /** Column to aggregate or SQL expression */
  sql: AnyColumn | SQL | ((ctx: QueryContext<TSchema>) => AnyColumn | SQL)
  
  /** Display format */
  format?: string
  
  /** Filters applied to this measure */
  filters?: Array<(ctx: QueryContext<TSchema>) => SQL>
}

/**
 * Compiled cube with execution function
 */
export interface CompiledCube<TSchema extends Record<string, any> = Record<string, any>> 
  extends Cube<TSchema> {
  /** Execute a query against this cube */
  queryFn: (query: SemanticQuery, securityContext: SecurityContext) => Promise<QueryResult>
}

/**
 * Helper function to create cubes
 */
export function defineCube<TSchema extends Record<string, any>>(
  name: string,
  definition: Omit<Cube<TSchema>, 'name'>
): Cube<TSchema> {
  return {
    name,
    ...definition
  }
}

/**
 * Multi-cube query context for cross-cube operations
 */
export interface MultiCubeQueryContext<TSchema extends Record<string, any> = Record<string, any>> 
  extends QueryContext<TSchema> {
  /** Available cubes for cross-cube operations */
  cubes: Map<string, Cube<TSchema>>
  /** Current cube being processed */
  currentCube: Cube<TSchema>
}

/**
 * Multi-cube query plan - describes how to execute a cross-cube query
 */
export interface MultiCubeQueryPlan<TSchema extends Record<string, any> = Record<string, any>> {
  /** Primary cube that drives the query */
  primaryCube: Cube<TSchema>
  /** Additional cubes to join */
  joinCubes: Array<{
    cube: Cube<TSchema>
    alias: string
    joinType: 'inner' | 'left' | 'right' | 'full'
    joinCondition: SQL
  }>
  /** Combined field selections across all cubes */
  selections: Record<string, SQL | AnyColumn>
  /** WHERE conditions for the entire query */
  whereConditions: SQL[]
  /** GROUP BY fields if aggregations are present */
  groupByFields: (SQL | AnyColumn)[]
}

/**
 * Cube join definition for multi-cube queries
 */
export interface CubeJoin<TSchema extends Record<string, any> = Record<string, any>> {
  /** Target cube name to join with */
  targetCube: string
  /** Join condition */
  condition: (ctx: MultiCubeQueryContext<TSchema>) => SQL
  /** Join type */
  type?: 'inner' | 'left' | 'right' | 'full'
  /** Relationship type for metadata */
  relationship: 'belongsTo' | 'hasOne' | 'hasMany'
}


/**
 * Helper to resolve SQL expressions
 */
export function resolveSqlExpression<TSchema extends Record<string, any>>(
  expr: AnyColumn | SQL | ((ctx: QueryContext<TSchema>) => AnyColumn | SQL),
  ctx: QueryContext<TSchema>
): AnyColumn | SQL {
  if (typeof expr === 'function') {
    return expr(ctx)
  }
  return expr
}

/**
 * Helper to create multi-cube query context
 */
export function createMultiCubeContext<TSchema extends Record<string, any>>(
  baseContext: QueryContext<TSchema>,
  cubes: Map<string, Cube<TSchema>>,
  currentCube: Cube<TSchema>
): MultiCubeQueryContext<TSchema> {
  return {
    ...baseContext,
    cubes,
    currentCube
  }
}
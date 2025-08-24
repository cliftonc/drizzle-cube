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
 * Unified Query Plan for both single and multi-cube queries
 * - For single-cube queries: joinCubes array is empty
 * - For multi-cube queries: joinCubes contains the additional cubes to join
 * - selections, whereConditions, and groupByFields are populated by QueryBuilder
 */
export interface QueryPlan<TSchema extends Record<string, any> = Record<string, any>> {
  /** Primary cube that drives the query */
  primaryCube: Cube<TSchema>
  /** Additional cubes to join (empty for single-cube queries) */
  joinCubes: Array<{
    cube: Cube<TSchema>
    alias: string
    joinType: 'inner' | 'left' | 'right' | 'full'
    joinCondition: SQL
  }>
  /** Combined field selections across all cubes (built by QueryBuilder) */
  selections: Record<string, SQL | AnyColumn>
  /** WHERE conditions for the entire query (built by QueryBuilder) */
  whereConditions: SQL[]
  /** GROUP BY fields if aggregations are present (built by QueryBuilder) */
  groupByFields: (SQL | AnyColumn)[]
  /** Pre-aggregation CTEs for hasMany relationships to prevent fan-out */
  preAggregationCTEs?: Array<{
    cube: Cube<TSchema>
    alias: string
    cteAlias: string
    joinKeys: Array<{
      sourceColumn: string
      targetColumn: string
      sourceColumnObj?: AnyColumn
      targetColumnObj?: AnyColumn
    }>
    measures: string[]
  }>
}

// Keep the old name for backwards compatibility
export type MultiCubeQueryPlan<TSchema extends Record<string, any> = Record<string, any>> = QueryPlan<TSchema>

/**
 * Type-safe cube join definition with lazy loading support
 */
export interface CubeJoin<TSchema extends Record<string, any> = Record<string, any>> {
  /** Target cube reference - lazy loaded to avoid circular dependencies */
  targetCube: Cube<TSchema> | (() => Cube<TSchema>)
  
  /** Semantic relationship - determines join behavior */
  relationship: 'belongsTo' | 'hasOne' | 'hasMany'
  
  /** Array of join conditions - supports multi-column joins */
  on: Array<{
    /** Column from source cube */
    source: AnyColumn
    /** Column from target cube */  
    target: AnyColumn
    /** Comparison operator - defaults to eq */
    as?: (source: AnyColumn, target: AnyColumn) => SQL
  }>
  
  /** Override default SQL join type (derived from relationship) */
  sqlJoinType?: 'inner' | 'left' | 'right' | 'full'
}


/**
 * Resolve cube reference (handles both direct and lazy references)
 */
export function resolveCubeReference<TSchema extends Record<string, any>>(
  ref: Cube<TSchema> | (() => Cube<TSchema>)
): Cube<TSchema> {
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
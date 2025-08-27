/**
 * Cube, dimension, measure, and join definitions
 * Core semantic layer building blocks
 */

import type { SQL, AnyColumn } from 'drizzle-orm'
import type { 
  SecurityContext, 
  DrizzleDatabase, 
  QueryResult, 
  MeasureType, 
  DimensionType 
} from './core'
import type { SemanticQuery } from './query'

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
 * Query context passed to cube SQL functions
 * Provides access to database, schema, and security context
 */
export interface QueryContext {
  /** Drizzle database instance */
  db: DrizzleDatabase
  /** Database schema (tables, columns, etc.) */
  schema?: any
  /** Security context for filtering */
  securityContext: SecurityContext
  /** The semantic query being executed */
  query?: SemanticQuery
  /** The compiled cube being queried */
  cube?: Cube
}

/**
 * Multi-cube query context for cross-cube operations
 */
export interface MultiCubeQueryContext 
  extends QueryContext {
  /** Available cubes for cross-cube operations */
  cubes: Map<string, Cube>
  /** Current cube being processed */
  currentCube: Cube
}

/**
 * Cube definition focused on Drizzle query building
 */
export interface Cube {
  name: string
  title?: string
  description?: string
  
  /** 
   * Base query setup - returns the foundation that can be extended
   * Should return FROM/JOIN/WHERE setup, NOT a complete SELECT
   */
  sql: (ctx: QueryContext) => BaseQueryDefinition
  
  /** Cube dimensions using direct column references */
  dimensions: Record<string, Dimension>
  
  /** Cube measures using direct column references */
  measures: Record<string, Measure>
  
  /** Optional joins to other cubes for multi-cube queries */
  joins?: Record<string, CubeJoin>
  
  /** Whether cube is publicly accessible */
  public?: boolean
  
  /** SQL alias for the cube */
  sqlAlias?: string
  
  /** Data source identifier */
  dataSource?: string
  
  /** Additional metadata */
  meta?: Record<string, any>
}

/**
 * Dimension definition
 */
export interface Dimension {
  name: string
  title?: string
  description?: string
  type: DimensionType
  
  /** Direct column reference or SQL expression */
  sql: AnyColumn | SQL | ((ctx: QueryContext) => AnyColumn | SQL)
  
  /** Whether this is a primary key */
  primaryKey?: boolean
  
  /** Whether to show in UI */
  shown?: boolean
  
  /** Display format */
  format?: string
  
  /** Additional metadata */
  meta?: Record<string, any>
}

/**
 * Measure definition
 */
export interface Measure {
  name: string
  title?: string
  description?: string
  type: MeasureType
  
  /** Column to aggregate or SQL expression */
  sql: AnyColumn | SQL | ((ctx: QueryContext) => AnyColumn | SQL)
  
  /** Display format */
  format?: string
  
  /** Whether to show in UI */
  shown?: boolean
  
  /** Filters applied to this measure */
  filters?: Array<(ctx: QueryContext) => SQL>
  
  /** Rolling window configuration */
  rollingWindow?: {
    trailing?: string
    leading?: string
    offset?: string
  }
  
  /** Additional metadata */
  meta?: Record<string, any>
}

/**
 * Type-safe cube join definition with lazy loading support
 */
export interface CubeJoin {
  /** Target cube reference - lazy loaded to avoid circular dependencies */
  targetCube: Cube | (() => Cube)
  
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
 * Compiled cube with execution function
 */
export interface CompiledCube 
  extends Cube {
  /** Execute a query against this cube */
  queryFn: (query: SemanticQuery, securityContext: SecurityContext) => Promise<QueryResult>
}

/**
 * Unified Query Plan for both single and multi-cube queries
 * - For single-cube queries: joinCubes array is empty
 * - For multi-cube queries: joinCubes contains the additional cubes to join
 * - selections, whereConditions, and groupByFields are populated by QueryBuilder
 */
export interface QueryPlan {
  /** Primary cube that drives the query */
  primaryCube: Cube
  /** Additional cubes to join (empty for single-cube queries) */
  joinCubes: Array<{
    cube: Cube
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
    cube: Cube
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



/**
 * Utility type for cube definition with schema inference
 */
export type CubeDefinition = Omit<Cube, 'name'> & {
  name?: string
}

/**
 * Helper type for creating type-safe cubes
 */
export interface CubeDefiner {
  <TName extends string>(
    name: TName,
    definition: CubeDefinition
  ): Cube & { name: TName }
}
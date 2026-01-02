/**
 * Cube, dimension, measure, and join definitions
 * Core semantic layer building blocks
 */

import type { SQL, AnyColumn, Table, Subquery, View } from 'drizzle-orm'
import type {
  SecurityContext,
  DrizzleDatabase,
  QueryResult,
  MeasureType,
  DimensionType
} from './core'
import type { SemanticQuery } from './query'
import type { FilterCacheManager } from '../filter-cache'

/**
 * Any queryable relation that can be used in FROM/JOIN clauses
 * Supports tables, views, subqueries, and raw SQL expressions
 */
export type QueryableRelation = Table | View | Subquery | SQL

/**
 * Base query definition that can be extended dynamically
 * Returns just the FROM/JOIN/WHERE setup, not a complete SELECT
 */
export interface BaseQueryDefinition {
  /** Main table to query from */
  from: QueryableRelation
  /** Optional joins to other tables */
  joins?: Array<{
    table: QueryableRelation
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
  /**
   * Filter cache for parameter deduplication across CTEs
   * Created at query start and used throughout query building
   */
  filterCache?: FilterCacheManager
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

  /**
   * Column to aggregate or SQL expression
   * Optional for calculated measures (type: 'calculated') which use calculatedSql instead
   */
  sql?: AnyColumn | SQL | ((ctx: QueryContext) => AnyColumn | SQL)

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

  /**
   * Calculated measure template with {member} references
   * Only used when type === 'calculated'
   * Example: "1.0 * {completed} / NULLIF({total}, 0)"
   */
  calculatedSql?: string

  /**
   * List of measure dependencies for calculated measures
   * Auto-detected from calculatedSql if not provided
   * Example: ['completed', 'total']
   */
  dependencies?: string[]

  /** Additional metadata */
  meta?: Record<string, any>

  /**
   * Statistical function configuration
   * Used for percentile, stddev, variance measure types
   */
  statisticalConfig?: {
    /** Percentile value (0-100) for percentile measures. Default: 50 for median */
    percentile?: number
    /** Use sample vs population calculation for stddev/variance. Default: false (population) */
    useSample?: boolean
  }

  /**
   * Window function configuration
   * Used for lag, lead, rank, movingAvg, and other window function measure types
   */
  windowConfig?: {
    /** Dimension references to partition by (e.g., ['employeeId']) */
    partitionBy?: string[]
    /** Columns to order by with direction */
    orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>
    /** Number of rows to offset for lag/lead. Default: 1 */
    offset?: number
    /** Default value when offset is out of bounds for lag/lead */
    defaultValue?: any
    /** Number of buckets for ntile. Default: 4 */
    nTile?: number
    /** Window frame specification for moving aggregates */
    frame?: {
      type: 'rows' | 'range'
      start: number | 'unbounded'
      end: number | 'current' | 'unbounded'
    }
  }
}

/**
 * Relationship types supported by cube joins
 */
export type CubeRelationship = 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'

/**
 * Type-safe cube join definition with lazy loading support
 */
export interface CubeJoin {
  /** Target cube reference - lazy loaded to avoid circular dependencies */
  targetCube: Cube | (() => Cube)

  /** Semantic relationship - determines join behavior */
  relationship: CubeRelationship

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

  /**
   * Many-to-many relationship configuration through a junction table
   * Only used when relationship is 'belongsToMany'
   */
  through?: {
    /** Junction/join table (Drizzle table reference) */
    table: Table
    /** Join conditions from source cube to junction table */
    sourceKey: Array<{
      source: AnyColumn
      target: AnyColumn
      as?: (source: AnyColumn, target: AnyColumn) => SQL
    }>
    /** Join conditions from junction table to target cube */
    targetKey: Array<{
      source: AnyColumn
      target: AnyColumn
      as?: (source: AnyColumn, target: AnyColumn) => SQL
    }>
    /** Optional security context SQL for junction table */
    securitySql?: (securityContext: SecurityContext) => SQL | SQL[]
  }
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
 * Join key information for CTE joins
 * Describes how a CTE should be joined to the main query
 */
export interface JoinKeyInfo {
  /** Column name in the source table */
  sourceColumn: string
  /** Column name in the target table (CTE) */
  targetColumn: string
  /** Optional Drizzle column object for source */
  sourceColumnObj?: AnyColumn
  /** Optional Drizzle column object for target */
  targetColumnObj?: AnyColumn
}

/**
 * Propagating filter information for cross-cube filter propagation
 * When cube A has filters and cube B (with hasMany from A) needs a CTE,
 * A's filters should propagate into B's CTE via a subquery
 */
export interface PropagatingFilter {
  /** The source cube whose filters need to propagate */
  sourceCube: Cube
  /** Filters from the source cube to apply */
  filters: import('./query').Filter[]
  /** Join condition linking source cube PK to target cube FK */
  joinCondition: {
    /** Primary key column on source cube */
    source: AnyColumn
    /** Foreign key column on target cube (CTE cube) */
    target: AnyColumn
  }
  /** Pre-built filter SQL for parameter deduplication (optional, built during query planning) */
  preBuiltFilterSQL?: SQL
}

/**
 * Pre-aggregation CTE information
 * Describes a Common Table Expression used for pre-aggregating hasMany relationships
 */
export interface PreAggregationCTEInfo {
  /** The cube being pre-aggregated */
  cube: Cube
  /** Table alias for this cube in the main query */
  alias: string
  /** CTE alias (WITH clause name) */
  cteAlias: string
  /** Join keys to connect CTE back to main query */
  joinKeys: JoinKeyInfo[]
  /** List of measure names included in this CTE */
  measures: string[]
  /** Propagating filters from related cubes (for cross-cube filter propagation) */
  propagatingFilters?: PropagatingFilter[]
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
    /** Junction table information for belongsToMany relationships */
    junctionTable?: {
      table: Table
      alias: string
      joinType: 'inner' | 'left' | 'right' | 'full'
      joinCondition: SQL
      /** Optional security SQL function to apply to junction table */
      securitySql?: (securityContext: SecurityContext) => SQL | SQL[]
    }
  }>
  /** Combined field selections across all cubes (built by QueryBuilder) */
  selections: Record<string, SQL | AnyColumn>
  /** WHERE conditions for the entire query (built by QueryBuilder) */
  whereConditions: SQL[]
  /** GROUP BY fields if aggregations are present (built by QueryBuilder) */
  groupByFields: (SQL | AnyColumn)[]
  /** Pre-aggregation CTEs for hasMany relationships to prevent fan-out */
  preAggregationCTEs?: PreAggregationCTEInfo[]
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
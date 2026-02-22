/**
 * Logical plan types for the multi-stage query pipeline.
 *
 * The logical plan is a composable tree of nodes that describes
 * WHAT to compute, independent of HOW to generate SQL. The
 * DrizzlePlanBuilder converts this tree into Drizzle ORM constructs.
 *
 * Node hierarchy:
 *   QueryNode (root)
 *     └── source: SimpleSource | FullKeyAggregate | MultiFactMerge
 *           └── ctes: CTEPreAggregate[]
 *           └── (future) KeysDeduplication
 */

import type { SQL, AnyColumn, Table } from 'drizzle-orm'
import type {
  Cube,
  JoinKeyInfo,
  PropagatingFilter,
  IntermediateJoinInfo,
  DownstreamJoinKeyInfo
} from '../types/cube'
import type { Filter } from '../types/query'
import type { SecurityContext, QueryWarning, TimeGranularity } from '../types/core'

// ---------------------------------------------------------------------------
// References — lightweight pointers into the cube registry
// ---------------------------------------------------------------------------

/** Reference to a registered cube */
export interface CubeRef {
  /** Cube name (e.g. 'Employees') */
  name: string
  /** Resolved cube object */
  cube: Cube
}

/** Reference to a measure on a specific cube */
export interface MeasureRef {
  /** Fully qualified name: CubeName.measureName */
  name: string
  /** Cube that owns this measure */
  cube: CubeRef
  /** Local measure name (without cube prefix) */
  localName: string
}

/** Reference to a dimension on a specific cube */
export interface DimensionRef {
  /** Fully qualified name: CubeName.dimensionName */
  name: string
  /** Cube that owns this dimension */
  cube: CubeRef
  /** Local dimension name (without cube prefix) */
  localName: string
}

/** Reference to a time dimension with granularity/dateRange */
export interface TimeDimensionRef {
  /** Fully qualified dimension name */
  name: string
  cube: CubeRef
  localName: string
  granularity?: TimeGranularity
  dateRange?: string | string[]
  fillMissingDates?: boolean
  compareDateRange?: (string | [string, string])[]
}

/** Reference to a column for join keys */
export interface ColumnRef {
  column: AnyColumn
  alias?: string
}

/** Order-by specification */
export interface OrderByRef {
  /** Fully qualified field name */
  name: string
  direction: 'asc' | 'desc'
}

// ---------------------------------------------------------------------------
// Logical schema — describes output columns of a node
// ---------------------------------------------------------------------------

export interface LogicalSchema {
  measures: MeasureRef[]
  dimensions: DimensionRef[]
  timeDimensions: TimeDimensionRef[]
}

// ---------------------------------------------------------------------------
// Join reference — describes how two cubes connect
// ---------------------------------------------------------------------------

export interface JoinRef {
  /** Target cube being joined */
  target: CubeRef
  /** Table alias in the generated SQL */
  alias: string
  /** SQL join type */
  joinType: 'inner' | 'left' | 'right' | 'full'
  /** Drizzle SQL join condition (pre-built by the planner) */
  joinCondition: SQL
  /** Junction table for belongsToMany relationships */
  junctionTable?: {
    table: Table
    alias: string
    joinType: 'inner' | 'left' | 'right' | 'full'
    joinCondition: SQL
    securitySql?: (securityContext: SecurityContext) => SQL | SQL[]
    sourceCubeName?: string
  }
}

// ---------------------------------------------------------------------------
// Logical plan nodes
// ---------------------------------------------------------------------------

/** Discriminated union tag for all node types */
export type LogicalNodeType =
  | 'query'
  | 'simpleSource'
  | 'fullKeyAggregate'
  | 'ctePreAggregate'
  | 'keysDeduplication'
  | 'multiFactMerge'

/** Base interface shared by all logical plan nodes */
export interface LogicalNodeBase {
  readonly type: LogicalNodeType
  readonly schema: LogicalSchema
}

// ---- Root node ----

/**
 * Root query node — represents the outermost SELECT.
 * Wraps a source node with dimensions, measures, filters, ordering, etc.
 */
export interface QueryNode extends LogicalNodeBase {
  readonly type: 'query'
  /** Source of rows (SimpleSource, FullKeyAggregate, etc.) */
  source: LogicalNode
  /** Dimensions to group by */
  dimensions: DimensionRef[]
  /** Measures to aggregate */
  measures: MeasureRef[]
  /** User-supplied filters */
  filters: Filter[]
  /** Time dimensions with granularity / date range */
  timeDimensions: TimeDimensionRef[]
  /** ORDER BY clauses */
  orderBy: OrderByRef[]
  limit?: number
  offset?: number
  /** Planning warnings surfaced to the caller */
  warnings: QueryWarning[]
}

// ---- Source nodes ----

/**
 * Simple source: one primary cube optionally joined to other cubes.
 * This is the runtime physical-source shape used by SQL generation today.
 */
export interface SimpleSource extends LogicalNodeBase {
  readonly type: 'simpleSource'
  /** Primary cube (FROM clause) */
  primaryCube: CubeRef
  /** Cubes joined to the primary */
  joins: JoinRef[]
  /** Pre-aggregation CTEs attached to this source */
  ctes: CTEPreAggregate[]
}

/**
 * Full key aggregate: merges results from multiple subqueries
 * that share the same dimension key set.
 * (Phase 3 — placeholder for now)
 */
export interface FullKeyAggregate extends LogicalNodeBase {
  readonly type: 'fullKeyAggregate'
  /** Subqueries whose results will be merged */
  subqueries: LogicalNode[]
  /** Shared dimensions used as the merge key */
  dimensions: DimensionRef[]
}

/**
 * CTE pre-aggregation node.
 * Represents a WITH clause that pre-aggregates a hasMany cube
 * to prevent fan-out in the outer query.
 */
export interface CTEPreAggregate extends LogicalNodeBase {
  readonly type: 'ctePreAggregate'
  /** The cube being pre-aggregated */
  cube: CubeRef
  /** Table alias for the cube in the main query */
  alias: string
  /** CTE alias (WITH clause name) */
  cteAlias: string
  /** Keys connecting CTE back to the main query */
  joinKeys: JoinKeyInfo[]
  /** Measure names included in this CTE */
  measures: string[]
  /** Cross-cube filter propagation */
  propagatingFilters?: PropagatingFilter[]
  /** Downstream join keys for transitive joins through this CTE */
  downstreamJoinKeys?: DownstreamJoinKeyInfo[]
  /** Intermediate joins absorbed into this CTE for fan-out prevention */
  intermediateJoins?: IntermediateJoinInfo[]
  /** CTE type (currently only 'aggregate') */
  cteType: 'aggregate'
  /**
   * Reason for creating this CTE:
   * - 'hasMany': Direct hasMany target — outer query uses SUM
   * - 'fanOutPrevention': Affected by hasMany elsewhere — outer query uses MAX
   */
  cteReason: 'hasMany' | 'fanOutPrevention'
}

/**
 * Keys-based deduplication for multiplied measures.
 * (Phase 3 — type defined now for forward compatibility)
 */
export interface KeysDeduplication extends LogicalNodeBase {
  readonly type: 'keysDeduplication'
  /** SELECT DISTINCT PKs + dims */
  keysSource: LogicalNode
  /** Aggregated measures source */
  measureSource: LogicalNode
  /** Primary key columns to join on */
  joinOn: ColumnRef[]
}

/**
 * Multi-fact merge: combines independent fact subqueries
 * that share dimensions.
 * (Phase 3 — type defined now for forward compatibility)
 */
export interface MultiFactMerge extends LogicalNodeBase {
  readonly type: 'multiFactMerge'
  /** Independent fact subqueries */
  groups: LogicalNode[]
  /** Shared dimensions for the merge */
  sharedDimensions: DimensionRef[]
  /** How to combine the groups */
  mergeStrategy: 'fullJoin' | 'leftJoin' | 'innerJoin'
}

// ---------------------------------------------------------------------------
// Discriminated union of all node types
// ---------------------------------------------------------------------------

export type LogicalNode =
  | QueryNode
  | SimpleSource
  | FullKeyAggregate
  | CTEPreAggregate
  | KeysDeduplication
  | MultiFactMerge

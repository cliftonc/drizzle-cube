/**
 * Query Analysis Types
 * Provides transparency into query planning decisions for debugging
 */

/**
 * Reason why a cube was selected as primary (FROM table)
 */
export type PrimaryCubeSelectionReason =
  | 'most_dimensions'        // Tier 1: Cube with most dimensions in query
  | 'most_connected'         // Tier 2: Most connected cube that can reach all others
  | 'alphabetical_fallback'  // Tier 3: Alphabetical order fallback
  | 'single_cube'            // Only one cube in query

/**
 * Candidate cube considered for primary selection
 */
export interface PrimaryCubeCandidate {
  /** Cube name */
  cubeName: string
  /** Number of dimensions from this cube in the query */
  dimensionCount: number
  /** Number of join definitions on this cube */
  joinCount: number
  /** Whether this cube can reach all other required cubes */
  canReachAll: boolean
}

/**
 * Primary cube selection analysis
 */
export interface PrimaryCubeAnalysis {
  /** Name of the selected primary cube */
  selectedCube: string
  /** Reason for selection */
  reason: PrimaryCubeSelectionReason
  /** Human-readable explanation */
  explanation: string
  /** Other candidates that were considered */
  candidates?: PrimaryCubeCandidate[]
}

/**
 * Single step in a join path
 */
export interface JoinPathStep {
  /** Source cube name */
  fromCube: string
  /** Target cube name */
  toCube: string
  /** Relationship type used */
  relationship: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
  /** SQL join type that will be used */
  joinType: 'inner' | 'left' | 'right' | 'full'
  /** Join condition columns */
  joinColumns: Array<{
    sourceColumn: string
    targetColumn: string
  }>
  /** Junction table info for belongsToMany */
  junctionTable?: {
    tableName: string
    sourceColumns: string[]
    targetColumns: string[]
  }
}

/**
 * Complete join path from primary to target cube
 */
export interface JoinPathAnalysis {
  /** Target cube name */
  targetCube: string
  /** Whether a path was found */
  pathFound: boolean
  /** The join steps (if found) */
  path?: JoinPathStep[]
  /** Total path length */
  pathLength?: number
  /** Error message if path not found */
  error?: string
  /** Cubes that were visited during BFS search */
  visitedCubes?: string[]
}

/**
 * Pre-aggregation CTE analysis
 */
/**
 * Reason why a cube requires a CTE
 */
export type CTEReason = 'hasMany' | 'fanOutPrevention'

export interface PreAggregationAnalysis {
  /** Cube being pre-aggregated */
  cubeName: string
  /** CTE alias in the query */
  cteAlias: string
  /** Why this cube needs a CTE (human-readable explanation) */
  reason: string
  /** Typed reason for programmatic use */
  reasonType?: CTEReason
  /** Measures included in CTE (aggregate measures + window base measures) */
  measures: string[]
  /** Join keys used */
  joinKeys: Array<{
    sourceColumn: string
    targetColumn: string
  }>
  /**
   * Type of CTE:
   * - 'aggregate': Standard CTE with GROUP BY (count, sum, avg, etc.)
   *
   * Note: Window function CTEs are no longer used. Post-aggregation window
   * functions are applied in the outer query after data is aggregated.
   */
  cteType?: 'aggregate'
}

/**
 * Query structure summary
 */
export interface QuerySummary {
  /** Query type: 'single_cube', 'multi_cube_join', or 'multi_cube_cte' */
  queryType: 'single_cube' | 'multi_cube_join' | 'multi_cube_cte'
  /** Total number of joins */
  joinCount: number
  /** Total number of CTEs */
  cteCount: number
  /** Has hasMany relationships requiring aggregation */
  hasPreAggregation: boolean
  /**
   * Whether query contains post-aggregation window function measures.
   * These window functions (lag, lead, rank, etc.) operate on aggregated
   * data and are applied in the outer query after CTEs.
   */
  hasWindowFunctions?: boolean
}

/**
 * Complete query analysis result
 */
export interface QueryAnalysis {
  /** Timestamp of analysis */
  timestamp: string
  /** Number of cubes involved */
  cubeCount: number
  /** List of all cubes used */
  cubesInvolved: string[]
  /** Primary cube selection details */
  primaryCube: PrimaryCubeAnalysis
  /** Join path analysis for each joined cube */
  joinPaths: JoinPathAnalysis[]
  /** Pre-aggregation CTE details */
  preAggregations: PreAggregationAnalysis[]
  /** Overall query structure summary */
  querySummary: QuerySummary
  /** Warnings or potential issues */
  warnings?: string[]
}

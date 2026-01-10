/**
 * Server-side Flow Analysis Types
 *
 * Types for server-side flow query building and execution.
 * Flow analysis explores paths BEFORE and AFTER a defined starting step (bidirectional).
 */

import type { Filter } from './query'

// ============================================================================
// Flow Query Configuration
// ============================================================================

/**
 * Flow query configuration for server-side execution
 * This is the configuration extracted from SemanticQuery.flow
 */
export interface FlowQueryConfig {
  /**
   * Binding key that identifies individual entities (e.g., userId)
   * Can be a single string like 'Events.userId' or array for multi-cube
   */
  bindingKey: string | { cube: string; dimension: string }[]

  /**
   * Time dimension used for ordering events
   * Can be a single string like 'Events.timestamp' or array for multi-cube
   */
  timeDimension: string | { cube: string; dimension: string }[]

  /**
   * The starting step from which we explore paths
   * Defines the anchor point for bidirectional flow analysis
   */
  startingStep: {
    /** Display name for the starting step */
    name: string
    /** Filter(s) that identify events for this starting step */
    filter?: Filter | Filter[]
  }

  /** Number of steps to explore BEFORE the starting step (1-5) */
  stepsBefore: number

  /** Number of steps to explore AFTER the starting step (1-5) */
  stepsAfter: number

  /**
   * Event dimension that categorizes events (e.g., 'Events.eventType')
   * This dimension's values become the node labels in the Sankey diagram
   */
  eventDimension: string

  /**
   * Optional limit on the number of entities to process
   * Useful for performance on large datasets
   */
  entityLimit?: number

  /**
   * Output mode for flow data aggregation
   * - 'sankey': Aggregate by (layer, event_type) - standard flow visualization where paths can converge
   * - 'sunburst': Path-qualified nodes for hierarchical tree visualization where each path is unique
   * @default 'sankey'
   */
  outputMode?: 'sankey' | 'sunburst'
}

// ============================================================================
// Sankey Result Types
// ============================================================================

/**
 * A node in the Sankey diagram
 * Represents an event type at a specific layer (distance from starting step)
 */
export interface SankeyNode {
  /**
   * Unique identifier for this node
   * Format: "before_{depth}_{eventType}" or "after_{depth}_{eventType}" or "start_{eventType}"
   */
  id: string

  /** Display name (typically the event type value) */
  name: string

  /**
   * Layer position in the Sankey diagram
   * Negative for steps before starting step, 0 for starting step, positive for after
   */
  layer: number

  /** Total count of entities passing through this node */
  value?: number
}

/**
 * A link (edge) in the Sankey diagram
 * Represents a transition between two nodes
 */
export interface SankeyLink {
  /** Source node ID */
  source: string

  /** Target node ID */
  target: string

  /** Count of entities that follow this path */
  value: number
}

/**
 * Flow result row returned from query execution
 * Contains the complete Sankey diagram data
 */
export interface FlowResultRow {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

// ============================================================================
// Internal Processing Types
// ============================================================================

/**
 * Internal representation of a resolved step during query building
 */
export interface ResolvedFlowStep {
  /** Layer index (-N to +N, 0 is starting step) */
  layer: number

  /** Direction from starting step */
  direction: 'before' | 'start' | 'after'

  /** Depth from starting step (0 for start, 1+ for before/after) */
  depth: number
}

/**
 * Raw aggregation row from the flow CTEs
 * Before transformation to SankeyNode/SankeyLink format
 */
export interface RawFlowNodeRow {
  node_id: string
  event_type: string
  layer: number
  count: number
}

/**
 * Raw link row from the flow CTEs
 * Before transformation to SankeyLink format
 */
export interface RawFlowLinkRow {
  source_id: string
  target_id: string
  count: number
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Flow validation result
 */
export interface FlowValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================================================
// Constants
// ============================================================================

/** Minimum number of steps before/after */
export const FLOW_MIN_DEPTH = 1

/** Maximum number of steps before/after */
export const FLOW_MAX_DEPTH = 5

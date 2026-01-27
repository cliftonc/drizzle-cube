/**
 * Metadata and annotation types for API responses
 * Used for UI rendering and query result annotations
 */

import type { MeasureType, MeasureFormat, DimensionFormat, TimeGranularity } from './core'

/**
 * Cube relationship metadata for ERD visualization
 */
export interface CubeRelationshipMetadata {
  targetCube: string
  relationship: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
  joinFields: Array<{
    sourceField: string
    targetField: string
  }>
}

/**
 * Cube metadata for API responses
 */
export interface CubeMetadata {
  name: string
  title: string
  description?: string
  /**
   * Example questions that can be answered using this cube
   * Used by AI agents to understand cube capabilities
   */
  exampleQuestions?: string[]
  measures: MeasureMetadata[]
  dimensions: DimensionMetadata[]
  segments: any[]
  relationships?: CubeRelationshipMetadata[]
  /**
   * Hierarchies for structured drill-down paths
   * Enables navigation through dimension levels (e.g., country -> region -> city)
   */
  hierarchies?: HierarchyMetadata[]
  /** Additional cube metadata (e.g., eventStream configuration for funnel queries) */
  meta?: Record<string, any>
}

/**
 * Measure metadata for API responses
 */
export interface MeasureMetadata {
  name: string
  title: string
  shortTitle: string
  type: MeasureType
  format?: MeasureFormat
  description?: string
  /**
   * Alternative names for this measure
   * Used by AI agents for natural language matching
   */
  synonyms?: string[]
  /**
   * Dimension names shown when drilling into this measure
   * Full names like "CubeName.dimensionName" for cross-cube support
   * If not specified, drilling is disabled for this measure
   */
  drillMembers?: string[]
}

/**
 * Dimension metadata for API responses
 */
export interface DimensionMetadata {
  name: string
  title: string
  shortTitle: string
  type: string
  format?: DimensionFormat
  description?: string
  /**
   * Alternative names for this dimension
   * Used by AI agents for natural language matching
   */
  synonyms?: string[]
  /**
   * Supported granularities for time dimensions
   * Only present when type is 'time'
   * Used for time-based drill-down (year -> quarter -> month -> week -> day)
   */
  granularities?: TimeGranularity[]
}

/**
 * Hierarchy metadata for structured drill-down paths
 */
export interface HierarchyMetadata {
  /** Unique identifier for the hierarchy */
  name: string
  /** Display title for the hierarchy */
  title: string
  /** Cube name this hierarchy belongs to */
  cubeName: string
  /**
   * Full dimension names in order from least to most granular
   * Format: "CubeName.dimensionName"
   */
  levels: string[]
}

/**
 * Pre-aggregation configuration
 */
export interface SemanticPreAggregation {
  name: string
  measures: string[]
  dimensions: string[]
  timeDimension?: {
    dimension: string
    granularity: TimeGranularity[]
  }
  refreshKey?: {
    every: string
    sql?: string
  }
  indexes?: Record<string, string[]>
}
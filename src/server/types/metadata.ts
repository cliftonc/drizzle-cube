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
  relationship: 'belongsTo' | 'hasOne' | 'hasMany'
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
  measures: MeasureMetadata[]
  dimensions: DimensionMetadata[]
  segments: any[]
  relationships?: CubeRelationshipMetadata[]
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
/**
 * Metadata and annotation types for API responses
 * Used for UI rendering and query result annotations
 */

import type { MeasureType, MeasureFormat, DimensionFormat, TimeGranularity } from './core'

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
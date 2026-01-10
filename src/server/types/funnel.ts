/**
 * Funnel analysis types for the semantic layer
 * Supports query-time funnel definition with temporal ordering and conversion metrics
 */

import type { Filter } from './query'

/**
 * Single-cube step definition - all steps use the same cube
 */
export interface FunnelStepSingleCube {
  /** Step display name */
  name: string

  /** Filter conditions for this step */
  filter?: Filter | Filter[]

  /**
   * Time window constraint - max duration from previous step.
   * Format: ISO 8601 duration (e.g., "P7D" for 7 days, "PT1H" for 1 hour)
   */
  timeToConvert?: string
}

/**
 * Multi-cube step definition - steps can use different cubes
 */
export interface FunnelStepMultiCube extends FunnelStepSingleCube {
  /** Which cube this step uses */
  cube: string
}

export type FunnelStep = FunnelStepSingleCube | FunnelStepMultiCube

/**
 * Binding key mapping for multi-cube funnels
 * Maps the user/entity identifier across different cubes
 */
export interface FunnelBindingKeyMapping {
  cube: string
  dimension: string
}

/**
 * Time dimension mapping for multi-cube funnels
 * Maps the timestamp field across different cubes
 */
export interface FunnelTimeDimensionMapping {
  cube: string
  dimension: string
}

/**
 * Funnel query configuration
 */
export interface FunnelQueryConfig {
  /**
   * Binding key - dimension that links entities across steps.
   * This is typically a user ID, session ID, or other entity identifier.
   * String for single-cube (e.g., 'Events.userId'),
   * Array for multi-cube with different column names per cube.
   */
  bindingKey: string | FunnelBindingKeyMapping[]

  /**
   * Time dimension for temporal ordering.
   * Used to determine event order and calculate time-to-convert.
   * String for single-cube (e.g., 'Events.timestamp'),
   * Array for multi-cube with different timestamp columns per cube.
   */
  timeDimension: string | FunnelTimeDimensionMapping[]

  /** Ordered array of funnel steps (minimum 2) */
  steps: FunnelStep[]

  /** Include time-to-convert metrics in results (default: false) */
  includeTimeMetrics?: boolean

  /**
   * Global time window - all steps must complete within this duration
   * from the first step. Format: ISO 8601 duration.
   */
  globalTimeWindow?: string
}

/**
 * Result row for funnel query
 */
export interface FunnelResultRow {
  /** Step name */
  step: string

  /** Step position (0-indexed) */
  stepIndex: number

  /** Count of entities that reached this step */
  count: number

  /**
   * Step-to-step conversion rate (count / previous step count).
   * null for first step.
   */
  conversionRate: number | null

  /**
   * Cumulative conversion rate from first step (count / first step count).
   */
  cumulativeConversionRate: number

  /** Average time to reach this step from previous step (seconds) */
  avgSecondsToConvert?: number | null

  /** Median time to reach this step from previous step (seconds) */
  medianSecondsToConvert?: number | null

  /** 90th percentile time to reach this step (seconds) */
  p90SecondsToConvert?: number | null

  /** Minimum time to reach this step (seconds) */
  minSecondsToConvert?: number | null

  /** Maximum time to reach this step (seconds) */
  maxSecondsToConvert?: number | null
}

/**
 * Funnel capabilities per database engine
 */
export interface FunnelCapabilities {
  /** Whether database supports PERCENTILE_CONT */
  supportsPercentile: boolean

  /** Whether database supports INTERVAL arithmetic directly */
  supportsIntervalArithmetic: boolean
}

/**
 * Type guard for multi-cube step
 */
export function isMultiCubeStep(step: FunnelStep): step is FunnelStepMultiCube {
  return 'cube' in step && typeof step.cube === 'string'
}

/**
 * Type guard for multi-cube binding key
 */
export function isMultiCubeBindingKey(
  bindingKey: string | FunnelBindingKeyMapping[]
): bindingKey is FunnelBindingKeyMapping[] {
  return Array.isArray(bindingKey)
}

/**
 * Type guard for multi-cube time dimension
 */
export function isMultiCubeTimeDimension(
  timeDimension: string | FunnelTimeDimensionMapping[]
): timeDimension is FunnelTimeDimensionMapping[] {
  return Array.isArray(timeDimension)
}

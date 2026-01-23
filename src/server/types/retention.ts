/**
 * Retention analysis types for the semantic layer
 * Supports cohort-based retention tracking with classic and rolling retention types
 */

import type { Filter } from './query'

/**
 * Binding key mapping for multi-cube retention
 * Maps the user/entity identifier across cohort and activity cubes
 */
export interface RetentionBindingKeyMapping {
  cube: string
  dimension: string
}

/**
 * Time dimension mapping for multi-cube retention
 * Maps the timestamp field across different cubes
 */
export interface RetentionTimeDimensionMapping {
  cube: string
  dimension: string
}

/**
 * Date range for cohort analysis
 */
export interface RetentionDateRange {
  /** Start date (inclusive), ISO 8601 format (YYYY-MM-DD) */
  start: string
  /** End date (inclusive), ISO 8601 format (YYYY-MM-DD) */
  end: string
}

/**
 * Retention query configuration (Simplified Mixpanel-style format)
 *
 * Key simplifications from previous version:
 * - Single timeDimension for both cohort entry and activity
 * - Single granularity for viewing periods (no separate cohort/period granularity)
 * - Single cohort (date range defines the cohort) with optional breakdown
 */
export interface RetentionQueryConfig {
  /**
   * Single timestamp dimension for the analysis.
   * String for single-cube (e.g., 'Events.timestamp'),
   * Object for multi-cube with explicit cube reference.
   */
  timeDimension: string | RetentionTimeDimensionMapping

  /**
   * Binding key - dimension that links users across events.
   * This is typically a user ID or other entity identifier.
   * String for single-cube (e.g., 'Events.userId'),
   * Array for multi-cube with different column names per cube.
   */
  bindingKey: string | RetentionBindingKeyMapping[]

  /**
   * Date range for cohort analysis (REQUIRED).
   * Users who first performed the cohort action within this range are included.
   */
  dateRange: RetentionDateRange

  /**
   * Granularity for viewing retention periods.
   * Determines how period_number is calculated (day/week/month).
   */
  granularity: 'day' | 'week' | 'month'

  /**
   * Number of periods to calculate (e.g., 12 for 12 weeks).
   * Period 0 is always the cohort entry period.
   */
  periods: number

  /**
   * Retention type:
   * - 'classic': User returned exactly in period N (bounded)
   * - 'rolling': User returned in period N or any later period (unbounded)
   */
  retentionType: 'classic' | 'rolling'

  /**
   * Optional filters on cohort entry events.
   * Applied when identifying which users enter the cohort.
   */
  cohortFilters?: Filter | Filter[]

  /**
   * Optional filters on return activity events.
   * Applied when checking for user activity in each period.
   */
  activityFilters?: Filter | Filter[]

  /**
   * Optional breakdown dimensions for segmenting the cohort.
   * When provided, retention is calculated per unique combination of breakdown values.
   * e.g., ["Events.country", "Events.plan"] to see retention by country and plan.
   */
  breakdownDimensions?: string[]
}

/**
 * Single retention data point in the flat result format.
 * Results are returned as a flat array; client transforms to matrix if needed.
 *
 * Simplified format: no cohortPeriod since we use a single cohort model.
 * When breakdownDimensions are specified, results include breakdownValues.
 */
export interface RetentionResultRow {
  /** Period number (0 = cohort entry, 1 = first retention period, etc.) */
  period: number

  /** Number of users in the cohort (or segment when breakdown is used) */
  cohortSize: number

  /** Number of users retained in this period */
  retainedUsers: number

  /** Retention rate as decimal (0-1), e.g., 0.45 for 45% */
  retentionRate: number

  /**
   * Breakdown values when breakdownDimensions are specified.
   * Keyed by dimension name (e.g., { "Events.country": "US", "Events.plan": "pro" })
   */
  breakdownValues?: Record<string, string | null>
}

/**
 * Retention capabilities per database engine
 */
export interface RetentionCapabilities {
  /** Whether database supports DATE_TRUNC natively */
  supportsDateTrunc: boolean

  /** Whether database supports DATE_DIFF with unit specification */
  supportsDateDiff: boolean

  /** Whether database supports generate_series for period generation */
  supportsGenerateSeries: boolean
}

/**
 * Type guard for multi-cube binding key
 */
export function isRetentionMultiCubeBindingKey(
  bindingKey: string | RetentionBindingKeyMapping[]
): bindingKey is RetentionBindingKeyMapping[] {
  return Array.isArray(bindingKey)
}

/**
 * Type guard for multi-cube time dimension (object form)
 */
export function isRetentionMultiCubeTimeDimension(
  timeDimension: string | RetentionTimeDimensionMapping
): timeDimension is RetentionTimeDimensionMapping {
  return typeof timeDimension === 'object' && timeDimension !== null && 'cube' in timeDimension
}

/**
 * Type guard for retention query
 */
export function isRetentionQuery(query: unknown): query is { retention: RetentionQueryConfig } {
  if (!query || typeof query !== 'object') return false
  const q = query as Record<string, unknown>
  return (
    q.retention !== undefined &&
    typeof q.retention === 'object' &&
    q.retention !== null
  )
}

/**
 * Extract cube name from a time dimension specification
 */
export function extractCubeFromTimeDimension(
  timeDimension: string | RetentionTimeDimensionMapping
): string {
  if (isRetentionMultiCubeTimeDimension(timeDimension)) {
    return timeDimension.cube
  }
  // String format: 'CubeName.dimensionName'
  const dotIndex = timeDimension.indexOf('.')
  if (dotIndex === -1) {
    throw new Error(`Invalid time dimension format: ${timeDimension}. Expected 'CubeName.dimensionName'`)
  }
  return timeDimension.substring(0, dotIndex)
}

/**
 * Extract dimension name from a time dimension specification
 */
export function extractDimensionFromTimeDimension(
  timeDimension: string | RetentionTimeDimensionMapping
): string {
  if (isRetentionMultiCubeTimeDimension(timeDimension)) {
    return timeDimension.dimension
  }
  // String format: 'CubeName.dimensionName'
  const dotIndex = timeDimension.indexOf('.')
  if (dotIndex === -1) {
    throw new Error(`Invalid time dimension format: ${timeDimension}. Expected 'CubeName.dimensionName'`)
  }
  return timeDimension.substring(dotIndex + 1)
}

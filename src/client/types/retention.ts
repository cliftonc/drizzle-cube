/**
 * Retention Analysis Types
 *
 * Types for Retention analysis mode which tracks cohort-based retention over time.
 * Retention analysis measures what percentage of users from each cohort return
 * in subsequent time periods.
 */

import type { Filter } from '../types'
import type { FunnelBindingKey } from './funnel'

// ============================================================================
// Date Range Types
// ============================================================================

/**
 * Date range for cohort analysis (REQUIRED)
 * Matches server's RetentionDateRange interface
 */
export interface DateRange {
  /** Start date (inclusive), ISO 8601 format (YYYY-MM-DD) */
  start: string
  /** End date (inclusive), ISO 8601 format (YYYY-MM-DD) */
  end: string
}

/**
 * Preset date range type
 */
export type DateRangePreset =
  | 'last_30_days'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_12_months'
  | 'this_year'
  | 'last_year'
  | 'custom'

/**
 * Preset date range options for the UI
 */
export const RETENTION_DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'last_12_months', label: 'Last 12 months' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_year', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
]

/**
 * Default preset for retention date range
 */
export const DEFAULT_DATE_RANGE_PRESET: DateRangePreset = 'last_3_months'

/**
 * Calculate date range from a preset value
 * Returns ISO date strings (YYYY-MM-DD)
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'last_30_days': {
      const start = new Date(today)
      start.setDate(start.getDate() - 30)
      return {
        start: formatDateToISO(start),
        end: formatDateToISO(today),
      }
    }
    case 'last_3_months': {
      // Start of 3 months ago to end of last month
      const start = new Date(today.getFullYear(), today.getMonth() - 3, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of previous month
      return {
        start: formatDateToISO(start),
        end: formatDateToISO(end),
      }
    }
    case 'last_6_months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 6, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        start: formatDateToISO(start),
        end: formatDateToISO(end),
      }
    }
    case 'last_12_months': {
      const start = new Date(today.getFullYear(), today.getMonth() - 12, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        start: formatDateToISO(start),
        end: formatDateToISO(end),
      }
    }
    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1)
      return {
        start: formatDateToISO(start),
        end: formatDateToISO(today),
      }
    }
    case 'last_year': {
      const start = new Date(today.getFullYear() - 1, 0, 1)
      const end = new Date(today.getFullYear() - 1, 11, 31)
      return {
        start: formatDateToISO(start),
        end: formatDateToISO(end),
      }
    }
    case 'custom':
    default:
      // For custom, return last 3 months as fallback
      return getDateRangeFromPreset('last_3_months')
  }
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 */
function formatDateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Detect which preset a date range matches, if any
 */
export function detectDateRangePreset(range: DateRange): DateRangePreset {
  for (const preset of RETENTION_DATE_RANGE_PRESETS) {
    if (preset.value === 'custom') continue
    const presetRange = getDateRangeFromPreset(preset.value)
    if (presetRange.start === range.start && presetRange.end === range.end) {
      return preset.value
    }
  }
  return 'custom'
}

// ============================================================================
// Server Query Format
// ============================================================================

/**
 * Server retention query format
 * This is the shape sent to the server for execution
 * Wrapped in { retention: {...} } similar to funnel queries
 */
export interface ServerRetentionQuery {
  retention: RetentionQueryConfig
}

/**
 * Retention query configuration
 * Contains all parameters needed for server-side retention analysis
 *
 * Simplified Mixpanel-style format:
 * - Single cube and timestamp dimension
 * - Single cohort (date range defines the cohort, not granularity)
 * - Optional breakdown dimension for segmentation
 */
export interface RetentionQueryConfig {
  /**
   * Single timestamp dimension for the analysis.
   * String format (e.g., 'Events.timestamp'),
   * Object format for multi-cube with explicit cube reference.
   */
  timeDimension: string | { cube: string; dimension: string }

  /**
   * Binding key - dimension that links users across events.
   * This is typically a user ID or other entity identifier.
   * String for single-cube (e.g., 'Events.userId'),
   * Array for multi-cube with different column names per cube.
   */
  bindingKey: string | { cube: string; dimension: string }[]

  /**
   * Date range for cohort analysis (REQUIRED).
   * Users who first performed the cohort action within this range are included.
   */
  dateRange: DateRange

  /**
   * Granularity for viewing retention periods.
   * Determines how retention periods are measured (day/week/month).
   */
  granularity: RetentionGranularity

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
  retentionType: RetentionType

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
   * When provided, retention is calculated per breakdown value combination.
   * e.g., ["Events.country"] or ["Events.country", "Events.plan"]
   */
  breakdownDimensions?: string[]
}

// ============================================================================
// Enums and Unions
// ============================================================================

/**
 * Supported granularity levels for retention analysis
 */
export type RetentionGranularity = 'day' | 'week' | 'month'

/**
 * Retention calculation types
 * - classic: User active exactly in period N
 * - rolling: User active in period N or any later period
 */
export type RetentionType = 'classic' | 'rolling'

// ============================================================================
// Result Types
// ============================================================================

/**
 * Single retention data point returned from server
 * Results are returned as a flat array; client transforms to matrix if needed
 */
export interface RetentionResultRow {
  /** Period number (0 = cohort entry, 1 = first retention period, etc.) */
  period: number

  /** Number of users in the cohort */
  cohortSize: number

  /** Number of users retained in this period */
  retainedUsers: number

  /** Retention rate as decimal (0-1), e.g., 0.45 for 45% */
  retentionRate: number

  /** Breakdown value when breakdown dimension is specified (e.g., "US", "UK") */
  breakdownValue?: string | null
}

/**
 * Retention chart data format for visualization
 * Supports both heatmap and line chart modes
 */
export interface RetentionChartData {
  rows: RetentionResultRow[]
  /** Period numbers (0 to periods) */
  periods: number[]
  /** Breakdown values when breakdown dimension is specified */
  breakdownValues?: string[]
  /** Summary statistics */
  summary?: RetentionSummary
  /** Granularity of retention periods (day/week/month) for period label formatting */
  granularity?: RetentionGranularity
  /** Human-readable label extracted from the binding key dimension (e.g., "userId" from "Users.userId") */
  bindingKeyLabel?: string
}

/**
 * Summary statistics for retention analysis
 */
export interface RetentionSummary {
  /** Total unique users in the cohort */
  totalUsers: number
  /** Average retention rate across all periods for period 1 */
  avgPeriod1Retention: number
  /** Highest retention rate for period 1 */
  maxPeriod1Retention: number
  /** Lowest retention rate for period 1 */
  minPeriod1Retention: number
  /** Number of breakdown segments (1 if no breakdown) */
  segmentCount?: number
}

// ============================================================================
// Breakdown Types
// ============================================================================

/**
 * Breakdown item for retention analysis (single dimension)
 * Follows Mixpanel pattern - one breakdown dimension only
 */
export interface RetentionBreakdownItem {
  /** Full dimension name (e.g., "Events.country") */
  field: string
  /** Display label for the dimension */
  label?: string
}

// ============================================================================
// Slice State (for Zustand store)
// ============================================================================

/**
 * Retention mode state for the AnalysisBuilder store
 * Simplified Mixpanel-style with single global configuration
 *
 * Key simplifications from previous version:
 * - Single cube for all (no separate cohort/activity cubes)
 * - Single timestamp dimension
 * - Single cohort with breakdown support (no cohort explosion)
 * - Granularity = viewing periods only
 */
export interface RetentionSliceState {
  /** Single cube for retention analysis */
  retentionCube: string | null

  /** Binding key that identifies entities (reuses funnel binding key type) */
  retentionBindingKey: FunnelBindingKey | null

  /** Single timestamp dimension for both cohort entry and activity */
  retentionTimeDimension: string | null

  /** Date range for cohort analysis (REQUIRED) */
  retentionDateRange: DateRange

  /** Filters that define who enters the cohort */
  retentionCohortFilters: Filter[]

  /** Filters that define what counts as a return */
  retentionActivityFilters: Filter[]

  /** Optional breakdown dimensions for segmenting the cohort */
  retentionBreakdowns: RetentionBreakdownItem[]

  /** Granularity for viewing retention periods (day/week/month) */
  retentionViewGranularity: RetentionGranularity

  /** Number of periods to analyze (1-52) */
  retentionPeriods: number

  /** Type of retention calculation */
  retentionType: RetentionType
}

/**
 * Retention slice actions for the store
 */
export interface RetentionSliceActions {
  /** Set the single cube for retention analysis */
  setRetentionCube: (cube: string | null) => void
  /** Set the retention binding key */
  setRetentionBindingKey: (key: FunnelBindingKey | null) => void
  /** Set the single timestamp dimension */
  setRetentionTimeDimension: (dim: string | null) => void
  /** Set the date range (REQUIRED) */
  setRetentionDateRange: (range: DateRange) => void
  /** Set all cohort filters at once */
  setRetentionCohortFilters: (filters: Filter[]) => void
  /** Add a cohort filter */
  addRetentionCohortFilter: (filter: Filter) => void
  /** Remove a cohort filter by index */
  removeRetentionCohortFilter: (index: number) => void
  /** Update a cohort filter by index */
  updateRetentionCohortFilter: (index: number, filter: Filter) => void
  /** Set all activity filters at once */
  setRetentionActivityFilters: (filters: Filter[]) => void
  /** Add an activity filter */
  addRetentionActivityFilter: (filter: Filter) => void
  /** Remove an activity filter by index */
  removeRetentionActivityFilter: (index: number) => void
  /** Update an activity filter by index */
  updateRetentionActivityFilter: (index: number, filter: Filter) => void
  /** Set all breakdown dimensions */
  setRetentionBreakdowns: (breakdowns: RetentionBreakdownItem[]) => void
  /** Add a breakdown dimension */
  addRetentionBreakdown: (breakdown: RetentionBreakdownItem) => void
  /** Remove a breakdown dimension by field name */
  removeRetentionBreakdown: (field: string) => void
  /** Set the view granularity */
  setRetentionViewGranularity: (granularity: RetentionGranularity) => void
  /** Set the number of periods */
  setRetentionPeriods: (periods: number) => void
  /** Set the retention type */
  setRetentionType: (type: RetentionType) => void
  /** Check if in retention mode (analysisType === 'retention') */
  isRetentionMode: () => boolean
  /** Check if retention mode is properly configured and ready for execution */
  isRetentionModeEnabled: () => boolean
  /** Build ServerRetentionQuery from retention state */
  buildRetentionQuery: () => ServerRetentionQuery | null
  /** Get validation errors explaining why retention query cannot be built */
  getRetentionValidation: () => { isValid: boolean; errors: string[]; warnings: string[] }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if data is retention chart data
 */
export function isRetentionData(data: unknown): data is RetentionChartData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    Array.isArray(d.rows) &&
    Array.isArray(d.periods)
  )
}

/**
 * Type guard to detect server retention query format
 * Used to distinguish { retention: {...} } from CubeQuery, etc.
 */
export function isServerRetentionQuery(obj: unknown): obj is ServerRetentionQuery {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'retention' in obj &&
    typeof (obj as { retention: unknown }).retention === 'object'
  )
}

/**
 * Type guard for retention result row
 */
export function isRetentionResultRow(row: unknown): row is RetentionResultRow {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return (
    typeof r.cohortPeriod === 'string' &&
    typeof r.period === 'number' &&
    typeof r.cohortSize === 'number' &&
    typeof r.retainedUsers === 'number' &&
    typeof r.retentionRate === 'number'
  )
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default retention slice state for store initialization
 */
export const defaultRetentionSliceState: RetentionSliceState = {
  retentionCube: null,
  retentionBindingKey: null,
  retentionTimeDimension: null,
  retentionDateRange: getDateRangeFromPreset(DEFAULT_DATE_RANGE_PRESET),
  retentionCohortFilters: [],
  retentionActivityFilters: [],
  retentionBreakdowns: [],
  retentionViewGranularity: 'week',
  retentionPeriods: 12,
  retentionType: 'classic',
}

/**
 * Minimum and maximum values for retention periods
 */
export const RETENTION_MIN_PERIODS = 1
export const RETENTION_MAX_PERIODS = 52

/**
 * Available granularity options
 */
export const RETENTION_GRANULARITY_OPTIONS: { value: RetentionGranularity; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

/**
 * Available retention type options
 */
export const RETENTION_TYPE_OPTIONS: { value: RetentionType; label: string; description: string }[] = [
  {
    value: 'classic',
    label: 'Classic',
    description: 'User was active in exactly period N',
  },
  {
    value: 'rolling',
    label: 'Rolling',
    description: 'User was active in period N or later',
  },
]

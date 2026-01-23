/**
 * Retention Mode Adapter
 *
 * Handles conversion between UI state and AnalysisConfig for retention mode.
 * Converts RetentionSliceState UI state to/from ServerRetentionQuery format.
 *
 * Simplified Mixpanel-style format (Phase 5):
 * - Single cube for all analysis
 * - Single timestamp dimension
 * - Single cohort with breakdown support
 * - Granularity = viewing periods
 */

import type { ModeAdapter, ValidationResult } from './modeAdapter'
import type {
  AnalysisConfig,
  RetentionAnalysisConfig,
  AnalysisType,
  ChartConfig,
} from '../types/analysisConfig'
import type { Filter } from '../types'
import type { FunnelBindingKey } from '../types/funnel'
import type {
  ServerRetentionQuery,
  RetentionSliceState,
  RetentionGranularity,
  RetentionType,
  DateRange,
  RetentionBreakdownItem,
} from '../types/retention'
import { defaultRetentionSliceState, getDateRangeFromPreset, DEFAULT_DATE_RANGE_PRESET } from '../types/retention'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert RetentionSliceState to ServerRetentionQuery
 * Uses the new simplified format from Phase 1
 */
function stateToServerQuery(state: RetentionSliceState): ServerRetentionQuery {
  // Convert binding key to server format
  let bindingKey: ServerRetentionQuery['retention']['bindingKey'] = ''
  if (state.retentionBindingKey) {
    if (typeof state.retentionBindingKey.dimension === 'string') {
      bindingKey = state.retentionBindingKey.dimension
    } else if (Array.isArray(state.retentionBindingKey.dimension)) {
      bindingKey = state.retentionBindingKey.dimension.map((mapping) => ({
        cube: mapping.cube,
        dimension: mapping.dimension,
      }))
    }
  }

  // Build the server query with new simplified format
  const query: ServerRetentionQuery = {
    retention: {
      timeDimension: state.retentionTimeDimension || '',
      bindingKey,
      dateRange: state.retentionDateRange,
      granularity: state.retentionViewGranularity,
      periods: state.retentionPeriods,
      retentionType: state.retentionType,
    },
  }

  // Add cohort filters if present
  if (state.retentionCohortFilters.length > 0) {
    query.retention.cohortFilters =
      state.retentionCohortFilters.length === 1
        ? state.retentionCohortFilters[0]
        : state.retentionCohortFilters
  }

  // Add activity filters if present
  if (state.retentionActivityFilters.length > 0) {
    query.retention.activityFilters =
      state.retentionActivityFilters.length === 1
        ? state.retentionActivityFilters[0]
        : state.retentionActivityFilters
  }

  // Add breakdown dimensions if present
  if (state.retentionBreakdowns && state.retentionBreakdowns.length > 0) {
    query.retention.breakdownDimensions = state.retentionBreakdowns.map((b) => b.field)
  }

  return query
}

/**
 * Convert ServerRetentionQuery to RetentionSliceState
 * Uses the new simplified format from Phase 1
 */
function serverQueryToState(query: ServerRetentionQuery): RetentionSliceState {
  const { retention } = query

  // Extract cube from time dimension
  let retentionCube: string | null = null
  if (typeof retention.timeDimension === 'string') {
    const parts = retention.timeDimension.split('.')
    if (parts.length > 0) {
      retentionCube = parts[0]
    }
  } else if (retention.timeDimension?.cube) {
    retentionCube = retention.timeDimension.cube
  }

  // Convert binding key to client format
  let retentionBindingKey: FunnelBindingKey | null = null
  if (retention.bindingKey) {
    if (typeof retention.bindingKey === 'string') {
      retentionBindingKey = { dimension: retention.bindingKey }
    } else if (Array.isArray(retention.bindingKey)) {
      retentionBindingKey = {
        dimension: retention.bindingKey.map((mapping) => ({
          cube: mapping.cube,
          dimension: mapping.dimension,
        })),
      }
    }
  }

  // Convert time dimension
  let retentionTimeDimension: string | null = null
  if (retention.timeDimension) {
    if (typeof retention.timeDimension === 'string') {
      retentionTimeDimension = retention.timeDimension
    } else {
      retentionTimeDimension = `${retention.timeDimension.cube}.${retention.timeDimension.dimension}`
    }
  }

  // Convert filters
  let retentionCohortFilters: Filter[] = []
  if (retention.cohortFilters) {
    if (Array.isArray(retention.cohortFilters)) {
      retentionCohortFilters = retention.cohortFilters as Filter[]
    } else {
      retentionCohortFilters = [retention.cohortFilters as Filter]
    }
  }

  let retentionActivityFilters: Filter[] = []
  if (retention.activityFilters) {
    if (Array.isArray(retention.activityFilters)) {
      retentionActivityFilters = retention.activityFilters as Filter[]
    } else {
      retentionActivityFilters = [retention.activityFilters as Filter]
    }
  }

  // Convert breakdown dimensions
  let retentionBreakdowns: RetentionBreakdownItem[] = []
  if (retention.breakdownDimensions && Array.isArray(retention.breakdownDimensions)) {
    retentionBreakdowns = retention.breakdownDimensions.map((field) => ({
      field,
      label: field.split('.').pop() || field,
    }))
  }

  // Extract or default the date range
  const retentionDateRange: DateRange = retention.dateRange || getDateRangeFromPreset(DEFAULT_DATE_RANGE_PRESET)

  return {
    retentionCube,
    retentionBindingKey,
    retentionTimeDimension,
    retentionDateRange,
    retentionViewGranularity: retention.granularity as RetentionGranularity,
    retentionPeriods: retention.periods,
    retentionType: retention.retentionType as RetentionType,
    retentionCohortFilters,
    retentionActivityFilters,
    retentionBreakdowns,
  }
}

/**
 * Check if a config is a valid retention config
 */
function isValidRetentionConfig(config: unknown): config is RetentionAnalysisConfig {
  if (!config || typeof config !== 'object') return false

  const c = config as Record<string, unknown>

  if (c.version !== 1) return false
  if (c.analysisType !== 'retention') return false
  if (!c.query || typeof c.query !== 'object') return false

  const query = c.query as Record<string, unknown>
  if (!query.retention || typeof query.retention !== 'object') return false

  return true
}

// ============================================================================
// Retention Mode Adapter
// ============================================================================

export const retentionModeAdapter: ModeAdapter<RetentionSliceState> = {
  type: 'retention',

  createInitial(): RetentionSliceState {
    return { ...defaultRetentionSliceState }
  },

  extractState(storeState: Record<string, unknown>): RetentionSliceState {
    return {
      retentionCube: storeState.retentionCube as string | null,
      retentionBindingKey: storeState.retentionBindingKey as FunnelBindingKey | null,
      retentionTimeDimension: storeState.retentionTimeDimension as string | null,
      retentionDateRange: (storeState.retentionDateRange as DateRange) || getDateRangeFromPreset(DEFAULT_DATE_RANGE_PRESET),
      retentionViewGranularity: (storeState.retentionViewGranularity as RetentionGranularity) || 'week',
      retentionPeriods: (storeState.retentionPeriods as number) || 12,
      retentionType: (storeState.retentionType as RetentionType) || 'classic',
      retentionCohortFilters: (storeState.retentionCohortFilters as Filter[]) || [],
      retentionActivityFilters: (storeState.retentionActivityFilters as Filter[]) || [],
      retentionBreakdowns: (storeState.retentionBreakdowns as RetentionBreakdownItem[]) || [],
    }
  },

  canLoad(config: unknown): config is AnalysisConfig {
    return isValidRetentionConfig(config)
  },

  load(config: AnalysisConfig): RetentionSliceState {
    // Type guard - ensure it's a retention config
    if (config.analysisType !== 'retention') {
      throw new Error(
        `Cannot load ${config.analysisType} config with retention adapter`
      )
    }

    const retentionConfig = config as RetentionAnalysisConfig
    return serverQueryToState(retentionConfig.query)
  },

  save(
    state: RetentionSliceState,
    charts: Partial<Record<AnalysisType, ChartConfig>>,
    activeView: 'table' | 'chart'
  ): RetentionAnalysisConfig {
    return {
      version: 1,
      analysisType: 'retention',
      activeView,
      charts: {
        retention: charts.retention || this.getDefaultChartConfig(),
      },
      query: stateToServerQuery(state),
    }
  },

  validate(state: RetentionSliceState): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Must have a cube selected
    if (!state.retentionCube) {
      errors.push('Select a cube for retention analysis')
    }

    // Must have a time dimension
    if (!state.retentionTimeDimension) {
      errors.push('Select a timestamp dimension for the analysis')
    }

    // Must have a binding key
    if (!state.retentionBindingKey?.dimension) {
      errors.push('Select a user identifier (binding key) to track retention')
    }

    // Date range is required
    if (!state.retentionDateRange?.start || !state.retentionDateRange?.end) {
      errors.push('Date range is required for retention analysis')
    } else {
      // Validate date format
      const startDate = new Date(state.retentionDateRange.start)
      const endDate = new Date(state.retentionDateRange.end)
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date format')
      }
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date format')
      }
      if (startDate > endDate) {
        errors.push('Start date must be before or equal to end date')
      }
    }

    // Periods must be valid
    if (state.retentionPeriods < 1) {
      errors.push('At least 1 retention period is required')
    }
    if (state.retentionPeriods > 52) {
      warnings.push('More than 52 periods may impact performance')
    }

    // Check time dimension format
    if (state.retentionTimeDimension) {
      const parts = state.retentionTimeDimension.split('.')
      if (parts.length < 2) {
        warnings.push('Time dimension should be in format "Cube.dimension"')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  },

  clear(state: RetentionSliceState): RetentionSliceState {
    // Keep cube selection and date range but clear other configuration
    return {
      ...this.createInitial(),
      retentionCube: state.retentionCube,
      retentionDateRange: state.retentionDateRange,
    }
  },

  getDefaultChartConfig(): ChartConfig {
    return {
      chartType: 'retentionCombined',
      chartConfig: {
        // RetentionCombinedChart auto-configures from the retention data structure
        // No explicit axis mapping needed
      },
      displayConfig: {
        showLegend: true,
        showTooltip: true,
        showGrid: true,
        retentionDisplayMode: 'combined',
      },
    }
  },
}

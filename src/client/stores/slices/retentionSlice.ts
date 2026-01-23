/**
 * Retention Slice
 *
 * Simplified Mixpanel-style retention state management:
 * - Single cube for all analysis
 * - Single timestamp dimension
 * - Single cohort with breakdown support
 * - Granularity = viewing periods
 */

import type { StateCreator } from 'zustand'
import type { AnalysisBuilderStore } from '../analysisBuilderStore'
import type { Filter, FunnelBindingKey } from '../../types'
import type {
  ServerRetentionQuery,
  RetentionSliceState,
  RetentionGranularity,
  RetentionType,
  DateRange,
  RetentionBreakdownItem,
} from '../../types/retention'
import {
  defaultRetentionSliceState,
  RETENTION_MIN_PERIODS,
  RETENTION_MAX_PERIODS,
} from '../../types/retention'

// ============================================================================
// Types
// ============================================================================

/**
 * Retention slice actions
 */
export interface RetentionSliceActions {
  /** Set the single cube for retention analysis (clears related fields) */
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
  /** Remove a breakdown dimension by field */
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

export type RetentionSlice = RetentionSliceState & RetentionSliceActions

// ============================================================================
// Initial State
// ============================================================================

export const createInitialRetentionState = (): RetentionSliceState => ({
  ...defaultRetentionSliceState,
})

// ============================================================================
// Slice Creator
// ============================================================================

/**
 * Create the retention slice.
 * Uses StateCreator pattern for composability.
 */
export const createRetentionSlice: StateCreator<
  AnalysisBuilderStore,
  [],
  [],
  RetentionSlice
> = (set, get) => ({
  ...createInitialRetentionState(),

  setRetentionCube: (cube) =>
    set(() => ({
      retentionCube: cube,
      // Clear related fields when cube changes
      retentionTimeDimension: null,
      retentionBindingKey: null,
      retentionCohortFilters: [],
      retentionActivityFilters: [],
      retentionBreakdowns: [],
    })),

  setRetentionBindingKey: (key) => set({ retentionBindingKey: key }),

  setRetentionTimeDimension: (dim) =>
    set({ retentionTimeDimension: dim }),

  setRetentionDateRange: (range) =>
    set({ retentionDateRange: range }),

  setRetentionCohortFilters: (filters) =>
    set({ retentionCohortFilters: filters }),

  addRetentionCohortFilter: (filter) =>
    set((state) => ({
      retentionCohortFilters: [...state.retentionCohortFilters, filter],
    })),

  removeRetentionCohortFilter: (index) =>
    set((state) => ({
      retentionCohortFilters: state.retentionCohortFilters.filter(
        (_, i) => i !== index
      ),
    })),

  updateRetentionCohortFilter: (index, filter) =>
    set((state) => {
      const newFilters = [...state.retentionCohortFilters]
      if (newFilters[index]) {
        newFilters[index] = filter
      }
      return { retentionCohortFilters: newFilters }
    }),

  setRetentionActivityFilters: (filters) =>
    set({ retentionActivityFilters: filters }),

  addRetentionActivityFilter: (filter) =>
    set((state) => ({
      retentionActivityFilters: [...state.retentionActivityFilters, filter],
    })),

  removeRetentionActivityFilter: (index) =>
    set((state) => ({
      retentionActivityFilters: state.retentionActivityFilters.filter(
        (_, i) => i !== index
      ),
    })),

  updateRetentionActivityFilter: (index, filter) =>
    set((state) => {
      const newFilters = [...state.retentionActivityFilters]
      if (newFilters[index]) {
        newFilters[index] = filter
      }
      return { retentionActivityFilters: newFilters }
    }),

  setRetentionBreakdowns: (breakdowns: RetentionBreakdownItem[]) =>
    set({ retentionBreakdowns: breakdowns }),

  addRetentionBreakdown: (breakdown: RetentionBreakdownItem) =>
    set((state) => ({
      retentionBreakdowns: [...state.retentionBreakdowns, breakdown],
    })),

  removeRetentionBreakdown: (field: string) =>
    set((state) => ({
      retentionBreakdowns: state.retentionBreakdowns.filter((b) => b.field !== field),
    })),

  setRetentionViewGranularity: (granularity) =>
    set({ retentionViewGranularity: granularity }),

  setRetentionPeriods: (periods) =>
    set({
      retentionPeriods: Math.max(
        RETENTION_MIN_PERIODS,
        Math.min(RETENTION_MAX_PERIODS, periods)
      ),
    }),

  setRetentionType: (type) => set({ retentionType: type }),

  isRetentionMode: () => get().analysisType === 'retention',

  isRetentionModeEnabled: () => {
    const state = get()

    if (state.analysisType !== 'retention') return false
    if (!state.retentionBindingKey?.dimension) return false
    if (!state.retentionTimeDimension) return false

    return true
  },

  buildRetentionQuery: () => {
    const state = get()

    if (state.analysisType !== 'retention') return null
    if (!state.retentionBindingKey?.dimension) return null
    if (!state.retentionTimeDimension) return null

    // Convert binding key to server format
    let bindingKey: ServerRetentionQuery['retention']['bindingKey']
    if (typeof state.retentionBindingKey.dimension === 'string') {
      bindingKey = state.retentionBindingKey.dimension
    } else if (Array.isArray(state.retentionBindingKey.dimension)) {
      bindingKey = state.retentionBindingKey.dimension.map((mapping) => ({
        cube: mapping.cube,
        dimension: mapping.dimension,
      }))
    } else {
      return null
    }

    // Build base query
    const query: ServerRetentionQuery = {
      retention: {
        timeDimension: state.retentionTimeDimension,
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
    if (state.retentionBreakdowns.length > 0) {
      query.retention.breakdownDimensions = state.retentionBreakdowns.map((b) => b.field)
    }

    return query
  },

  getRetentionValidation: () => {
    const state = get()
    const errors: string[] = []
    const warnings: string[] = []

    if (state.analysisType !== 'retention') {
      return { isValid: true, errors: [], warnings: [] }
    }

    // Check cube
    if (!state.retentionCube) {
      errors.push('Select a cube for retention analysis')
    }

    // Check binding key
    if (!state.retentionBindingKey?.dimension) {
      errors.push('Select a user identifier (binding key) to track retention')
    }

    // Check timestamp dimension
    if (!state.retentionTimeDimension) {
      errors.push('Select a timestamp dimension for the analysis')
    }

    // Check date range (REQUIRED)
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

    // Check periods
    if (state.retentionPeriods < 1) {
      errors.push('At least 1 retention period is required')
    }
    if (state.retentionPeriods > 52) {
      warnings.push('More than 52 periods may impact performance')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  },
})

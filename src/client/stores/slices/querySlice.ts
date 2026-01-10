/**
 * Query Slice
 *
 * Handles query mode state and actions:
 * - queryStates (array of query configurations)
 * - activeQueryIndex (current query tab)
 * - mergeStrategy (how to combine multiple queries)
 * - All metrics, breakdowns, filters actions
 */

import type { StateCreator } from 'zustand'
import type { AnalysisBuilderStore } from '../analysisBuilderStore'
import type {
  Filter,
  SimpleFilter,
  QueryMergeStrategy,
  CubeQuery,
  MultiQueryConfig,
} from '../../types'
import type {
  AnalysisBuilderState,
  MetricItem,
  BreakdownItem,
} from '../../components/AnalysisBuilder/types'
import {
  generateId,
  generateMetricLabel,
  createInitialState,
  buildCubeQuery,
} from '../../components/AnalysisBuilder/utils'
import { convertDateRangeTypeToValue } from '../../shared/utils'

// ============================================================================
// Types
// ============================================================================

/**
 * Query slice state
 */
export interface QuerySliceState {
  /** Array of query states (one per tab) */
  queryStates: AnalysisBuilderState[]
  /** Index of the currently active query tab */
  activeQueryIndex: number
  /** Strategy for merging multi-query results */
  mergeStrategy: QueryMergeStrategy
}

/**
 * Query slice actions
 */
export interface QuerySliceActions {
  // Query state management
  setQueryStates: (states: AnalysisBuilderState[]) => void
  updateQueryState: (
    index: number,
    updater: (state: AnalysisBuilderState) => AnalysisBuilderState
  ) => void
  setActiveQueryIndex: (index: number) => void
  setMergeStrategy: (strategy: QueryMergeStrategy) => void

  // Multi-query actions
  addQuery: () => void
  removeQuery: (index: number) => void

  // Metrics actions
  addMetric: (field: string, label?: string) => void
  removeMetric: (id: string) => void
  toggleMetric: (fieldName: string) => void
  reorderMetrics: (fromIndex: number, toIndex: number) => void

  // Breakdowns actions
  addBreakdown: (field: string, isTimeDimension: boolean, granularity?: string) => void
  removeBreakdown: (id: string) => void
  toggleBreakdown: (fieldName: string, isTimeDimension: boolean, granularity?: string) => void
  setBreakdownGranularity: (id: string, granularity: string) => void
  toggleBreakdownComparison: (id: string) => void
  reorderBreakdowns: (fromIndex: number, toIndex: number) => void

  // Filters actions
  setFilters: (filters: Filter[]) => void
  dropFieldToFilter: (field: string) => void
  setOrder: (fieldName: string, direction: 'asc' | 'desc' | null) => void

  // Utility actions
  getCurrentState: () => AnalysisBuilderState
  getMergeKeys: () => string[] | undefined
  isMultiQueryMode: () => boolean
  buildCurrentQuery: () => CubeQuery
  buildAllQueries: () => CubeQuery[]
  buildMultiQueryConfig: () => MultiQueryConfig | null
}

export type QuerySlice = QuerySliceState & QuerySliceActions

// ============================================================================
// Initial State
// ============================================================================

export const createInitialQueryState = (): QuerySliceState => ({
  queryStates: [createInitialState()],
  activeQueryIndex: 0,
  mergeStrategy: 'concat',
})

// ============================================================================
// Slice Creator
// ============================================================================

/**
 * Create the query slice.
 * Uses StateCreator pattern for composability.
 */
export const createQuerySlice: StateCreator<
  AnalysisBuilderStore,
  [],
  [],
  QuerySlice
> = (set, get) => ({
  ...createInitialQueryState(),

  // ==========================================================================
  // Query State Management
  // ==========================================================================

  setQueryStates: (states) => set({ queryStates: states }),

  updateQueryState: (index, updater) =>
    set((state) => {
      const newStates = [...state.queryStates]
      newStates[index] = updater(newStates[index] || createInitialState())
      return { queryStates: newStates }
    }),

  setActiveQueryIndex: (index) => set({ activeQueryIndex: index }),

  setMergeStrategy: (strategy) => set({ mergeStrategy: strategy }),

  // ==========================================================================
  // Multi-Query Actions
  // ==========================================================================

  addQuery: () =>
    set((state) => {
      const currentState = state.queryStates[state.activeQueryIndex] || createInitialState()
      const newState: AnalysisBuilderState = {
        ...createInitialState(),
        metrics: [...currentState.metrics],
        breakdowns: [...currentState.breakdowns],
        filters: [...currentState.filters],
      }
      return {
        queryStates: [...state.queryStates, newState],
        activeQueryIndex: state.queryStates.length,
      }
    }),

  removeQuery: (index) =>
    set((state) => {
      if (state.queryStates.length <= 1) return state
      const newStates = state.queryStates.filter((_, i) => i !== index)
      let newActiveIndex = state.activeQueryIndex
      if (index === state.activeQueryIndex) {
        newActiveIndex = Math.max(0, state.activeQueryIndex - 1)
      } else if (index < state.activeQueryIndex) {
        newActiveIndex = state.activeQueryIndex - 1
      }
      return { queryStates: newStates, activeQueryIndex: newActiveIndex }
    }),

  // ==========================================================================
  // Metrics Actions
  // ==========================================================================

  addMetric: (field, label) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const newMetric: MetricItem = {
        id: generateId(),
        field,
        label: label || generateMetricLabel(currentState.metrics.length),
      }
      newStates[index] = {
        ...currentState,
        metrics: [...currentState.metrics, newMetric],
      }
      return { queryStates: newStates }
    }),

  removeMetric: (id) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const fieldToRemove = currentState.metrics.find((m) => m.id === id)?.field
      const newMetrics = currentState.metrics.filter((m) => m.id !== id)

      // Clean up sort order for removed field
      let newOrder = currentState.order
      if (fieldToRemove && newOrder && newOrder[fieldToRemove]) {
        newOrder = { ...newOrder }
        delete newOrder[fieldToRemove]
        if (Object.keys(newOrder).length === 0) {
          newOrder = undefined
        }
      }

      newStates[index] = {
        ...currentState,
        metrics: newMetrics,
        order: newOrder,
      }
      return { queryStates: newStates }
    }),

  toggleMetric: (fieldName) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const existingIndex = currentState.metrics.findIndex((m) => m.field === fieldName)

      if (existingIndex >= 0) {
        newStates[index] = {
          ...currentState,
          metrics: currentState.metrics.filter((_, i) => i !== existingIndex),
        }
      } else {
        const newMetric: MetricItem = {
          id: generateId(),
          field: fieldName,
          label: generateMetricLabel(currentState.metrics.length),
        }
        newStates[index] = {
          ...currentState,
          metrics: [...currentState.metrics, newMetric],
        }
      }
      return { queryStates: newStates }
    }),

  reorderMetrics: (fromIndex, toIndex) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const newMetrics = [...currentState.metrics]
      const [movedItem] = newMetrics.splice(fromIndex, 1)
      newMetrics.splice(toIndex, 0, movedItem)
      newStates[index] = {
        ...currentState,
        metrics: newMetrics,
      }
      return { queryStates: newStates }
    }),

  // ==========================================================================
  // Breakdowns Actions
  // ==========================================================================

  addBreakdown: (field, isTimeDimension, granularity) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()

      // Only allow one time dimension
      if (isTimeDimension) {
        const hasExisting = currentState.breakdowns.some((b) => b.isTimeDimension)
        if (hasExisting) return state
      }

      const newBreakdown: BreakdownItem = {
        id: generateId(),
        field,
        isTimeDimension,
        granularity: isTimeDimension ? granularity || 'month' : undefined,
      }
      newStates[index] = {
        ...currentState,
        breakdowns: [...currentState.breakdowns, newBreakdown],
      }
      return { queryStates: newStates }
    }),

  removeBreakdown: (id) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const fieldToRemove = currentState.breakdowns.find((b) => b.id === id)?.field
      const newBreakdowns = currentState.breakdowns.filter((b) => b.id !== id)

      // Clean up sort order for removed field
      let newOrder = currentState.order
      if (fieldToRemove && newOrder && newOrder[fieldToRemove]) {
        newOrder = { ...newOrder }
        delete newOrder[fieldToRemove]
        if (Object.keys(newOrder).length === 0) {
          newOrder = undefined
        }
      }

      newStates[index] = {
        ...currentState,
        breakdowns: newBreakdowns,
        order: newOrder,
      }
      return { queryStates: newStates }
    }),

  toggleBreakdown: (fieldName, isTimeDimension, granularity) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const existingIndex = currentState.breakdowns.findIndex((b) => b.field === fieldName)

      if (existingIndex >= 0) {
        newStates[index] = {
          ...currentState,
          breakdowns: currentState.breakdowns.filter((_, i) => i !== existingIndex),
        }
      } else {
        // Check if we already have a time dimension
        if (isTimeDimension) {
          const hasExisting = currentState.breakdowns.some((b) => b.isTimeDimension)
          if (hasExisting) return state
        }

        const newBreakdown: BreakdownItem = {
          id: generateId(),
          field: fieldName,
          isTimeDimension,
          granularity: isTimeDimension ? granularity || 'month' : undefined,
        }
        newStates[index] = {
          ...currentState,
          breakdowns: [...currentState.breakdowns, newBreakdown],
        }
      }
      return { queryStates: newStates }
    }),

  setBreakdownGranularity: (id, granularity) =>
    set((state) => {
      const { mergeStrategy, activeQueryIndex, queryStates } = state
      const newStates = [...queryStates]

      // In merge mode, granularity changes update Q1 (source of truth)
      const targetIndex = mergeStrategy === 'merge' && activeQueryIndex > 0 ? 0 : activeQueryIndex

      newStates[targetIndex] = {
        ...newStates[targetIndex],
        breakdowns: newStates[targetIndex].breakdowns.map((b) =>
          b.id === id ? { ...b, granularity } : b
        ),
      }
      return { queryStates: newStates }
    }),

  toggleBreakdownComparison: (id) =>
    set((state) => {
      const { mergeStrategy, activeQueryIndex, queryStates, charts, analysisType } = state
      const newStates = [...queryStates]

      // Get source breakdowns based on mode
      const sourceIndex = mergeStrategy === 'merge' && activeQueryIndex > 0 ? 0 : activeQueryIndex

      // Find the breakdown being toggled
      const targetBreakdown = newStates[sourceIndex].breakdowns.find((b) => b.id === id)
      const isEnablingComparison = targetBreakdown && !targetBreakdown.enableComparison

      // Update breakdowns with comparison toggle
      const updatedBreakdowns = newStates[sourceIndex].breakdowns.map((b) => {
        if (b.id === id) {
          return { ...b, enableComparison: !b.enableComparison }
        }
        // Clear comparison from other time dimensions
        if (b.isTimeDimension && b.enableComparison) {
          return { ...b, enableComparison: false }
        }
        return b
      })

      newStates[sourceIndex] = {
        ...newStates[sourceIndex],
        breakdowns: updatedBreakdowns,
      }

      // Build result object
      const result: Partial<AnalysisBuilderStore> = { queryStates: newStates }

      // If enabling comparison, auto-add date filter if not present
      if (isEnablingComparison && targetBreakdown?.isTimeDimension && targetBreakdown.field) {
        const currentFilters = newStates[sourceIndex].filters || []

        // Check if a date filter already exists for this field
        const hasDateFilter = currentFilters.some((f) => {
          if ('member' in f) {
            const simple = f as SimpleFilter
            return simple.member === targetBreakdown.field && simple.operator === 'inDateRange'
          }
          return false
        })

        // If no date filter exists, add one with 'this month' as default
        if (!hasDateFilter) {
          const newDateFilter: SimpleFilter = {
            member: targetBreakdown.field,
            operator: 'inDateRange',
            values: [],
            dateRange: convertDateRangeTypeToValue('last_n_months', 3),
          } as SimpleFilter

          newStates[sourceIndex] = {
            ...newStates[sourceIndex],
            filters: [...currentFilters, newDateFilter],
          }
          result.queryStates = newStates
        }

        // Auto-switch to line chart if not already (line chart is best for comparison)
        const currentChartConfig = charts[analysisType]
        if (currentChartConfig && currentChartConfig.chartType !== 'line') {
          result.charts = {
            ...charts,
            [analysisType]: {
              ...currentChartConfig,
              chartType: 'line',
            },
          }
          result.userManuallySelectedChart = false
          result.activeView = 'chart'
          result.activeViews = {
            ...state.activeViews,
            [analysisType]: 'chart',
          }
        }
      }

      return result
    }),

  reorderBreakdowns: (fromIndex, toIndex) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const newBreakdowns = [...currentState.breakdowns]
      const [movedItem] = newBreakdowns.splice(fromIndex, 1)
      newBreakdowns.splice(toIndex, 0, movedItem)
      newStates[index] = {
        ...currentState,
        breakdowns: newBreakdowns,
      }
      return { queryStates: newStates }
    }),

  // ==========================================================================
  // Filters Actions
  // ==========================================================================

  setFilters: (filters) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      newStates[index] = {
        ...newStates[index],
        filters,
      }
      return { queryStates: newStates }
    }),

  dropFieldToFilter: (field) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const existingFilters = currentState.filters || []

      // Check if we already have a filter for this field
      const hasFilter = existingFilters.some((f) => 'member' in f && f.member === field)
      if (hasFilter) return state

      const newFilter: Filter = {
        member: field,
        operator: 'set',
        values: [],
      }

      let updatedFilters: Filter[]
      if (existingFilters.length === 0) {
        updatedFilters = [newFilter]
      } else if (existingFilters.length === 1 && 'type' in existingFilters[0]) {
        const group = existingFilters[0] as { type: 'and' | 'or'; filters: Filter[] }
        updatedFilters = [{ ...group, filters: [...group.filters, newFilter] }]
      } else {
        updatedFilters = [{ type: 'and' as const, filters: [...existingFilters, newFilter] }]
      }

      newStates[index] = {
        ...currentState,
        filters: updatedFilters,
      }
      return { queryStates: newStates }
    }),

  setOrder: (fieldName, direction) =>
    set((state) => {
      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      const currentState = newStates[index] || createInitialState()
      const newOrder = { ...(currentState.order || {}) }

      if (direction === null) {
        delete newOrder[fieldName]
      } else {
        newOrder[fieldName] = direction
      }

      newStates[index] = {
        ...currentState,
        order: Object.keys(newOrder).length > 0 ? newOrder : undefined,
      }
      return { queryStates: newStates }
    }),

  // ==========================================================================
  // Utility Actions
  // ==========================================================================

  getCurrentState: () => {
    const state = get()
    return state.queryStates[state.activeQueryIndex] || createInitialState()
  },

  getMergeKeys: () => {
    const state = get()
    if (state.mergeStrategy !== 'merge' || state.queryStates.length === 0) {
      return undefined
    }
    const q1Breakdowns = state.queryStates[0].breakdowns
    if (q1Breakdowns.length === 0) return undefined
    return q1Breakdowns.map((b) => b.field)
  },

  isMultiQueryMode: () => {
    const state = get()
    if (state.queryStates.length <= 1) return false
    const queriesWithContent = state.queryStates.filter(
      (qs) => qs.metrics.length > 0 || qs.breakdowns.length > 0
    )
    return queriesWithContent.length > 1
  },

  buildCurrentQuery: () => {
    const state = get()
    const current = state.queryStates[state.activeQueryIndex] || createInitialState()
    return buildCubeQuery(current.metrics, current.breakdowns, current.filters, current.order)
  },

  buildAllQueries: () => {
    const state = get()
    const q1Breakdowns = state.queryStates[0]?.breakdowns || []

    return state.queryStates.map((qs, index) => {
      // In merge mode, Q2+ inherit Q1's breakdowns
      const breakdowns =
        state.mergeStrategy === 'merge' && index > 0 ? q1Breakdowns : qs.breakdowns

      return buildCubeQuery(qs.metrics, breakdowns, qs.filters, qs.order)
    })
  },

  buildMultiQueryConfig: () => {
    const state = get()
    if (!get().isMultiQueryMode()) return null

    const allQueries = get().buildAllQueries()
    // Filter to queries that have at least one measure, dimension, or time dimension
    const validQueries = allQueries.filter((q) => {
      return (
        (q.measures && q.measures.length > 0) ||
        (q.dimensions && q.dimensions.length > 0) ||
        (q.timeDimensions && q.timeDimensions.length > 0)
      )
    })

    if (validQueries.length < 2) return null

    return {
      queries: validQueries,
      mergeStrategy: state.mergeStrategy,
      mergeKeys: get().getMergeKeys(),
      queryLabels: validQueries.map((_, i) => `Q${i + 1}`),
    }
  },
})

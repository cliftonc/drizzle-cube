/**
 * AnalysisBuilder Zustand Store (Instance-based)
 *
 * Centralized state management for AnalysisBuilder, consolidating:
 * - Query state (multi-query support with per-query metrics, breakdowns, filters)
 * - Chart configuration (type, axis config, display config)
 * - UI state (tabs, views, modals)
 * - AI state
 *
 * KEY ARCHITECTURE: Instance-based stores
 * - Each AnalysisBuilder component gets its own store instance
 * - Standalone mode: Uses localStorage persistence
 * - Modal/portlet editing mode: No persistence, initializes from props
 *
 * Uses Zustand's createStore (factory) instead of create (singleton).
 * Store is provided via React Context.
 */

import { createContext, useContext, useRef, type ReactNode } from 'react'
import { createStore, useStore, type StoreApi } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type {
  Filter,
  SimpleFilter,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  CubeQuery,
  QueryMergeStrategy,
  MultiQueryConfig,
  FunnelBindingKey,
  FunnelConfig,
} from '../types'
import type {
  AnalysisBuilderState,
  MetricItem,
  BreakdownItem,
  QueryPanelTab,
  AIState,
} from '../components/AnalysisBuilder/types'
import {
  generateId,
  generateMetricLabel,
  createInitialState,
  buildCubeQuery,
  STORAGE_KEY,
} from '../components/AnalysisBuilder/utils'
import { buildFunnelConfigFromQueries } from '../utils/funnelExecution'
import { findDateFilterForField } from '../components/AnalysisBuilder/utils'
import { convertDateRangeTypeToValue } from '../shared/utils'
import { getSmartChartDefaults } from '../shared/chartDefaults'

// ============================================================================
// Types
// ============================================================================

/**
 * Field modal mode for field search
 */
export type FieldModalMode = 'metrics' | 'breakdown'

/**
 * Complete store state interface
 */
export interface AnalysisBuilderStoreState {
  // =========================================================================
  // Query State (Multi-query support)
  // =========================================================================
  /** Array of query states (one per tab) */
  queryStates: AnalysisBuilderState[]
  /** Index of the currently active query tab */
  activeQueryIndex: number
  /** Strategy for merging multi-query results */
  mergeStrategy: QueryMergeStrategy

  // =========================================================================
  // Chart Configuration
  // =========================================================================
  /** Current chart type */
  chartType: ChartType
  /** Chart axis configuration */
  chartConfig: ChartAxisConfig
  /** Chart display configuration */
  displayConfig: ChartDisplayConfig
  /** Whether user manually selected chart type (disables auto-switch) */
  userManuallySelectedChart: boolean
  /** Current color palette name */
  localPaletteName: string

  // =========================================================================
  // UI State
  // =========================================================================
  /** Active tab in query panel */
  activeTab: QueryPanelTab
  /** Active view (table or chart) */
  activeView: 'table' | 'chart'
  /** Display limit for table */
  displayLimit: number
  /** Whether field search modal is open */
  showFieldModal: boolean
  /** Current mode for field search modal */
  fieldModalMode: FieldModalMode

  // =========================================================================
  // AI State
  // =========================================================================
  /** AI panel state */
  aiState: AIState

  // =========================================================================
  // Funnel State (when mergeStrategy === 'funnel')
  // =========================================================================
  /** Binding key dimension that links funnel steps together */
  funnelBindingKey: FunnelBindingKey | null
  /** Time window constraint for each step (ISO 8601 duration) */
  stepTimeToConvert: (string | null)[]
}

/**
 * Store actions interface
 */
export interface AnalysisBuilderStoreActions {
  // =========================================================================
  // Query State Actions
  // =========================================================================
  /** Set all query states */
  setQueryStates: (states: AnalysisBuilderState[]) => void
  /** Update a specific query state by index */
  updateQueryState: (
    index: number,
    updater: (state: AnalysisBuilderState) => AnalysisBuilderState
  ) => void
  /** Set active query index */
  setActiveQueryIndex: (index: number) => void
  /** Set merge strategy */
  setMergeStrategy: (strategy: QueryMergeStrategy) => void

  // =========================================================================
  // Metrics Actions
  // =========================================================================
  /** Open field modal in metrics mode */
  openMetricsModal: () => void
  /** Add a metric to current query */
  addMetric: (field: string, label?: string) => void
  /** Remove a metric from current query */
  removeMetric: (id: string) => void
  /** Toggle a metric (add if not present, remove if present) */
  toggleMetric: (fieldName: string) => void
  /** Reorder metrics */
  reorderMetrics: (fromIndex: number, toIndex: number) => void

  // =========================================================================
  // Breakdowns Actions
  // =========================================================================
  /** Open field modal in breakdown mode */
  openBreakdownsModal: () => void
  /** Add a breakdown to current query */
  addBreakdown: (field: string, isTimeDimension: boolean, granularity?: string) => void
  /** Remove a breakdown from current query */
  removeBreakdown: (id: string) => void
  /** Toggle a breakdown (add if not present, remove if present) */
  toggleBreakdown: (
    fieldName: string,
    isTimeDimension: boolean,
    granularity?: string
  ) => void
  /** Change granularity for a time dimension breakdown */
  setBreakdownGranularity: (id: string, granularity: string) => void
  /** Toggle comparison mode for a time dimension breakdown */
  toggleBreakdownComparison: (id: string) => void
  /** Reorder breakdowns */
  reorderBreakdowns: (fromIndex: number, toIndex: number) => void

  // =========================================================================
  // Filters Actions
  // =========================================================================
  /** Set filters for current query */
  setFilters: (filters: Filter[]) => void
  /** Drop a field to create a filter */
  dropFieldToFilter: (field: string) => void
  /** Set sort order for a field */
  setOrder: (fieldName: string, direction: 'asc' | 'desc' | null) => void

  // =========================================================================
  // Multi-Query Actions
  // =========================================================================
  /** Add a new query tab */
  addQuery: () => void
  /** Remove a query tab */
  removeQuery: (index: number) => void

  // =========================================================================
  // Chart Actions
  // =========================================================================
  /** Set chart type */
  setChartType: (type: ChartType) => void
  /** Set chart type with manual selection flag */
  setChartTypeManual: (type: ChartType) => void
  /** Set chart config */
  setChartConfig: (config: ChartAxisConfig) => void
  /** Set display config */
  setDisplayConfig: (config: ChartDisplayConfig) => void
  /** Set color palette name */
  setLocalPaletteName: (name: string) => void
  /** Set user manually selected chart flag */
  setUserManuallySelectedChart: (value: boolean) => void

  // =========================================================================
  // UI Actions
  // =========================================================================
  /** Set active tab */
  setActiveTab: (tab: QueryPanelTab) => void
  /** Set active view */
  setActiveView: (view: 'table' | 'chart') => void
  /** Set display limit */
  setDisplayLimit: (limit: number) => void
  /** Close field modal */
  closeFieldModal: () => void

  // =========================================================================
  // AI Actions
  // =========================================================================
  /** Open AI panel */
  openAI: () => void
  /** Close AI panel */
  closeAI: () => void
  /** Set AI prompt */
  setAIPrompt: (prompt: string) => void
  /** Set AI generating state */
  setAIGenerating: (generating: boolean) => void
  /** Set AI error */
  setAIError: (error: string | null) => void
  /** Set AI has generated query */
  setAIHasGeneratedQuery: (hasQuery: boolean) => void
  /** Save previous state for AI undo */
  saveAIPreviousState: () => void
  /** Restore previous state (AI cancel/undo) */
  restoreAIPreviousState: () => void

  // =========================================================================
  // Funnel Actions (when mergeStrategy === 'funnel')
  // =========================================================================
  /** Set the funnel binding key */
  setFunnelBindingKey: (bindingKey: FunnelBindingKey | null) => void
  /** Set time window for a specific step */
  setStepTimeToConvert: (stepIndex: number, duration: string | null) => void
  /** Build FunnelConfig from current state */
  buildFunnelConfig: () => FunnelConfig | null
  /** Check if in funnel mode */
  isFunnelMode: () => boolean

  // =========================================================================
  // Utility Actions
  // =========================================================================
  /** Clear the current query */
  clearQuery: () => void
  /** Load state from URL share */
  loadFromShare: (sharedState: SharedState) => void
  /** Get current state (helper accessor) */
  getCurrentState: () => AnalysisBuilderState
  /** Get merge keys (computed from Q1 breakdowns) */
  getMergeKeys: () => string[] | undefined
  /** Check if in multi-query mode */
  isMultiQueryMode: () => boolean
  /** Build current CubeQuery */
  buildCurrentQuery: () => CubeQuery
  /** Build all queries */
  buildAllQueries: () => CubeQuery[]
  /** Build MultiQueryConfig */
  buildMultiQueryConfig: () => MultiQueryConfig | null
  /** Reset store to initial state */
  reset: () => void
}

/**
 * Shared state from URL
 */
export interface SharedState {
  query: CubeQuery | MultiQueryConfig
  chartType?: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  activeView?: 'table' | 'chart'
}

/**
 * Combined store type
 */
export type AnalysisBuilderStore = AnalysisBuilderStoreState &
  AnalysisBuilderStoreActions

/**
 * Options for creating a store instance
 */
export interface CreateStoreOptions {
  /** Initial query configuration */
  initialQuery?: CubeQuery | MultiQueryConfig
  /** Initial chart configuration */
  initialChartConfig?: {
    chartType?: ChartType
    chartConfig?: ChartAxisConfig
    displayConfig?: ChartDisplayConfig
  }
  /** Disable localStorage persistence */
  disableLocalStorage?: boolean
}

// ============================================================================
// Initial State
// ============================================================================

const initialQueryState = createInitialState()

const initialAIState: AIState = {
  isOpen: false,
  userPrompt: '',
  isGenerating: false,
  error: null,
  hasGeneratedQuery: false,
  previousState: null,
}

const createDefaultState = (): AnalysisBuilderStoreState => ({
  // Query state
  queryStates: [initialQueryState],
  activeQueryIndex: 0,
  mergeStrategy: 'concat',

  // Chart configuration
  chartType: 'line',
  chartConfig: {},
  displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
  userManuallySelectedChart: false,
  localPaletteName: 'default',

  // UI state
  activeTab: 'query',
  activeView: 'chart',
  displayLimit: 100,
  showFieldModal: false,
  fieldModalMode: 'metrics',

  // AI state
  aiState: initialAIState,

  // Funnel state
  funnelBindingKey: null,
  stepTimeToConvert: [],
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert CubeQuery to AnalysisBuilderState
 */
function queryToState(query: CubeQuery): AnalysisBuilderState {
  const baseFilters = query.filters ? [...query.filters] : []

  const timeDimensions = query.timeDimensions || []
  const breakdowns = [
    ...(query.dimensions || []).map((field) => ({
      id: generateId(),
      field,
      isTimeDimension: false,
    })),
    ...timeDimensions.map((td) => ({
      id: generateId(),
      field: td.dimension,
      granularity: td.granularity,
      isTimeDimension: true,
      enableComparison: Boolean(td.compareDateRange && td.compareDateRange.length > 0),
    })),
  ]

  let filters = baseFilters

  // Restore date filters for comparison-enabled time dimensions when missing.
  for (const td of timeDimensions) {
    if (!td.compareDateRange || td.compareDateRange.length === 0) continue

    const hasDateFilter = filters.some(
      (filter) =>
        'member' in filter &&
        (filter as SimpleFilter).member === td.dimension &&
        (filter as SimpleFilter).operator === 'inDateRange'
    )

    const firstRange = td.compareDateRange[0]
    const dateRange =
      Array.isArray(firstRange) || typeof firstRange === 'string'
        ? firstRange
        : undefined

    if (!dateRange) continue

    if (!hasDateFilter) {
      filters = [
        ...filters,
        {
          member: td.dimension,
          operator: 'inDateRange',
          values: [],
          dateRange,
        } as SimpleFilter,
      ]
      continue
    }

    filters = filters.map((filter) => {
      if (
        'member' in filter &&
        (filter as SimpleFilter).member === td.dimension &&
        (filter as SimpleFilter).operator === 'inDateRange' &&
        !(filter as SimpleFilter).dateRange
      ) {
        return { ...(filter as SimpleFilter), dateRange }
      }
      return filter
    })
  }

  return {
    ...createInitialState(),
    metrics: (query.measures || []).map((field, index) => ({
      id: generateId(),
      field,
      label: generateMetricLabel(index),
    })),
    breakdowns,
    filters,
    order: query.order,
  }
}

/**
 * Check if config is MultiQueryConfig
 */
function isMultiQueryConfig(config: CubeQuery | MultiQueryConfig): config is MultiQueryConfig {
  return 'queries' in config && Array.isArray(config.queries)
}

/**
 * Build initial state from options
 */
function buildInitialState(options: CreateStoreOptions): AnalysisBuilderStoreState {
  const defaultState = createDefaultState()

  // If no initial query, return default state (localStorage will hydrate if enabled)
  if (!options.initialQuery) {
    // Apply initial chart config if provided (for cases like empty portlet with chart defaults)
    if (options.initialChartConfig) {
      return {
        ...defaultState,
        chartType: options.initialChartConfig.chartType || defaultState.chartType,
        chartConfig: options.initialChartConfig.chartConfig || defaultState.chartConfig,
        displayConfig: options.initialChartConfig.displayConfig || defaultState.displayConfig,
        userManuallySelectedChart: !!options.initialChartConfig.chartType,
      }
    }
    return defaultState
  }

  // Initialize from provided query
  const query = options.initialQuery
  let newQueryStates: AnalysisBuilderState[]
  let newMergeStrategy = defaultState.mergeStrategy
  let newFunnelBindingKey = defaultState.funnelBindingKey
  let newStepTimeToConvert = defaultState.stepTimeToConvert

  if (isMultiQueryConfig(query)) {
    newQueryStates = query.queries.map(queryToState)
    if (query.mergeStrategy) {
      newMergeStrategy = query.mergeStrategy
    }
    // Restore funnel-specific config
    if (query.funnelBindingKey !== undefined) {
      newFunnelBindingKey = query.funnelBindingKey
    }
    if (query.stepTimeToConvert !== undefined) {
      newStepTimeToConvert = query.stepTimeToConvert
    }
  } else {
    newQueryStates = [queryToState(query)]
  }

  return {
    ...defaultState,
    queryStates: newQueryStates,
    activeQueryIndex: 0,
    mergeStrategy: newMergeStrategy,
    funnelBindingKey: newFunnelBindingKey,
    stepTimeToConvert: newStepTimeToConvert,
    chartType: options.initialChartConfig?.chartType || defaultState.chartType,
    chartConfig: options.initialChartConfig?.chartConfig || defaultState.chartConfig,
    displayConfig: options.initialChartConfig?.displayConfig || defaultState.displayConfig,
    userManuallySelectedChart: !!options.initialChartConfig?.chartType,
  }
}

// ============================================================================
// Store Factory
// ============================================================================

/**
 * Create store actions (shared between persisted and non-persisted stores)
 */
function createStoreActions(
  set: (partial: Partial<AnalysisBuilderStore> | ((state: AnalysisBuilderStore) => Partial<AnalysisBuilderStore>)) => void,
  get: () => AnalysisBuilderStore,
  initialState: AnalysisBuilderStoreState
): AnalysisBuilderStoreActions {
  return {
    // =================================================================
    // Query State Actions
    // =================================================================

    setQueryStates: (states) => set({ queryStates: states }),

    updateQueryState: (index, updater) =>
      set((state) => {
        const newStates = [...state.queryStates]
        newStates[index] = updater(newStates[index] || createInitialState())
        return { queryStates: newStates }
      }),

    setActiveQueryIndex: (index) => set({ activeQueryIndex: index }),

    setMergeStrategy: (strategy) =>
      set((state) => {
        // Auto-switch to funnel chart when entering funnel mode
        if (strategy === 'funnel' && state.chartType !== 'funnel') {
          return {
            mergeStrategy: strategy,
            chartType: 'funnel',
            userManuallySelectedChart: false,
          }
        }
        // Auto-switch away from funnel chart when leaving funnel mode
        if (strategy !== 'funnel' && state.chartType === 'funnel') {
          return {
            mergeStrategy: strategy,
            chartType: 'line',
            userManuallySelectedChart: false,
          }
        }
        return { mergeStrategy: strategy }
      }),

    // =================================================================
    // Metrics Actions
    // =================================================================

    openMetricsModal: () =>
      set({ showFieldModal: true, fieldModalMode: 'metrics' }),

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
        const existingIndex = currentState.metrics.findIndex(
          (m) => m.field === fieldName
        )

        if (existingIndex >= 0) {
          // Remove existing
          newStates[index] = {
            ...currentState,
            metrics: currentState.metrics.filter((_, i) => i !== existingIndex),
            }
        } else {
          // Add new
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

    // =================================================================
    // Breakdowns Actions
    // =================================================================

    openBreakdownsModal: () =>
      set({ showFieldModal: true, fieldModalMode: 'breakdown' }),

    addBreakdown: (field, isTimeDimension, granularity) =>
      set((state) => {
        const index = state.activeQueryIndex
        const newStates = [...state.queryStates]
        const currentState = newStates[index] || createInitialState()

        // Check if we already have a time dimension (only allow one)
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
        const existingIndex = currentState.breakdowns.findIndex(
          (b) => b.field === fieldName
        )

        if (existingIndex >= 0) {
          // Remove existing
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
        if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
          newStates[0] = {
            ...newStates[0],
            breakdowns: newStates[0].breakdowns.map((b) =>
              b.id === id ? { ...b, granularity } : b
            ),
            }
        } else {
          newStates[activeQueryIndex] = {
            ...newStates[activeQueryIndex],
            breakdowns: newStates[activeQueryIndex].breakdowns.map((b) =>
              b.id === id ? { ...b, granularity } : b
            ),
            }
        }
        return { queryStates: newStates }
      }),

    toggleBreakdownComparison: (id) =>
      set((state) => {
        const { mergeStrategy, activeQueryIndex, queryStates, chartType } = state
        const newStates = [...queryStates]

        // Get source breakdowns based on mode
        const sourceIndex = mergeStrategy === 'merge' && activeQueryIndex > 0 ? 0 : activeQueryIndex
        const sourceState = newStates[sourceIndex]
        const targetBreakdown = sourceState.breakdowns.find((b) => b.id === id)
        const isEnabling = targetBreakdown && !targetBreakdown.enableComparison

        let newChartType = chartType
        let newChartConfig = state.chartConfig

        // If enabling comparison, auto-add date filter and switch to line chart
        if (isEnabling && targetBreakdown) {
          const hasDateFilter = findDateFilterForField(
            sourceState.filters,
            targetBreakdown.field
          )

          if (!hasDateFilter) {
            const newFilter: Filter = {
              member: targetBreakdown.field,
              operator: 'inDateRange',
              values: [],
              dateRange: convertDateRangeTypeToValue('last_30_days'),
            } as Filter
            newStates[sourceIndex] = {
              ...sourceState,
              filters: [...sourceState.filters, newFilter],
            }
          }

          // Switch to line chart if not already
          if (chartType !== 'line') {
            newChartType = 'line'
            const { chartConfig: smartConfig } = getSmartChartDefaults(
              sourceState.metrics,
              sourceState.breakdowns,
              'line'
            )
            newChartConfig = smartConfig
          }
        }

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

        return {
          queryStates: newStates,
          chartType: newChartType,
          chartConfig: newChartConfig,
        }
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

    // =================================================================
    // Filters Actions
    // =================================================================

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
        const hasFilter = existingFilters.some(
          (f) => 'member' in f && f.member === field
        )
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

    // =================================================================
    // Multi-Query Actions
    // =================================================================

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

    // =================================================================
    // Chart Actions
    // =================================================================

    setChartType: (type) => set({ chartType: type }),

    setChartTypeManual: (type) =>
      set((state) => {
        const currentState = state.queryStates[state.activeQueryIndex]

        // If switching away from line, clear comparison
        if (type !== 'line' && currentState) {
          const hasComparison = currentState.breakdowns.some(
            (b) => b.isTimeDimension && b.enableComparison
          )
          if (hasComparison) {
            const newStates = [...state.queryStates]
            newStates[state.activeQueryIndex] = {
              ...currentState,
              breakdowns: currentState.breakdowns.map((b) =>
                b.isTimeDimension && b.enableComparison
                  ? { ...b, enableComparison: false }
                  : b
              ),
                }

            const { chartConfig } = getSmartChartDefaults(
              currentState.metrics,
              currentState.breakdowns,
              type
            )

            return {
              queryStates: newStates,
              chartType: type,
              chartConfig,
              userManuallySelectedChart: true,
              activeView: 'chart',
            }
          }
        }

        const { chartConfig } = getSmartChartDefaults(
          currentState?.metrics || [],
          currentState?.breakdowns || [],
          type
        )

        return {
          chartType: type,
          chartConfig,
          userManuallySelectedChart: true,
          activeView: 'chart',
        }
      }),

    setChartConfig: (config) => set({ chartConfig: config, activeView: 'chart' }),

    setDisplayConfig: (config) => set({ displayConfig: config, activeView: 'chart' }),

    setLocalPaletteName: (name) => set({ localPaletteName: name }),

    setUserManuallySelectedChart: (value) => set({ userManuallySelectedChart: value }),

    // =================================================================
    // UI Actions
    // =================================================================

    setActiveTab: (tab) => set({ activeTab: tab }),

    setActiveView: (view) => set({ activeView: view }),

    setDisplayLimit: (limit) => set({ displayLimit: limit }),

    closeFieldModal: () => set({ showFieldModal: false }),

    // =================================================================
    // AI Actions
    // =================================================================

    openAI: () =>
      set((state) => ({
        aiState: { ...state.aiState, isOpen: true },
      })),

    closeAI: () =>
      set((state) => ({
        aiState: { ...state.aiState, isOpen: false },
      })),

    setAIPrompt: (prompt) =>
      set((state) => ({
        aiState: { ...state.aiState, userPrompt: prompt },
      })),

    setAIGenerating: (generating) =>
      set((state) => ({
        aiState: { ...state.aiState, isGenerating: generating },
      })),

    setAIError: (error) =>
      set((state) => ({
        aiState: { ...state.aiState, error },
      })),

    setAIHasGeneratedQuery: (hasQuery) =>
      set((state) => ({
        aiState: { ...state.aiState, hasGeneratedQuery: hasQuery },
      })),

    saveAIPreviousState: () =>
      set((state) => {
        const currentState = state.queryStates[state.activeQueryIndex]
        return {
          aiState: {
            ...state.aiState,
            previousState: currentState
              ? {
                  metrics: [...currentState.metrics],
                  breakdowns: [...currentState.breakdowns],
                  filters: [...currentState.filters],
                  chartType: state.chartType,
                  chartConfig: { ...state.chartConfig },
                  displayConfig: { ...state.displayConfig },
                }
              : null,
          },
        }
      }),

    restoreAIPreviousState: () =>
      set((state) => {
        const prev = state.aiState.previousState
        if (!prev) return state

        const index = state.activeQueryIndex
        const newStates = [...state.queryStates]
        newStates[index] = {
          ...(newStates[index] || createInitialState()),
          metrics: prev.metrics,
          breakdowns: prev.breakdowns,
          filters: prev.filters,
        }

        return {
          queryStates: newStates,
          chartType: prev.chartType,
          chartConfig: prev.chartConfig,
          displayConfig: prev.displayConfig,
          aiState: { ...initialAIState },
        }
      }),

    // =================================================================
    // Funnel Actions
    // =================================================================

    setFunnelBindingKey: (bindingKey) => set({ funnelBindingKey: bindingKey }),

    setStepTimeToConvert: (stepIndex, duration) =>
      set((state) => {
        const newTimeToConvert = [...state.stepTimeToConvert]
        // Ensure array is large enough
        while (newTimeToConvert.length <= stepIndex) {
          newTimeToConvert.push(null)
        }
        newTimeToConvert[stepIndex] = duration
        return { stepTimeToConvert: newTimeToConvert }
      }),

    buildFunnelConfig: () => {
      const state = get()
      if (state.mergeStrategy !== 'funnel') return null
      if (!state.funnelBindingKey) return null
      if (state.queryStates.length < 2) return null

      // Build queries for each step
      const queries = state.queryStates.map((qs) =>
        buildCubeQuery(qs.metrics, qs.breakdowns, qs.filters, qs.order)
      )

      // Generate step labels
      const stepLabels = state.queryStates.map((_, i) => `Step ${i + 1}`)

      return buildFunnelConfigFromQueries(
        queries,
        state.funnelBindingKey,
        stepLabels,
        state.stepTimeToConvert
      )
    },

    isFunnelMode: () => get().mergeStrategy === 'funnel',

    // =================================================================
    // Utility Actions
    // =================================================================

    clearQuery: () =>
      set((state) => {
        const newStates = [...state.queryStates]
        newStates[state.activeQueryIndex] = createInitialState()
        return {
          queryStates: newStates,
          chartType: 'line',
          chartConfig: {},
          displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
          userManuallySelectedChart: false,
        }
      }),

    loadFromShare: (sharedState) =>
      set((state) => {
        const { query } = sharedState
        let newQueryStates: AnalysisBuilderState[]
        let newMergeStrategy = state.mergeStrategy
        let newFunnelBindingKey = state.funnelBindingKey
        let newStepTimeToConvert = state.stepTimeToConvert

        if (isMultiQueryConfig(query)) {
          newQueryStates = query.queries.map(queryToState)
          if (query.mergeStrategy) {
            newMergeStrategy = query.mergeStrategy
          }
          // Restore funnel-specific config from shared state
          if (query.funnelBindingKey !== undefined) {
            newFunnelBindingKey = query.funnelBindingKey
          }
          if (query.stepTimeToConvert !== undefined) {
            newStepTimeToConvert = query.stepTimeToConvert
          }
        } else {
          newQueryStates = [queryToState(query)]
        }

        return {
          queryStates: newQueryStates,
          activeQueryIndex: 0,
          mergeStrategy: newMergeStrategy,
          funnelBindingKey: newFunnelBindingKey,
          stepTimeToConvert: newStepTimeToConvert,
          chartType: sharedState.chartType || state.chartType,
          chartConfig: sharedState.chartConfig || state.chartConfig,
          displayConfig: sharedState.displayConfig || state.displayConfig,
          activeView: sharedState.activeView || state.activeView,
          userManuallySelectedChart: !!sharedState.chartType,
        }
      }),

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
      return buildCubeQuery(
        current.metrics,
        current.breakdowns,
        current.filters,
        current.order
      )
    },

    buildAllQueries: () => {
      const state = get()
      // In merge mode, Q2+ use Q1's breakdowns (dimensions are shared/locked)
      const q1Breakdowns = state.queryStates[0]?.breakdowns || []

      return state.queryStates.map((qs, index) => {
        // In merge mode, Q2+ inherit Q1's breakdowns
        const breakdowns = state.mergeStrategy === 'merge' && index > 0
          ? q1Breakdowns
          : qs.breakdowns

        return buildCubeQuery(qs.metrics, breakdowns, qs.filters, qs.order)
      })
    },

    buildMultiQueryConfig: () => {
      const state = get()
      if (!get().isMultiQueryMode()) return null

      const allQueries = get().buildAllQueries()
      const validQueries = allQueries.filter(
        (q) =>
          (q.measures && q.measures.length > 0) ||
          (q.dimensions && q.dimensions.length > 0) ||
          (q.timeDimensions && q.timeDimensions.length > 0)
      )

      if (validQueries.length < 2) return null

      return {
        queries: validQueries,
        mergeStrategy: state.mergeStrategy,
        mergeKeys: get().getMergeKeys(),
        queryLabels: validQueries.map((_, i) => `Q${i + 1}`),
      }
    },

    reset: () => set(initialState),
  }
}

/**
 * Create a new store instance with optional persistence
 */
export function createAnalysisBuilderStore(options: CreateStoreOptions = {}) {
  const initialState = buildInitialState(options)

  // Create store with or without persistence
  if (options.disableLocalStorage) {
    // No persistence - for modal/portlet editing
    return createStore<AnalysisBuilderStore>()(
      devtools(
        subscribeWithSelector((set, get) => ({
          ...initialState,
          ...createStoreActions(set, get, initialState),
        })),
        { name: 'AnalysisBuilderStore (no-persist)' }
      )
    )
  }

  // With persistence - for standalone mode
  return createStore<AnalysisBuilderStore>()(
    devtools(
      subscribeWithSelector(
        persist(
          (set, get) => ({
            ...initialState,
            ...createStoreActions(set, get, initialState),
          }),
          {
            name: STORAGE_KEY,
            partialize: (state) => ({
              // Only persist these fields
              queryStates: state.queryStates,
              activeQueryIndex: state.queryStates.length > 1 ? state.activeQueryIndex : undefined,
              mergeStrategy: state.queryStates.length > 1 ? state.mergeStrategy : undefined,
              // Funnel binding key (only persist when in funnel mode)
              funnelBindingKey: state.mergeStrategy === 'funnel' ? state.funnelBindingKey : undefined,
              chartType: state.chartType,
              chartConfig: state.chartConfig,
              displayConfig: state.displayConfig,
              activeView: state.activeView,
            }),
          }
        )
      ),
      { name: 'AnalysisBuilderStore' }
    )
  )
}

// ============================================================================
// React Context & Provider
// ============================================================================

/**
 * Context for the store instance
 */
const AnalysisBuilderStoreContext = createContext<StoreApi<AnalysisBuilderStore> | null>(null)

/**
 * Provider props
 */
export interface AnalysisBuilderStoreProviderProps {
  children: ReactNode
  /** Initial query configuration */
  initialQuery?: CubeQuery | MultiQueryConfig
  /** Initial chart configuration */
  initialChartConfig?: {
    chartType?: ChartType
    chartConfig?: ChartAxisConfig
    displayConfig?: ChartDisplayConfig
  }
  /** Disable localStorage persistence */
  disableLocalStorage?: boolean
}

/**
 * Provider component that creates a store instance per AnalysisBuilder
 */
export function AnalysisBuilderStoreProvider({
  children,
  initialQuery,
  initialChartConfig,
  disableLocalStorage,
}: AnalysisBuilderStoreProviderProps) {
  // Create store instance once per provider mount
  const storeRef = useRef<StoreApi<AnalysisBuilderStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = createAnalysisBuilderStore({
      initialQuery,
      initialChartConfig,
      disableLocalStorage,
    })
  }

  return (
    <AnalysisBuilderStoreContext.Provider value={storeRef.current}>
      {children}
    </AnalysisBuilderStoreContext.Provider>
  )
}

/**
 * Hook to access the store from context
 * @throws Error if used outside of provider
 */
export function useAnalysisBuilderStore<T>(selector: (state: AnalysisBuilderStore) => T): T {
  const store = useContext(AnalysisBuilderStoreContext)
  if (!store) {
    throw new Error('useAnalysisBuilderStore must be used within AnalysisBuilderStoreProvider')
  }
  return useStore(store, selector)
}

/**
 * Hook to get the raw store API (for actions that need direct access)
 */
export function useAnalysisBuilderStoreApi(): StoreApi<AnalysisBuilderStore> {
  const store = useContext(AnalysisBuilderStoreContext)
  if (!store) {
    throw new Error('useAnalysisBuilderStoreApi must be used within AnalysisBuilderStoreProvider')
  }
  return store
}

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

/**
 * Select current query state
 */
export const selectCurrentState = (state: AnalysisBuilderStore) =>
  state.queryStates[state.activeQueryIndex] || createInitialState()

/**
 * Select current metrics
 */
export const selectMetrics = (state: AnalysisBuilderStore) =>
  selectCurrentState(state).metrics

/**
 * Select current breakdowns
 */
export const selectBreakdowns = (state: AnalysisBuilderStore) =>
  selectCurrentState(state).breakdowns

/**
 * Select current filters
 */
export const selectFilters = (state: AnalysisBuilderStore) =>
  selectCurrentState(state).filters

/**
 * Select chart configuration
 */
export const selectChartConfig = (state: AnalysisBuilderStore) => ({
  chartType: state.chartType,
  chartConfig: state.chartConfig,
  displayConfig: state.displayConfig,
})

/**
 * Select UI state
 */
export const selectUIState = (state: AnalysisBuilderStore) => ({
  activeTab: state.activeTab,
  activeView: state.activeView,
  displayLimit: state.displayLimit,
  showFieldModal: state.showFieldModal,
  fieldModalMode: state.fieldModalMode,
})

/**
 * Select multi-query state
 */
export const selectMultiQueryState = (state: AnalysisBuilderStore) => ({
  queryStates: state.queryStates,
  activeQueryIndex: state.activeQueryIndex,
  mergeStrategy: state.mergeStrategy,
  isMultiQueryMode: state.queryStates.length > 1,
})

/**
 * Select funnel state
 */
export const selectFunnelState = (state: AnalysisBuilderStore) => ({
  funnelBindingKey: state.funnelBindingKey,
  stepTimeToConvert: state.stepTimeToConvert,
  isFunnelMode: state.mergeStrategy === 'funnel',
})

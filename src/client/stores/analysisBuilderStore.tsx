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
  AnalysisType,
  FunnelStepState,
} from '../types'
import type { ServerFunnelQuery } from '../types/funnel'
import type { ServerFlowQuery, FlowStartingStep } from '../types/flow'
import type {
  AnalysisBuilderState,
  QueryPanelTab,
  AIState,
} from '../components/AnalysisBuilder/types'
import {
  generateId,
  generateMetricLabel,
  createInitialState,
  STORAGE_KEY,
} from '../components/AnalysisBuilder/utils'
import { adapterRegistry } from '../adapters/adapterRegistry'
import { queryModeAdapter } from '../adapters/queryModeAdapter'
import { funnelModeAdapter } from '../adapters/funnelModeAdapter'
import { flowModeAdapter } from '../adapters/flowModeAdapter'
import type { AnalysisConfig, ChartConfig, AnalysisWorkspace } from '../types/analysisConfig'
import { isValidAnalysisConfig, isValidAnalysisWorkspace } from '../types/analysisConfig'
import {
  createCoreSlice,
  createQuerySlice,
  createFunnelSlice,
  createFlowSlice,
  createUISlice,
  createInitialCoreState,
  createInitialQueryState,
  createInitialFunnelState,
  createInitialFlowState,
} from './slices'

// Note: Adapters are registered in coreSlice.ts (single registration point)

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
  // Analysis Type (Explicit mode selection)
  // =========================================================================
  /** Explicit analysis type - determines which mode is active */
  analysisType: AnalysisType

  // =========================================================================
  // Per-Mode Chart Configuration (NEW - Phase 2)
  // =========================================================================
  /**
   * Per-mode chart configuration map.
   * Each mode owns its own chart settings, enabling mode switching
   * without losing chart configurations.
   */
  charts: {
    [K in AnalysisType]?: ChartConfig
  }

  /**
   * Per-mode active view (table or chart) map.
   * Each mode owns its own view preference, enabling mode switching
   * without losing view preferences.
   */
  activeViews: {
    [K in AnalysisType]?: 'table' | 'chart'
  }

  // =========================================================================
  // Query State (Query/Multi modes)
  // =========================================================================
  /** Array of query states (one per tab) */
  queryStates: AnalysisBuilderState[]
  /** Index of the currently active query tab */
  activeQueryIndex: number
  /** Strategy for merging multi-query results (used when queryStates.length > 1) */
  mergeStrategy: QueryMergeStrategy

  // =========================================================================
  // Chart Configuration (unified in charts map - Phase 4 cleanup)
  // =========================================================================
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
  // Funnel State (when analysisType === 'funnel')
  // =========================================================================
  /** Selected cube for funnel mode (all steps use this cube) */
  funnelCube: string | null
  /** Dedicated funnel steps (separate from queryStates) */
  funnelSteps: FunnelStepState[]
  /** Index of currently active funnel step */
  activeFunnelStepIndex: number
  /** Time dimension for funnel temporal ordering */
  funnelTimeDimension: string | null
  /** Binding key dimension that links funnel steps together */
  funnelBindingKey: FunnelBindingKey | null
  /** @deprecated Use funnelSteps[].timeToConvert instead - kept for backward compat */
  stepTimeToConvert: (string | null)[]

  // =========================================================================
  // Flow State (when analysisType === 'flow')
  // =========================================================================
  /** Selected cube for flow mode (must be an eventStream cube) */
  flowCube: string | null
  /** Binding key that links events to entities */
  flowBindingKey: FunnelBindingKey | null
  /** Time dimension for event ordering */
  flowTimeDimension: string | null
  /** Starting step configuration (anchor point for exploration) */
  startingStep: FlowStartingStep
  /** Number of steps to explore before starting step (1-5) */
  stepsBefore: number
  /** Number of steps to explore after starting step (1-5) */
  stepsAfter: number
  /** Event dimension that categorizes events (node labels) */
  eventDimension: string | null
}

/**
 * Store actions interface
 */
export interface AnalysisBuilderStoreActions {
  // =========================================================================
  // Analysis Type Actions
  // =========================================================================
  /** Set the analysis type (switches between Query/Multi/Funnel modes) */
  setAnalysisType: (type: AnalysisType) => void

  // =========================================================================
  // Query State Actions (Query/Multi modes)
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
  // Funnel Actions (when analysisType === 'funnel')
  // =========================================================================
  /** Add a new funnel step */
  addFunnelStep: () => void
  /** Remove a funnel step by index */
  removeFunnelStep: (index: number) => void
  /** Update a funnel step by index */
  updateFunnelStep: (index: number, updates: Partial<FunnelStepState>) => void
  /** Set the active funnel step index */
  setActiveFunnelStepIndex: (index: number) => void
  /** Reorder funnel steps */
  reorderFunnelSteps: (fromIndex: number, toIndex: number) => void
  /** Set the time dimension for funnel */
  setFunnelTimeDimension: (dimension: string | null) => void
  /** Set the funnel binding key */
  setFunnelBindingKey: (bindingKey: FunnelBindingKey | null) => void
  /** Set the funnel cube (clears binding key/time dimension, updates all steps) */
  setFunnelCube: (cube: string | null) => void
  /** @deprecated Set time window for a specific step - use updateFunnelStep instead */
  setStepTimeToConvert: (stepIndex: number, duration: string | null) => void
  /** @deprecated Build FunnelConfig from queryStates - use buildFunnelQueryFromSteps instead */
  buildFunnelConfig: () => FunnelConfig | null
  /** Build ServerFunnelQuery from dedicated funnelSteps */
  buildFunnelQueryFromSteps: () => ServerFunnelQuery | null
  /** Check if in funnel mode (analysisType === 'funnel') */
  isFunnelMode: () => boolean
  /** Check if funnel mode is properly configured and ready for execution */
  isFunnelModeEnabled: () => boolean
  /** Set funnel chart type */
  setFunnelChartType: (type: ChartType) => void
  /** Set funnel chart config */
  setFunnelChartConfig: (config: ChartAxisConfig) => void
  /** Set funnel display config */
  setFunnelDisplayConfig: (config: ChartDisplayConfig) => void

  // =========================================================================
  // Flow Actions (when analysisType === 'flow')
  // =========================================================================
  /** Set the flow cube (clears binding key/time dimension) */
  setFlowCube: (cube: string | null) => void
  /** Set the flow binding key */
  setFlowBindingKey: (key: FunnelBindingKey | null) => void
  /** Set the flow time dimension */
  setFlowTimeDimension: (dim: string | null) => void
  /** Set the event dimension */
  setEventDimension: (dim: string | null) => void
  /** Set the starting step name */
  setStartingStepName: (name: string) => void
  /** Set all starting step filters at once */
  setStartingStepFilters: (filters: Filter[]) => void
  /** Add a filter to the starting step */
  addStartingStepFilter: (filter: Filter) => void
  /** Remove a filter from the starting step by index */
  removeStartingStepFilter: (index: number) => void
  /** Update a filter in the starting step by index */
  updateStartingStepFilter: (index: number, filter: Filter) => void
  /** Set the number of steps to explore before starting step */
  setStepsBefore: (count: number) => void
  /** Set the number of steps to explore after starting step */
  setStepsAfter: (count: number) => void
  /** Check if in flow mode (analysisType === 'flow') */
  isFlowMode: () => boolean
  /** Check if flow mode is properly configured and ready for execution */
  isFlowModeEnabled: () => boolean
  /** Build ServerFlowQuery from flow state */
  buildFlowQuery: () => ServerFlowQuery | null

  // =========================================================================
  // Utility Actions
  // =========================================================================
  /** Clear only the current mode's state (preserves other modes) */
  clearCurrentMode: () => void
  /** @deprecated Clear the current query - use clearCurrentMode instead */
  clearQuery: () => void
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

  // =========================================================================
  // Save/Load Actions (NEW - Phase 2)
  // =========================================================================
  /**
   * Save current state to AnalysisConfig format.
   * Delegates to the appropriate adapter based on analysisType.
   * Use for share URLs and portlets (single-mode).
   */
  save: () => AnalysisConfig

  /**
   * Load state from AnalysisConfig.
   * Delegates to the appropriate adapter based on config.analysisType.
   * Use for share URLs and portlets (single-mode).
   */
  load: (config: AnalysisConfig) => void

  /**
   * Save ALL modes to AnalysisWorkspace format.
   * Used for localStorage persistence to preserve state across mode switches.
   */
  saveWorkspace: () => AnalysisWorkspace

  /**
   * Load ALL modes from AnalysisWorkspace.
   * Used for localStorage persistence to restore state for all modes.
   */
  loadWorkspace: (workspace: AnalysisWorkspace) => void

  // =========================================================================
  // Validation Actions (NEW - Phase 5)
  // =========================================================================
  /**
   * Validate current state using the adapter for the current analysis type.
   * Returns validation errors and warnings that can be displayed to the user.
   */
  getValidation: () => import('../adapters/modeAdapter').ValidationResult
}

/**
 * Combined store type
 */
export type AnalysisBuilderStore = AnalysisBuilderStoreState &
  AnalysisBuilderStoreActions

/**
 * Initial funnel state for creating a store instance.
 * Chart configuration is handled via CreateStoreOptions.initialChartConfig instead.
 */
export interface InitialFunnelState {
  funnelCube?: string | null
  funnelSteps?: FunnelStepState[]
  funnelTimeDimension?: string | null
  funnelBindingKey?: FunnelBindingKey | null
}

export interface InitialFlowState {
  flowCube?: string | null
  flowBindingKey?: FunnelBindingKey | null
  flowTimeDimension?: string | null
  startingStep?: FlowStartingStep
  stepsBefore?: number
  stepsAfter?: number
  eventDimension?: string | null
}

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
  /** Initial analysis type (query or funnel) */
  initialAnalysisType?: AnalysisType
  /** Initial funnel state (when analysisType === 'funnel') */
  initialFunnelState?: InitialFunnelState
  /** Initial flow state (when analysisType === 'flow') */
  initialFlowState?: InitialFlowState
  /** Initial active view (table or chart) - used to prevent flash when loading from share */
  initialActiveView?: 'table' | 'chart'
}

// Note: Initial state is now handled by slice initializers
// (createInitialCoreState, createInitialQueryState, createInitialFunnelState, createInitialUIState)

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
 * Convert store creation options to AnalysisConfig.
 * Returns null if no meaningful options are provided (use defaults).
 */
function optionsToAnalysisConfig(options: CreateStoreOptions): AnalysisConfig | null {
  // Handle funnel mode with funnel state
  if (options.initialAnalysisType === 'funnel' && options.initialFunnelState) {
    const defaultFunnelChart = funnelModeAdapter.getDefaultChartConfig()
    // Use initialChartConfig for chart settings (legacy funnel chart fields removed)
    const funnelChartConfig: ChartConfig = {
      chartType: options.initialChartConfig?.chartType || defaultFunnelChart.chartType,
      chartConfig: options.initialChartConfig?.chartConfig || defaultFunnelChart.chartConfig,
      displayConfig: options.initialChartConfig?.displayConfig || defaultFunnelChart.displayConfig,
    }

    // Build funnel config via adapter's save method structure
    const funnelState = {
      funnelCube: options.initialFunnelState.funnelCube ?? null,
      funnelSteps: options.initialFunnelState.funnelSteps || [],
      activeFunnelStepIndex: 0,
      funnelTimeDimension: options.initialFunnelState.funnelTimeDimension ?? null,
      funnelBindingKey: options.initialFunnelState.funnelBindingKey ?? null,
    }

    return funnelModeAdapter.save(
      funnelState,
      { funnel: funnelChartConfig },
      options.initialActiveView || 'chart'
    )
  }

  // Handle flow mode with flow state
  if (options.initialAnalysisType === 'flow' && options.initialFlowState) {
    const defaultFlowChart = flowModeAdapter.getDefaultChartConfig()
    // Use initialChartConfig for chart settings
    const flowChartConfig: ChartConfig = {
      chartType: options.initialChartConfig?.chartType || defaultFlowChart.chartType,
      chartConfig: options.initialChartConfig?.chartConfig || defaultFlowChart.chartConfig,
      displayConfig: options.initialChartConfig?.displayConfig || defaultFlowChart.displayConfig,
    }

    // Build flow config via adapter's save method structure
    const flowState = {
      flowCube: options.initialFlowState.flowCube ?? null,
      flowBindingKey: options.initialFlowState.flowBindingKey ?? null,
      flowTimeDimension: options.initialFlowState.flowTimeDimension ?? null,
      startingStep: options.initialFlowState.startingStep || { name: '', filters: [] },
      stepsBefore: options.initialFlowState.stepsBefore ?? 3,
      stepsAfter: options.initialFlowState.stepsAfter ?? 3,
      eventDimension: options.initialFlowState.eventDimension ?? null,
      joinStrategy: options.initialFlowState.joinStrategy ?? 'auto',
    }

    return flowModeAdapter.save(
      flowState,
      { flow: flowChartConfig },
      options.initialActiveView || 'chart'
    )
  }

  // Handle query mode with initial query
  if (options.initialQuery) {
    const query = options.initialQuery
    let queryStates: AnalysisBuilderState[]
    let mergeStrategy: QueryMergeStrategy = 'concat'

    if (isMultiQueryConfig(query)) {
      queryStates = query.queries.map(queryToState)
      if (query.mergeStrategy) {
        mergeStrategy = query.mergeStrategy
      }
    } else {
      queryStates = [queryToState(query)]
    }

    const defaultQueryChart = queryModeAdapter.getDefaultChartConfig()
    const queryChartConfig: ChartConfig = {
      chartType: options.initialChartConfig?.chartType || defaultQueryChart.chartType,
      chartConfig: options.initialChartConfig?.chartConfig || defaultQueryChart.chartConfig,
      displayConfig: options.initialChartConfig?.displayConfig || defaultQueryChart.displayConfig,
    }

    return queryModeAdapter.save(
      { queryStates, activeQueryIndex: 0, mergeStrategy },
      { query: queryChartConfig },
      options.initialActiveView || 'chart'
    )
  }

  // Handle just chart config (no query)
  if (options.initialChartConfig) {
    const defaultQueryChart = queryModeAdapter.getDefaultChartConfig()
    const queryChartConfig: ChartConfig = {
      chartType: options.initialChartConfig.chartType || defaultQueryChart.chartType,
      chartConfig: options.initialChartConfig.chartConfig || defaultQueryChart.chartConfig,
      displayConfig: options.initialChartConfig.displayConfig || defaultQueryChart.displayConfig,
    }

    return queryModeAdapter.save(
      { queryStates: [createInitialState()], activeQueryIndex: 0, mergeStrategy: 'concat' },
      { query: queryChartConfig },
      options.initialActiveView || 'chart'
    )
  }

  // Handle just active view
  if (options.initialActiveView) {
    // Return a minimal config with just activeView set
    return queryModeAdapter.save(
      { queryStates: [createInitialState()], activeQueryIndex: 0, mergeStrategy: 'concat' },
      { query: queryModeAdapter.getDefaultChartConfig() },
      options.initialActiveView
    )
  }

  // No meaningful options - use store defaults
  return null
}

// NOTE: createStoreActions has been replaced by slice composition.
// See createAnalysisBuilderStore below which composes:
// - createCoreSlice
// - createQuerySlice
// - createFunnelSlice
// - createUISlice
// - createCrossSliceActions


// ============================================================================
// Cross-Slice Actions
// ============================================================================

/**
 * Cross-slice actions that coordinate state across multiple slices.
 * These can't be in individual slices because they need to update state
 * from multiple slices atomically.
 */
interface CrossSliceActions {
  reset: () => void
  clearCurrentMode: () => void
  clearQuery: () => void
  getValidation: () => { isValid: boolean; errors: string[]; warnings: string[] }
}

function createCrossSliceActions(
  set: (
    partial:
      | Partial<AnalysisBuilderStore>
      | ((state: AnalysisBuilderStore) => Partial<AnalysisBuilderStore>)
  ) => void,
  get: () => AnalysisBuilderStore
): CrossSliceActions {
  return {
    reset: () => {
      // Reset to default state using slice initializers
      set({
        ...createInitialCoreState(),
        ...createInitialQueryState(),
        ...createInitialFunnelState(),
        ...createInitialFlowState(),
        // Apply adapter defaults for charts (may differ from slice defaults)
        charts: {
          query: queryModeAdapter.getDefaultChartConfig(),
          funnel: funnelModeAdapter.getDefaultChartConfig(),
          flow: flowModeAdapter.getDefaultChartConfig(),
        },
        activeViews: {
          query: 'chart',
          funnel: 'chart',
          flow: 'chart',
        },
      } as Partial<AnalysisBuilderStore>)
    },

    clearCurrentMode: () =>
      set((state) => {
        switch (state.analysisType) {
          case 'funnel':
            // Use slice initializer for funnel state
            return {
              ...createInitialFunnelState(),
              charts: {
                ...state.charts,
                funnel: funnelModeAdapter.getDefaultChartConfig(),
              },
            }
          case 'flow':
            // Use slice initializer for flow state
            return {
              ...createInitialFlowState(),
              charts: {
                ...state.charts,
                flow: flowModeAdapter.getDefaultChartConfig(),
              },
            }
          case 'query':
          default:
            // Use slice initializer for query state
            return {
              ...createInitialQueryState(),
              userManuallySelectedChart: false,
              charts: {
                ...state.charts,
                query: queryModeAdapter.getDefaultChartConfig(),
              },
            }
        }
      }),

    clearQuery: () =>
      set((state) => {
        const newStates = [...state.queryStates]
        newStates[state.activeQueryIndex] = createInitialState()
        return {
          queryStates: newStates,
          userManuallySelectedChart: false,
          charts: {
            ...state.charts,
            query: queryModeAdapter.getDefaultChartConfig(),
          },
        }
      }),

    getValidation: () => {
      const state = get()
      const adapter = adapterRegistry.get(state.analysisType)

      // Use adapter's extractState method for mode-specific state
      const modeState = adapter.extractState(state as unknown as Record<string, unknown>)

      return adapter.validate(modeState)
    },
  }
}

// ============================================================================
// Store Factory
// ============================================================================

/**
 * Create a new store instance with optional persistence.
 * Composes slices: coreSlice, querySlice, funnelSlice, uiSlice.
 */
export function createAnalysisBuilderStore(options: CreateStoreOptions = {}) {
  // Convert options to AnalysisConfig for loading
  const initialConfig = optionsToAnalysisConfig(options)

  // Store creator function that composes all slices
  const storeCreator = (
    set: (
      partial:
        | Partial<AnalysisBuilderStore>
        | ((state: AnalysisBuilderStore) => Partial<AnalysisBuilderStore>)
    ) => void,
    get: () => AnalysisBuilderStore,
    store: StoreApi<AnalysisBuilderStore>
  ) => ({
    // Compose slices - they provide default state and actions
    ...createCoreSlice(set, get, store),
    ...createQuerySlice(set, get, store),
    ...createFunnelSlice(set, get, store),
    ...createFlowSlice(set, get, store),
    ...createUISlice(set, get, store),

    // Cross-slice actions
    ...createCrossSliceActions(set, get),
  })

  // Create store with or without persistence
  if (options.disableLocalStorage) {
    // No persistence - for modal/portlet editing
    const store = createStore<AnalysisBuilderStore>()(
      devtools(subscribeWithSelector(storeCreator), {
        name: 'AnalysisBuilderStore (no-persist)',
      })
    )

    // Apply initial config if provided
    if (initialConfig) {
      store.getState().load(initialConfig)
    }

    return store
  }

  // With persistence - for standalone mode
  return createStore<AnalysisBuilderStore>()(
    devtools(
      subscribeWithSelector(
        persist(storeCreator, {
          name: STORAGE_KEY,
          // Use workspace format to preserve ALL modes' state
          partialize: (state) => state.saveWorkspace(),
          merge: (persisted, current) => {
            // Try workspace format first (new format)
            if (persisted && isValidAnalysisWorkspace(persisted)) {
              return {
                ...current,
                _persistedWorkspace: persisted,
              } as typeof current
            }
            // Backward compat: single AnalysisConfig (migrate to workspace on next save)
            if (persisted && isValidAnalysisConfig(persisted)) {
              return {
                ...current,
                _persistedConfig: persisted,
              } as typeof current
            }
            // Invalid/legacy format - use current (fresh start)
            // Also preserve initialConfig to apply if provided
            if (initialConfig) {
              return {
                ...current,
                _initialConfig: initialConfig,
              } as typeof current
            }
            return current
          },
          onRehydrateStorage: () => (state) => {
            // After rehydration, call loadWorkspace/load with persisted or initial config
            if (state) {
              if ((state as any)._persistedWorkspace) {
                // New workspace format - load all modes
                const workspace = (state as any)._persistedWorkspace as AnalysisWorkspace
                delete (state as any)._persistedWorkspace
                delete (state as any)._persistedConfig
                delete (state as any)._initialConfig
                state.loadWorkspace(workspace)
              } else if ((state as any)._persistedConfig) {
                // Legacy single-mode format - load only that mode
                // Will be migrated to workspace on next save
                const config = (state as any)._persistedConfig
                delete (state as any)._persistedConfig
                delete (state as any)._initialConfig
                state.load(config)
              } else if ((state as any)._initialConfig) {
                const config = (state as any)._initialConfig
                delete (state as any)._initialConfig
                state.load(config)
              }
            }
          },
        })
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
  /** Initial analysis type (query or funnel) */
  initialAnalysisType?: AnalysisType
  /** Initial funnel state (when analysisType === 'funnel') */
  initialFunnelState?: InitialFunnelState
  /** Initial flow state (when analysisType === 'flow') */
  initialFlowState?: InitialFlowState
  /** Initial active view (table or chart) - used to prevent flash when loading from share */
  initialActiveView?: 'table' | 'chart'
}

/**
 * Provider component that creates a store instance per AnalysisBuilder
 */
export function AnalysisBuilderStoreProvider({
  children,
  initialQuery,
  initialChartConfig,
  disableLocalStorage,
  initialAnalysisType,
  initialFunnelState,
  initialFlowState,
  initialActiveView,
}: AnalysisBuilderStoreProviderProps) {
  // Create store instance once per provider mount
  const storeRef = useRef<StoreApi<AnalysisBuilderStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = createAnalysisBuilderStore({
      initialQuery,
      initialChartConfig,
      disableLocalStorage,
      initialAnalysisType,
      initialFunnelState,
      initialFlowState,
      initialActiveView,
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
 * Select current chart config from the charts map (NEW - Phase 2)
 * This is the preferred way to access chart configuration.
 * Falls back to default chart config if mode's config is missing.
 */
export const selectCurrentChartConfig = (state: AnalysisBuilderStore): ChartConfig => {
  const config = state.charts[state.analysisType]
  if (config) return config

  // Fallback to adapter default (shouldn't happen in normal usage)
  return adapterRegistry.get(state.analysisType).getDefaultChartConfig()
}

/**
 * Select chart type from current mode's chart config
 */
export const selectChartType = (state: AnalysisBuilderStore): ChartType =>
  selectCurrentChartConfig(state).chartType

/**
 * Select chart axis config from current mode's chart config
 */
export const selectChartAxisConfig = (state: AnalysisBuilderStore): ChartAxisConfig =>
  selectCurrentChartConfig(state).chartConfig

/**
 * Select display config from current mode's chart config
 */
export const selectChartDisplayConfig = (state: AnalysisBuilderStore): ChartDisplayConfig =>
  selectCurrentChartConfig(state).displayConfig

/**
 * Select chart configuration (returns mode-appropriate config)
 * @deprecated Use selectCurrentChartConfig instead (reads from charts map)
 */
export const selectChartConfig = (state: AnalysisBuilderStore) => {
  // Use charts map (Phase 2 approach)
  const config = state.charts[state.analysisType]
  if (config) {
    return {
      chartType: config.chartType,
      chartConfig: config.chartConfig,
      displayConfig: config.displayConfig,
    }
  }

  // No fallback - charts map is the source of truth (Phase 4 cleanup)
  // Return defaults if config is missing (shouldn't happen in practice)
  return {
    chartType: 'bar' as const,
    chartConfig: {},
    displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
  }
}

/**
 * Select query mode chart configuration (always returns query mode config)
 */
export const selectQueryModeChartConfig = (state: AnalysisBuilderStore) => {
  // charts map is the source of truth (Phase 4 cleanup)
  const config = state.charts.query
  if (config) {
    return {
      chartType: config.chartType,
      chartConfig: config.chartConfig,
      displayConfig: config.displayConfig,
    }
  }
  // Return defaults if config is missing (shouldn't happen in practice)
  return {
    chartType: 'bar' as const,
    chartConfig: {},
    displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
  }
}

/**
 * Select funnel mode chart configuration (always returns funnel mode config)
 */
export const selectFunnelModeChartConfig = (state: AnalysisBuilderStore) => {
  // charts map is the source of truth (Phase 4 cleanup)
  const config = state.charts.funnel
  if (config) {
    return {
      chartType: config.chartType,
      chartConfig: config.chartConfig,
      displayConfig: config.displayConfig,
    }
  }
  // Return defaults if config is missing (shouldn't happen in practice)
  return {
    chartType: 'funnel' as const,
    chartConfig: {},
    displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
  }
}

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
 * Select analysis type
 */
export const selectAnalysisType = (state: AnalysisBuilderStore) => state.analysisType

/**
 * Select multi-query state
 */
export const selectMultiQueryState = (state: AnalysisBuilderStore) => ({
  queryStates: state.queryStates,
  activeQueryIndex: state.activeQueryIndex,
  mergeStrategy: state.mergeStrategy,
  // Multi-query mode is when we have more than one query in 'query' analysis type
  isMultiQueryMode: state.analysisType === 'query' && state.queryStates.length > 1,
})

/**
 * Select funnel cube
 */
export const selectFunnelCube = (state: AnalysisBuilderStore) => state.funnelCube

/**
 * Select funnel state (new dedicated state)
 */
export const selectFunnelState = (state: AnalysisBuilderStore) => ({
  funnelCube: state.funnelCube,
  funnelSteps: state.funnelSteps,
  activeFunnelStepIndex: state.activeFunnelStepIndex,
  funnelTimeDimension: state.funnelTimeDimension,
  funnelBindingKey: state.funnelBindingKey,
  isFunnelMode: state.analysisType === 'funnel',
  // Deprecated field kept for backward compat
  stepTimeToConvert: state.stepTimeToConvert,
})

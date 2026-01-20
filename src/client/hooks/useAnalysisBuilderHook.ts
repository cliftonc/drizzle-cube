/**
 * useAnalysisBuilder - Master Coordination Hook
 *
 * The single hook that provides everything AnalysisBuilder needs.
 * Orchestrates sub-hooks for modular, maintainable code:
 *
 * - useAnalysisQueryBuilder: Query state, building, validation
 * - useAnalysisCombinedFields: Multi-query field merging
 * - useAnalysisQueryExecution: TanStack Query data fetching
 * - useAnalysisChartDefaults: Chart configuration and smart defaults
 * - useAnalysisUIState: UI state (tabs, modals, view toggle)
 * - useAnalysisInitialization: Side effects (URL loading, callbacks)
 *
 * IMPORTANT: This hook must be used within AnalysisBuilderStoreProvider
 */

import { useCallback, useMemo, useRef } from 'react'
import { useCubeFeatures } from '../providers/CubeProvider'
import {
  useAnalysisBuilderStore,
  useAnalysisBuilderStoreApi,
} from '../stores/analysisBuilderStore'

// Sub-hooks
import { useAnalysisQueryBuilder } from './useAnalysisQueryBuilder'
import { useAnalysisCombinedFields } from './useAnalysisCombinedFields'
import { useAnalysisQueryExecution } from './useAnalysisQueryExecution'
import { useAnalysisChartDefaults } from './useAnalysisChartDefaults'
import { useAnalysisUIState } from './useAnalysisUIState'
import { useAnalysisInitialization } from './useAnalysisInitialization'

import type { ColorPalette } from '../utils/colorPalettes'
import type {
  CubeQuery,
  MultiQueryConfig,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  Filter,
  QueryMergeStrategy,
  FunnelBindingKey,
  AnalysisType,
  FunnelStepState,
} from '../types'
import type {
  AnalysisBuilderState,
  MetricItem,
  BreakdownItem,
  ExecutionStatus,
  QueryPanelTab,
} from '../components/AnalysisBuilder/types'
import type { ChartAvailabilityMap } from '../shared/chartDefaults'
import type { DebugDataEntry } from './queries'
import type { MultiQueryValidationResult } from '../utils/multiQueryValidation'
import type { MetaField } from '../shared/types'
import type { ValidationResult } from '../adapters/modeAdapter'

// ============================================================================
// Types
// ============================================================================

export interface UseAnalysisBuilderOptions {
  /** External color palette (overrides local) */
  externalColorPalette?: string[] | ColorPalette
  /** Initial data (skip first fetch) */
  initialData?: unknown[]
  /** Callback when query changes */
  onQueryChange?: (query: CubeQuery) => void
  /** Callback when chart config changes */
  onChartConfigChange?: (config: {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }) => void
}

export interface UseAnalysisBuilderResult {
  // Query State
  queryState: AnalysisBuilderState
  queryStates: AnalysisBuilderState[]
  activeQueryIndex: number
  mergeStrategy: QueryMergeStrategy
  isMultiQueryMode: boolean
  mergeKeys: string[] | undefined
  currentQuery: CubeQuery
  allQueries: CubeQuery[]
  multiQueryConfig: MultiQueryConfig | null
  multiQueryValidation: MultiQueryValidationResult | null

  // Funnel State (legacy - merge strategy mode)
  funnelBindingKey: FunnelBindingKey | null
  /** Whether funnel mode is properly configured and ready for execution */
  isFunnelModeEnabled: boolean

  // Analysis Type State (new dedicated mode selection)
  /** Current analysis type (query, multi, funnel) */
  analysisType: AnalysisType
  /** Selected cube for funnel mode (all steps use this cube) */
  funnelCube: string | null
  /** Dedicated funnel steps (when analysisType === 'funnel') */
  funnelSteps: FunnelStepState[]
  /** Index of currently active funnel step */
  activeFunnelStepIndex: number
  /** Time dimension for funnel temporal ordering */
  funnelTimeDimension: string | null
  /** Chart type for funnel mode (separate from query mode) */
  funnelChartType: ChartType
  /** Chart config for funnel mode (separate from query mode) */
  funnelChartConfig: ChartAxisConfig
  /** Display config for funnel mode (separate from query mode) */
  funnelDisplayConfig: ChartDisplayConfig

  // Flow Mode State (when analysisType === 'flow')
  /** Selected cube for flow mode */
  flowCube: string | null
  /** Binding key for flow mode (entity linking) */
  flowBindingKey: FunnelBindingKey | null
  /** Time dimension for flow mode (event ordering) */
  flowTimeDimension: string | null
  /** Event dimension for flow mode (node labels in Sankey) */
  eventDimension: string | null
  /** Starting step configuration */
  startingStep: import('../types/flow').FlowStartingStep
  /** Number of steps to explore before starting step */
  stepsBefore: number
  /** Number of steps to explore after starting step */
  stepsAfter: number
  /** Join strategy for flow execution */
  joinStrategy: 'auto' | 'lateral' | 'window'
  /** Display config for flow mode */
  flowDisplayConfig: ChartDisplayConfig

  // Data Fetching
  executionStatus: ExecutionStatus
  executionResults: unknown[] | null
  perQueryResults: (unknown[] | null)[] | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  isValidQuery: boolean
  debugDataPerQuery: DebugDataEntry[]
  /**
   * Whether the current query config differs from the last executed query.
   * Used for manual refresh mode to show "needs refresh" indicator.
   */
  needsRefresh: boolean
  /** In funnel mode, the actually executed queries with binding key dimension and IN filters */
  funnelExecutedQueries: CubeQuery[] | null
  /** In funnel mode, the actual server query { funnel: {...} } sent to the API */
  funnelServerQuery: unknown | null
  /** In funnel mode, unified debug data (SQL, analysis, funnel metadata) */
  funnelDebugData: {
    sql: { sql: string; params: unknown[] } | null
    analysis: unknown | null
    loading: boolean
    error: Error | null
    funnelMetadata?: unknown
  } | null
  /** In flow mode, the actual server query { flow: {...} } sent to the API */
  flowServerQuery: unknown | null
  /** In flow mode, unified debug data (SQL, analysis, flow metadata) */
  flowDebugData: {
    sql: { sql: string; params: unknown[] } | null
    analysis: unknown | null
    loading: boolean
    error: Error | null
    flowMetadata?: unknown
  } | null

  // Chart Configuration
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  colorPalette: ColorPalette
  localPaletteName: string
  chartAvailability: ChartAvailabilityMap
  combinedMetrics: MetricItem[]
  combinedBreakdowns: BreakdownItem[]
  effectiveBreakdowns: BreakdownItem[]

  // UI State
  activeTab: QueryPanelTab
  activeView: 'table' | 'chart'
  displayLimit: number
  showFieldModal: boolean
  fieldModalMode: 'metrics' | 'breakdown'
  activeTableIndex: number
  userManuallySelectedChart: boolean

  // AI State
  aiState: {
    isOpen: boolean
    userPrompt: string
    isGenerating: boolean
    error: string | null
    hasGeneratedQuery: boolean
  }

  // Share State
  shareButtonState: 'idle' | 'copied' | 'copied-no-chart'
  canShare: boolean

  // Adapter Validation (NEW - Phase 5)
  /** Validation result from the adapter for the current analysis type */
  adapterValidation: ValidationResult

  // Actions
  actions: {
    setActiveQueryIndex: (index: number) => void
    setMergeStrategy: (strategy: QueryMergeStrategy) => void
    openMetricsModal: () => void
    addMetric: (field: string, label?: string) => void
    removeMetric: (id: string) => void
    toggleMetric: (fieldName: string) => void
    reorderMetrics: (fromIndex: number, toIndex: number) => void
    openBreakdownsModal: () => void
    addBreakdown: (field: string, isTimeDimension: boolean, granularity?: string) => void
    removeBreakdown: (id: string) => void
    toggleBreakdown: (fieldName: string, isTimeDimension: boolean, granularity?: string) => void
    setBreakdownGranularity: (id: string, granularity: string) => void
    toggleBreakdownComparison: (id: string) => void
    reorderBreakdowns: (fromIndex: number, toIndex: number) => void
    setFilters: (filters: Filter[]) => void
    dropFieldToFilter: (field: string) => void
    setOrder: (fieldName: string, direction: 'asc' | 'desc' | null) => void
    addQuery: () => void
    removeQuery: (index: number) => void
    setFunnelBindingKey: (bindingKey: FunnelBindingKey | null) => void
    // Analysis Type actions
    setAnalysisType: (type: AnalysisType) => void
    // Funnel Mode actions (when analysisType === 'funnel')
    setFunnelCube: (cube: string | null) => void
    addFunnelStep: () => void
    removeFunnelStep: (index: number) => void
    updateFunnelStep: (index: number, updates: Partial<FunnelStepState>) => void
    setActiveFunnelStepIndex: (index: number) => void
    reorderFunnelSteps: (fromIndex: number, toIndex: number) => void
    setFunnelTimeDimension: (dimension: string | null) => void
    setFunnelDisplayConfig: (config: ChartDisplayConfig) => void
    // Flow Mode actions (when analysisType === 'flow')
    setFlowCube: (cube: string | null) => void
    setFlowBindingKey: (key: FunnelBindingKey | null) => void
    setFlowTimeDimension: (dim: string | null) => void
    setEventDimension: (dim: string | null) => void
    setStartingStepName: (name: string) => void
    setStartingStepFilters: (filters: Filter[]) => void
    setStepsBefore: (count: number) => void
    setStepsAfter: (count: number) => void
    setJoinStrategy: (strategy: 'auto' | 'lateral' | 'window') => void
    setFlowDisplayConfig: (config: ChartDisplayConfig) => void
    setChartType: (type: ChartType) => void
    setChartConfig: (config: ChartAxisConfig) => void
    setDisplayConfig: (config: ChartDisplayConfig) => void
    setLocalPaletteName: (name: string) => void
    setActiveTab: (tab: QueryPanelTab) => void
    setActiveView: (view: 'table' | 'chart') => void
    setDisplayLimit: (limit: number) => void
    closeFieldModal: () => void
    setActiveTableIndex: (index: number) => void
    openAI: () => void
    closeAI: () => void
    setAIPrompt: (prompt: string) => void
    generateAI: () => Promise<void>
    acceptAI: () => void
    cancelAI: () => void
    share: () => Promise<void>
    clearQuery: () => void
    clearCurrentMode: () => void
    refetch: (options?: { bustCache?: boolean }) => void
    handleFieldSelected: (
      field: MetaField,
      fieldType: 'measure' | 'dimension' | 'timeDimension',
      cubeName: string,
      keepOpen?: boolean
    ) => void
  }

  // Refs (for imperative access)
  getQueryConfig: () => CubeQuery | MultiQueryConfig | import('../types/funnel').ServerFunnelQuery
  getChartConfig: () => {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }
  getAnalysisType: () => AnalysisType
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAnalysisBuilder(
  options: UseAnalysisBuilderOptions = {}
): UseAnalysisBuilderResult {
  const { initialData, externalColorPalette, onQueryChange, onChartConfigChange } = options

  // Get context
  const { features } = useCubeFeatures()

  // Get store API for direct access
  const storeApi = useAnalysisBuilderStoreApi()

  // =========================================================================
  // Sub-Hooks Orchestration
  // =========================================================================

  // 1. Query Builder (query state, building, validation)
  const queryBuilder = useAnalysisQueryBuilder()

  // 2. Combined Fields (multi-query field merging)
  const combinedFields = useAnalysisCombinedFields({
    queryState: queryBuilder.queryState,
    queryStates: queryBuilder.queryStates,
    isMultiQueryMode: queryBuilder.isMultiQueryMode,
    mergeStrategy: queryBuilder.mergeStrategy,
    activeQueryIndex: queryBuilder.activeQueryIndex,
  })

  // Get funnel binding key from store for funnel mode
  const funnelBindingKey = useAnalysisBuilderStore((s) => s.funnelBindingKey)

  // Get analysis type state (must be before computed values that use it)
  const analysisType = useAnalysisBuilderStore((s) => s.analysisType)
  const funnelCube = useAnalysisBuilderStore((s) => s.funnelCube)
  const funnelSteps = useAnalysisBuilderStore((s) => s.funnelSteps)
  const activeFunnelStepIndex = useAnalysisBuilderStore((s) => s.activeFunnelStepIndex)
  const funnelTimeDimension = useAnalysisBuilderStore((s) => s.funnelTimeDimension)

  // Get funnel mode enabled state (computed to avoid function call in selector)
  // This includes filter-only step validation
  const isFunnelModeEnabled = useMemo(() => {
    if (analysisType !== 'funnel') return false
    if (!funnelBindingKey?.dimension) return false
    if (!funnelTimeDimension) return false
    if (!funnelSteps || funnelSteps.length < 2) return false
    // All steps must have at least one filter
    return funnelSteps.every((step) => step.filters.length > 0)
  }, [analysisType, funnelBindingKey, funnelTimeDimension, funnelSteps])
  // Phase 4: Read from charts map instead of legacy fields
  // Use stable selectors to avoid infinite loop from creating new objects
  const funnelChartType = useAnalysisBuilderStore((s) => s.charts.funnel?.chartType) || 'funnel'
  const funnelChartConfigFromStore = useAnalysisBuilderStore((s) => s.charts.funnel?.chartConfig)
  const funnelChartConfig = useMemo(() => funnelChartConfigFromStore || {}, [funnelChartConfigFromStore])

  // Get flow mode state
  const flowCube = useAnalysisBuilderStore((s) => s.flowCube)
  const flowBindingKey = useAnalysisBuilderStore((s) => s.flowBindingKey)
  const flowTimeDimension = useAnalysisBuilderStore((s) => s.flowTimeDimension)
  const eventDimension = useAnalysisBuilderStore((s) => s.eventDimension)
  const startingStep = useAnalysisBuilderStore((s) => s.startingStep)
  const stepsBefore = useAnalysisBuilderStore((s) => s.stepsBefore)
  const stepsAfter = useAnalysisBuilderStore((s) => s.stepsAfter)
  const joinStrategy = useAnalysisBuilderStore((s) => s.joinStrategy)
  // Flow display config from charts map - use stable selector to avoid infinite loop
  const flowDisplayConfigFromStore = useAnalysisBuilderStore((state) => state.charts.flow?.displayConfig)
  const flowDisplayConfig = useMemo(
    () => flowDisplayConfigFromStore || { showLegend: true, showGrid: true, showTooltip: true },
    [flowDisplayConfigFromStore]
  )
  // Flow chart type from charts map - needed for outputMode in query
  const flowChartType = useAnalysisBuilderStore((state) => state.charts.flow?.chartType) || 'sankey'

  // Build server funnel query from dedicated funnelSteps (when analysisType === 'funnel')
  // Note: funnelSteps must be in dependency array so query rebuilds when filters change
  const buildFunnelQueryFromSteps = useAnalysisBuilderStore((s) => s.buildFunnelQueryFromSteps)
  const serverFunnelQuery = useMemo(() => {
    if (analysisType !== 'funnel') return null
    return buildFunnelQueryFromSteps()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- funnelSteps triggers rebuild when step filters change
  }, [analysisType, buildFunnelQueryFromSteps, funnelSteps])

  const buildFlowQuery = useAnalysisBuilderStore((s) => s.buildFlowQuery)

  // Build server flow query (when analysisType === 'flow')
  // Note: flowChartType is included because it determines outputMode (sankey vs sunburst aggregation)
  const serverFlowQuery = useMemo(() => {
    if (analysisType !== 'flow') return null
    return buildFlowQuery()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flow config values trigger rebuild when they change in store
  }, [analysisType, buildFlowQuery, flowCube, flowBindingKey, flowTimeDimension, eventDimension, startingStep, stepsBefore, stepsAfter, flowChartType, joinStrategy])

  // Compute effective isValidQuery that considers funnel and flow modes
  // In funnel mode, the query is valid when serverFunnelQuery is not null
  // In flow mode, the query is valid when serverFlowQuery is not null
  const effectiveIsValidQuery = useMemo(() => {
    if (analysisType === 'flow') {
      // Flow mode: valid when we have a buildable flow query
      return serverFlowQuery !== null
    }
    if (analysisType === 'funnel') {
      // Funnel mode: valid when we have a buildable funnel query
      return serverFunnelQuery !== null
    }
    // Query/Multi mode: use the standard validation
    return queryBuilder.isValidQuery ?? false
  }, [analysisType, serverFlowQuery, serverFunnelQuery, queryBuilder.isValidQuery])

  // 3. Query Execution (TanStack Query integration)
  const queryExecution = useAnalysisQueryExecution({
    currentQuery: queryBuilder.currentQuery,
    allQueries: queryBuilder.allQueries,
    multiQueryConfig: queryBuilder.multiQueryConfig,
    isMultiQueryMode: queryBuilder.isMultiQueryMode,
    isValidQuery: effectiveIsValidQuery,
    initialData,
    mergeStrategy: queryBuilder.mergeStrategy,
    funnelBindingKey,
    isFunnelModeEnabled,
    // New: pass analysisType and serverFunnelQuery for explicit mode routing
    analysisType,
    serverFunnelQuery,
    // Flow mode: pass serverFlowQuery
    serverFlowQuery,
  })

  // 4. Chart Defaults (chart config, availability, smart defaults)
  const chartDefaults = useAnalysisChartDefaults({
    externalColorPalette,
    combinedMetrics: combinedFields.combinedMetrics,
    combinedBreakdowns: combinedFields.combinedBreakdowns,
    hasDebounced: queryExecution.hasDebounced,
  })

  // 5. UI State (tabs, modals, view toggle)
  const uiState = useAnalysisUIState()

  // 6. Initialization (URL loading, callbacks - side effects only)
  useAnalysisInitialization({
    currentQuery: queryBuilder.currentQuery,
    isValidQuery: queryBuilder.isValidQuery ?? false,
    chartType: chartDefaults.chartType,
    chartConfig: chartDefaults.chartConfig,
    displayConfig: chartDefaults.displayConfig,
    onQueryChange,
    onChartConfigChange,
  })

  // =========================================================================
  // Store Actions (not covered by sub-hooks)
  // =========================================================================

  // Metric actions
  const openMetricsModal = useAnalysisBuilderStore((state) => state.openMetricsModal)
  const addMetric = useAnalysisBuilderStore((state) => state.addMetric)
  const removeMetric = useAnalysisBuilderStore((state) => state.removeMetric)
  const toggleMetric = useAnalysisBuilderStore((state) => state.toggleMetric)
  const reorderMetrics = useAnalysisBuilderStore((state) => state.reorderMetrics)

  // Breakdown actions
  const openBreakdownsModal = useAnalysisBuilderStore((state) => state.openBreakdownsModal)
  const addBreakdown = useAnalysisBuilderStore((state) => state.addBreakdown)
  const removeBreakdown = useAnalysisBuilderStore((state) => state.removeBreakdown)
  const toggleBreakdown = useAnalysisBuilderStore((state) => state.toggleBreakdown)
  const setBreakdownGranularity = useAnalysisBuilderStore((state) => state.setBreakdownGranularity)
  const toggleBreakdownComparison = useAnalysisBuilderStore((state) => state.toggleBreakdownComparison)
  const reorderBreakdowns = useAnalysisBuilderStore((state) => state.reorderBreakdowns)

  // Filter actions
  const setFilters = useAnalysisBuilderStore((state) => state.setFilters)
  const dropFieldToFilter = useAnalysisBuilderStore((state) => state.dropFieldToFilter)
  const setOrder = useAnalysisBuilderStore((state) => state.setOrder)

  // Utility actions
  const clearQuery = useAnalysisBuilderStore((state) => state.clearQuery)
  const clearCurrentMode = useAnalysisBuilderStore((state) => state.clearCurrentMode)

  // Funnel actions (legacy)
  const setFunnelBindingKey = useAnalysisBuilderStore((state) => state.setFunnelBindingKey)

  // Analysis Type actions (new)
  const setAnalysisType = useAnalysisBuilderStore((state) => state.setAnalysisType)

  // Funnel Mode actions (new dedicated state)
  const setFunnelCube = useAnalysisBuilderStore((state) => state.setFunnelCube)
  const addFunnelStep = useAnalysisBuilderStore((state) => state.addFunnelStep)
  const removeFunnelStep = useAnalysisBuilderStore((state) => state.removeFunnelStep)
  const updateFunnelStep = useAnalysisBuilderStore((state) => state.updateFunnelStep)
  const setActiveFunnelStepIndex = useAnalysisBuilderStore((state) => state.setActiveFunnelStepIndex)
  const reorderFunnelSteps = useAnalysisBuilderStore((state) => state.reorderFunnelSteps)
  const setFunnelTimeDimension = useAnalysisBuilderStore((state) => state.setFunnelTimeDimension)

  // Funnel display config (for Display tab in funnel mode)
  // Phase 4: Read from charts map - use stable selector to avoid infinite loop
  const funnelDisplayConfigFromStore = useAnalysisBuilderStore((state) => state.charts.funnel?.displayConfig)
  const funnelDisplayConfig = useMemo(
    () => funnelDisplayConfigFromStore || { showLegend: true, showGrid: true, showTooltip: true },
    [funnelDisplayConfigFromStore]
  )
  const setFunnelDisplayConfig = useAnalysisBuilderStore((state) => state.setFunnelDisplayConfig)

  // Flow Mode actions
  const setFlowCube = useAnalysisBuilderStore((state) => state.setFlowCube)
  const setFlowBindingKey = useAnalysisBuilderStore((state) => state.setFlowBindingKey)
  const setFlowTimeDimension = useAnalysisBuilderStore((state) => state.setFlowTimeDimension)
  const setEventDimension = useAnalysisBuilderStore((state) => state.setEventDimension)
  const setStartingStepName = useAnalysisBuilderStore((state) => state.setStartingStepName)
  const setStartingStepFilters = useAnalysisBuilderStore((state) => state.setStartingStepFilters)
  const setStepsBefore = useAnalysisBuilderStore((state) => state.setStepsBefore)
  const setStepsAfter = useAnalysisBuilderStore((state) => state.setStepsAfter)
  const setJoinStrategy = useAnalysisBuilderStore((state) => state.setJoinStrategy)
  // Flow display config action - creates setFlowDisplayConfig wrapper using charts map pattern
  const setFlowDisplayConfig = useCallback(
    (config: ChartDisplayConfig) => {
      storeApi.setState((state) => ({
        charts: {
          ...state.charts,
          flow: {
            ...(state.charts.flow || { chartType: 'sankey', chartConfig: {}, displayConfig: {} }),
            displayConfig: config,
          },
        },
      }))
    },
    [storeApi]
  )

  // AI state and actions
  const aiState = useAnalysisBuilderStore((state) => state.aiState)
  const openAI = useAnalysisBuilderStore((state) => state.openAI)
  const closeAI = useAnalysisBuilderStore((state) => state.closeAI)
  const setAIPrompt = useAnalysisBuilderStore((state) => state.setAIPrompt)
  const setAIGenerating = useAnalysisBuilderStore((state) => state.setAIGenerating)
  const setAIError = useAnalysisBuilderStore((state) => state.setAIError)
  const setAIHasGeneratedQuery = useAnalysisBuilderStore((state) => state.setAIHasGeneratedQuery)
  const saveAIPreviousState = useAnalysisBuilderStore((state) => state.saveAIPreviousState)
  const restoreAIPreviousState = useAnalysisBuilderStore((state) => state.restoreAIPreviousState)

  // =========================================================================
  // Share State
  // =========================================================================

  const shareButtonStateRef = useRef<'idle' | 'copied' | 'copied-no-chart'>('idle')
  const canShare = effectiveIsValidQuery

  // =========================================================================
  // Adapter Validation (NEW - Phase 5)
  // =========================================================================

  const getValidation = useAnalysisBuilderStore((state) => state.getValidation)
  // Note: Dependencies trigger recomputation when store values change.
  // getValidation reads values from store closure, but we need the memo to
  // recompute when the underlying state changes.
  const adapterValidation = useMemo(
    () => getValidation(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      getValidation,
      queryBuilder.queryStates,
      analysisType,
      // Funnel deps
      funnelSteps,
      funnelBindingKey,
      funnelTimeDimension,
      // Flow deps
      flowCube,
      flowBindingKey,
      flowTimeDimension,
      eventDimension,
      startingStep,
      stepsBefore,
      stepsAfter,
      joinStrategy,
    ]
  )

  // =========================================================================
  // Action Callbacks
  // =========================================================================

  const handleFieldSelected = useCallback(
    (
      field: MetaField,
      fieldType: 'measure' | 'dimension' | 'timeDimension',
      _cubeName: string,
      keepOpen?: boolean
    ) => {
      if (uiState.fieldModalMode === 'metrics' && fieldType === 'measure') {
        toggleMetric(field.name)
      } else if (uiState.fieldModalMode === 'breakdown') {
        toggleBreakdown(field.name, fieldType === 'timeDimension')
      }
      if (!keepOpen) {
        uiState.closeFieldModal()
      }
    },
    [uiState, toggleMetric, toggleBreakdown]
  )

  const generateAI = useCallback(async () => {
    if (!features?.aiEndpoint) return
    saveAIPreviousState()
    setAIGenerating(true)
    setAIError(null)

    try {
      // AI generation logic would go here
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setAIHasGeneratedQuery(true)
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'Failed to generate query')
    } finally {
      setAIGenerating(false)
    }
  }, [features?.aiEndpoint, saveAIPreviousState, setAIGenerating, setAIError, setAIHasGeneratedQuery])

  const acceptAI = useCallback(() => {
    closeAI()
    setAIHasGeneratedQuery(false)
  }, [closeAI, setAIHasGeneratedQuery])

  const cancelAI = useCallback(() => {
    restoreAIPreviousState()
    closeAI()
  }, [restoreAIPreviousState, closeAI])

  const share = useCallback(async () => {
    shareButtonStateRef.current = 'copied'
    setTimeout(() => {
      shareButtonStateRef.current = 'idle'
    }, 2000)
  }, [])

  // =========================================================================
  // Ref API Functions
  // =========================================================================

  const getQueryConfig = useCallback(() => {
    const state = storeApi.getState()

    // Handle dedicated funnel mode (analysisType === 'funnel')
    if (state.analysisType === 'funnel') {
      // Return ServerFunnelQuery format built from funnelSteps
      const funnelQuery = state.buildFunnelQueryFromSteps()
      if (funnelQuery) {
        return funnelQuery
      }
      // Fallback to single query if funnel isn't properly configured yet
      return state.buildCurrentQuery()
    }

    // Handle multi-query mode (legacy funnel mode with mergeStrategy === 'funnel' is included here)
    if (state.queryStates.length > 1) {
      return {
        queries: state.buildAllQueries(),
        mergeStrategy: state.mergeStrategy,
        mergeKeys: state.getMergeKeys(),
        queryLabels: state.queryStates.map((_, i) => `Q${i + 1}`),
        // Include funnel-specific config when in funnel mode
        funnelBindingKey: state.funnelBindingKey,
        stepTimeToConvert: state.stepTimeToConvert,
      }
    }

    // Single query mode
    return state.buildCurrentQuery()
  }, [storeApi])

  const getChartConfig = useCallback(() => {
    const state = storeApi.getState()

    // Phase 4: Read from charts map based on analysis type
    const config = state.charts[state.analysisType]
    if (config) {
      return {
        chartType: config.chartType,
        chartConfig: config.chartConfig,
        displayConfig: config.displayConfig,
      }
    }

    // Fallback to defaults
    return {
      chartType: chartDefaults.chartType,
      chartConfig: chartDefaults.chartConfig,
      displayConfig: chartDefaults.displayConfig,
    }
  }, [storeApi, chartDefaults.chartType, chartDefaults.chartConfig, chartDefaults.displayConfig])

  const getAnalysisType = useCallback(() => {
    return storeApi.getState().analysisType
  }, [storeApi])

  // =========================================================================
  // Return Value
  // =========================================================================

  return {
    // Query state (from queryBuilder)
    queryState: queryBuilder.queryState,
    queryStates: queryBuilder.queryStates,
    activeQueryIndex: queryBuilder.activeQueryIndex,
    mergeStrategy: queryBuilder.mergeStrategy,
    isMultiQueryMode: queryBuilder.isMultiQueryMode,
    mergeKeys: queryBuilder.mergeKeys,
    currentQuery: queryBuilder.currentQuery,
    allQueries: queryBuilder.allQueries,
    multiQueryConfig: queryBuilder.multiQueryConfig,
    multiQueryValidation: queryBuilder.multiQueryValidation,

    // Funnel state (legacy)
    funnelBindingKey,
    isFunnelModeEnabled,

    // Analysis Type state (new)
    analysisType,
    funnelCube,
    funnelSteps,
    activeFunnelStepIndex,
    funnelTimeDimension,
    funnelChartType,
    funnelChartConfig,
    funnelDisplayConfig,

    // Flow state (new)
    flowCube,
    flowBindingKey,
    flowTimeDimension,
    eventDimension,
    startingStep,
    stepsBefore,
    stepsAfter,
    joinStrategy,
    flowDisplayConfig,

    // Data fetching (from queryExecution)
    executionStatus: queryExecution.executionStatus,
    executionResults: queryExecution.executionResults,
    perQueryResults: queryExecution.perQueryResults,
    isLoading: queryExecution.isLoading,
    isFetching: queryExecution.isFetching,
    error: queryExecution.error,
    isValidQuery: effectiveIsValidQuery,
    debugDataPerQuery: queryExecution.debugDataPerQuery,
    needsRefresh: queryExecution.needsRefresh,
    funnelExecutedQueries: queryExecution.funnelExecutedQueries,
    funnelServerQuery: queryExecution.funnelServerQuery,
    funnelDebugData: queryExecution.funnelDebugData,
    flowServerQuery: queryExecution.flowServerQuery,
    flowDebugData: queryExecution.flowDebugData,

    // Chart configuration (from chartDefaults)
    // Note: Funnel chart type is determined by analysisType === 'funnel', not mergeStrategy
    chartType: chartDefaults.chartType,
    chartConfig: chartDefaults.chartConfig,
    displayConfig: chartDefaults.displayConfig,
    colorPalette: chartDefaults.colorPalette,
    localPaletteName: chartDefaults.localPaletteName,
    chartAvailability: chartDefaults.chartAvailability,
    combinedMetrics: combinedFields.combinedMetrics,
    combinedBreakdowns: combinedFields.combinedBreakdowns,
    effectiveBreakdowns: combinedFields.effectiveBreakdowns,

    // UI state (from uiState)
    activeTab: uiState.activeTab,
    activeView: uiState.activeView,
    displayLimit: uiState.displayLimit,
    showFieldModal: uiState.showFieldModal,
    fieldModalMode: uiState.fieldModalMode,
    activeTableIndex: uiState.activeTableIndex,
    userManuallySelectedChart: uiState.userManuallySelectedChart,

    // AI state
    aiState: {
      isOpen: aiState.isOpen,
      userPrompt: aiState.userPrompt,
      isGenerating: aiState.isGenerating,
      error: aiState.error,
      hasGeneratedQuery: aiState.hasGeneratedQuery,
    },

    // Share state
    shareButtonState: shareButtonStateRef.current,
    canShare,

    // Adapter validation (NEW - Phase 5)
    adapterValidation,

    // Actions
    actions: {
      // Query state (from queryBuilder)
      setActiveQueryIndex: queryBuilder.setActiveQueryIndex,
      setMergeStrategy: queryBuilder.setMergeStrategy,

      // Metrics
      openMetricsModal,
      addMetric,
      removeMetric,
      toggleMetric,
      reorderMetrics,

      // Breakdowns
      openBreakdownsModal,
      addBreakdown,
      removeBreakdown,
      toggleBreakdown,
      setBreakdownGranularity,
      toggleBreakdownComparison,
      reorderBreakdowns,

      // Filters
      setFilters,
      dropFieldToFilter,
      setOrder,

      // Multi-query (from queryBuilder)
      addQuery: queryBuilder.addQuery,
      removeQuery: queryBuilder.removeQuery,

      // Funnel (legacy)
      setFunnelBindingKey,

      // Analysis Type (new)
      setAnalysisType,

      // Funnel Mode (new dedicated state)
      setFunnelCube,
      addFunnelStep,
      removeFunnelStep,
      updateFunnelStep,
      setActiveFunnelStepIndex,
      reorderFunnelSteps,
      setFunnelTimeDimension,
      setFunnelDisplayConfig,

      // Flow Mode actions
      setFlowCube,
      setFlowBindingKey,
      setFlowTimeDimension,
      setEventDimension,
      setStartingStepName,
      setStartingStepFilters,
      setStepsBefore,
      setStepsAfter,
      setJoinStrategy,
      setFlowDisplayConfig,

      // Chart (from chartDefaults)
      setChartType: chartDefaults.setChartType,
      setChartConfig: chartDefaults.setChartConfig,
      setDisplayConfig: chartDefaults.setDisplayConfig,
      setLocalPaletteName: chartDefaults.setLocalPaletteName,

      // UI (from uiState)
      setActiveTab: uiState.setActiveTab,
      setActiveView: uiState.setActiveView,
      setDisplayLimit: uiState.setDisplayLimit,
      closeFieldModal: uiState.closeFieldModal,
      setActiveTableIndex: uiState.setActiveTableIndex,

      // AI
      openAI,
      closeAI,
      setAIPrompt,
      generateAI,
      acceptAI,
      cancelAI,

      // Share
      share,

      // Utility
      clearQuery,
      clearCurrentMode,
      refetch: queryExecution.refetch,
      handleFieldSelected,
    },

    // Refs
    getQueryConfig,
    getChartConfig,
    getAnalysisType,
  }
}

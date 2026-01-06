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

import { useCallback, useRef } from 'react'
import { useCubeContext } from '../providers/CubeProvider'
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
  mergeStrategy: 'concat' | 'merge'
  isMultiQueryMode: boolean
  mergeKeys: string[] | undefined
  currentQuery: CubeQuery
  allQueries: CubeQuery[]
  multiQueryConfig: MultiQueryConfig | null
  multiQueryValidation: MultiQueryValidationResult | null

  // Data Fetching
  executionStatus: ExecutionStatus
  executionResults: unknown[] | null
  perQueryResults: (unknown[] | null)[] | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  isValidQuery: boolean
  debugDataPerQuery: DebugDataEntry[]

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

  // Actions
  actions: {
    setActiveQueryIndex: (index: number) => void
    setMergeStrategy: (strategy: 'concat' | 'merge') => void
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
    refetch: () => void
    handleFieldSelected: (
      field: MetaField,
      fieldType: 'measure' | 'dimension' | 'timeDimension',
      cubeName: string,
      keepOpen?: boolean
    ) => void
  }

  // Refs (for imperative access)
  getQueryConfig: () => CubeQuery | MultiQueryConfig
  getChartConfig: () => {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAnalysisBuilder(
  options: UseAnalysisBuilderOptions = {}
): UseAnalysisBuilderResult {
  const { initialData, externalColorPalette, onQueryChange, onChartConfigChange } = options

  // Get context
  const { features } = useCubeContext()

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

  // 3. Query Execution (TanStack Query integration)
  const queryExecution = useAnalysisQueryExecution({
    currentQuery: queryBuilder.currentQuery,
    allQueries: queryBuilder.allQueries,
    multiQueryConfig: queryBuilder.multiQueryConfig,
    isMultiQueryMode: queryBuilder.isMultiQueryMode,
    isValidQuery: queryBuilder.isValidQuery ?? false,
    initialData,
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
  const canShare = queryBuilder.isValidQuery ?? false

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
    if (state.queryStates.length > 1) {
      return {
        queries: state.buildAllQueries(),
        mergeStrategy: state.mergeStrategy,
        mergeKeys: state.getMergeKeys(),
        queryLabels: state.queryStates.map((_, i) => `Q${i + 1}`),
      }
    }
    return state.buildCurrentQuery()
  }, [storeApi])

  const getChartConfig = useCallback(
    () => ({
      chartType: chartDefaults.chartType,
      chartConfig: chartDefaults.chartConfig,
      displayConfig: chartDefaults.displayConfig,
    }),
    [chartDefaults.chartType, chartDefaults.chartConfig, chartDefaults.displayConfig]
  )

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

    // Data fetching (from queryExecution)
    executionStatus: queryExecution.executionStatus,
    executionResults: queryExecution.executionResults,
    perQueryResults: queryExecution.perQueryResults,
    isLoading: queryExecution.isLoading,
    isFetching: queryExecution.isFetching,
    error: queryExecution.error,
    isValidQuery: queryBuilder.isValidQuery ?? false,
    debugDataPerQuery: queryExecution.debugDataPerQuery,

    // Chart configuration (from chartDefaults)
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
      refetch: queryExecution.refetch,
      handleFieldSelected,
    },

    // Refs
    getQueryConfig,
    getChartConfig,
  }
}

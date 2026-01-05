/**
 * useAnalysisBuilder - Master Coordination Hook
 *
 * The single hook that provides everything AnalysisBuilder needs:
 * - Zustand store state and actions (from Context)
 * - TanStack Query data fetching
 * - Derived/computed values (memoized)
 * - Chart configuration and availability
 *
 * This hook replaces 15+ individual hooks and provides a clean
 * interface for the AnalysisBuilder component.
 *
 * IMPORTANT: This hook must be used within AnalysisBuilderStoreProvider
 *
 * Usage:
 * ```tsx
 * const analysis = useAnalysisBuilder(options)
 *
 * // Access state
 * const { metrics, breakdowns, filters } = analysis.queryState
 *
 * // Access actions
 * analysis.actions.addMetric('Employees.count')
 *
 * // Access data
 * const { data, isLoading } = analysis.queryResult
 * ```
 */

import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { useCubeContext } from '../providers/CubeProvider'
import {
  useAnalysisBuilderStore,
  useAnalysisBuilderStoreApi,
  type SharedState,
} from '../stores/analysisBuilderStore'
import {
  useCubeLoadQuery,
  useMultiCubeLoadQuery,
  useDryRunQueries,
  type DebugDataEntry,
} from './queries'
import { getAllChartAvailability, getSmartChartDefaults, shouldAutoSwitchChartType } from '../shared/chartDefaults'
import { getColorPalette, type ColorPalette } from '../utils/colorPalettes'
import { validateMultiQueryConfig, type MultiQueryValidationResult } from '../utils/multiQueryValidation'
import type {
  CubeQuery,
  MultiQueryConfig,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
} from '../types'
import type {
  AnalysisBuilderState,
  MetricItem,
  BreakdownItem,
  ExecutionStatus,
  QueryPanelTab,
} from '../components/AnalysisBuilder/types'
import type { ChartAvailabilityMap } from '../shared/chartDefaults'
import { parseShareHash, decodeAndDecompress, clearShareHash } from '../utils/shareUtils'

// ============================================================================
// Types
// ============================================================================

export interface UseAnalysisBuilderOptions {
  /**
   * External color palette (overrides local)
   */
  externalColorPalette?: string[] | ColorPalette
  /**
   * Initial data (skip first fetch)
   */
  initialData?: unknown[]
  /**
   * Callback when query changes
   */
  onQueryChange?: (query: CubeQuery) => void
  /**
   * Callback when chart config changes
   */
  onChartConfigChange?: (config: {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }) => void
}

export interface UseAnalysisBuilderResult {
  // =========================================================================
  // Query State
  // =========================================================================
  /** Current query state (active query) */
  queryState: AnalysisBuilderState
  /** All query states (for multi-query mode) */
  queryStates: AnalysisBuilderState[]
  /** Active query index */
  activeQueryIndex: number
  /** Merge strategy for multi-query */
  mergeStrategy: 'concat' | 'merge'
  /** Whether in multi-query mode */
  isMultiQueryMode: boolean
  /** Merge keys (computed from Q1 breakdowns) */
  mergeKeys: string[] | undefined
  /** Current query as CubeQuery */
  currentQuery: CubeQuery
  /** All queries as CubeQuery[] */
  allQueries: CubeQuery[]
  /** MultiQueryConfig (if in multi-query mode) */
  multiQueryConfig: MultiQueryConfig | null
  /** Multi-query validation result */
  multiQueryValidation: MultiQueryValidationResult | null

  // =========================================================================
  // Data Fetching
  // =========================================================================
  /** Query execution status */
  executionStatus: ExecutionStatus
  /** Query results (merged for multi-query) */
  executionResults: unknown[] | null
  /** Per-query results (for table view in multi-query mode) */
  perQueryResults: (unknown[] | null)[] | null
  /** Whether query is loading */
  isLoading: boolean
  /** Whether query is fetching (includes refetch) */
  isFetching: boolean
  /** Query error */
  error: Error | null
  /** Whether current query is valid */
  isValidQuery: boolean
  /** Debug data per query */
  debugDataPerQuery: DebugDataEntry[]

  // =========================================================================
  // Chart Configuration
  // =========================================================================
  /** Current chart type */
  chartType: ChartType
  /** Chart axis configuration */
  chartConfig: ChartAxisConfig
  /** Chart display configuration */
  displayConfig: ChartDisplayConfig
  /** Effective color palette */
  colorPalette: ColorPalette
  /** Local palette name (when not using external) */
  localPaletteName: string
  /** Chart availability map */
  chartAvailability: ChartAvailabilityMap
  /** Combined metrics from all queries (for chart config) */
  combinedMetrics: MetricItem[]
  /** Combined breakdowns from all queries (for chart config) */
  combinedBreakdowns: BreakdownItem[]
  /** Effective breakdowns for display (Q1's in merge mode, otherwise current query's) */
  effectiveBreakdowns: BreakdownItem[]

  // =========================================================================
  // UI State
  // =========================================================================
  /** Active tab in query panel */
  activeTab: QueryPanelTab
  /** Active view (table or chart) */
  activeView: 'table' | 'chart'
  /** Display limit for table */
  displayLimit: number
  /** Whether field modal is open */
  showFieldModal: boolean
  /** Field modal mode */
  fieldModalMode: 'metrics' | 'breakdown'
  /** Active table index for multi-query */
  activeTableIndex: number
  /** User manually selected chart */
  userManuallySelectedChart: boolean

  // =========================================================================
  // AI State
  // =========================================================================
  /** AI panel state */
  aiState: {
    isOpen: boolean
    userPrompt: string
    isGenerating: boolean
    error: string | null
    hasGeneratedQuery: boolean
  }

  // =========================================================================
  // Share State
  // =========================================================================
  /** Share button state */
  shareButtonState: 'idle' | 'copied' | 'copied-no-chart'
  /** Can share current query */
  canShare: boolean

  // =========================================================================
  // Actions
  // =========================================================================
  actions: {
    // Query state actions
    setActiveQueryIndex: (index: number) => void
    setMergeStrategy: (strategy: 'concat' | 'merge') => void

    // Metrics actions
    openMetricsModal: () => void
    addMetric: (field: string, label?: string) => void
    removeMetric: (id: string) => void
    toggleMetric: (fieldName: string) => void
    reorderMetrics: (fromIndex: number, toIndex: number) => void

    // Breakdowns actions
    openBreakdownsModal: () => void
    addBreakdown: (field: string, isTimeDimension: boolean, granularity?: string) => void
    removeBreakdown: (id: string) => void
    toggleBreakdown: (fieldName: string, isTimeDimension: boolean, granularity?: string) => void
    setBreakdownGranularity: (id: string, granularity: string) => void
    toggleBreakdownComparison: (id: string) => void
    reorderBreakdowns: (fromIndex: number, toIndex: number) => void

    // Filters actions
    setFilters: (filters: import('../types').Filter[]) => void
    dropFieldToFilter: (field: string) => void
    setOrder: (fieldName: string, direction: 'asc' | 'desc' | null) => void

    // Multi-query actions
    addQuery: () => void
    removeQuery: (index: number) => void

    // Chart actions
    setChartType: (type: ChartType) => void
    setChartConfig: (config: ChartAxisConfig) => void
    setDisplayConfig: (config: ChartDisplayConfig) => void
    setLocalPaletteName: (name: string) => void

    // UI actions
    setActiveTab: (tab: QueryPanelTab) => void
    setActiveView: (view: 'table' | 'chart') => void
    setDisplayLimit: (limit: number) => void
    closeFieldModal: () => void
    setActiveTableIndex: (index: number) => void

    // AI actions
    openAI: () => void
    closeAI: () => void
    setAIPrompt: (prompt: string) => void
    generateAI: () => Promise<void>
    acceptAI: () => void
    cancelAI: () => void

    // Share actions
    share: () => Promise<void>

    // Utility actions
    clearQuery: () => void
    refetch: () => void
    handleFieldSelected: (
      field: import('../shared/types').MetaField,
      fieldType: 'measure' | 'dimension' | 'timeDimension',
      cubeName: string,
      keepOpen?: boolean
    ) => void
  }

  // =========================================================================
  // Refs (for imperative access)
  // =========================================================================
  /** Get query config (for ref API) */
  getQueryConfig: () => CubeQuery | MultiQueryConfig
  /** Get chart config (for ref API) */
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
  const {
    initialData,
    externalColorPalette,
    onQueryChange,
    onChartConfigChange,
  } = options

  // Get context
  const { features } = useCubeContext()

  // Get store API for direct access
  const storeApi = useAnalysisBuilderStoreApi()

  // =========================================================================
  // Zustand Store (via Context)
  // =========================================================================

  // Select state from store - use individual selectors for optimal re-renders
  const queryStates = useAnalysisBuilderStore((state) => state.queryStates)
  const activeQueryIndex = useAnalysisBuilderStore((state) => state.activeQueryIndex)
  const mergeStrategy = useAnalysisBuilderStore((state) => state.mergeStrategy)
  const chartType = useAnalysisBuilderStore((state) => state.chartType)
  const chartConfig = useAnalysisBuilderStore((state) => state.chartConfig)
  const displayConfig = useAnalysisBuilderStore((state) => state.displayConfig)
  const userManuallySelectedChart = useAnalysisBuilderStore((state) => state.userManuallySelectedChart)
  const localPaletteName = useAnalysisBuilderStore((state) => state.localPaletteName)
  const activeTab = useAnalysisBuilderStore((state) => state.activeTab)
  const activeView = useAnalysisBuilderStore((state) => state.activeView)
  const displayLimit = useAnalysisBuilderStore((state) => state.displayLimit)
  const showFieldModal = useAnalysisBuilderStore((state) => state.showFieldModal)
  const fieldModalMode = useAnalysisBuilderStore((state) => state.fieldModalMode)
  const aiState = useAnalysisBuilderStore((state) => state.aiState)

  // Get actions from store
  const setQueryStates = useAnalysisBuilderStore((state) => state.setQueryStates)
  const updateQueryState = useAnalysisBuilderStore((state) => state.updateQueryState)
  const setActiveQueryIndex = useAnalysisBuilderStore((state) => state.setActiveQueryIndex)
  const setMergeStrategy = useAnalysisBuilderStore((state) => state.setMergeStrategy)
  const openMetricsModal = useAnalysisBuilderStore((state) => state.openMetricsModal)
  const addMetric = useAnalysisBuilderStore((state) => state.addMetric)
  const removeMetric = useAnalysisBuilderStore((state) => state.removeMetric)
  const toggleMetric = useAnalysisBuilderStore((state) => state.toggleMetric)
  const reorderMetrics = useAnalysisBuilderStore((state) => state.reorderMetrics)
  const openBreakdownsModal = useAnalysisBuilderStore((state) => state.openBreakdownsModal)
  const addBreakdown = useAnalysisBuilderStore((state) => state.addBreakdown)
  const removeBreakdown = useAnalysisBuilderStore((state) => state.removeBreakdown)
  const toggleBreakdown = useAnalysisBuilderStore((state) => state.toggleBreakdown)
  const setBreakdownGranularity = useAnalysisBuilderStore((state) => state.setBreakdownGranularity)
  const toggleBreakdownComparison = useAnalysisBuilderStore((state) => state.toggleBreakdownComparison)
  const reorderBreakdowns = useAnalysisBuilderStore((state) => state.reorderBreakdowns)
  const setFilters = useAnalysisBuilderStore((state) => state.setFilters)
  const dropFieldToFilter = useAnalysisBuilderStore((state) => state.dropFieldToFilter)
  const setOrder = useAnalysisBuilderStore((state) => state.setOrder)
  const addQuery = useAnalysisBuilderStore((state) => state.addQuery)
  const removeQuery = useAnalysisBuilderStore((state) => state.removeQuery)
  const setChartType = useAnalysisBuilderStore((state) => state.setChartType)
  const setChartTypeManual = useAnalysisBuilderStore((state) => state.setChartTypeManual)
  const setChartConfig = useAnalysisBuilderStore((state) => state.setChartConfig)
  const setDisplayConfig = useAnalysisBuilderStore((state) => state.setDisplayConfig)
  const setLocalPaletteName = useAnalysisBuilderStore((state) => state.setLocalPaletteName)
  const setUserManuallySelectedChart = useAnalysisBuilderStore((state) => state.setUserManuallySelectedChart)
  const setActiveTab = useAnalysisBuilderStore((state) => state.setActiveTab)
  const setActiveView = useAnalysisBuilderStore((state) => state.setActiveView)
  const setDisplayLimit = useAnalysisBuilderStore((state) => state.setDisplayLimit)
  const closeFieldModal = useAnalysisBuilderStore((state) => state.closeFieldModal)
  const openAI = useAnalysisBuilderStore((state) => state.openAI)
  const closeAI = useAnalysisBuilderStore((state) => state.closeAI)
  const setAIPrompt = useAnalysisBuilderStore((state) => state.setAIPrompt)
  const setAIGenerating = useAnalysisBuilderStore((state) => state.setAIGenerating)
  const setAIError = useAnalysisBuilderStore((state) => state.setAIError)
  const setAIHasGeneratedQuery = useAnalysisBuilderStore((state) => state.setAIHasGeneratedQuery)
  const saveAIPreviousState = useAnalysisBuilderStore((state) => state.saveAIPreviousState)
  const restoreAIPreviousState = useAnalysisBuilderStore((state) => state.restoreAIPreviousState)
  const clearQuery = useAnalysisBuilderStore((state) => state.clearQuery)
  const loadFromShare = useAnalysisBuilderStore((state) => state.loadFromShare)
  const getCurrentState = useAnalysisBuilderStore((state) => state.getCurrentState)
  const getMergeKeys = useAnalysisBuilderStore((state) => state.getMergeKeys)
  const isMultiQueryModeGetter = useAnalysisBuilderStore((state) => state.isMultiQueryMode)
  const buildCurrentQuery = useAnalysisBuilderStore((state) => state.buildCurrentQuery)
  const buildAllQueries = useAnalysisBuilderStore((state) => state.buildAllQueries)
  const buildMultiQueryConfig = useAnalysisBuilderStore((state) => state.buildMultiQueryConfig)

  // Silence unused variable warnings
  void setQueryStates
  void updateQueryState

  // =========================================================================
  // Derived State (Memoized)
  // =========================================================================

  // Current query state
  const queryState = getCurrentState()

  // Whether in multi-query mode
  const isMultiQueryMode = isMultiQueryModeGetter()

  // Merge keys (computed from Q1 breakdowns)
  const mergeKeys = getMergeKeys()

  // Build current query
  const currentQuery = useMemo(() => buildCurrentQuery(), [
    queryState.metrics,
    queryState.breakdowns,
    queryState.filters,
    queryState.order,
    buildCurrentQuery,
  ])

  // Build all queries
  // Note: mergeStrategy is needed as a dependency because buildAllQueries uses Q1's breakdowns for Q2+ in merge mode
  const allQueries = useMemo(() => buildAllQueries(), [queryStates, mergeStrategy, buildAllQueries])

  // Build multi-query config
  const multiQueryConfig = useMemo(() => buildMultiQueryConfig(), [
    isMultiQueryMode,
    allQueries,
    mergeStrategy,
    mergeKeys,
    buildMultiQueryConfig,
  ])

  // Validate multi-query configuration
  const multiQueryValidation = useMemo((): MultiQueryValidationResult | null => {
    if (!isMultiQueryMode) return null
    return validateMultiQueryConfig(allQueries, mergeStrategy, mergeKeys || [])
  }, [isMultiQueryMode, allQueries, mergeStrategy, mergeKeys])

  // Check if query is valid
  const isValidQuery = useMemo(() => {
    return (
      (currentQuery.measures && currentQuery.measures.length > 0) ||
      (currentQuery.dimensions && currentQuery.dimensions.length > 0) ||
      (currentQuery.timeDimensions && currentQuery.timeDimensions.length > 0)
    )
  }, [currentQuery])

  // Combined metrics from all queries
  const combinedMetrics = useMemo(() => {
    if (!isMultiQueryMode) return queryState.metrics
    const seen = new Set<string>()
    const combined: MetricItem[] = []
    for (let qIndex = 0; qIndex < queryStates.length; qIndex++) {
      const qs = queryStates[qIndex]
      for (const metric of qs.metrics) {
        const key = `Q${qIndex + 1}:${metric.field}`
        if (!seen.has(key)) {
          seen.add(key)
          combined.push({
            ...metric,
            label: `${metric.label} (Q${qIndex + 1})`,
          })
        }
      }
    }
    return combined
  }, [isMultiQueryMode, queryStates, queryState.metrics])

  // Combined breakdowns from all queries
  const combinedBreakdowns = useMemo(() => {
    if (!isMultiQueryMode) return queryState.breakdowns
    const seen = new Set<string>()
    const combined: BreakdownItem[] = []
    for (const qs of queryStates) {
      for (const breakdown of qs.breakdowns) {
        if (!seen.has(breakdown.field)) {
          seen.add(breakdown.field)
          combined.push(breakdown)
        }
      }
    }
    return combined
  }, [isMultiQueryMode, queryStates, queryState.breakdowns])

  // Effective breakdowns for the current view
  // In merge mode, Q2+ should visually show Q1's breakdowns since they're shared
  const effectiveBreakdowns = useMemo(() => {
    if (mergeStrategy === 'merge' && activeQueryIndex > 0) {
      // Show Q1's breakdowns for Q2+ in merge mode
      return queryStates[0]?.breakdowns || []
    }
    return queryState.breakdowns
  }, [mergeStrategy, activeQueryIndex, queryStates, queryState.breakdowns])

  // Chart availability
  const chartAvailability = useMemo(
    () => getAllChartAvailability(combinedMetrics, combinedBreakdowns),
    [combinedMetrics, combinedBreakdowns]
  )

  // Effective color palette
  const colorPalette = useMemo((): ColorPalette => {
    if (externalColorPalette) {
      if (Array.isArray(externalColorPalette) && typeof externalColorPalette[0] === 'string') {
        return {
          name: 'custom',
          label: 'Custom',
          colors: externalColorPalette as string[],
          gradient: externalColorPalette as string[],
        }
      }
      return externalColorPalette as ColorPalette
    }
    return getColorPalette(localPaletteName)
  }, [externalColorPalette, localPaletteName])

  // =========================================================================
  // Data Fetching (TanStack Query)
  // =========================================================================

  // Single query execution
  const singleQueryResult = useCubeLoadQuery(currentQuery, {
    skip: !isValidQuery || isMultiQueryMode,
    debounceMs: 300,
  })

  // Multi-query execution
  const multiQueryResult = useMultiCubeLoadQuery(multiQueryConfig, {
    skip: !multiQueryConfig || !isMultiQueryMode,
    debounceMs: 300,
  })

  // Dry-run queries for debug data
  const dryRunResult = useDryRunQueries({
    queries: isMultiQueryMode ? allQueries : [currentQuery],
    isMultiQueryMode,
    skip: !isValidQuery,
  })

  // Unify results
  const isLoading = isMultiQueryMode ? multiQueryResult.isLoading : singleQueryResult.isLoading
  const isFetching = isMultiQueryMode ? multiQueryResult.isFetching : singleQueryResult.isFetching
  const error = isMultiQueryMode ? multiQueryResult.error : singleQueryResult.error

  // Unified refetch function
  const refetch = useCallback(() => {
    if (isMultiQueryMode) {
      multiQueryResult.refetch()
    } else {
      singleQueryResult.refetch()
    }
  }, [isMultiQueryMode, multiQueryResult, singleQueryResult])

  // Execution status
  // Note: isLoading = initial load only, isFetching = any fetch (including refetch)
  const executionStatus: ExecutionStatus = useMemo(() => {
    const hasResults = isMultiQueryMode ? multiQueryResult.data : singleQueryResult.rawData
    if (initialData && initialData.length > 0 && !hasResults) return 'success'
    if (!isValidQuery) return 'idle'
    if (isLoading && !hasResults) return 'loading'
    if (isFetching && hasResults) return 'refreshing'  // Use isFetching for refetch detection
    if (error) return 'error'
    if (hasResults) return 'success'
    return 'idle'
  }, [isValidQuery, isLoading, isFetching, error, singleQueryResult.rawData, multiQueryResult.data, initialData, isMultiQueryMode])

  // Execution results
  const executionResults = useMemo(() => {
    if (isMultiQueryMode && multiQueryResult.data) {
      return multiQueryResult.data as unknown[]
    }
    if (singleQueryResult.rawData) {
      return singleQueryResult.rawData
    }
    if (initialData && initialData.length > 0) {
      return initialData
    }
    return null
  }, [singleQueryResult.rawData, multiQueryResult.data, initialData, isMultiQueryMode])

  // Per-query results for table view
  const perQueryResults = useMemo(() => {
    if (!isMultiQueryMode || !multiQueryResult.perQueryData) return null
    return multiQueryResult.perQueryData
  }, [isMultiQueryMode, multiQueryResult.perQueryData])

  // =========================================================================
  // Active Table Index (for multi-query table view)
  // =========================================================================

  const [activeTableIndex, setActiveTableIndex] = useState(0)

  // =========================================================================
  // Share State
  // =========================================================================

  const shareButtonStateRef = useRef<'idle' | 'copied' | 'copied-no-chart'>('idle')

  const canShare = isValidQuery

  // =========================================================================
  // URL Share Loading (on mount) - only for non-persisted stores
  // =========================================================================

  const hasInitializedShareRef = useRef(false)

  useEffect(() => {
    if (hasInitializedShareRef.current) return
    hasInitializedShareRef.current = true

    const encoded = parseShareHash()
    if (!encoded) return

    const sharedState = decodeAndDecompress(encoded) as SharedState | null
    if (!sharedState || !sharedState.query) return

    loadFromShare(sharedState)
    clearShareHash()
  }, [loadFromShare])

  // =========================================================================
  // Callbacks (onQueryChange, onChartConfigChange)
  // =========================================================================

  useEffect(() => {
    if (onQueryChange && isValidQuery) {
      onQueryChange(currentQuery)
    }
  }, [currentQuery, isValidQuery, onQueryChange])

  useEffect(() => {
    if (onChartConfigChange) {
      onChartConfigChange({
        chartType,
        chartConfig,
        displayConfig,
      })
    }
  }, [chartType, chartConfig, displayConfig, onChartConfigChange])

  // =========================================================================
  // Smart Chart Defaulting
  // =========================================================================

  const prevMetricsBreakdownsRef = useRef<string>('')

  useEffect(() => {
    if (!singleQueryResult.debouncedQuery && !multiQueryResult.debouncedConfig) return
    if (combinedMetrics.length === 0 && combinedBreakdowns.length === 0) return

    const currentKey = JSON.stringify({
      metrics: combinedMetrics.map((m) => m.field),
      breakdowns: combinedBreakdowns.map((b) => ({ field: b.field, isTime: b.isTimeDimension })),
    })

    if (currentKey === prevMetricsBreakdownsRef.current) return
    prevMetricsBreakdownsRef.current = currentKey

    const newChartType = shouldAutoSwitchChartType(
      combinedMetrics,
      combinedBreakdowns,
      chartType,
      userManuallySelectedChart
    )

    if (newChartType) {
      const { chartConfig: newConfig } = getSmartChartDefaults(
        combinedMetrics,
        combinedBreakdowns,
        newChartType
      )
      setChartType(newChartType)
      setChartConfig(newConfig)
      setUserManuallySelectedChart(false)
    } else if (combinedMetrics.length > 0 || combinedBreakdowns.length > 0) {
      // Apply smart defaults only if chart config is empty
      const isChartConfigEmpty =
        !chartConfig.xAxis?.length &&
        !chartConfig.yAxis?.length &&
        !chartConfig.series?.length
      if (isChartConfigEmpty) {
        const { chartConfig: smartDefaults } = getSmartChartDefaults(
          combinedMetrics,
          combinedBreakdowns,
          chartType
        )
        setChartConfig(smartDefaults)
      }
    }
  }, [
    singleQueryResult.debouncedQuery,
    multiQueryResult.debouncedConfig,
    combinedMetrics,
    combinedBreakdowns,
    chartType,
    userManuallySelectedChart,
    chartConfig,
    setChartType,
    setChartConfig,
    setUserManuallySelectedChart,
  ])

  // =========================================================================
  // Actions
  // =========================================================================

  const handleFieldSelected = useCallback(
    (
      field: import('../shared/types').MetaField,
      fieldType: 'measure' | 'dimension' | 'timeDimension',
      _cubeName: string,
      keepOpen?: boolean
    ) => {
      if (fieldModalMode === 'metrics' && fieldType === 'measure') {
        toggleMetric(field.name)
      } else if (fieldModalMode === 'breakdown') {
        toggleBreakdown(field.name, fieldType === 'timeDimension')
      }
      if (!keepOpen) {
        closeFieldModal()
      }
    },
    [fieldModalMode, toggleMetric, toggleBreakdown, closeFieldModal]
  )

  const generateAI = useCallback(async () => {
    if (!features?.aiEndpoint) return
    saveAIPreviousState()
    setAIGenerating(true)
    setAIError(null)

    try {
      // AI generation logic would go here
      // For now, just simulate
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
    // Share logic would go here
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
      chartType,
      chartConfig,
      displayConfig,
    }),
    [chartType, chartConfig, displayConfig]
  )

  // =========================================================================
  // Return Value
  // =========================================================================

  return {
    // Query state
    queryState,
    queryStates,
    activeQueryIndex,
    mergeStrategy,
    isMultiQueryMode,
    mergeKeys,
    currentQuery,
    allQueries,
    multiQueryConfig,
    multiQueryValidation,

    // Data fetching
    executionStatus,
    executionResults,
    perQueryResults,
    isLoading,
    isFetching,
    error,
    isValidQuery: isValidQuery ?? false,
    debugDataPerQuery: dryRunResult.debugDataPerQuery,

    // Chart configuration
    chartType,
    chartConfig,
    displayConfig,
    colorPalette,
    localPaletteName,
    chartAvailability,
    combinedMetrics,
    combinedBreakdowns,
    effectiveBreakdowns,

    // UI state
    activeTab,
    activeView,
    displayLimit,
    showFieldModal,
    fieldModalMode,
    activeTableIndex,
    userManuallySelectedChart,

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
    canShare: canShare ?? false,

    // Actions
    actions: {
      // Query state
      setActiveQueryIndex,
      setMergeStrategy,

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

      // Multi-query
      addQuery,
      removeQuery,

      // Chart
      setChartType: setChartTypeManual,
      setChartConfig,
      setDisplayConfig,
      setLocalPaletteName,

      // UI
      setActiveTab,
      setActiveView,
      setDisplayLimit,
      closeFieldModal,
      setActiveTableIndex,

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
      refetch,
      handleFieldSelected,
    },

    // Refs
    getQueryConfig,
    getChartConfig,
  }
}

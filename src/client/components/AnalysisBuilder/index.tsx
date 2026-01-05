/**
 * AnalysisBuilder Component
 *
 * A redesigned query builder with a modern UX:
 * - Results panel on the left (large)
 * - Query builder panel on the right
 * - Search-based field selection via modal
 * - Sections: Metrics (measures), Breakdown (dimensions), Filters
 * - Auto-execute queries on field changes
 */

import { useState, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import { useAnalysisState } from '../../hooks/useAnalysisState'
import { useQueryExecution } from '../../hooks/useQueryExecution'
import { useChartConfiguration } from '../../hooks/useChartConfiguration'
import { useAnalysisAI } from '../../hooks/useAnalysisAI'
import { useAnalysisShare } from '../../hooks/useAnalysisShare'
import type {
  AnalysisBuilderProps,
  AnalysisBuilderRef,
  AnalysisBuilderStorageState,
  MetricItem,
  BreakdownItem,
  QueryPanelTab,
  QueryAnalysis
} from './types'
import type { CubeQuery, ChartType, ChartAxisConfig, ChartDisplayConfig, MultiQueryConfig } from '../../types'
import { isMultiQueryConfig } from '../../types'
import FieldSearchModal from './FieldSearchModal'
import AnalysisResultsPanel from './AnalysisResultsPanel'
import AnalysisQueryPanel from './AnalysisQueryPanel'
import type { MetaResponse } from '../../shared/types'
import { cleanQueryForServer } from '../../shared/utils'
import { getSmartChartDefaults } from '../../shared/chartDefaults'
import { parseShareHash, decodeAndDecompress, clearShareHash } from '../../utils/shareUtils'
import { validateMultiQueryConfig, type MultiQueryValidationResult } from '../../utils/multiQueryValidation'
import AnalysisAIPanel from './AnalysisAIPanel'

// Import utils from organized folder
import {
  buildCubeQuery,
  createInitialState,
  loadInitialStateFromStorage,
  STORAGE_KEY
} from './utils'

// Import handler hooks
import {
  useMetricsHandlers,
  useBreakdownsHandlers,
  useFiltersHandlers,
  useMultiQueryHandlers
} from './handlers'

const AnalysisBuilder = forwardRef<AnalysisBuilderRef, AnalysisBuilderProps>(
  (
    {
      className = '',
      maxHeight,
      initialQuery,
      initialChartConfig,
      initialData,
      colorPalette: externalColorPalette,
      disableLocalStorage: disableLocalStorageProp = false,
      hideSettings: _hideSettings = false,
      onQueryChange,
      onChartConfigChange
    },
    ref
  ) => {
    // Mark unused props for future use
    void _hideSettings

    // Disable localStorage when initialQuery is provided (parent manages state)
    const disableLocalStorage = disableLocalStorageProp || !!initialQuery

    // Get context - metaLoading and metaError used by FieldSearchModal internally
    const { meta, cubeApi } = useCubeContext()

    // Load localStorage once on mount (before useState calls) to avoid repeated parsing
    const cachedStorage = useMemo(
      () => loadInitialStateFromStorage(disableLocalStorageProp),
      [] // Only run once on mount
    )

    // Use the analysis state hook for multi-query state management
    const {
      queryStates,
      setQueryStates,
      activeQueryIndex,
      setActiveQueryIndex,
      mergeStrategy,
      setMergeStrategy,
      state,
      setState,
      mergeKeys,
      isMultiQueryMode,
      queryToState
    } = useAnalysisState({
      initialQuery,
      cachedStorage
    })

    // Order is now stored per-query in queryStates[index].order
    // Access current query's order via state.order

    // UI state
    const [activeTab, setActiveTab] = useState<QueryPanelTab>('query')
    const [activeView, setActiveView] = useState<'table' | 'chart'>(() => {
      if (!initialQuery && cachedStorage?.activeView) {
        return cachedStorage.activeView
      }
      return 'chart'
    })
    const [displayLimit, setDisplayLimit] = useState<number>(100)

    // Debug data state (from dry-run API) - one entry per query in multi-query mode
    interface DebugDataEntry {
      sql: { sql: string; params: any[] } | null
      analysis: QueryAnalysis | null
      loading: boolean
      error: string | null
    }
    const [debugDataPerQuery, setDebugDataPerQuery] = useState<DebugDataEntry[]>([])

    // Field search modal state
    const [showFieldModal, setShowFieldModal] = useState(false)
    const [fieldModalMode, setFieldModalMode] = useState<'metrics' | 'breakdown'>('metrics')

    // Load shared state from URL on mount
    useEffect(() => {
      // Skip if initialQuery is provided (parent manages state)
      if (initialQuery) return

      const encoded = parseShareHash()
      if (!encoded) return

      const sharedState = decodeAndDecompress(encoded)
      if (!sharedState || !sharedState.query) return

      const queryConfig = sharedState.query

      // Check if this is a multi-query config
      if (isMultiQueryConfig(queryConfig)) {
        // Multi-query: set all query states
        const multiConfig = queryConfig as MultiQueryConfig
        setQueryStates(multiConfig.queries.map(queryToState))
        setActiveQueryIndex(0)
        if (multiConfig.mergeStrategy) {
          setMergeStrategy(multiConfig.mergeStrategy)
        }
      } else {
        // Single query: set as the only query state
        // queryToState already includes order from query.order
        const query = queryConfig as CubeQuery
        setQueryStates([queryToState(query)])
        setActiveQueryIndex(0)
      }

      // Apply chart config if present
      if (sharedState.chartType) {
        setChartType(sharedState.chartType)
        setUserManuallySelectedChart(true)
      }
      if (sharedState.chartConfig) {
        setChartConfig(sharedState.chartConfig)
      }
      if (sharedState.displayConfig) {
        setDisplayConfig(sharedState.displayConfig)
      }
      if (sharedState.activeView) {
        setActiveView(sharedState.activeView)
      }

      // Clear the share hash from URL
      clearShareHash()
    }, []) // Run once on mount

    // Build current query for the active tab - memoized to prevent infinite loops
    const currentQuery = useMemo(
      () => buildCubeQuery(state.metrics, state.breakdowns, state.filters, state.order),
      [state.metrics, state.breakdowns, state.filters, state.order]
    )

    // Build ALL queries from all queryStates (for multi-query execution)
    // Each query uses its own order from its state
    const allQueries = useMemo(() => {
      return queryStates.map(qs => buildCubeQuery(qs.metrics, qs.breakdowns, qs.filters, qs.order))
    }, [queryStates])

    // Validate multi-query configuration and get warnings/errors
    const multiQueryValidation = useMemo((): MultiQueryValidationResult | null => {
      if (!isMultiQueryMode) return null
      return validateMultiQueryConfig(allQueries, mergeStrategy, mergeKeys || [])
    }, [isMultiQueryMode, allQueries, mergeStrategy, mergeKeys])

    // Combined metrics from ALL queries (for chart config in multi-query mode)
    const allMetrics = useMemo(() => {
      if (!isMultiQueryMode) return state.metrics
      return queryStates.flatMap(qs => qs.metrics)
    }, [isMultiQueryMode, queryStates, state.metrics])

    // Combined breakdowns from ALL queries (for chart config in multi-query mode)
    // In merge mode, breakdowns are synced from Q1 so we use Q1's breakdowns
    // In concat mode, we also use Q1's breakdowns as the reference (they're usually shared)
    const allBreakdowns = useMemo(() => {
      if (!isMultiQueryMode) return state.breakdowns
      // Use Q1's breakdowns as the canonical source
      return queryStates[0]?.breakdowns || []
    }, [isMultiQueryMode, queryStates, state.breakdowns])

    // Build MultiQueryConfig for multi-query execution
    const multiQueryConfig = useMemo(() => {
      if (!isMultiQueryMode) return null

      // Filter to only valid queries (have measures or dimensions)
      const validQueries = allQueries.filter(q =>
        (q.measures && q.measures.length > 0) ||
        (q.dimensions && q.dimensions.length > 0) ||
        (q.timeDimensions && q.timeDimensions.length > 0)
      )

      if (validQueries.length < 2) return null

      return {
        queries: validQueries.map(q => cleanQueryForServer(q)),
        mergeStrategy,
        mergeKeys,
        queryLabels: validQueries.map((_, i) => `Q${i + 1}`)
      }
    }, [allQueries, isMultiQueryMode, mergeStrategy, mergeKeys])

    // Callback to clear resultsStale flag
    const handleResultsStaleChange = useCallback((stale: boolean) => {
      setState((prev) => ({ ...prev, resultsStale: stale }))
    }, [setState])

    // Use query execution hook for debouncing and result management
    const {
      executionStatus,
      executionResults,
      perQueryResults,
      isLoading,
      error,
      debouncedQuery,
      setDebouncedQuery,
      debounceTimerRef,
      isValidQuery,
      activeTableIndex,
      setActiveTableIndex,
      serverQuery
    } = useQueryExecution({
      currentQuery,
      allQueries,
      isMultiQueryMode,
      multiQueryConfig,
      mergeStrategy,
      mergeKeys,
      initialData,
      initialQuery,
      resultsStale: state.resultsStale,
      onResultsStaleChange: handleResultsStaleChange
    })

    // Chart configuration via hook (type, config, display, palette, smart defaulting)
    const {
      chartType,
      setChartType,
      chartConfig,
      setChartConfig,
      displayConfig,
      setDisplayConfig,
      localPaletteName,
      setLocalPaletteName,
      effectiveColorPalette,
      setUserManuallySelectedChart,
      chartAvailability
    } = useChartConfiguration({
      initialChartConfig,
      cachedStorage,
      initialQuery,
      externalColorPalette,
      allMetrics,
      allBreakdowns,
      debouncedQuery
    })

    // ========================================================================
    // Handler Hooks
    // ========================================================================

    // Metrics handlers (add, remove, select, reorder)
    const {
      handleAddMetric,
      handleRemoveMetric,
      handleFieldSelected,
      handleReorderMetrics
    } = useMetricsHandlers({
      setState,
      fieldModalMode,
      setShowFieldModal,
      setFieldModalMode
    })

    // Breakdowns handlers (add, remove, granularity, comparison, reorder)
    const {
      handleAddBreakdown,
      handleRemoveBreakdown,
      handleBreakdownGranularityChange,
      handleBreakdownComparisonToggle,
      handleReorderBreakdowns
    } = useBreakdownsHandlers({
      setState,
      setShowFieldModal,
      setFieldModalMode,
      mergeStrategy,
      activeQueryIndex,
      queryStates,
      setQueryStates,
      chartType,
      setChartType,
      setChartConfig,
      state
    })

    // Filters handlers (change, drop to filter, order)
    const {
      handleFiltersChange,
      handleDropFieldToFilter,
      handleOrderChange
    } = useFiltersHandlers({
      setState
    })

    // Multi-query handlers (add, remove, change, merge strategy)
    const {
      handleAddQuery,
      handleRemoveQuery,
      handleActiveQueryChange,
      handleMergeStrategyChange
    } = useMultiQueryHandlers({
      queryStates,
      setQueryStates,
      activeQueryIndex,
      setActiveQueryIndex,
      setMergeStrategy
    })

    // AI query generation hook
    const { features } = useCubeContext()
    const {
      aiState,
      handleOpenAI,
      handleCloseAI,
      handleAIPromptChange,
      handleGenerateAI,
      handleAcceptAI,
      handleCancelAI
    } = useAnalysisAI({
      state,
      setState,
      chartType,
      setChartType,
      chartConfig,
      setChartConfig,
      displayConfig,
      setDisplayConfig,
      setUserManuallySelectedChart,
      setActiveView,
      aiEndpoint: features?.aiEndpoint
    })

    // Share URL hook
    const {
      shareButtonState,
      handleShare
    } = useAnalysisShare({
      isValidQuery,
      queryStatesLength: queryStates.length,
      allQueries,
      currentQuery,
      mergeStrategy,
      mergeKeys: mergeKeys || undefined,
      chartType,
      chartConfig,
      displayConfig,
      activeView
    })

    // Save state to localStorage whenever it changes (if not disabled)
    // Deferred to avoid blocking renders
    useEffect(() => {
      if (disableLocalStorage) return

      // Defer to next tick to avoid blocking renders
      const timeoutId = setTimeout(() => {
        try {
          // Store both legacy format (for backward compatibility) and multi-query format
          const activeState = queryStates[activeQueryIndex] || createInitialState()
          const storageState: AnalysisBuilderStorageState = {
            // Legacy format (for backward compatibility with single-query)
            metrics: activeState.metrics,
            breakdowns: activeState.breakdowns,
            filters: activeState.filters,
            order: activeState.order,
            chartType,
            chartConfig,
            displayConfig,
            activeView,
            // Multi-query format (mergeKeys is computed from Q1 breakdowns, not stored)
            // queryStates already includes order per query
            queryStates: queryStates.length > 1 ? queryStates : undefined,
            activeQueryIndex: queryStates.length > 1 ? activeQueryIndex : undefined,
            mergeStrategy: queryStates.length > 1 ? mergeStrategy : undefined
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageState))
        } catch {
          // Failed to save to localStorage
        }
      }, 0)

      return () => clearTimeout(timeoutId)
    }, [
      queryStates,
      activeQueryIndex,
      mergeStrategy,
      chartType,
      chartConfig,
      displayConfig,
      activeView,
      disableLocalStorage
    ])

    // Call onQueryChange callback when query changes
    useEffect(() => {
      if (onQueryChange && isValidQuery) {
        onQueryChange(currentQuery)
      }
    }, [currentQuery, isValidQuery, onQueryChange])

    // Call onChartConfigChange callback when chart config changes
    useEffect(() => {
      if (onChartConfigChange) {
        onChartConfigChange({ chartType, chartConfig, displayConfig })
      }
    }, [chartType, chartConfig, displayConfig, onChartConfigChange])

    // Fetch dry-run data for debug tab
    // In multi-query mode, fetch debug data for ALL queries
    useEffect(() => {
      // Determine which queries to fetch debug for
      const queriesToFetch = isMultiQueryMode && multiQueryConfig
        ? multiQueryConfig.queries
        : (isValidQuery && serverQuery) ? [serverQuery] : []

      if (queriesToFetch.length === 0) {
        setDebugDataPerQuery([])
        return
      }

      let isCancelled = false

      const fetchDebugData = async () => {
        // Initialize loading state for all queries
        setDebugDataPerQuery(queriesToFetch.map(() => ({
          sql: null,
          analysis: null,
          loading: true,
          error: null
        })))

        // Fetch debug data for each query in parallel
        const results = await Promise.all(
          queriesToFetch.map(async (query) => {
            try {
              const result = await cubeApi.dryRun(query)
              return {
                sql: result.sql,
                analysis: result.analysis,
                loading: false,
                error: null
              }
            } catch (err) {
              return {
                sql: null,
                analysis: null,
                loading: false,
                error: err instanceof Error ? err.message : 'Failed to fetch debug info'
              }
            }
          })
        )

        if (!isCancelled) {
          setDebugDataPerQuery(results)
        }
      }

      fetchDebugData()

      return () => {
        isCancelled = true
      }
    }, [serverQuery, multiQueryConfig, cubeApi, isValidQuery, isMultiQueryMode])

    // Compute combined metrics from ALL queries (for chart config in multi-query mode)
    // Always returns an array (never undefined) for consistent prop passing
    const combinedMetrics = useMemo(() => {
      if (!isMultiQueryMode) return state.metrics

      const seen = new Set<string>()
      const combined: MetricItem[] = []

      for (let qIndex = 0; qIndex < queryStates.length; qIndex++) {
        const qs = queryStates[qIndex]
        for (const metric of qs.metrics) {
          // In multi-query mode, prefix with query label to distinguish
          const key = `Q${qIndex + 1}:${metric.field}`
          if (!seen.has(key)) {
            seen.add(key)
            combined.push({
              ...metric,
              // Keep original field but update label to show query source
              label: `${metric.label} (Q${qIndex + 1})`
            })
          }
        }
      }
      return combined
    }, [isMultiQueryMode, queryStates, state.metrics])

    // Compute combined breakdowns from ALL queries (for chart config in multi-query mode)
    // Always returns an array (never undefined) for consistent prop passing
    const combinedBreakdowns = useMemo(() => {
      if (!isMultiQueryMode) return state.breakdowns

      const seen = new Set<string>()
      const combined: BreakdownItem[] = []

      for (const qs of queryStates) {
        for (const breakdown of qs.breakdowns) {
          // Deduplicate by field (breakdowns are usually shared across queries)
          if (!seen.has(breakdown.field)) {
            seen.add(breakdown.field)
            combined.push(breakdown)
          }
        }
      }
      return combined
    }, [isMultiQueryMode, queryStates, state.breakdowns])

    // ========================================================================
    // Clear Query
    // ========================================================================

    const handleClearQuery = useCallback(() => {
      // In multi-query mode, only clear the active query
      // If user wants to clear all queries, they should remove tabs
      // createInitialState() already sets order: undefined
      setState(createInitialState())
      setUserManuallySelectedChart(false)
      // Also reset chart type, config, and display config
      setChartType('line')
      setChartConfig({})
      setDisplayConfig({ showLegend: true, showGrid: true, showTooltip: true })
      // Clear the debounced query immediately to stop showing old results
      setDebouncedQuery(null)
      // Also clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }, [setState])

    // Handle chart type change - track that user manually selected this
    const handleChartTypeChange = useCallback((type: ChartType) => {
      // If switching away from 'line', clear any comparison from time dimensions first
      // (comparison only works with line charts)
      // Do this before other updates so React 18 batches them together
      if (type !== 'line') {
        const hasComparison = state.breakdowns.some(b => b.isTimeDimension && b.enableComparison)
        if (hasComparison) {
          setState((prev) => ({
            ...prev,
            breakdowns: prev.breakdowns.map((b) =>
              b.isTimeDimension && b.enableComparison
                ? { ...b, enableComparison: false }
                : b
            ),
            resultsStale: true
          }))
        }
      }

      setChartType(type)
      setUserManuallySelectedChart(true)

      // Update chart config for the new chart type
      const { chartConfig: newChartConfig } = getSmartChartDefaults(
        state.metrics,
        state.breakdowns,
        type
      )
      setChartConfig(newChartConfig)
      // Switch to chart view so user can see the changes
      setActiveView('chart')
    }, [state.metrics, state.breakdowns])

    // Handle chart config change - also switch to chart view
    const handleChartConfigChange = useCallback((config: ChartAxisConfig) => {
      setChartConfig(config)
      // Switch to chart view so user can see the changes
      setActiveView('chart')
    }, [])

    // Handle display config change - also switch to chart view
    const handleDisplayConfigChange = useCallback((config: ChartDisplayConfig) => {
      setDisplayConfig(config)
      // Switch to chart view so user can see the changes
      setActiveView('chart')
    }, [])

    // ========================================================================
    // Expose API via ref
    // ========================================================================

    useImperativeHandle(
      ref,
      () => ({
        getQueryConfig: () => {
          // If multiple queries, return MultiQueryConfig format
          if (queryStates.length > 1) {
            return {
              queries: allQueries,
              mergeStrategy,
              mergeKeys,
              queryLabels: queryStates.map((_, i) => `Q${i + 1}`)
            }
          }
          // Single query, return CubeQuery format
          return currentQuery
        },
        getChartConfig: () => ({ chartType, chartConfig, displayConfig }),
        executeQuery: () => {
          // TODO: Implement manual execute
        },
        clearQuery: handleClearQuery
      }),
      [currentQuery, allQueries, queryStates.length, mergeStrategy, mergeKeys, chartType, chartConfig, displayConfig, handleClearQuery]
    )

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <div
        className={`flex flex-col lg:flex-row bg-dc-surface border-x border-b border-dc-border ${maxHeight ? 'lg:h-[var(--dc-max-h)] lg:max-h-[var(--dc-max-h)] lg:overflow-hidden' : 'lg:h-full'} ${className}`}
        style={maxHeight ? { ['--dc-max-h' as string]: maxHeight } : undefined}
      >
        {/* Top/Left Panel - Results */}
        <div className="h-[60vh] lg:h-auto lg:flex-1 min-w-0 border-b lg:border-b-0 lg:border-r border-dc-border overflow-auto flex flex-col">
          {/* AI Panel - expands above results when open */}
          {aiState.isOpen && (
            <AnalysisAIPanel
              userPrompt={aiState.userPrompt}
              onPromptChange={handleAIPromptChange}
              isGenerating={aiState.isGenerating}
              error={aiState.error}
              hasGeneratedQuery={aiState.hasGeneratedQuery}
              onGenerate={handleGenerateAI}
              onAccept={handleAcceptAI}
              onCancel={handleCancelAI}
            />
          )}

          {/* Results Panel */}
          <div className="flex-1 overflow-auto">
            <AnalysisResultsPanel
              executionStatus={executionStatus}
              executionResults={executionResults}
              executionError={error?.message || null}
              totalRowCount={null}
              resultsStale={isLoading && executionResults !== null}
              chartType={chartType}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              colorPalette={effectiveColorPalette}
              // Only show palette selector in standalone mode (not when editing portlet)
              currentPaletteName={!externalColorPalette ? localPaletteName : undefined}
              onColorPaletteChange={!externalColorPalette ? setLocalPaletteName : undefined}
              allQueries={allQueries}
              schema={meta as MetaResponse | null}
              activeView={activeView}
              onActiveViewChange={setActiveView}
              displayLimit={displayLimit}
              onDisplayLimitChange={setDisplayLimit}
              hasMetrics={state.metrics.length > 0}
              // Debug props - per-query debug data for multi-query mode
              debugDataPerQuery={debugDataPerQuery}
              // Share props
              onShareClick={handleShare}
              canShare={isValidQuery}
              shareButtonState={shareButtonState}
              // Clear props
              onClearClick={handleClearQuery}
              canClear={state.metrics.length > 0 || state.breakdowns.length > 0 || state.filters.length > 0}
              // AI props
              enableAI={features?.enableAI !== false}
              isAIOpen={aiState.isOpen}
              onAIToggle={aiState.isOpen ? handleCloseAI : handleOpenAI}
              // Multi-query props
              queryCount={queryStates.length}
              perQueryResults={perQueryResults}
              activeTableIndex={activeTableIndex}
              onActiveTableChange={setActiveTableIndex}
            />
          </div>
        </div>

        {/* Bottom/Right Panel - Query Builder */}
        <div className="w-full lg:w-96 flex-shrink-0 lg:h-full overflow-auto lg:overflow-hidden">
          <AnalysisQueryPanel
            metrics={state.metrics}
            breakdowns={state.breakdowns}
            filters={state.filters}
            schema={meta as MetaResponse | null}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            onAddMetric={handleAddMetric}
            onRemoveMetric={handleRemoveMetric}
            onReorderMetrics={handleReorderMetrics}
            onAddBreakdown={handleAddBreakdown}
            onRemoveBreakdown={handleRemoveBreakdown}
            onBreakdownGranularityChange={handleBreakdownGranularityChange}
            onBreakdownComparisonToggle={handleBreakdownComparisonToggle}
            onReorderBreakdowns={handleReorderBreakdowns}
            onFiltersChange={handleFiltersChange}
            onDropFieldToFilter={handleDropFieldToFilter}
            order={state.order}
            onOrderChange={handleOrderChange}
            chartType={chartType}
            chartConfig={chartConfig}
            displayConfig={displayConfig}
            colorPalette={effectiveColorPalette}
            chartAvailability={chartAvailability}
            onChartTypeChange={handleChartTypeChange}
            onChartConfigChange={handleChartConfigChange}
            onDisplayConfigChange={handleDisplayConfigChange}
            validationStatus={state.validationStatus}
            validationError={state.validationError}
            // Multi-query props
            queryCount={queryStates.length}
            activeQueryIndex={activeQueryIndex}
            mergeStrategy={mergeStrategy}
            onActiveQueryChange={handleActiveQueryChange}
            onAddQuery={handleAddQuery}
            onRemoveQuery={handleRemoveQuery}
            onMergeStrategyChange={handleMergeStrategyChange}
            breakdownsLocked={mergeStrategy === 'merge' && activeQueryIndex > 0}
            combinedMetrics={combinedMetrics}
            combinedBreakdowns={combinedBreakdowns}
            multiQueryValidation={multiQueryValidation}
          />
        </div>

        {/* Field Search Modal */}
        <FieldSearchModal
          isOpen={showFieldModal}
          onClose={() => setShowFieldModal(false)}
          onSelect={handleFieldSelected}
          mode={fieldModalMode}
          schema={meta as MetaResponse | null}
          selectedFields={[
            ...state.metrics.map((m) => m.field),
            ...state.breakdowns.map((b) => b.field)
          ]}
        />
      </div>
    )
  }
)

AnalysisBuilder.displayName = 'AnalysisBuilder'

export default AnalysisBuilder

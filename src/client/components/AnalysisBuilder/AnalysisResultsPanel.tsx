/**
 * AnalysisResultsPanel Component
 *
 * Displays query execution results with chart and table views.
 * Used in the left panel of AnalysisBuilder.
 */

import { useState, useEffect, useMemo, memo, useRef } from 'react'
import type { AnalysisResultsPanelProps } from './types'
import { LazyChart, isValidChartType } from '../../charts/ChartLoader'
import { getIcon } from '../../icons'
import { QueryAnalysisPanel, CodeBlock } from '../../shared'
import ConfirmModal from '../ConfirmModal'
import ColorPaletteSelector from '../ColorPaletteSelector'
import { useExplainQuery } from '../../hooks/queries/useExplainQuery'
import { useExplainAI } from '../../hooks/queries/useExplainAI'
import type { CubeQuery } from '../../types'
import { ExecutionPlanPanel } from './ExecutionPlanPanel'

/**
 * AnalysisResultsPanel displays query results with chart/table toggle.
 *
 * Features:
 * - Chart visualization with LazyChart
 * - Table view with DataTable
 * - Loading, error, and empty states
 * - Stale results indicator
 * - Display limit control for tables
 */
const AnalysisResultsPanel = memo(function AnalysisResultsPanel({
  executionStatus,
  executionResults,
  executionError,
  totalRowCount,
  resultsStale = false,
  chartType = 'line',
  chartConfig = {},
  displayConfig = {},
  colorPalette,
  currentPaletteName,
  onColorPaletteChange,
  allQueries,
  funnelExecutedQueries,
  activeView = 'chart',
  onActiveViewChange,
  displayLimit = 100,
  onDisplayLimitChange,
  hasMetrics = false,
  // Debug props - per-query for multi-query mode
  debugDataPerQuery = [],
  // Share props
  onShareClick,
  canShare = false,
  shareButtonState = 'idle',
  // Refresh functionality
  onRefreshClick,
  canRefresh = false,
  isRefreshing = false,
  needsRefresh = false,
  // Clear functionality
  onClearClick,
  canClear = false,
  // AI functionality
  enableAI = false,
  isAIOpen = false,
  onAIToggle,
  // Multi-query props
  queryCount = 1,
  perQueryResults,
  activeTableIndex = 0,
  onActiveTableChange,
  // Analysis type (new) - primary way to detect funnel mode
  analysisType,
  // Legacy funnel mode prop (deprecated - use analysisType === 'funnel' instead)
  isFunnelMode: isFunnelModeProp = false,
  // Funnel-specific debug props
  funnelServerQuery,
  funnelDebugData,
  // Flow-specific debug props
  flowServerQuery,
  flowDebugData,
  // Retention-specific props
  retentionServerQuery,
  retentionDebugData,
  retentionChartData,
  retentionValidation
}: AnalysisResultsPanelProps) {
  // Determine funnel mode from analysisType (preferred) or legacy prop
  const isFunnelMode = analysisType === 'funnel' || isFunnelModeProp
  // Determine flow mode from analysisType
  const isFlowMode = analysisType === 'flow'
  // Determine retention mode from analysisType
  const isRetentionMode = analysisType === 'retention'
  // Debug view toggle state
  const [showDebug, setShowDebug] = useState(false)
  // Active debug query tab (independent of main query tabs)
  const [activeDebugIndex, setActiveDebugIndex] = useState(0)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  // Track shift key + hover state for cache bust visual feedback
  const [isShiftHeld, setIsShiftHeld] = useState(false)
  const [isHoveringRefresh, setIsHoveringRefresh] = useState(false)

  // Listen for shift key up/down to show visual feedback on refresh button (only when hovering)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Show warning styling only when hovering AND shift is held
  const showCacheBustIndicator = isShiftHeld && isHoveringRefresh

  // Clamp activeDebugIndex when queries are removed
  useEffect(() => {
    if (debugDataPerQuery.length > 0 && activeDebugIndex >= debugDataPerQuery.length) {
      setActiveDebugIndex(debugDataPerQuery.length - 1)
    }
  }, [debugDataPerQuery.length, activeDebugIndex])

  // Get current debug data based on active index
  const currentDebugData = debugDataPerQuery[activeDebugIndex] || {
    sql: null,
    analysis: null,
    loading: false,
    error: null
  }
  const debugSql = currentDebugData.sql
  const debugAnalysis = currentDebugData.analysis
  const debugLoading = currentDebugData.loading
  const debugError = currentDebugData.error
  // Get the query for the active debug tab
  // In funnel mode, prefer showing the executed queries which include:
  // - The binding key dimension (auto-added)
  // - The IN filter for steps 2+ (with values from previous step)
  const debugQuery = funnelExecutedQueries?.[activeDebugIndex] ?? allQueries?.[activeDebugIndex] ?? null

  // Determine if we're showing funnel executed queries (for visual indicator)
  const isShowingFunnelQuery = Boolean(funnelExecutedQueries?.length && funnelExecutedQueries[activeDebugIndex])

  // EXPLAIN PLAN hook - for standard query mode
  // Uses the current active debug query
  const {
    explainResult,
    isLoading: explainLoading,
    hasRun: explainHasRun,
    error: explainError,
    runExplain,
    clearExplain,
  } = useExplainQuery(debugQuery as CubeQuery | null, {
    skip: isFunnelMode || isFlowMode || isRetentionMode || !debugQuery,
  })

  // EXPLAIN PLAN hook - for funnel mode
  const {
    explainResult: funnelExplainResult,
    isLoading: funnelExplainLoading,
    hasRun: funnelExplainHasRun,
    error: funnelExplainError,
    runExplain: runFunnelExplain,
    clearExplain: clearFunnelExplain,
  } = useExplainQuery(funnelServerQuery, {
    skip: !isFunnelMode || !funnelServerQuery,
  })

  // EXPLAIN PLAN hook - for flow mode
  const {
    explainResult: flowExplainResult,
    isLoading: flowExplainLoading,
    hasRun: flowExplainHasRun,
    error: flowExplainError,
    runExplain: runFlowExplain,
    clearExplain: clearFlowExplain,
  } = useExplainQuery(flowServerQuery, {
    skip: !isFlowMode || !flowServerQuery,
  })

  // EXPLAIN PLAN hook - for retention mode
  const {
    explainResult: retentionExplainResult,
    isLoading: retentionExplainLoading,
    hasRun: retentionExplainHasRun,
    error: retentionExplainError,
    runExplain: runRetentionExplain,
    // clearExplain: clearRetentionExplain, - unused for now
  } = useExplainQuery(retentionServerQuery, {
    skip: !isRetentionMode || !retentionServerQuery,
  })

  // AI Analysis hook for EXPLAIN plans
  const {
    analysis: aiAnalysis,
    isAnalyzing: aiAnalysisLoading,
    error: aiAnalysisError,
    analyze: runAIAnalysis,
    clearAnalysis: clearAIAnalysis,
  } = useExplainAI()

  // Clear explain results when the active debug query changes
  useEffect(() => {
    clearExplain()
  }, [activeDebugIndex, clearExplain])

  // Clear funnel explain results when funnel query changes
  useEffect(() => {
    clearFunnelExplain()
  }, [funnelServerQuery, clearFunnelExplain])

  // Clear flow explain results when flow query changes
  useEffect(() => {
    clearFlowExplain()
  }, [flowServerQuery, clearFlowExplain])

  // Track if this effect has run once - skip forcing table view on the first run
  // to allow share URLs and portlet configs to restore their saved view
  const isFirstRunRef = useRef(true)

  // Force table view when no metrics are selected (only for query mode)
  // In funnel mode, we allow chart view even during loading since funnel charts
  // don't require traditional "metrics" - they have funnel steps instead
  useEffect(() => {
    // Skip on first run to allow share/portlet state to load first
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      return
    }

    // Don't force table view in funnel, flow, or retention mode - they work differently
    // Check both analysisType directly AND computed isFunnelMode to avoid stale closure issues
    if (analysisType === 'funnel' || analysisType === 'flow' || analysisType === 'retention' || isFunnelMode) return

    if (!hasMetrics && activeView === 'chart') {
      onActiveViewChange('table')
    }
  }, [hasMetrics, activeView, onActiveViewChange, isFunnelMode, analysisType])

  // Create a combined query object for the chart (includes measures from ALL queries)
  const combinedQueryForChart = useMemo(() => {
    if (!allQueries || allQueries.length === 0) return undefined
    if (allQueries.length === 1) return allQueries[0]

    // Combine measures from all queries, dimensions are shared (from Q1)
    const allMeasures = allQueries.flatMap(q => q?.measures || [])
    return {
      ...allQueries[0],
      measures: allMeasures
    }
  }, [allQueries])

  // Icons
  const SuccessIcon = getIcon('success')
  const ErrorIcon = getIcon('error')
  const WarningIcon = getIcon('warning')
  const TableIcon = getIcon('table')
  const ChartIcon = getIcon('measure')
  const CodeIcon = getIcon('codeBracket')
  const ShareIcon = getIcon('share')
  const CheckIcon = getIcon('check')
  const TrashIcon = getIcon('delete')
  const SparklesIcon = getIcon('sparkles')
  const RefreshIcon = getIcon('arrowPath')

  // Loading state - initial load
  const renderLoading = () => (
    <div className="dc:h-full dc:flex dc:items-center dc:justify-center">
      <div className="text-center">
        <div
          className="dc:animate-spin dc:rounded-full dc:h-12 dc:w-12 dc:border-b-2 dc:mx-auto dc:mb-4"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1">
          Executing Query...
        </div>
        <div className="dc:text-xs text-dc-text-muted">
          Running your query against the cube API
        </div>
      </div>
    </div>
  )

  // Error state - no previous results
  const renderError = () => (
    <div className="dc:h-full dc:flex dc:flex-col">
      {renderHeader()}
      <div className="dc:flex-1 dc:flex dc:items-center dc:justify-center dc:p-4">
        {showDebug ? (
          <div className="dc:w-full dc:h-full dc:overflow-auto">
            {renderDebug()}
          </div>
        ) : (
          <div className="text-center dc:max-w-md">
            <ErrorIcon className="dc:w-12 dc:h-12 dc:mx-auto text-dc-error dc:mb-4" />
            <div className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">
              Query Execution Failed
            </div>
            <div className="dc:text-sm text-dc-text-secondary dc:mb-4">
              There was an error executing your query. Please check the query and try again.
            </div>
            {executionError && (
              <div className="bg-dc-danger-bg dc:border border-dc-error dc:rounded-lg dc:p-3 text-left">
                <div className="dc:text-xs font-mono text-dc-error dc:break-words">
                  {executionError}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // Check if any query has content (pending execution)
  const hasQueryContent = !!(allQueries?.some(q =>
    (q?.measures && q.measures.length > 0) ||
    (q?.dimensions && q.dimensions.length > 0) ||
    (q?.timeDimensions && q.timeDimensions.length > 0)
  ))

  // Determine if current mode has valid pending content (mode-specific)
  // This is used to decide whether to show "Preparing Query..." or "No Results Yet"
  const hasModeSpecificContent = useMemo(() => {
    if (isRetentionMode) {
      // Retention mode: need valid server query (cube + binding key + time dimension configured)
      return retentionServerQuery !== null
    }
    if (isFunnelMode) {
      // Funnel mode: need valid server query
      return funnelServerQuery !== null
    }
    if (isFlowMode) {
      // Flow mode: need valid server query
      return flowServerQuery !== null
    }
    // Query mode: standard check for measures/dimensions/timeDimensions
    return hasQueryContent
  }, [isRetentionMode, isFunnelMode, isFlowMode, retentionServerQuery, funnelServerQuery, flowServerQuery, hasQueryContent])

  // Waiting state - query built but not yet executed (debounce period)
  const renderWaiting = () => (
    <div className="dc:h-full dc:flex dc:items-center dc:justify-center">
      <div className="text-center">
        <div
          className="dc:animate-spin dc:rounded-full dc:h-12 dc:w-12 dc:border-b-2 dc:mx-auto dc:mb-4"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1">
          Preparing Query...
        </div>
        <div className="dc:text-xs text-dc-text-muted">
          Your query will execute shortly
        </div>
      </div>
    </div>
  )

  // Manual refresh mode - query ready but needs user to click refresh
  const renderNeedsRefreshEmpty = () => (
    <div className="dc:h-full dc:flex dc:items-center dc:justify-center">
      <div className="text-center">
        <svg className="dc:w-12 dc:h-12 dc:mx-auto text-dc-warning dc:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <div className="dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1">
          Ready to Execute
        </div>
        <div className="dc:text-xs text-dc-text-muted dc:mb-4">
          Click refresh to run your query
        </div>
        {onRefreshClick && (
          <button
            onClick={() => onRefreshClick()}
            className="dc:inline-flex dc:items-center dc:gap-2 dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-white bg-dc-accent dc:hover:opacity-90 dc:rounded-lg dc:transition-colors dc:shadow-sm"
          >
            <svg className="dc:w-4 dc:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Run Query
          </button>
        )}
      </div>
    </div>
  )

  // Empty state - no query built yet
  // Shows mode-specific guidance based on analysis type
  const renderEmpty = () => {
    // Mode-specific empty message
    let emptyMessage = 'Add metrics or breakdowns from the panel on the right to see results'
    if (isRetentionMode) {
      emptyMessage = 'Select a cube and configure retention settings to see results'
    } else if (isFunnelMode) {
      emptyMessage = 'Add funnel steps to see conversion analysis'
    } else if (isFlowMode) {
      emptyMessage = 'Configure flow analysis to see user journey paths'
    }

    return (
      <div className="dc:h-full dc:flex dc:items-center dc:justify-center dc:pt-6">
        <div className="text-center dc:mb-16">
          <ChartIcon className="dc:w-12 dc:h-12 dc:mx-auto text-dc-text-muted dc:mb-3" />
          <div className="dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1">
            No Results Yet
          </div>
          <div className="dc:text-xs text-dc-text-muted dc:mb-4">
            {emptyMessage}
          </div>
          {/* Prominent AI button when enabled (only for query mode) */}
          {enableAI && onAIToggle && !isRetentionMode && !isFunnelMode && !isFlowMode && (
            <button
              onClick={onAIToggle}
              className="dc:inline-flex dc:items-center dc:gap-2 dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-white bg-dc-accent hover:bg-dc-accent dc:rounded-lg dc:transition-colors dc:shadow-sm"
            >
              <SparklesIcon className="dc:w-4 dc:h-4" />
              Analyse with AI
            </button>
          )}
        </div>
      </div>
    )
  }

  // No data returned state
  const renderNoData = () => (
    <div className="dc:h-full dc:flex dc:items-center dc:justify-center">
      <div className="text-center">
        <SuccessIcon className="dc:w-12 dc:h-12 dc:mx-auto text-dc-success dc:mb-3" />
        <div className="dc:text-sm dc:font-semibold text-dc-text dc:mb-1">
          Query Successful
        </div>
        <div className="dc:text-xs text-dc-text-muted">
          No data returned from the query
        </div>
      </div>
    </div>
  )

  // Render chart
  const renderChart = () => {
    if (!executionResults || executionResults.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted">
          <div className="text-center">
            <ChartIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">No data to display</div>
            <div className="dc:text-xs">Run a query to see chart visualization</div>
          </div>
        </div>
      )
    }

    // Determine effective chart type (handles sankey/sunburst toggle)
    const effectiveChartType = chartType === 'sankey' &&
      (displayConfig as Record<string, unknown>)?.flowVisualization === 'sunburst'
        ? 'sunburst'
        : chartType

    if (!isValidChartType(effectiveChartType)) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted">
          <div className="text-center">
            <WarningIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">Unsupported chart type</div>
            <div className="dc:text-xs">{effectiveChartType}</div>
          </div>
        </div>
      )
    }

    // For retention mode, use retentionChartData which is already transformed
    // into the cohort × period matrix format expected by RetentionHeatmap
    // Cast to any[] since LazyChart expects array type but RetentionHeatmap handles the object format
    const chartData = isRetentionMode && retentionChartData
      ? (retentionChartData as unknown as any[])
      : executionResults

    return (
      <LazyChart
        chartType={effectiveChartType}
        data={chartData}
        chartConfig={chartConfig}
        displayConfig={displayConfig}
        colorPalette={colorPalette}
        queryObject={combinedQueryForChart}
        height="100%"
        fallback={
          <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
            <div className="dc:animate-pulse bg-dc-surface-secondary dc:rounded dc:w-full dc:h-full" />
          </div>
        }
      />
    )
  }

  // Type for funnel metadata
  interface FunnelMetadata {
    stepCount: number
    steps: Array<{
      index: number
      name: string
      timeToConvert?: string
      cube?: string
    }>
    bindingKey: unknown
    timeDimension: unknown
  }

  // Render debug view for funnel mode (unified single query view)
  const renderFunnelDebug = () => {
    const funnelSql = funnelDebugData?.sql
    const funnelLoading = funnelDebugData?.loading || false
    const funnelError = funnelDebugData?.error
    const funnelMeta = funnelDebugData?.funnelMetadata as FunnelMetadata | undefined

    return (
      <div className="dc:p-4 dc:space-y-4 dc:overflow-auto dc:h-full">
        {/* Funnel Mode Header */}
        <div className="dc:flex dc:items-center dc:gap-2 dc:mb-4">
          <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-accent text-white dc:rounded">Funnel Query</span>
          {funnelMeta?.stepCount && (
            <span className="dc:text-xs text-dc-text-muted">
              {funnelMeta.stepCount} steps
            </span>
          )}
          {funnelLoading && (
            <span className="dc:text-xs text-dc-text-muted dc:animate-pulse">Loading SQL...</span>
          )}
        </div>

        {/* Execution Error Banner (if any) */}
        {executionError && (
          <div className="bg-dc-danger-bg dark:bg-dc-danger-bg dc:border border-dc-error dark:border-dc-error dc:rounded dc:p-3">
            <h4 className="dc:text-sm dc:font-semibold text-dc-error dark:text-dc-error dc:mb-1">
              Execution Error
            </h4>
            <p className="dc:text-sm text-dc-error dark:text-dc-error">{executionError}</p>
          </div>
        )}

        {/* Funnel Server Query - full width */}
        <div>
          {funnelServerQuery ? (
            <CodeBlock
              code={JSON.stringify(funnelServerQuery, null, 2)}
              language="json"
              title="Funnel Server Query"
              height="16rem"
            />
          ) : (
            <>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Funnel Server Query</h4>
              <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto">
                No funnel query configured
              </div>
            </>
          )}
        </div>

        {/* Generated SQL with Explain Plan and AI Analysis - full width */}
        <ExecutionPlanPanel
          sql={funnelSql}
          sqlLoading={funnelLoading}
          sqlError={funnelError}
          sqlPlaceholder="Configure funnel binding key to generate SQL"
          explainResult={funnelExplainResult}
          explainLoading={funnelExplainLoading}
          explainHasRun={funnelExplainHasRun}
          explainError={funnelExplainError}
          runExplain={runFunnelExplain}
          aiAnalysis={aiAnalysis}
          aiAnalysisLoading={aiAnalysisLoading}
          aiAnalysisError={aiAnalysisError}
          runAIAnalysis={runAIAnalysis}
          clearAIAnalysis={clearAIAnalysis}
          enableAI={enableAI}
          query={funnelServerQuery}
          title="Generated SQL"
          height="16rem"
        />

        {/* Funnel Metadata (step info) */}
        {funnelMeta && (
          <div>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Funnel Steps</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3">
              <div className="dc:flex dc:flex-wrap dc:gap-2">
                {funnelMeta.steps.map((step, idx) => (
                  <div key={idx} className="dc:flex dc:items-center dc:gap-2 dc:px-3 dc:py-1.5 bg-dc-bg dc:border border-dc-border dc:rounded dc:text-sm">
                    <span className="dc:w-5 dc:h-5 dc:flex dc:items-center dc:justify-center bg-dc-accent text-white dc:text-xs dc:rounded-full">
                      {idx + 1}
                    </span>
                    <span className="text-dc-text">{step.name}</span>
                    {step.timeToConvert && (
                      <span className="dc:text-xs text-dc-text-muted">({step.timeToConvert})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart Config & Display Config in 2 columns */}
        <div className="dc:grid dc:grid-cols-1 dc:md:grid-cols-2 dc:gap-4">
          <div>
            <CodeBlock
              code={JSON.stringify(chartConfig, null, 2)}
              language="json"
              title="Chart Config"
              height="16rem"
            />
          </div>
          <div>
            <CodeBlock
              code={JSON.stringify(displayConfig, null, 2)}
              language="json"
              title="Display Config"
              height="16rem"
            />
          </div>
        </div>

        {/* Server Response - full width */}
        <div>
          {executionResults ? (
            <CodeBlock
              code={JSON.stringify(executionResults, null, 2)}
              language="json"
              title={`Server Response (${executionResults.length} rows)`}
              maxHeight="24rem"
            />
          ) : (
            <>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Server Response</h4>
              <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
                No results yet
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Render debug view for flow mode (unified single query view)
  const renderFlowDebug = () => {
    const flowSql = flowDebugData?.sql
    const flowLoading = flowDebugData?.loading || false
    const flowError = flowDebugData?.error
    const flowMeta = flowDebugData?.flowMetadata as {
      stepsBefore?: number
      stepsAfter?: number
      bindingKey?: unknown
      timeDimension?: unknown
      eventDimension?: string
      startingStep?: { name?: string; filter?: unknown }
    } | undefined

    return (
      <div className="dc:p-4 dc:space-y-4 dc:overflow-auto dc:h-full">
        {/* Flow Mode Header */}
        <div className="dc:flex dc:items-center dc:gap-2 dc:mb-4">
          <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-accent text-white dc:rounded">Flow Query</span>
          {flowMeta && (
            <span className="dc:text-xs text-dc-text-muted">
              {flowMeta.stepsBefore} before, {flowMeta.stepsAfter} after
            </span>
          )}
          {flowLoading && (
            <span className="dc:text-xs text-dc-text-muted dc:animate-pulse">Loading SQL...</span>
          )}
        </div>

        {/* Execution Error Banner (if any) */}
        {executionError && (
          <div className="bg-dc-danger-bg dark:bg-dc-danger-bg dc:border border-dc-error dark:border-dc-error dc:rounded dc:p-3">
            <h4 className="dc:text-sm dc:font-semibold text-dc-error dark:text-dc-error dc:mb-1">
              Execution Error
            </h4>
            <p className="dc:text-sm text-dc-error dark:text-dc-error">{executionError}</p>
          </div>
        )}

        {/* Flow Server Query - full width */}
        <div>
          {flowServerQuery ? (
            <CodeBlock
              code={JSON.stringify(flowServerQuery, null, 2)}
              language="json"
              title="Flow Server Query"
              height="16rem"
            />
          ) : (
            <>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Flow Server Query</h4>
              <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto">
                No flow query configured
              </div>
            </>
          )}
        </div>

        {/* Generated SQL with Explain Plan and AI Analysis - full width */}
        <ExecutionPlanPanel
          sql={flowSql}
          sqlLoading={flowLoading}
          sqlError={flowError}
          sqlPlaceholder="Configure flow to generate SQL"
          explainResult={flowExplainResult}
          explainLoading={flowExplainLoading}
          explainHasRun={flowExplainHasRun}
          explainError={flowExplainError}
          runExplain={runFlowExplain}
          aiAnalysis={aiAnalysis}
          aiAnalysisLoading={aiAnalysisLoading}
          aiAnalysisError={aiAnalysisError}
          runAIAnalysis={runAIAnalysis}
          clearAIAnalysis={clearAIAnalysis}
          enableAI={enableAI}
          query={flowServerQuery}
          title="Generated SQL"
          height="16rem"
        />

        {/* Flow Metadata */}
        {flowMeta && (
          <div>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Flow Configuration</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3">
              <div className="dc:grid dc:grid-cols-2 dc:gap-4 dc:text-sm">
                <div>
                  <span className="text-dc-text-muted">Starting Step:</span>{' '}
                  <span className="text-dc-text">{flowMeta.startingStep?.name || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-dc-text-muted">Event Dimension:</span>{' '}
                  <span className="text-dc-text">{flowMeta.eventDimension || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-dc-text-muted">Steps Before:</span>{' '}
                  <span className="text-dc-text">{flowMeta.stepsBefore ?? 'Not set'}</span>
                </div>
                <div>
                  <span className="text-dc-text-muted">Steps After:</span>{' '}
                  <span className="text-dc-text">{flowMeta.stepsAfter ?? 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Config & Display Config in 2 columns */}
        <div className="dc:grid dc:grid-cols-1 dc:md:grid-cols-2 dc:gap-4">
          <div>
            <CodeBlock
              code={JSON.stringify(chartConfig, null, 2)}
              language="json"
              title="Chart Config"
              height="16rem"
            />
          </div>
          <div>
            <CodeBlock
              code={JSON.stringify(displayConfig, null, 2)}
              language="json"
              title="Display Config"
              height="16rem"
            />
          </div>
        </div>

        {/* Server Response - full width */}
        <div>
          {executionResults ? (
            <CodeBlock
              code={JSON.stringify(executionResults, null, 2)}
              language="json"
              title="Server Response (Sankey Data)"
              maxHeight="24rem"
            />
          ) : (
            <>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Server Response</h4>
              <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
                No results yet
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Render debug view for retention mode (cohort retention analysis)
  const renderRetentionDebug = () => {
    const retentionSql = retentionDebugData?.sql
    const retentionLoading = retentionDebugData?.loading || false
    const retentionError = retentionDebugData?.error
    const retentionMeta = retentionDebugData?.retentionMetadata as {
      totalUsers?: number
      segmentCount?: number
      periods?: number
      granularity?: string
      retentionType?: string
    } | undefined

    return (
      <div className="dc:p-4 dc:space-y-4 dc:overflow-auto dc:h-full">
        {/* Retention Mode Header */}
        <div className="dc:flex dc:items-center dc:gap-2 dc:mb-4">
          <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-accent text-white dc:rounded">Retention Query</span>
          {retentionMeta && (
            <span className="dc:text-xs text-dc-text-muted">
              {retentionMeta.segmentCount || 1} segment(s), {retentionMeta.totalUsers} users
            </span>
          )}
          {retentionLoading && (
            <span className="dc:text-xs text-dc-text-muted dc:animate-pulse">Loading SQL...</span>
          )}
        </div>

        {/* Execution Error Banner (if any) */}
        {executionError && (
          <div className="bg-dc-danger-bg dark:bg-dc-danger-bg dc:border border-dc-error dark:border-dc-error dc:rounded dc:p-3">
            <h4 className="dc:text-sm dc:font-semibold text-dc-error dark:text-dc-error dc:mb-1">
              Execution Error
            </h4>
            <p className="dc:text-sm text-dc-error dark:text-dc-error">{executionError}</p>
          </div>
        )}

        {/* Retention Server Query - full width */}
        <div>
          {retentionServerQuery ? (
            <CodeBlock
              code={JSON.stringify(retentionServerQuery, null, 2)}
              language="json"
              title="Retention Server Query"
              height="16rem"
            />
          ) : (
            <>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Retention Server Query</h4>
              <div className="bg-dc-warning-bg dc:border border-dc-warning dc:rounded dc:p-3 dc:text-sm dc:h-64 dc:overflow-auto">
                <div className="text-dc-warning dc:font-medium dc:mb-2">Configuration Incomplete</div>
                {retentionValidation && retentionValidation.errors.length > 0 ? (
                  <ul className="list-disc dc:list-inside text-dc-text-secondary dc:space-y-1">
                    {retentionValidation.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-dc-text-muted">Configure the retention analysis settings to generate a query.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Generated SQL with Explain Plan and AI Analysis - full width */}
        <ExecutionPlanPanel
          sql={retentionSql}
          sqlLoading={retentionLoading}
          sqlError={retentionError}
          sqlPlaceholder="Configure retention to generate SQL"
          explainResult={retentionExplainResult}
          explainLoading={retentionExplainLoading}
          explainHasRun={retentionExplainHasRun}
          explainError={retentionExplainError}
          runExplain={runRetentionExplain}
          aiAnalysis={aiAnalysis}
          aiAnalysisLoading={aiAnalysisLoading}
          aiAnalysisError={aiAnalysisError}
          runAIAnalysis={runAIAnalysis}
          clearAIAnalysis={clearAIAnalysis}
          enableAI={enableAI}
          query={retentionServerQuery}
          title="Generated SQL"
          height="16rem"
        />

        {/* Retention Metadata */}
        {retentionMeta && (
          <div>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Retention Configuration</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3">
              <div className="dc:grid dc:grid-cols-2 dc:gap-4 dc:text-sm">
                <div>
                  <span className="text-dc-text-muted">Retention Type:</span>{' '}
                  <span className="text-dc-text">{retentionMeta.retentionType || 'Classic'}</span>
                </div>
                <div>
                  <span className="text-dc-text-muted">Periods:</span>{' '}
                  <span className="text-dc-text">{retentionMeta.periods ?? 'Not set'}</span>
                </div>
                <div>
                  <span className="text-dc-text-muted">Granularity:</span>{' '}
                  <span className="text-dc-text">{retentionMeta.granularity || 'Week'}</span>
                </div>
                <div>
                  <span className="text-dc-text-muted">Segments:</span>{' '}
                  <span className="text-dc-text">{retentionMeta.segmentCount || 1}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {retentionChartData?.summary && (
          <div>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Retention Summary</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3">
              <div className="dc:grid dc:grid-cols-3 dc:gap-4 dc:text-sm">
                <div>
                  <span className="text-dc-text-muted">Avg Period 1:</span>{' '}
                  <span className="text-dc-text dc:font-medium">
                    {(retentionChartData.summary.avgPeriod1Retention * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-dc-text-muted">Max Period 1:</span>{' '}
                  <span className="text-dc-text dc:font-medium">
                    {(retentionChartData.summary.maxPeriod1Retention * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-dc-text-muted">Min Period 1:</span>{' '}
                  <span className="text-dc-text dc:font-medium">
                    {(retentionChartData.summary.minPeriod1Retention * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Config & Display Config in 2 columns */}
        <div className="dc:grid dc:grid-cols-1 dc:md:grid-cols-2 dc:gap-4">
          <div>
            <CodeBlock
              code={JSON.stringify(chartConfig, null, 2)}
              language="json"
              title="Chart Config"
              height="16rem"
            />
          </div>
          <div>
            <CodeBlock
              code={JSON.stringify(displayConfig, null, 2)}
              language="json"
              title="Display Config"
              height="16rem"
            />
          </div>
        </div>

        {/* Server Response - full width */}
        <div>
          {retentionChartData ? (
            <CodeBlock
              code={JSON.stringify(retentionChartData, null, 2)}
              language="json"
              title={`Server Response (${retentionChartData.rows.length} rows, ${retentionChartData.periods.length} periods)`}
              maxHeight="24rem"
            />
          ) : executionResults ? (
            <CodeBlock
              code={JSON.stringify(executionResults, null, 2)}
              language="json"
              title={`Server Response (${executionResults.length} rows)`}
              maxHeight="24rem"
            />
          ) : (
            <>
              <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Server Response</h4>
              <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
                No results yet
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Render debug view (multi-query or single query)
  const renderStandardDebug = () => (
    <div className="dc:p-4 dc:space-y-4 dc:overflow-auto dc:h-full">
      {/* Query tabs for multi-query mode */}
      {debugDataPerQuery.length > 1 && (
        <div className="dc:flex dc:items-center dc:gap-1 dc:mb-4">
          <span className="dc:text-xs dc:font-medium text-dc-text-muted dc:mr-2">Query:</span>
          <div className="dc:flex dc:border border-dc-border dc:rounded-md dc:overflow-hidden">
            {debugDataPerQuery.map((data, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDebugIndex(idx)}
                className={`dc:px-3 dc:py-1 dc:text-xs dc:font-medium dc:transition-colors dc:border-r dc:last:border-r-0 border-dc-border ${
                  activeDebugIndex === idx
                    ? 'bg-dc-accent text-white'
                    : 'bg-dc-bg text-dc-text-secondary hover:bg-dc-bg-secondary'
                }`}
              >
                Q{idx + 1}
                {data.loading && (
                  <span className="dc:ml-1 dc:opacity-70">•</span>
                )}
                {data.error && (
                  <span className="dc:ml-1 text-dc-error">!</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Execution Error Banner (if any) */}
      {executionError && (
        <div className="bg-dc-danger-bg dark:bg-dc-danger-bg dc:border border-dc-error dark:border-dc-error dc:rounded dc:p-3">
          <h4 className="dc:text-sm dc:font-semibold text-dc-error dark:text-dc-error dc:mb-1">
            Execution Error
          </h4>
          <p className="dc:text-sm text-dc-error dark:text-dc-error">{executionError}</p>
        </div>
      )}

      {/* Query Analysis - full width (at top for visibility) */}
      <div>
        <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Query Analysis</h4>
        {debugLoading ? (
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
            Loading...
          </div>
        ) : debugAnalysis ? (
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3">
            <QueryAnalysisPanel analysis={debugAnalysis} />
          </div>
        ) : (
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
            {debugError ? 'Analysis unavailable due to error' : 'Add metrics to see analysis'}
          </div>
        )}
      </div>

      {/* Cube Query - full width */}
      <div>
        {debugQuery ? (
          <>
            <CodeBlock
              code={JSON.stringify(debugQuery, null, 2)}
              language="json"
              title={isShowingFunnelQuery ? "Executed Query (with funnel filters)" : "Cube Query"}
              height="16rem"
            />
            {isShowingFunnelQuery && activeDebugIndex > 0 && (
              <div className="dc:mt-1 dc:text-xs text-dc-text-muted">
                <span className="text-dc-accent">ℹ</span> This query includes an IN filter with binding key values from the previous step
              </div>
            )}
          </>
        ) : (
          <>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Cube Query</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto">
              No query
            </div>
          </>
        )}
      </div>

      {/* Generated SQL with Explain Plan and AI Analysis - full width */}
      <ExecutionPlanPanel
        sql={debugSql}
        sqlLoading={debugLoading}
        sqlError={debugError}
        sqlPlaceholder="Add metrics to generate SQL"
        explainResult={explainResult}
        explainLoading={explainLoading}
        explainHasRun={explainHasRun}
        explainError={explainError}
        runExplain={runExplain}
        aiAnalysis={aiAnalysis}
        aiAnalysisLoading={aiAnalysisLoading}
        aiAnalysisError={aiAnalysisError}
        runAIAnalysis={runAIAnalysis}
        clearAIAnalysis={clearAIAnalysis}
        enableAI={enableAI}
        query={debugQuery}
        title="Generated SQL"
        height="16rem"
      />

      {/* Chart Config & Display Config in 2 columns */}
      <div className="dc:grid dc:grid-cols-1 dc:md:grid-cols-2 dc:gap-4">
        {/* Chart Config */}
        <div>
          <CodeBlock
            code={JSON.stringify(chartConfig, null, 2)}
            language="json"
            title="Chart Config"
            height="16rem"
          />
        </div>

        {/* Display Config */}
        <div>
          <CodeBlock
            code={JSON.stringify(displayConfig, null, 2)}
            language="json"
            title="Display Config"
            height="16rem"
          />
        </div>
      </div>

      {/* Server Response - full width */}
      <div>
        {executionResults ? (
          <CodeBlock
            code={JSON.stringify(executionResults, null, 2)}
            language="json"
            title={`Server Response (${executionResults.length} rows)`}
            maxHeight="24rem"
          />
        ) : (
          <>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">Server Response</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
              No results yet
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Route to appropriate debug view based on mode
  const renderDebug = () => {
    if (isRetentionMode) {
      return renderRetentionDebug()
    }
    if (isFlowMode) {
      return renderFlowDebug()
    }
    if (isFunnelMode) {
      return renderFunnelDebug()
    }
    return renderStandardDebug()
  }

  // Determine if we're in multi-query mode (but NOT funnel mode)
  // Funnel mode always shows unified results, not per-query tables
  const isMultiQuery = !isFunnelMode && queryCount > 1 && perQueryResults && perQueryResults.length > 1

  // Render flow-specific table view showing nodes and links
  const renderFlowTable = () => {
    // Flow results from server are wrapped: [{ nodes: [...], links: [...] }]
    // The executor returns data: [flowData] where flowData = { nodes, links }
    let nodes: Record<string, unknown>[] = []
    let links: Record<string, unknown>[] = []

    if (!executionResults || (Array.isArray(executionResults) && executionResults.length === 0)) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted">
          <div className="text-center">
            <TableIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">No flow data to display</div>
            <div className="dc:text-xs">Configure flow analysis to see results</div>
          </div>
        </div>
      )
    }

    // Server returns [{ nodes: [...], links: [...] }] - unwrap the first element
    if (Array.isArray(executionResults) && executionResults.length > 0) {
      const firstResult = executionResults[0] as Record<string, unknown>
      // Check if it's flow data structure (has nodes/links arrays)
      if (firstResult && 'nodes' in firstResult && 'links' in firstResult) {
        nodes = (firstResult.nodes || []) as Record<string, unknown>[]
        links = (firstResult.links || []) as Record<string, unknown>[]
      } else if ('record_type' in firstResult) {
        // Fallback: raw format with record_type discriminator
        nodes = executionResults.filter((r: Record<string, unknown>) => r.record_type === 'node')
        links = executionResults.filter((r: Record<string, unknown>) => r.record_type === 'link')
      }
    }

    // If no data after parsing, show empty state
    if (nodes.length === 0 && links.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted">
          <div className="text-center">
            <TableIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">No flow data to display</div>
            <div className="dc:text-xs">Configure flow analysis to see results</div>
          </div>
        </div>
      )
    }

    return (
      <div className="dc:h-full dc:overflow-auto dc:p-4 dc:space-y-6">
        {/* Nodes Table */}
        <div>
          <h3 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">
            Nodes ({nodes.length})
          </h3>
          <div className="dc:border border-dc-border dc:rounded dc:overflow-hidden">
            <table className="dc:w-full dc:text-sm">
              <thead className="bg-dc-surface-secondary">
                <tr>
                  <th className="dc:px-3 dc:py-2 text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">Layer</th>
                  <th className="dc:px-3 dc:py-2 text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">Name</th>
                  <th className="dc:px-3 dc:py-2 text-right dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">Count</th>
                </tr>
              </thead>
              <tbody className="dc:divide-y divide-dc-border bg-dc-surface">
                {nodes
                  .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.layer as number) - (b.layer as number))
                  .map((node: Record<string, unknown>, idx: number) => (
                    <tr key={idx} className="hover:bg-dc-surface-hover">
                      <td className="dc:px-3 dc:py-2 dc:whitespace-nowrap">
                        <span className={`dc:inline-flex dc:items-center dc:justify-center dc:w-6 dc:h-6 dc:rounded dc:text-xs dc:font-medium ${
                          (node.layer as number) === 0
                            ? 'bg-dc-primary text-white'
                            : (node.layer as number) < 0
                              ? 'bg-dc-accent-bg text-dc-accent'
                              : 'bg-dc-success-bg text-dc-success'
                        }`}>
                          {(node.layer as number) === 0 ? '★' : node.layer as number}
                        </span>
                      </td>
                      <td className="dc:px-3 dc:py-2 text-dc-text">{node.name as string}</td>
                      <td className="dc:px-3 dc:py-2 text-right text-dc-text font-mono">
                        {(node.value as number)?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Links Table */}
        <div>
          <h3 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">
            Transitions ({links.length})
          </h3>
          <div className="dc:border border-dc-border dc:rounded dc:overflow-hidden">
            <table className="dc:w-full dc:text-sm">
              <thead className="bg-dc-surface-secondary">
                <tr>
                  <th className="dc:px-3 dc:py-2 text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">From</th>
                  <th className="dc:px-3 dc:py-2 text-center dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">→</th>
                  <th className="dc:px-3 dc:py-2 text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">To</th>
                  <th className="dc:px-3 dc:py-2 text-right dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">Count</th>
                </tr>
              </thead>
              <tbody className="dc:divide-y divide-dc-border bg-dc-surface">
                {links.map((link: Record<string, unknown>, idx: number) => {
                  // SankeyLink uses `source` and `target` (transformed), fallback to source_id/target_id (raw)
                  const sourceId = (link.source || link.source_id) as string || ''
                  const targetId = (link.target || link.target_id) as string || ''
                  // IDs are like "before_5_created" or "start_created" - extract the event name
                  const sourceName = sourceId.split('_').slice(-1)[0] || sourceId
                  const targetName = targetId.split('_').slice(-1)[0] || targetId

                  return (
                    <tr key={idx} className="hover:bg-dc-surface-hover">
                      <td className="dc:px-3 dc:py-2 text-dc-text">{sourceName}</td>
                      <td className="dc:px-3 dc:py-2 text-center text-dc-text-muted">→</td>
                      <td className="dc:px-3 dc:py-2 text-dc-text">{targetName}</td>
                      <td className="dc:px-3 dc:py-2 text-right text-dc-text font-mono">
                        {(link.value as number)?.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Render table - uses per-query results in multi-query mode
  const renderTable = (tableIndex?: number) => {
    // In multi-query mode, use specific query's results and query object
    // tableIndex: undefined = single query, -1 = merged view, 0+ = per-query view
    let tableData: any[] | null = null
    let tableQuery = allQueries?.[0]  // Default to first query

    if (isMultiQuery && tableIndex !== undefined && tableIndex >= 0 && perQueryResults) {
      // Per-query table view
      tableData = perQueryResults[tableIndex] || null
      tableQuery = allQueries?.[tableIndex]
    } else {
      // Merged view (tableIndex === -1) or single query mode
      tableData = executionResults
      // For merged view, use combined query
      if (isMultiQuery) {
        tableQuery = combinedQueryForChart
      }
    }

    if (!tableData || tableData.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted">
          <div className="text-center">
            <TableIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">No data to display</div>
            <div className="dc:text-xs">Run a query to see table data</div>
          </div>
        </div>
      )
    }

    // Apply display limit
    const limitedData = tableData.slice(0, displayLimit)

    return (
      <LazyChart
        chartType="table"
        data={limitedData}
        colorPalette={colorPalette}
        queryObject={tableQuery}
        height="100%"
        fallback={
          <div className="dc:flex dc:items-center dc:justify-center dc:h-full">
            <div className="dc:animate-pulse bg-dc-surface-secondary dc:rounded dc:w-full dc:h-full" />
          </div>
        }
      />
    )
  }

  // Overlay spinner for refreshing
  const renderOverlaySpinner = () => (
    <div className="dc:absolute dc:inset-0 dc:flex dc:items-center dc:justify-center bg-dc-surface bg-opacity-75 dc:z-10">
      <div className="text-center">
        <div
          className="dc:animate-spin dc:rounded-full dc:h-10 dc:w-10 dc:border-b-2 dc:mx-auto dc:mb-2"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="dc:text-xs text-dc-text-secondary">Refreshing results...</div>
      </div>
    </div>
  )

  // Render header - shown whenever we have query content
  const renderHeader = () => {
    const hasResults = executionResults && executionResults.length > 0

    return (
      <div className="dc:px-4 dc:py-2 dc:border-b border-dc-border bg-dc-surface-secondary dc:flex-shrink-0">
        <div className="dc:flex dc:items-center dc:justify-between">
          {/* Left side: Status and row count */}
          <div className="dc:flex dc:items-center">
            {executionStatus === 'refreshing' ? (
              <div
                className="dc:w-4 dc:h-4 dc:mr-2 dc:rounded-full dc:border-b-2 dc:animate-spin"
                style={{ borderBottomColor: 'var(--dc-primary)' }}
              />
            ) : hasResults ? (
              <SuccessIcon className="dc:w-4 dc:h-4 text-dc-success dc:mr-2" />
            ) : executionStatus === 'error' ? (
              <ErrorIcon className="dc:w-4 dc:h-4 text-dc-error dc:mr-2" />
            ) : (
              <WarningIcon className="dc:w-4 dc:h-4 text-dc-text-muted dc:mr-2" />
            )}
            <span className="dc:text-sm text-dc-text-secondary">
              {hasResults ? (
                <>
                  {executionResults.length} row{executionResults.length !== 1 ? 's' : ''}
                  {totalRowCount !== null && totalRowCount > executionResults.length && (
                    <span className="text-dc-text-muted"> of {totalRowCount.toLocaleString()}</span>
                  )}
                  {resultsStale && (
                    <span className="text-dc-warning dc:ml-2">• Results may be outdated</span>
                  )}
                </>
              ) : executionStatus === 'error' ? (
                'Query failed'
              ) : executionStatus === 'loading' ? (
                'Executing...'
              ) : (
                'No results'
              )}
            </span>
          </div>

          {/* Right side: Display limit (table only) and Debug toggle */}
          <div className="dc:flex dc:items-center dc:gap-2">
            {/* Display Limit (only for table view) */}
            {hasResults && activeView === 'table' && !showDebug && onDisplayLimitChange && (
              <select
                value={displayLimit}
                onChange={(e) => onDisplayLimitChange(Number(e.target.value))}
                className="dc:text-xs dc:border border-dc-border dc:rounded dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
              >
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={250}>250 rows</option>
                <option value={500}>500 rows</option>
              </select>
            )}

            {/* AI Button - positioned before palette selector */}
            {enableAI && onAIToggle && (
              <button
                onClick={onAIToggle}
                className={`dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded dc:transition-colors ${
                  isAIOpen
                    ? 'text-white bg-dc-accent dc:border border-dc-accent'
                    : 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg dc:border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg'
                }`}
                title={isAIOpen ? 'Close AI assistant' : 'Analyse with AI'}
              >
                <SparklesIcon className="dc:w-3 dc:h-3" />
                <span className="dc:hidden dc:sm:inline">Analyse with AI</span>
              </button>
            )}

            {/* Color Palette Selector (only when callback is provided, i.e., standalone mode) */}
            {onColorPaletteChange && hasResults && (
              <ColorPaletteSelector
                currentPalette={currentPaletteName || 'default'}
                onPaletteChange={onColorPaletteChange}
              />
            )}

            {/* Share Button */}
            {onShareClick && (
              <button
                onClick={onShareClick}
                className={`dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded dc:transition-colors ${
                  shareButtonState === 'idle' && canShare
                    ? 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg dc:border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg'
                    : shareButtonState !== 'idle'
                    ? 'text-dc-success dark:text-dc-success bg-dc-success-bg dark:bg-dc-success-bg dc:border border-dc-success dark:border-dc-success'
                    : 'text-dc-text-muted bg-dc-surface-secondary dc:border border-dc-border dc:cursor-not-allowed'
                }`}
                title={shareButtonState === 'idle' ? 'Share this analysis' : 'Link copied!'}
                disabled={!canShare || shareButtonState !== 'idle'}
              >
                {shareButtonState === 'idle' ? (
                  <>
                    <ShareIcon className="dc:w-3 dc:h-3" />
                    <span className="dc:hidden dc:sm:inline">Share</span>
                  </>
                ) : shareButtonState === 'copied' ? (
                  <>
                    <CheckIcon className="dc:w-3 dc:h-3" />
                    <span className="dc:hidden dc:sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="dc:w-3 dc:h-3" />
                    <span className="dc:hidden dc:sm:inline">Copied!</span>
                    <span className="dc:hidden dc:lg:inline dc:text-[10px] dc:opacity-75">(no chart)</span>
                  </>
                )}
              </button>
            )}

            {/* Refresh Button - Shift+click bypasses cache */}
            {onRefreshClick && canRefresh && (
              <button
                onClick={(e) => onRefreshClick({ bustCache: e.shiftKey })}
                onMouseEnter={() => setIsHoveringRefresh(true)}
                onMouseLeave={() => setIsHoveringRefresh(false)}
                disabled={isRefreshing}
                className={`dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium dc:rounded dc:transition-colors ${
                  isRefreshing
                    ? 'text-dc-text-muted bg-dc-surface-secondary dc:border border-dc-border dc:cursor-wait'
                    : showCacheBustIndicator
                      ? 'text-dc-warning bg-dc-warning-bg dc:border border-dc-warning dc:font-semibold'
                      : 'text-dc-accent bg-dc-accent-bg dc:border border-dc-accent hover:bg-dc-accent-bg'
                }`}
                title={isRefreshing ? 'Refreshing...' : showCacheBustIndicator ? 'Click to refresh and bypass cache' : 'Refresh data (Shift+click to bypass cache)'}
              >
                <RefreshIcon className={`dc:w-3 dc:h-3 ${isRefreshing ? 'dc:animate-spin' : ''}`} />
                <span className="dc:hidden dc:sm:inline">{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
              </button>
            )}

            {/* Clear Button */}
            {onClearClick && canClear && (
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 dc:text-xs dc:font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface hover:bg-dc-surface-hover dc:border border-dc-border dc:rounded dc:transition-colors"
                title={isFunnelMode ? 'Clear funnel' : 'Clear all query data'}
              >
                <TrashIcon className="dc:w-3 dc:h-3" />
                <span className="dc:hidden dc:sm:inline">Clear</span>
              </button>
            )}

            {/* Debug Toggle Button */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`dc:p-1.5 dc:rounded dc:transition-colors dc:relative ${
                showDebug
                  ? 'bg-dc-primary text-white'
                  : 'text-dc-text-secondary hover:text-dc-text hover:bg-dc-surface-hover'
              }`}
              title={showDebug ? 'Hide debug info' : 'Show debug info'}
            >
              <CodeIcon className="dc:w-4 dc:h-4" />
              {/* Error indicator dot - show if ANY query has an error */}
              {(executionError || debugDataPerQuery.some(d => d.error)) && !showDebug && (
                <span className="dc:absolute dc:-top-0.5 dc:-right-0.5 dc:w-2 dc:h-2 bg-dc-danger-bg0 dc:rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Performance Warning */}
        {hasResults && totalRowCount !== null && totalRowCount > 1000 && (
          <div className="dc:mt-2 bg-dc-warning-bg dc:border border-dc-warning dc:rounded-lg dc:p-2 dc:flex dc:items-start">
            <WarningIcon className="dc:w-4 dc:h-4 text-dc-warning dc:mr-2 dc:shrink-0 dc:mt-0.5" />
            <div className="dc:text-xs text-dc-warning">
              <span className="dc:font-semibold">Large dataset:</span> {totalRowCount.toLocaleString()} rows.
              Consider adding filters to improve performance.
            </div>
          </div>
        )}
      </div>
    )
  }

  // "Needs refresh" banner for manual refresh mode
  const renderNeedsRefreshBanner = () => {
    if (!needsRefresh || !onRefreshClick) return null

    return (
      <div className="dc:px-4 dc:py-2 bg-dc-warning-bg dc:border-b border-dc-warning dc:flex dc:items-center dc:justify-between dc:gap-3 dc:flex-shrink-0">
        <div className="dc:flex dc:items-center dc:gap-2 text-dc-warning">
          <svg className="dc:w-4 dc:h-4 dc:flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="dc:text-sm dc:font-medium">Query configuration changed. Results may be outdated.</span>
        </div>
        <button
          onClick={() => onRefreshClick()}
          className="dc:px-3 dc:py-1 dc:text-xs dc:font-medium bg-dc-warning text-white dc:rounded hover:bg-dc-warning/90 dc:transition-colors"
        >
          Refresh Now
        </button>
      </div>
    )
  }

  // Success state with data
  const renderSuccess = () => {
    const hasResults = executionResults && executionResults.length > 0

    if (!hasResults) {
      return (
        <div className="dc:h-full dc:flex dc:flex-col">
          {renderHeader()}
          <div className="dc:flex-1 dc:min-h-0 dc:relative dc:overflow-auto">
            {showDebug ? renderDebug() : renderNoData()}
          </div>
        </div>
      )
    }

    return (
      <div className="dc:h-full dc:flex dc:flex-col">
        {renderHeader()}
        {renderNeedsRefreshBanner()}

        {/* Results Content */}
        <div className="dc:flex-1 dc:min-h-0 dc:relative dc:overflow-auto">
          {showDebug ? (
            renderDebug()
          ) : activeView === 'chart' ? (
            <div className="dc:p-4 dc:h-full">{renderChart()}</div>
          ) : isFlowMode ? (
            <div className="dc:h-full" key="table-flow">{renderFlowTable()}</div>
          ) : isMultiQuery ? (
            <div className="dc:h-full" key={`table-${activeTableIndex}`}>{renderTable(activeTableIndex)}</div>
          ) : (
            <div className="dc:h-full" key="table-single">{renderTable()}</div>
          )}
        </div>

        {/* View Toggle - Below content, centered */}
        {!showDebug && (
          <div className="dc:px-4 dc:py-3 dc:border-t border-dc-border bg-dc-surface dc:flex dc:justify-center dc:flex-shrink-0">
            <div className="dc:flex dc:items-center bg-dc-surface-secondary dc:border border-dc-border dc:rounded-md dc:overflow-hidden">
              {/* Chart button - always enabled for flow/funnel/retention modes which don't need traditional metrics */}
              <button
                onClick={() => (hasMetrics || isFlowMode || isFunnelMode || isRetentionMode) && onActiveViewChange('chart')}
                disabled={!hasMetrics && !isFlowMode && !isFunnelMode && !isRetentionMode}
                className={`dc:flex dc:items-center dc:gap-1.5 dc:px-4 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
                  activeView === 'chart'
                    ? 'bg-dc-primary text-white'
                    : (!hasMetrics && !isFlowMode && !isFunnelMode && !isRetentionMode)
                      ? 'text-dc-text-disabled bg-dc-surface-tertiary dc:cursor-not-allowed'
                      : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                }`}
                title={(hasMetrics || isFlowMode || isFunnelMode || isRetentionMode) ? 'Chart view' : 'Add metrics to enable chart view'}
              >
                <ChartIcon className="dc:w-4 dc:h-4" />
                Chart
              </button>

              {/* Table buttons - show multiple when in multi-query mode */}
              {isMultiQuery ? (
                <>
                  {/* Per-query table buttons */}
                  {Array.from({ length: queryCount }).map((_, index) => (
                    <button
                      key={`table-${index}`}
                      onClick={() => {
                        onActiveViewChange('table')
                        onActiveTableChange?.(index)
                      }}
                      className={`dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
                        activeView === 'table' && activeTableIndex === index
                          ? 'bg-dc-primary text-white'
                          : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                      }`}
                      title={`Table Q${index + 1}`}
                    >
                      <TableIcon className="dc:w-4 dc:h-4" />
                      Q{index + 1}
                    </button>
                  ))}
                  {/* Merged table button */}
                  <button
                    onClick={() => {
                      onActiveViewChange('table')
                      onActiveTableChange?.(-1)  // -1 = merged view
                    }}
                    className={`dc:flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
                      activeView === 'table' && activeTableIndex === -1
                        ? 'bg-dc-primary text-white'
                        : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                    }`}
                    title="Merged table view"
                  >
                    <TableIcon className="dc:w-4 dc:h-4" />
                    Merged
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onActiveViewChange('table')}
                  className={`dc:flex dc:items-center dc:gap-1.5 dc:px-4 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
                    activeView === 'table'
                      ? 'bg-dc-primary text-white'
                      : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                  }`}
                  title="Table view"
                >
                  <TableIcon className="dc:w-4 dc:h-4" />
                  Table
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Determine what to render based on execution status
  // Check for meaningful results - handles different data structures per mode
  const hasResults = useMemo(() => {
    if (executionResults === null) return false
    if (!Array.isArray(executionResults)) return true
    if (executionResults.length === 0) return false

    // For flow mode, check if we have actual nodes/links data
    // Flow wraps results as [{ nodes: [...], links: [...] }] - need to check inner content
    if (isFlowMode && executionResults.length === 1) {
      const flowData = executionResults[0] as { nodes?: unknown[]; links?: unknown[] } | undefined
      if (flowData && typeof flowData === 'object' && 'nodes' in flowData && 'links' in flowData) {
        const hasNodes = Array.isArray(flowData.nodes) && flowData.nodes.length > 0
        const hasLinks = Array.isArray(flowData.links) && flowData.links.length > 0
        return hasNodes || hasLinks
      }
    }

    // For retention mode, check if we have chart data with rows
    if (isRetentionMode && retentionChartData) {
      return retentionChartData.rows.length > 0
    }

    // For funnel mode, results are chart data items - check length
    // For query mode, results are data rows - check length
    return executionResults.length > 0
  }, [executionResults, isFlowMode, isRetentionMode, retentionChartData])

  // Don't show results if we're in idle state with no query content (cleared state)
  const shouldShowResults = hasResults && (executionStatus !== 'idle' || hasModeSpecificContent)

  // Priority 1: Manual refresh mode with no results - show centered refresh prompt
  // This takes precedence over all other states for consistent UX across all modes
  if (needsRefresh && !hasResults) {
    return (
      <div className="dc:h-full dc:min-h-[400px] dc:flex dc:flex-col bg-dc-surface dc:relative">
        {renderNeedsRefreshEmpty()}
      </div>
    )
  }

  return (
    <div className="dc:h-full dc:min-h-[400px] dc:flex dc:flex-col bg-dc-surface dc:relative">
      {/* Main content */}
      {executionStatus === 'idle' && !hasModeSpecificContent && renderEmpty()}
      {executionStatus === 'idle' && hasModeSpecificContent && !hasResults && renderWaiting()}
      {executionStatus === 'loading' && !hasResults && renderLoading()}
      {executionStatus === 'error' && !hasResults && renderError()}
      {(executionStatus === 'success' || shouldShowResults) && renderSuccess()}

      {/* Overlay states */}
      {(executionStatus === 'loading' || executionStatus === 'refreshing') && hasResults && renderOverlaySpinner()}

      {onClearClick && (
        <ConfirmModal
          isOpen={isClearConfirmOpen}
          onClose={() => setIsClearConfirmOpen(false)}
          onConfirm={() => {
            onClearClick()
            setIsClearConfirmOpen(false)
          }}
          title={isFunnelMode ? 'Clear Funnel' : 'Clear Query'}
          message={
            <>
              {isFunnelMode
                ? 'Are you sure you want to clear this funnel? This action cannot be undone.'
                : 'Are you sure you want to clear this query? This action cannot be undone.'}
            </>
          }
          confirmText="Clear"
          confirmVariant="warning"
        />
      )}
    </div>
  )
})

export default AnalysisResultsPanel

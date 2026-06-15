/**
 * AnalysisResultsPanel Component
 *
 * Displays query execution results with chart and table views.
 * Used in the left panel of AnalysisBuilder.
 */

import React, { useState, useEffect, useMemo, memo, useRef, useCallback } from 'react'
import type { AnalysisResultsPanelProps } from './types'
import { LazyChart, isValidChartType } from '../../charts/ChartLoader'
import { getIcon } from '../../icons'
import { QueryAnalysisPanel, CodeBlock } from '../../shared'
import ConfirmModal from '../ConfirmModal'
import { useExplainQuery } from '../../hooks/queries/useExplainQuery'
import { useExplainAI } from '../../hooks/queries/useExplainAI'
import type { CubeQuery } from '../../types'
import { ExecutionPlanPanel } from './ExecutionPlanPanel'
import ResultsHeader from './AnalysisResultsHeader'
import type { ResultsSummary, ResultsToolbarActions, ResultsDisplayFlags } from './AnalysisResultsHeader'
import { generateExecutionPlanMarkdown } from './utils/executionPlanMarkdown'
import { resolveDebugData, isChartViewEnabled, chartViewButtonTitle, computeHasResults, selectTableData, flowLinkNames, computeIsMultiQuery } from './utils/resultsPanelDerive'
import { useCubeFeatures } from '../../providers/CubeFeaturesProvider'
import { useTranslation } from '../../hooks/useTranslation'
const SchemaVisualizationLazy = React.lazy(() =>
  import('../SchemaVisualization/SchemaVisualizationLazy').then(m => ({ default: m.SchemaVisualizationLazy }))
)

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
  chartAvailability,
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
  retentionValidation,
  // Query warnings from server
  warnings,
  // Schema visualization interaction
  highlightedFields,
  onSchemaFieldClick
}: AnalysisResultsPanelProps) {
  const { t } = useTranslation()
  // Determine funnel mode from analysisType (preferred) or legacy prop
  const isFunnelMode = analysisType === 'funnel' || isFunnelModeProp
  // Determine flow mode from analysisType
  const isFlowMode = analysisType === 'flow'
  // Determine retention mode from analysisType
  const isRetentionMode = analysisType === 'retention'
  // Features config
  const { features } = useCubeFeatures()
  // Debug view toggle state
  const [showDebug, setShowDebug] = useState(false)
  // Schema visualization toggle state
  const [showSchema, setShowSchema] = useState(false)
  // Active debug query tab (independent of main query tabs)
  const [activeDebugIndex, setActiveDebugIndex] = useState(0)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  // Track shift key + hover state for cache bust visual feedback
  const [isShiftHeld, setIsShiftHeld] = useState(false)
  const [isHoveringRefresh, setIsHoveringRefresh] = useState(false)
  // Copy as markdown state
  const [copyMarkdownState, setCopyMarkdownState] = useState<'idle' | 'copied'>('idle')

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
  const currentDebugData = resolveDebugData(debugDataPerQuery, activeDebugIndex)
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

  // Copy execution plan as markdown
  const handleCopyMarkdown = useCallback(() => {
    if (!debugAnalysis) return
    const markdown = generateExecutionPlanMarkdown(debugAnalysis, debugQuery, debugSql)
    navigator.clipboard.writeText(markdown).then(() => {
      setCopyMarkdownState('copied')
      setTimeout(() => setCopyMarkdownState('idle'), 2000)
    })
  }, [debugAnalysis, debugQuery, debugSql])

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

  // Whether the current chart type can actually render with the current query shape.
  // Drives the Chart view toggle — table is always available, bar/line/etc. need measures.
  const isCurrentChartRenderable =
    chartAvailability?.[chartType]?.available ?? true
  const chartViewEnabled = isChartViewEnabled({
    isCurrentChartRenderable,
    isFlowMode,
    isFunnelMode,
    isRetentionMode
  })
  const chartViewUnavailableReason = chartAvailability?.[chartType]?.reason
  const chartButtonTitle = chartViewButtonTitle(chartViewEnabled, chartViewUnavailableReason, t)

  // Force table view when the selected chart type can't render with the current query.
  // In funnel/flow/retention modes, charts have their own requirements, so we skip this.
  useEffect(() => {
    // Skip on first run to allow share/portlet state to load first
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      return
    }

    if (analysisType === 'funnel' || analysisType === 'flow' || analysisType === 'retention' || isFunnelMode) return

    if (!isCurrentChartRenderable && activeView === 'chart') {
      onActiveViewChange('table')
    }
  }, [isCurrentChartRenderable, activeView, onActiveViewChange, isFunnelMode, analysisType])

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
  const SparklesIcon = getIcon('sparkles')

  // Loading state - initial load
  const renderLoading = () => (
    <div className="dc:h-full dc:flex dc:items-center dc:justify-center">
      <div className="dc:text-center">
        <div
          className="dc:animate-spin dc:rounded-full dc:h-12 dc:w-12 dc:border-b-2 dc:mx-auto dc:mb-4"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1">
          {t('results.loading.title')}
        </div>
        <div className="dc:text-xs text-dc-text-muted">
          {t('results.loading.subtitle')}
        </div>
      </div>
    </div>
  )

  // Error state - no previous results
  const renderError = () => (
    <div className="dc:h-full dc:flex dc:flex-col">
      {renderHeader()}
      <div className="dc:flex-1 dc:flex dc:items-center dc:justify-center dc:p-4">
        {showSchema ? (
          <div className="dc:w-full dc:h-full">
            <React.Suspense fallback={null}><SchemaVisualizationLazy height="100%" highlightedFields={highlightedFields} onFieldClick={onSchemaFieldClick} /></React.Suspense>
          </div>
        ) : showDebug ? (
          <div className="dc:w-full dc:h-full dc:overflow-auto">
            {renderDebug()}
          </div>
        ) : (
          <div className="dc:text-center dc:max-w-md">
            <ErrorIcon className="dc:w-12 dc:h-12 dc:mx-auto text-dc-error dc:mb-4" />
            <div className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">
              {t('results.error.title')}
            </div>
            <div className="dc:text-sm text-dc-text-secondary dc:mb-4">
              {t('results.error.subtitle')}
            </div>
            {executionError && (
              <div className="bg-dc-danger-bg dc:border border-dc-error dc:rounded-lg dc:p-3 dc:text-left">
                <div className="dc:text-xs dc:font-mono text-dc-error dc:break-words">
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
      <div className="dc:text-center">
        <div
          className="dc:animate-spin dc:rounded-full dc:h-12 dc:w-12 dc:border-b-2 dc:mx-auto dc:mb-4"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1">
          {t('results.waiting.title')}
        </div>
        <div className="dc:text-xs text-dc-text-muted">
          {t('results.waiting.subtitle')}
        </div>
      </div>
    </div>
  )

  // Manual refresh mode - query ready but needs user to click refresh
  const renderNeedsRefreshEmpty = () => (
    <div className="dc:h-full dc:flex dc:items-center dc:justify-center">
      <div className="dc:text-center">
        <svg className="dc:w-12 dc:h-12 dc:mx-auto text-dc-warning dc:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <div className="dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1">
          {t('results.needsRefresh.title')}
        </div>
        <div className="dc:text-xs text-dc-text-muted dc:mb-4">
          {t('results.needsRefresh.subtitle')}
        </div>
        {onRefreshClick && (
          <button
            onClick={() => onRefreshClick()}
            className="dc:inline-flex dc:items-center dc:gap-2 dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-white bg-dc-accent dc:hover:opacity-90 dc:rounded-lg dc:transition-colors dc:shadow-sm"
          >
            <svg className="dc:w-4 dc:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('results.needsRefresh.runButton')}
          </button>
        )}
      </div>
    </div>
  )

  // Empty state - no query built yet
  // Shows mode-specific guidance based on analysis type
  const renderEmpty = () => {
    // Mode-specific empty message
    let emptyMessage = t('results.empty.query')
    if (isRetentionMode) {
      emptyMessage = t('results.empty.retention')
    } else if (isFunnelMode) {
      emptyMessage = t('results.empty.funnel')
    } else if (isFlowMode) {
      emptyMessage = t('results.empty.flow')
    }

    return (
      <div className="dc:h-full dc:flex dc:items-center dc:justify-center dc:pt-6">
        <div className="dc:text-center dc:mb-16">
          <ChartIcon className="dc:w-12 dc:h-12 dc:mx-auto text-dc-text-muted dc:mb-3" />
          <div className="dc:text-sm dc:font-semibold text-dc-text-secondary dc:mb-1">
            {t('results.empty.title')}
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
              {t('results.ai.button')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // No data returned state
  const renderNoData = () => (
    <div className="dc:h-full dc:flex dc:items-center dc:justify-center">
      <div className="dc:text-center">
        <SuccessIcon className="dc:w-12 dc:h-12 dc:mx-auto text-dc-success dc:mb-3" />
        <div className="dc:text-sm dc:font-semibold text-dc-text dc:mb-1">
          {t('results.noData.title')}
        </div>
        <div className="dc:text-xs text-dc-text-muted">
          {t('results.noData.subtitle')}
        </div>
      </div>
    </div>
  )

  // Render chart
  const renderChart = () => {
    if (!executionResults || executionResults.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted">
          <div className="dc:text-center">
            <ChartIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('results.chart.noData')}</div>
            <div className="dc:text-xs">{t('results.chart.noDataHint')}</div>
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
          <div className="dc:text-center">
            <WarningIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('results.chart.unsupported')}</div>
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

  interface FunnelMetadata {
    stepCount: number
    steps: Array<{
      index: number
      name: string
      timeToConvert?: string
      cube?: string
    }>
  }

  interface FlowMetadata {
    stepsBefore?: number
    stepsAfter?: number
    eventDimension?: string
    startingStep?: { name?: string; filter?: unknown }
  }

  interface RetentionMetadata {
    totalUsers?: number
    segmentCount?: number
    periods?: number
    granularity?: string
    retentionType?: string
  }

  interface ModeDebugConfig {
    label: string
    badgeText?: string
    serverQuery: unknown | null | undefined
    serverQueryTitle: string
    serverQueryMissing: React.ReactNode
    debugData: {
      sql: { sql: string; params: unknown[] } | null
      loading: boolean
      error: Error | null
      modeMetadata?: unknown
    } | null | undefined
    sqlPlaceholder: string
    explainResult: any
    explainLoading: boolean
    explainHasRun: boolean
    explainError: Error | null
    runExplain: () => void
    metadataTitle?: string
    metadataSection?: React.ReactNode
    extraSection?: React.ReactNode
    responseSection: React.ReactNode
  }

  const renderExecutionErrorBanner = () => {
    if (!executionError) return null
    return (
      <div className="bg-dc-danger-bg dark:bg-dc-danger-bg dc:border border-dc-error dark:border-dc-error dc:rounded dc:p-3">
        <h4 className="dc:text-sm dc:font-semibold text-dc-error dark:text-dc-error dc:mb-1">
          {t('results.debug.executionError')}
        </h4>
        <p className="dc:text-sm text-dc-error dark:text-dc-error">{executionError}</p>
      </div>
    )
  }

  const renderSharedConfigBlocks = () => (
    <div className="dc:grid dc:grid-cols-1 dc:md:grid-cols-2 dc:gap-4">
      <div>
        <CodeBlock
          code={JSON.stringify(chartConfig, null, 2)}
          language="json"
          title={t('results.debug.chartConfig')}
          height="16rem"
        />
      </div>
      <div>
        <CodeBlock
          code={JSON.stringify(displayConfig, null, 2)}
          language="json"
          title={t('results.debug.displayConfig')}
          height="16rem"
        />
      </div>
    </div>
  )

  const renderStandardResponseBlock = (title?: string) => (
    <div>
      {executionResults ? (
        <CodeBlock
          code={JSON.stringify(executionResults, null, 2)}
          language="json"
          title={title || `${t('results.debug.serverResponse')} (${executionResults.length} ${t('results.header.rows')})`}
          maxHeight="24rem"
        />
      ) : (
        <>
          <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{t('results.debug.serverResponse')}</h4>
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
            {t('results.debug.noResults')}
          </div>
        </>
      )}
    </div>
  )

  const renderRetentionResponseBlock = () => (
    <div>
      {retentionChartData ? (
        <CodeBlock
          code={JSON.stringify(retentionChartData, null, 2)}
          language="json"
          title={`Server Response (${retentionChartData.rows.length} rows, ${retentionChartData.periods.length} periods)`}
          maxHeight="24rem"
        />
      ) : (
        renderStandardResponseBlock()
      )}
    </div>
  )

  const renderModeDebug = (config: ModeDebugConfig) => {
    const modeSql = config.debugData?.sql
    const modeLoading = config.debugData?.loading || false
    const modeError = config.debugData?.error || null

    return (
      <div className="dc:p-4 dc:space-y-4 dc:overflow-auto dc:h-full">
        <div className="dc:flex dc:items-center dc:gap-2 dc:mb-4">
          <span className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium bg-dc-accent text-white dc:rounded">
            {config.label}
          </span>
          {config.badgeText && (
            <span className="dc:text-xs text-dc-text-muted">{config.badgeText}</span>
          )}
          {modeLoading && (
            <span className="dc:text-xs text-dc-text-muted dc:animate-pulse">{t('results.debug.loadingSql')}</span>
          )}
        </div>

        {renderExecutionErrorBanner()}

        <div>
          {config.serverQuery ? (
            <CodeBlock
              code={JSON.stringify(config.serverQuery, null, 2)}
              language="json"
              title={config.serverQueryTitle}
              height="16rem"
            />
          ) : (
            config.serverQueryMissing
          )}
        </div>

        <ExecutionPlanPanel
          sql={modeSql}
          sqlLoading={modeLoading}
          sqlError={modeError}
          sqlPlaceholder={config.sqlPlaceholder}
          explainResult={config.explainResult}
          explainLoading={config.explainLoading}
          explainHasRun={config.explainHasRun}
          explainError={config.explainError}
          runExplain={config.runExplain}
          aiAnalysis={aiAnalysis}
          aiAnalysisLoading={aiAnalysisLoading}
          aiAnalysisError={aiAnalysisError}
          runAIAnalysis={runAIAnalysis}
          clearAIAnalysis={clearAIAnalysis}
          enableAI={enableAI}
          query={config.serverQuery}
          title="Generated SQL"
          height="16rem"
        />

        {config.metadataTitle && config.metadataSection && (
          <div>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{config.metadataTitle}</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3">
              {config.metadataSection}
            </div>
          </div>
        )}

        {config.extraSection}

        {renderSharedConfigBlocks()}

        {config.responseSection}
      </div>
    )
  }

  // Render debug view (multi-query or single query)
  const renderStandardDebug = () => (
    <div className="dc:p-4 dc:space-y-4 dc:overflow-auto dc:h-full">
      {/* Query tabs for multi-query mode */}
      {debugDataPerQuery.length > 1 && (
        <div className="dc:flex dc:items-center dc:gap-1 dc:mb-4">
          <span className="dc:text-xs dc:font-medium text-dc-text-muted dc:mr-2">{t('results.debug.query')}</span>
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
            {t('results.debug.executionError')}
          </h4>
          <p className="dc:text-sm text-dc-error dark:text-dc-error">{executionError}</p>
        </div>
      )}

      {/* Query Analysis - full width (at top for visibility) */}
      <div>
        <div className="dc:flex dc:items-center dc:justify-between dc:mb-2">
          <h4 className="dc:text-sm dc:font-semibold text-dc-text">{t('results.debug.queryAnalysis')}</h4>
          {debugAnalysis && (
            <button
              onClick={handleCopyMarkdown}
              className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:rounded dc:border border-dc-border bg-dc-surface hover:bg-dc-surface-hover text-dc-text-secondary hover:text-dc-text dc:transition-colors dc:flex dc:items-center dc:gap-1"
              title={t('results.debug.copyMarkdownTitle')}
            >
              {copyMarkdownState === 'copied' ? (
                <>
                  <span className="text-dc-success">✓</span>
                  {t('common.actions.copied')}
                </>
              ) : (
                <>{`📋 ${t('results.debug.copyAsMarkdown')}`}</>
              )}
            </button>
          )}
        </div>
        {debugLoading ? (
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
            {t('common.loading')}
          </div>
        ) : debugAnalysis ? (
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3">
            <QueryAnalysisPanel analysis={debugAnalysis} />
          </div>
        ) : (
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
            {debugError ? t('results.debug.analysisError') : t('results.debug.analysisEmpty')}
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
              title={isShowingFunnelQuery ? t('results.debug.cubeQueryExecuted') : t('results.debug.cubeQuery')}
              height="16rem"
            />
            {isShowingFunnelQuery && activeDebugIndex > 0 && (
              <div className="dc:mt-1 dc:text-xs text-dc-text-muted">
                <span className="text-dc-accent">ℹ</span> {t('results.debug.funnelFilterHint')}
              </div>
            )}
          </>
        ) : (
          <>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{t('results.debug.cubeQuery')}</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto">
              {t('results.debug.noQuery')}
            </div>
          </>
        )}
      </div>

      {/* Generated SQL with Explain Plan and AI Analysis - full width */}
      <ExecutionPlanPanel
        sql={debugSql}
        sqlLoading={debugLoading}
        sqlError={debugError}
        sqlPlaceholder={t('results.debug.standard.sqlPlaceholder')}
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
            title={t('results.debug.chartConfig')}
            height="16rem"
          />
        </div>

        {/* Display Config */}
        <div>
          <CodeBlock
            code={JSON.stringify(displayConfig, null, 2)}
            language="json"
            title={t('results.debug.displayConfig')}
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
            title={`${t('results.debug.serverResponse')} (${executionResults.length} ${t('results.header.rows')})`}
            maxHeight="24rem"
          />
        ) : (
          <>
            <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{t('results.debug.serverResponse')}</h4>
            <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm">
              {t('results.debug.noResults')}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Route to appropriate debug view based on mode
  const renderFunnelDebug = () => {
    const metadata = funnelDebugData?.modeMetadata as FunnelMetadata | undefined
    const metadataSection = metadata ? (
      <div className="dc:flex dc:flex-wrap dc:gap-2">
        {metadata.steps.map((step, idx) => (
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
    ) : null

    return renderModeDebug({
      label: t('results.debug.funnel.label'),
      badgeText: metadata?.stepCount ? t('results.debug.funnel.steps', { count: metadata.stepCount }) : undefined,
      serverQuery: funnelServerQuery,
      serverQueryTitle: t('results.debug.funnel.serverQuery'),
      serverQueryMissing: (
        <>
          <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{t('results.debug.funnel.serverQuery')}</h4>
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto">
            {t('results.debug.funnel.noQuery')}
          </div>
        </>
      ),
      debugData: funnelDebugData,
      sqlPlaceholder: t('results.debug.funnel.sqlPlaceholder'),
      explainResult: funnelExplainResult,
      explainLoading: funnelExplainLoading,
      explainHasRun: funnelExplainHasRun,
      explainError: funnelExplainError,
      runExplain: runFunnelExplain,
      metadataTitle: metadataSection ? t('results.debug.funnel.stepsTitle') : undefined,
      metadataSection,
      responseSection: renderStandardResponseBlock(),
    })
  }

  const renderRetentionDebug = () => {
    const metadata = retentionDebugData?.modeMetadata as RetentionMetadata | undefined
    const metadataSection = metadata ? (
      <div className="dc:grid dc:grid-cols-2 dc:gap-4 dc:text-sm">
        <div>
          <span className="text-dc-text-muted">{t('results.debug.retention.retentionType')}</span>{' '}
          <span className="text-dc-text">{metadata.retentionType || 'Classic'}</span>
        </div>
        <div>
          <span className="text-dc-text-muted">{t('results.debug.retention.periods')}</span>{' '}
          <span className="text-dc-text">{metadata.periods ?? t('results.debug.flow.notSet')}</span>
        </div>
        <div>
          <span className="text-dc-text-muted">{t('results.debug.retention.granularity')}</span>{' '}
          <span className="text-dc-text">{metadata.granularity || 'Week'}</span>
        </div>
        <div>
          <span className="text-dc-text-muted">{t('results.debug.retention.segments')}</span>{' '}
          <span className="text-dc-text">{metadata.segmentCount || 1}</span>
        </div>
      </div>
    ) : null

    const extraSection = retentionChartData?.summary ? (
      <div>
        <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{t('results.debug.retention.summaryTitle')}</h4>
        <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3">
          <div className="dc:grid dc:grid-cols-3 dc:gap-4 dc:text-sm">
            <div>
              <span className="text-dc-text-muted">{t('results.debug.retention.avgPeriod1')}</span>{' '}
              <span className="text-dc-text dc:font-medium">
                {(retentionChartData.summary.avgPeriod1Retention * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-dc-text-muted">{t('results.debug.retention.maxPeriod1')}</span>{' '}
              <span className="text-dc-text dc:font-medium">
                {(retentionChartData.summary.maxPeriod1Retention * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-dc-text-muted">{t('results.debug.retention.minPeriod1')}</span>{' '}
              <span className="text-dc-text dc:font-medium">
                {(retentionChartData.summary.minPeriod1Retention * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    ) : null

    return renderModeDebug({
      label: t('results.debug.retention.label'),
      badgeText: metadata ? t('results.debug.retention.badge', { segments: metadata.segmentCount || 1, users: metadata.totalUsers }) : undefined,
      serverQuery: retentionServerQuery,
      serverQueryTitle: t('results.debug.retention.serverQuery'),
      serverQueryMissing: (
        <>
          <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{t('results.debug.retention.serverQuery')}</h4>
          <div className="bg-dc-warning-bg dc:border border-dc-warning dc:rounded dc:p-3 dc:text-sm dc:h-64 dc:overflow-auto">
            <div className="text-dc-warning dc:font-medium dc:mb-2">{t('results.debug.retention.configIncomplete')}</div>
            {retentionValidation && retentionValidation.errors.length > 0 ? (
              <ul className="list-disc dc:list-inside text-dc-text-secondary dc:space-y-1">
                {retentionValidation.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            ) : (
              <p className="text-dc-text-muted">{t('results.debug.retention.configHint')}</p>
            )}
          </div>
        </>
      ),
      debugData: retentionDebugData,
      sqlPlaceholder: t('results.debug.retention.sqlPlaceholder'),
      explainResult: retentionExplainResult,
      explainLoading: retentionExplainLoading,
      explainHasRun: retentionExplainHasRun,
      explainError: retentionExplainError,
      runExplain: runRetentionExplain,
      metadataTitle: metadataSection ? t('results.debug.retention.configTitle') : undefined,
      metadataSection,
      extraSection,
      responseSection: renderRetentionResponseBlock(),
    })
  }

  const renderFlowDebug = () => {
    const metadata = flowDebugData?.modeMetadata as FlowMetadata | undefined
    const metadataSection = metadata ? (
      <div className="dc:grid dc:grid-cols-2 dc:gap-4 dc:text-sm">
        <div>
          <span className="text-dc-text-muted">{t('results.debug.flow.startingStep')}</span>{' '}
          <span className="text-dc-text">{metadata.startingStep?.name || t('results.debug.flow.notSet')}</span>
        </div>
        <div>
          <span className="text-dc-text-muted">{t('results.debug.flow.eventDimension')}</span>{' '}
          <span className="text-dc-text">{metadata.eventDimension || t('results.debug.flow.notSet')}</span>
        </div>
        <div>
          <span className="text-dc-text-muted">{t('results.debug.flow.stepsBefore')}</span>{' '}
          <span className="text-dc-text">{metadata.stepsBefore ?? t('results.debug.flow.notSet')}</span>
        </div>
        <div>
          <span className="text-dc-text-muted">{t('results.debug.flow.stepsAfter')}</span>{' '}
          <span className="text-dc-text">{metadata.stepsAfter ?? t('results.debug.flow.notSet')}</span>
        </div>
      </div>
    ) : null

    return renderModeDebug({
      label: t('results.debug.flow.label'),
      badgeText: metadata ? `${metadata.stepsBefore} before, ${metadata.stepsAfter} after` : undefined,
      serverQuery: flowServerQuery,
      serverQueryTitle: t('results.debug.flow.serverQuery'),
      serverQueryMissing: (
        <>
          <h4 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">{t('results.debug.flow.serverQuery')}</h4>
          <div className="bg-dc-surface-secondary dc:border border-dc-border dc:rounded dc:p-3 text-dc-text-muted dc:text-sm dc:h-64 dc:overflow-auto">
            {t('results.debug.flow.noQuery')}
          </div>
        </>
      ),
      debugData: flowDebugData,
      sqlPlaceholder: t('results.debug.flow.sqlPlaceholder'),
      explainResult: flowExplainResult,
      explainLoading: flowExplainLoading,
      explainHasRun: flowExplainHasRun,
      explainError: flowExplainError,
      runExplain: runFlowExplain,
      metadataTitle: metadataSection ? t('results.debug.flow.configTitle') : undefined,
      metadataSection,
      responseSection: renderStandardResponseBlock(t('results.debug.flow.responseTitle')),
    })
  }

  const renderDebug = () => {
    if (isFunnelMode) return renderFunnelDebug()
    if (isRetentionMode) return renderRetentionDebug()
    if (isFlowMode) return renderFlowDebug()
    return renderStandardDebug()
  }

  // Determine if we're in multi-query mode (but NOT funnel mode)
  // Funnel mode always shows unified results, not per-query tables
  const isMultiQuery = computeIsMultiQuery(isFunnelMode, queryCount, perQueryResults)

  // Render flow-specific table view showing nodes and links
  const renderFlowTable = () => {
    // Flow results from server are wrapped: [{ nodes: [...], links: [...] }]
    // The executor returns data: [flowData] where flowData = { nodes, links }
    let nodes: Record<string, unknown>[] = []
    let links: Record<string, unknown>[] = []

    if (!executionResults || (Array.isArray(executionResults) && executionResults.length === 0)) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted">
          <div className="dc:text-center">
            <TableIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('results.flow.noData')}</div>
            <div className="dc:text-xs">{t('results.flow.noDataHint')}</div>
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
          <div className="dc:text-center">
            <TableIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('results.flow.noData')}</div>
            <div className="dc:text-xs">{t('results.flow.noDataHint')}</div>
          </div>
        </div>
      )
    }

    return (
      <div className="dc:h-full dc:overflow-auto dc:p-4 dc:space-y-6">
        {/* Nodes Table */}
        <div>
          <h3 className="dc:text-sm dc:font-semibold text-dc-text dc:mb-2">
            {t('results.flow.nodes', { count: nodes.length })}
          </h3>
          <div className="dc:border border-dc-border dc:rounded dc:overflow-hidden">
            <table className="dc:w-full dc:text-sm">
              <thead className="bg-dc-surface-secondary">
                <tr>
                  <th className="dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">{t('results.flow.layer')}</th>
                  <th className="dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">{t('results.flow.name')}</th>
                  <th className="dc:px-3 dc:py-2 dc:text-right dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">{t('results.flow.count')}</th>
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
                      <td className="dc:px-3 dc:py-2 dc:text-right text-dc-text dc:font-mono">
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
            {t('results.flow.transitions', { count: links.length })}
          </h3>
          <div className="dc:border border-dc-border dc:rounded dc:overflow-hidden">
            <table className="dc:w-full dc:text-sm">
              <thead className="bg-dc-surface-secondary">
                <tr>
                  <th className="dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">{t('results.flow.from')}</th>
                  <th className="dc:px-3 dc:py-2 dc:text-center dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">→</th>
                  <th className="dc:px-3 dc:py-2 dc:text-left dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">{t('results.flow.to')}</th>
                  <th className="dc:px-3 dc:py-2 dc:text-right dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wider">{t('results.flow.count')}</th>
                </tr>
              </thead>
              <tbody className="dc:divide-y divide-dc-border bg-dc-surface">
                {links.map((link: Record<string, unknown>, idx: number) => {
                  const { sourceName, targetName } = flowLinkNames(link)

                  return (
                    <tr key={idx} className="hover:bg-dc-surface-hover">
                      <td className="dc:px-3 dc:py-2 text-dc-text">{sourceName}</td>
                      <td className="dc:px-3 dc:py-2 dc:text-center text-dc-text-muted">→</td>
                      <td className="dc:px-3 dc:py-2 text-dc-text">{targetName}</td>
                      <td className="dc:px-3 dc:py-2 dc:text-right text-dc-text dc:font-mono">
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
    const { tableData, tableQuery } = selectTableData({
      tableIndex,
      isMultiQuery,
      allQueries,
      perQueryResults,
      executionResults,
      combinedQueryForChart
    })

    if (!tableData || tableData.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:h-full text-dc-text-muted">
          <div className="dc:text-center">
            <TableIcon className="dc:w-12 dc:h-12 dc:mx-auto dc:mb-3 dc:opacity-50" />
            <div className="dc:text-sm dc:font-semibold dc:mb-1">No data to display</div>
            <div className="dc:text-xs">{t('results.table.noDataHint')}</div>
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
      <div className="dc:text-center">
        <div
          className="dc:animate-spin dc:rounded-full dc:h-10 dc:w-10 dc:border-b-2 dc:mx-auto dc:mb-2"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="dc:text-xs text-dc-text-secondary">{t('results.refreshing')}</div>
      </div>
    </div>
  )

  // Header prop groups — cohesive slices passed to ResultsHeader (see its
  // ResultsSummary / ResultsToolbarActions / ResultsDisplayFlags types).
  const headerSummary: ResultsSummary = {
    executionResults,
    executionStatus,
    totalRowCount,
    resultsStale,
    executionError,
    debugDataPerQuery,
  }

  const headerToolbar: ResultsToolbarActions = {
    displayLimit,
    onDisplayLimitChange,
    isAIOpen,
    onAIToggle,
    onColorPaletteChange,
    currentPaletteName,
    onShareClick,
    shareButtonState,
    canShare,
    onRefreshClick,
    canRefresh,
    isRefreshing,
    showCacheBustIndicator,
    setIsHoveringRefresh,
    onClearClick,
    canClear,
    setIsClearConfirmOpen,
    setShowDebug,
    setShowSchema,
  }

  const headerDisplay: ResultsDisplayFlags = {
    activeView,
    showDebug,
    showSchema,
    enableAI,
    isFunnelMode,
    showSchemaDiagram: !!features.showSchemaDiagram,
  }

  // Render header - shown whenever we have query content
  const renderHeader = () => (
    <ResultsHeader summary={headerSummary} toolbar={headerToolbar} display={headerDisplay} />
  )

  // "Needs refresh" banner for manual refresh mode
  const renderNeedsRefreshBanner = () => {
    if (!needsRefresh || !onRefreshClick) return null

    return (
      <div className="dc:px-4 dc:py-2 bg-dc-warning-bg dc:border-b border-dc-warning dc:flex dc:items-center dc:justify-between dc:gap-3 dc:flex-shrink-0">
        <div className="dc:flex dc:items-center dc:gap-2 text-dc-warning">
          <svg className="dc:w-4 dc:h-4 dc:flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="dc:text-sm dc:font-medium">{t('results.warning.configChanged')}</span>
        </div>
        <button
          onClick={() => onRefreshClick()}
          className="dc:px-3 dc:py-1 dc:text-xs dc:font-medium bg-dc-warning text-white dc:rounded hover:bg-dc-warning/90 dc:transition-colors"
        >
          {t('results.warning.refreshNow')}
        </button>
      </div>
    )
  }

  // Query warnings banner (e.g., fan-out without dimensions)
  const renderWarningsBanner = () => {
    if (!warnings || warnings.length === 0) return null

    return (
      <>
        {warnings.map((warning, index) => {
          const WarningIcon = getIcon('warning')
          const isError = warning.severity === 'error'
          const bgClass = isError ? 'bg-dc-danger-bg' : 'bg-dc-warning-bg'
          const borderClass = isError ? 'border-dc-error' : 'border-dc-warning'
          const textClass = isError ? 'text-dc-error' : 'text-dc-warning'

          return (
            <div
              key={`${warning.code}-${index}`}
              className={`dc:px-4 dc:py-2 ${bgClass} dc:border-b ${borderClass} dc:flex dc:items-start dc:gap-3 dc:flex-shrink-0`}
            >
              <WarningIcon className={`dc:w-4 dc:h-4 dc:flex-shrink-0 dc:mt-0.5 ${textClass}`} />
              <div className="dc:flex-1 dc:min-w-0">
                <div className={`dc:text-sm dc:font-medium ${textClass}`}>
                  {warning.message}
                </div>
                {warning.suggestion && (
                  <div className={`dc:text-xs dc:mt-1 ${textClass} dc:opacity-80`}>
                    💡 {warning.suggestion}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </>
    )
  }

  // Success state with data
  // Schema / debug / chart / table content area for a successful result
  const renderResultsContent = () => {
    if (showSchema) {
      return (
        <React.Suspense fallback={null}><SchemaVisualizationLazy height="100%" highlightedFields={highlightedFields} onFieldClick={onSchemaFieldClick} /></React.Suspense>
      )
    }
    if (showDebug) return renderDebug()
    if (activeView === 'chart') return <div className="dc:p-4 dc:h-full">{renderChart()}</div>
    if (isFlowMode) return <div className="dc:h-full" key="table-flow">{renderFlowTable()}</div>
    if (isMultiQuery) return <div className="dc:h-full" key={`table-${activeTableIndex}`}>{renderTable(activeTableIndex)}</div>
    return <div className="dc:h-full" key="table-single">{renderTable()}</div>
  }

  // Per-query + merged table buttons shown in multi-query mode
  const renderMultiQueryTableButtons = () => (
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
        {t('results.view.merged')}
      </button>
    </>
  )

  // Chart / table view toggle, centered below the content
  const renderViewToggle = () => (
    <div className="dc:px-4 dc:py-3 dc:border-t border-dc-border bg-dc-surface dc:flex dc:justify-center dc:flex-shrink-0">
      <div className="dc:flex dc:items-center bg-dc-surface-secondary dc:border border-dc-border dc:rounded-md dc:overflow-hidden">
        {/* Chart button - enabled when the selected chart type can render with the current query */}
        <button
          onClick={() => chartViewEnabled && onActiveViewChange('chart')}
          disabled={!chartViewEnabled}
          className={`dc:flex dc:items-center dc:gap-1.5 dc:px-4 dc:py-1.5 dc:text-sm dc:font-medium dc:transition-colors ${
            activeView === 'chart'
              ? 'bg-dc-primary text-white'
              : !chartViewEnabled
                ? 'text-dc-text-disabled bg-dc-surface-tertiary dc:cursor-not-allowed'
                : 'text-dc-text-secondary hover:bg-dc-surface-hover'
          }`}
          title={chartButtonTitle}
        >
          <ChartIcon className="dc:w-4 dc:h-4" />
          {t('results.view.chart')}
        </button>

        {/* Table buttons - show multiple when in multi-query mode */}
        {isMultiQuery ? renderMultiQueryTableButtons() : (
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
            {t('results.view.table')}
          </button>
        )}
      </div>
    </div>
  )

  const renderSuccess = () => {
    const hasResults = executionResults && executionResults.length > 0

    if (!hasResults) {
      return (
        <div className="dc:h-full dc:flex dc:flex-col">
          {renderHeader()}
          <div className="dc:flex-1 dc:min-h-0 dc:relative dc:overflow-auto">
            {showSchema ? (
              <React.Suspense fallback={null}><SchemaVisualizationLazy height="100%" highlightedFields={highlightedFields} onFieldClick={onSchemaFieldClick} /></React.Suspense>
            ) : showDebug ? renderDebug() : renderNoData()}
          </div>
        </div>
      )
    }

    return (
      <div className="dc:h-full dc:flex dc:flex-col">
        {renderHeader()}
        {renderNeedsRefreshBanner()}
        {renderWarningsBanner()}

        {/* Results Content */}
        <div className="dc:flex-1 dc:min-h-0 dc:relative dc:overflow-auto">
          {renderResultsContent()}
        </div>

        {/* View Toggle - Below content, centered */}
        {!showDebug && !showSchema && renderViewToggle()}
      </div>
    )
  }

  // Determine what to render based on execution status
  // Check for meaningful results - handles different data structures per mode
  const hasResults = useMemo(
    () => computeHasResults(executionResults, isFlowMode, isRetentionMode, retentionChartData),
    [executionResults, isFlowMode, isRetentionMode, retentionChartData]
  )

  // Don't show results if we're in idle state with no query content (cleared state)
  const shouldShowResults = hasResults && (executionStatus !== 'idle' || hasModeSpecificContent)

  // Main content based on execution status (overlay + modal handled by the wrapper)
  const renderMainContent = () => (
    <>
      {executionStatus === 'idle' && !hasModeSpecificContent && renderEmpty()}
      {executionStatus === 'idle' && hasModeSpecificContent && !hasResults && renderWaiting()}
      {executionStatus === 'loading' && !hasResults && renderLoading()}
      {executionStatus === 'error' && !hasResults && renderError()}
      {(executionStatus === 'success' || shouldShowResults) && renderSuccess()}
    </>
  )

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
      {renderMainContent()}

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

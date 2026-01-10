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
  funnelDebugData
}: AnalysisResultsPanelProps) {
  // Determine funnel mode from analysisType (preferred) or legacy prop
  const isFunnelMode = analysisType === 'funnel' || isFunnelModeProp
  // Debug view toggle state
  const [showDebug, setShowDebug] = useState(false)
  // Active debug query tab (independent of main query tabs)
  const [activeDebugIndex, setActiveDebugIndex] = useState(0)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)

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

    // Don't force table view in funnel mode - funnel charts work differently
    // Check both analysisType directly AND computed isFunnelMode to avoid stale closure issues
    if (analysisType === 'funnel' || isFunnelMode) return

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
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="text-sm font-semibold text-dc-text-secondary mb-1">
          Executing Query...
        </div>
        <div className="text-xs text-dc-text-muted">
          Running your query against the cube API
        </div>
      </div>
    </div>
  )

  // Error state - no previous results
  const renderError = () => (
    <div className="h-full flex flex-col">
      {renderHeader()}
      <div className="flex-1 flex items-center justify-center p-4">
        {showDebug ? (
          <div className="w-full h-full overflow-auto">
            {renderDebug()}
          </div>
        ) : (
          <div className="text-center max-w-md">
            <ErrorIcon className="w-12 h-12 mx-auto text-dc-error mb-4" />
            <div className="text-sm font-semibold text-dc-text mb-2">
              Query Execution Failed
            </div>
            <div className="text-sm text-dc-text-secondary mb-4">
              There was an error executing your query. Please check the query and try again.
            </div>
            {executionError && (
              <div className="bg-dc-danger-bg border border-dc-error rounded-lg p-3 text-left">
                <div className="text-xs font-mono text-dc-error break-words">
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

  // Waiting state - query built but not yet executed (debounce period)
  const renderWaiting = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="text-sm font-semibold text-dc-text-secondary mb-1">
          Preparing Query...
        </div>
        <div className="text-xs text-dc-text-muted">
          Your query will execute shortly
        </div>
      </div>
    </div>
  )

  // Empty state - no query built yet
  const renderEmpty = () => (
    <div className="h-full flex items-center justify-center pt-6">
      <div className="text-center mb-16">
        <ChartIcon className="w-12 h-12 mx-auto text-dc-text-muted mb-3" />
        <div className="text-sm font-semibold text-dc-text-secondary mb-1">
          No Results Yet
        </div>
        <div className="text-xs text-dc-text-muted mb-4">
          Add metrics or breakdowns from the panel on the right to see results
        </div>
        {/* Prominent AI button when enabled */}
        {enableAI && onAIToggle && (
          <button
            onClick={onAIToggle}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-dc-accent hover:bg-dc-accent rounded-lg transition-colors shadow-sm"
          >
            <SparklesIcon className="w-4 h-4" />
            Analyse with AI
          </button>
        )}
      </div>
    </div>
  )

  // No data returned state
  const renderNoData = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <SuccessIcon className="w-12 h-12 mx-auto text-dc-success mb-3" />
        <div className="text-sm font-semibold text-dc-text mb-1">
          Query Successful
        </div>
        <div className="text-xs text-dc-text-muted">
          No data returned from the query
        </div>
      </div>
    </div>
  )

  // Render chart
  const renderChart = () => {
    if (!executionResults || executionResults.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-dc-text-muted">
          <div className="text-center">
            <ChartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="text-sm font-semibold mb-1">No data to display</div>
            <div className="text-xs">Run a query to see chart visualization</div>
          </div>
        </div>
      )
    }

    if (!isValidChartType(chartType)) {
      return (
        <div className="flex items-center justify-center h-full text-dc-text-muted">
          <div className="text-center">
            <WarningIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="text-sm font-semibold mb-1">Unsupported chart type</div>
            <div className="text-xs">{chartType}</div>
          </div>
        </div>
      )
    }

    return (
      <LazyChart
        chartType={chartType}
        data={executionResults}
        chartConfig={chartConfig}
        displayConfig={displayConfig}
        colorPalette={colorPalette}
        queryObject={combinedQueryForChart}
        height="100%"
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse bg-dc-surface-secondary rounded w-full h-full" />
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
      <div className="p-4 space-y-4 overflow-auto h-full">
        {/* Funnel Mode Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 text-xs font-medium bg-dc-accent text-white rounded">Funnel Query</span>
          {funnelMeta?.stepCount && (
            <span className="text-xs text-dc-text-muted">
              {funnelMeta.stepCount} steps
            </span>
          )}
          {funnelLoading && (
            <span className="text-xs text-dc-text-muted animate-pulse">Loading SQL...</span>
          )}
        </div>

        {/* Execution Error Banner (if any) */}
        {executionError && (
          <div className="bg-dc-danger-bg dark:bg-dc-danger-bg border border-dc-error dark:border-dc-error rounded p-3">
            <h4 className="text-sm font-semibold text-dc-error dark:text-dc-error mb-1">
              Execution Error
            </h4>
            <p className="text-sm text-dc-error dark:text-dc-error">{executionError}</p>
          </div>
        )}

        {/* Funnel Server Query and Generated SQL in 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Server Query (the actual { funnel: {...} } sent to server) */}
          <div>
            {funnelServerQuery ? (
              <CodeBlock
                code={JSON.stringify(funnelServerQuery, null, 2)}
                language="json"
                title="Funnel Server Query"
                height="20rem"
              />
            ) : (
              <>
                <h4 className="text-sm font-semibold text-dc-text mb-2">Funnel Server Query</h4>
                <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm h-80 overflow-auto">
                  No funnel query configured
                </div>
              </>
            )}
          </div>

          {/* Generated SQL (the unified CTE-based funnel SQL) */}
          <div>
            {funnelLoading ? (
              <>
                <h4 className="text-sm font-semibold text-dc-text mb-2">Generated SQL</h4>
                <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm h-80 overflow-auto animate-pulse">
                  Loading funnel SQL...
                </div>
              </>
            ) : funnelError ? (
              <>
                <h4 className="text-sm font-semibold text-dc-text mb-2">Generated SQL</h4>
                <div className="text-dc-error text-sm bg-dc-danger-bg dark:bg-dc-danger-bg p-3 rounded border border-dc-error dark:border-dc-error h-80 overflow-auto">
                  {funnelError.message}
                </div>
              </>
            ) : funnelSql ? (
              <CodeBlock
                code={
                  funnelSql.sql +
                  (funnelSql.params && funnelSql.params.length > 0
                    ? '\n\n-- Parameters:\n' + JSON.stringify(funnelSql.params, null, 2)
                    : '')
                }
                language="sql"
                title="Generated SQL (CTE-based)"
                height="20rem"
              />
            ) : (
              <>
                <h4 className="text-sm font-semibold text-dc-text mb-2">Generated SQL</h4>
                <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm h-80 overflow-auto">
                  Configure funnel binding key to generate SQL
                </div>
              </>
            )}
          </div>
        </div>

        {/* Funnel Metadata (step info) */}
        {funnelMeta && (
          <div>
            <h4 className="text-sm font-semibold text-dc-text mb-2">Funnel Steps</h4>
            <div className="bg-dc-surface-secondary border border-dc-border rounded p-3">
              <div className="flex flex-wrap gap-2">
                {funnelMeta.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-dc-bg border border-dc-border rounded text-sm">
                    <span className="w-5 h-5 flex items-center justify-center bg-dc-accent text-white text-xs rounded-full">
                      {idx + 1}
                    </span>
                    <span className="text-dc-text">{step.name}</span>
                    {step.timeToConvert && (
                      <span className="text-xs text-dc-text-muted">({step.timeToConvert})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart Config & Display Config in 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <h4 className="text-sm font-semibold text-dc-text mb-2">Server Response</h4>
              <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm">
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
    <div className="p-4 space-y-4 overflow-auto h-full">
      {/* Query tabs for multi-query mode */}
      {debugDataPerQuery.length > 1 && (
        <div className="flex items-center gap-1 mb-4">
          <span className="text-xs font-medium text-dc-text-muted mr-2">Query:</span>
          <div className="flex border border-dc-border rounded-md overflow-hidden">
            {debugDataPerQuery.map((data, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDebugIndex(idx)}
                className={`px-3 py-1 text-xs font-medium transition-colors border-r last:border-r-0 border-dc-border ${
                  activeDebugIndex === idx
                    ? 'bg-dc-accent text-white'
                    : 'bg-dc-bg text-dc-text-secondary hover:bg-dc-bg-secondary'
                }`}
              >
                Q{idx + 1}
                {data.loading && (
                  <span className="ml-1 opacity-70">•</span>
                )}
                {data.error && (
                  <span className="ml-1 text-dc-error">!</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Execution Error Banner (if any) */}
      {executionError && (
        <div className="bg-dc-danger-bg dark:bg-dc-danger-bg border border-dc-error dark:border-dc-error rounded p-3">
          <h4 className="text-sm font-semibold text-dc-error dark:text-dc-error mb-1">
            Execution Error
          </h4>
          <p className="text-sm text-dc-error dark:text-dc-error">{executionError}</p>
        </div>
      )}

      {/* Query Analysis - full width (at top for visibility) */}
      <div>
        <h4 className="text-sm font-semibold text-dc-text mb-2">Query Analysis</h4>
        {debugLoading ? (
          <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm">
            Loading...
          </div>
        ) : debugAnalysis ? (
          <div className="bg-dc-surface-secondary border border-dc-border rounded p-3">
            <QueryAnalysisPanel analysis={debugAnalysis} />
          </div>
        ) : (
          <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm">
            {debugError ? 'Analysis unavailable due to error' : 'Add metrics to see analysis'}
          </div>
        )}
      </div>

      {/* Cube Query and SQL Query in 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cube Query */}
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
                <div className="mt-1 text-xs text-dc-text-muted">
                  <span className="text-dc-accent">ℹ</span> This query includes an IN filter with binding key values from the previous step
                </div>
              )}
            </>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-dc-text mb-2">Cube Query</h4>
              <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm h-64 overflow-auto">
                No query
              </div>
            </>
          )}
        </div>

        {/* Generated SQL */}
        <div>
          {debugLoading ? (
            <>
              <h4 className="text-sm font-semibold text-dc-text mb-2">Generated SQL</h4>
              <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm h-64 overflow-auto">
                Loading...
              </div>
            </>
          ) : debugError ? (
            <>
              <h4 className="text-sm font-semibold text-dc-text mb-2">Generated SQL</h4>
              <div className="text-dc-error text-sm bg-dc-danger-bg dark:bg-dc-danger-bg p-3 rounded border border-dc-error dark:border-dc-error h-64 overflow-auto">
                {debugError.message}
              </div>
            </>
          ) : debugSql ? (
            <CodeBlock
              code={
                debugSql.sql +
                (debugSql.params && debugSql.params.length > 0
                  ? '\n\n-- Parameters:\n' + JSON.stringify(debugSql.params, null, 2)
                  : '')
              }
              language="sql"
              title="Generated SQL"
              height="16rem"
            />
          ) : (
            <>
              <h4 className="text-sm font-semibold text-dc-text mb-2">Generated SQL</h4>
              <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm h-64 overflow-auto">
                Add metrics to generate SQL
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Config & Display Config in 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <h4 className="text-sm font-semibold text-dc-text mb-2">Server Response</h4>
            <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm">
              No results yet
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Route to appropriate debug view based on mode
  const renderDebug = () => {
    if (isFunnelMode) {
      return renderFunnelDebug()
    }
    return renderStandardDebug()
  }

  // Determine if we're in multi-query mode (but NOT funnel mode)
  // Funnel mode always shows unified results, not per-query tables
  const isMultiQuery = !isFunnelMode && queryCount > 1 && perQueryResults && perQueryResults.length > 1

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
        <div className="flex items-center justify-center h-full text-dc-text-muted">
          <div className="text-center">
            <TableIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="text-sm font-semibold mb-1">No data to display</div>
            <div className="text-xs">Run a query to see table data</div>
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
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse bg-dc-surface-secondary rounded w-full h-full" />
          </div>
        }
      />
    )
  }

  // Overlay spinner for refreshing
  const renderOverlaySpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-dc-surface bg-opacity-75 z-10">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-2"
          style={{ borderBottomColor: 'var(--dc-primary)' }}
        />
        <div className="text-xs text-dc-text-secondary">Refreshing results...</div>
      </div>
    </div>
  )

  // Render header - shown whenever we have query content
  const renderHeader = () => {
    const hasResults = executionResults && executionResults.length > 0

    return (
      <div className="px-4 py-2 border-b border-dc-border bg-dc-surface-secondary flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left side: Status and row count */}
          <div className="flex items-center">
            {executionStatus === 'refreshing' ? (
              <div
                className="w-4 h-4 mr-2 rounded-full border-b-2 animate-spin"
                style={{ borderBottomColor: 'var(--dc-primary)' }}
              />
            ) : hasResults ? (
              <SuccessIcon className="w-4 h-4 text-dc-success mr-2" />
            ) : executionStatus === 'error' ? (
              <ErrorIcon className="w-4 h-4 text-dc-error mr-2" />
            ) : (
              <WarningIcon className="w-4 h-4 text-dc-text-muted mr-2" />
            )}
            <span className="text-sm text-dc-text-secondary">
              {hasResults ? (
                <>
                  {executionResults.length} row{executionResults.length !== 1 ? 's' : ''}
                  {totalRowCount !== null && totalRowCount > executionResults.length && (
                    <span className="text-dc-text-muted"> of {totalRowCount.toLocaleString()}</span>
                  )}
                  {resultsStale && (
                    <span className="text-dc-warning ml-2">• Results may be outdated</span>
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
          <div className="flex items-center gap-2">
            {/* Display Limit (only for table view) */}
            {hasResults && activeView === 'table' && !showDebug && onDisplayLimitChange && (
              <select
                value={displayLimit}
                onChange={(e) => onDisplayLimitChange(Number(e.target.value))}
                className="text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text focus:outline-none focus:ring-1 focus:ring-dc-primary"
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
                className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                  isAIOpen
                    ? 'text-white bg-dc-accent border border-dc-accent'
                    : 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg'
                }`}
                title={isAIOpen ? 'Close AI assistant' : 'Analyse with AI'}
              >
                <SparklesIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Analyse with AI</span>
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
                className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                  shareButtonState === 'idle' && canShare
                    ? 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg'
                    : shareButtonState !== 'idle'
                    ? 'text-dc-success dark:text-dc-success bg-dc-success-bg dark:bg-dc-success-bg border border-dc-success dark:border-dc-success'
                    : 'text-dc-text-muted bg-dc-surface-secondary border border-dc-border cursor-not-allowed'
                }`}
                title={shareButtonState === 'idle' ? 'Share this analysis' : 'Link copied!'}
                disabled={!canShare || shareButtonState !== 'idle'}
              >
                {shareButtonState === 'idle' ? (
                  <>
                    <ShareIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                ) : shareButtonState === 'copied' ? (
                  <>
                    <CheckIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Copied!</span>
                    <span className="hidden lg:inline text-[10px] opacity-75">(no chart)</span>
                  </>
                )}
              </button>
            )}

            {/* Refresh Button */}
            {onRefreshClick && canRefresh && (
              <button
                onClick={onRefreshClick}
                disabled={isRefreshing}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                  isRefreshing
                    ? 'text-dc-text-muted bg-dc-surface-secondary border border-dc-border cursor-wait'
                    : 'text-dc-accent bg-dc-accent-bg border border-dc-accent hover:bg-dc-accent-bg'
                }`}
                title={isRefreshing ? 'Refreshing...' : 'Refresh data'}
              >
                <RefreshIcon className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
              </button>
            )}

            {/* Clear Button */}
            {onClearClick && canClear && (
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface hover:bg-dc-surface-hover border border-dc-border rounded transition-colors"
                title={isFunnelMode ? 'Clear funnel' : 'Clear all query data'}
              >
                <TrashIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            {/* Debug Toggle Button */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`p-1.5 rounded transition-colors relative ${
                showDebug
                  ? 'bg-dc-primary text-white'
                  : 'text-dc-text-secondary hover:text-dc-text hover:bg-dc-surface-hover'
              }`}
              title={showDebug ? 'Hide debug info' : 'Show debug info'}
            >
              <CodeIcon className="w-4 h-4" />
              {/* Error indicator dot - show if ANY query has an error */}
              {(executionError || debugDataPerQuery.some(d => d.error)) && !showDebug && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-dc-danger-bg0 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Performance Warning */}
        {hasResults && totalRowCount !== null && totalRowCount > 1000 && (
          <div className="mt-2 bg-dc-warning-bg border border-dc-warning rounded-lg p-2 flex items-start">
            <WarningIcon className="w-4 h-4 text-dc-warning mr-2 shrink-0 mt-0.5" />
            <div className="text-xs text-dc-warning">
              <span className="font-semibold">Large dataset:</span> {totalRowCount.toLocaleString()} rows.
              Consider adding filters to improve performance.
            </div>
          </div>
        )}
      </div>
    )
  }

  // Success state with data
  const renderSuccess = () => {
    const hasResults = executionResults && executionResults.length > 0

    if (!hasResults) {
      return (
        <div className="h-full flex flex-col">
          {renderHeader()}
          <div className="flex-1 min-h-0 relative overflow-auto">
            {showDebug ? renderDebug() : renderNoData()}
          </div>
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col">
        {renderHeader()}

        {/* Results Content */}
        <div className="flex-1 min-h-0 relative overflow-auto">
          {showDebug ? (
            renderDebug()
          ) : activeView === 'chart' ? (
            <div className="p-4 h-full">{renderChart()}</div>
          ) : isMultiQuery ? (
            <div className="h-full" key={`table-${activeTableIndex}`}>{renderTable(activeTableIndex)}</div>
          ) : (
            <div className="h-full" key="table-single">{renderTable()}</div>
          )}
        </div>

        {/* View Toggle - Below content, centered */}
        {!showDebug && (
          <div className="px-4 py-3 border-t border-dc-border bg-dc-surface flex justify-center flex-shrink-0">
            <div className="flex items-center bg-dc-surface-secondary border border-dc-border rounded-md overflow-hidden">
              {/* Chart button */}
              <button
                onClick={() => hasMetrics && onActiveViewChange('chart')}
                disabled={!hasMetrics}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeView === 'chart'
                    ? 'bg-dc-primary text-white'
                    : !hasMetrics
                      ? 'text-dc-text-disabled bg-dc-surface-tertiary cursor-not-allowed'
                      : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                }`}
                title={hasMetrics ? 'Chart view' : 'Add metrics to enable chart view'}
              >
                <ChartIcon className="w-4 h-4" />
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                        activeView === 'table' && activeTableIndex === index
                          ? 'bg-dc-primary text-white'
                          : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                      }`}
                      title={`Table Q${index + 1}`}
                    >
                      <TableIcon className="w-4 h-4" />
                      Q{index + 1}
                    </button>
                  ))}
                  {/* Merged table button */}
                  <button
                    onClick={() => {
                      onActiveViewChange('table')
                      onActiveTableChange?.(-1)  // -1 = merged view
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeView === 'table' && activeTableIndex === -1
                        ? 'bg-dc-primary text-white'
                        : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                    }`}
                    title="Merged table view"
                  >
                    <TableIcon className="w-4 h-4" />
                    Merged
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onActiveViewChange('table')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeView === 'table'
                      ? 'bg-dc-primary text-white'
                      : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                  }`}
                  title="Table view"
                >
                  <TableIcon className="w-4 h-4" />
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
  const hasResults = executionResults !== null

  // Don't show results if we're in idle state with no query content (cleared state)
  const shouldShowResults = hasResults && (executionStatus !== 'idle' || hasQueryContent)

  return (
    <div className="h-full min-h-[400px] flex flex-col bg-dc-surface relative">
      {/* Main content */}
      {executionStatus === 'idle' && !hasQueryContent && renderEmpty()}
      {executionStatus === 'idle' && hasQueryContent && !hasResults && renderWaiting()}
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

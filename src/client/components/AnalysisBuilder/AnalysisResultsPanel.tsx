/**
 * AnalysisResultsPanel Component
 *
 * Displays query execution results with chart and table views.
 * Used in the left panel of AnalysisBuilder.
 */

import { useState, useEffect, useMemo, memo } from 'react'
import type { AnalysisResultsPanelProps } from './types'
import { LazyChart, isValidChartType } from '../../charts/ChartLoader'
import { getIcon } from '../../icons'
import { QueryAnalysisPanel, CodeBlock } from '../../shared'
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
  activeView = 'chart',
  onActiveViewChange,
  displayLimit = 100,
  onDisplayLimitChange,
  hasMetrics = false,
  // Debug props
  debugQuery,
  debugSql,
  debugAnalysis,
  debugLoading,
  debugError,
  // Share props
  onShareClick,
  canShare = false,
  shareButtonState = 'idle',
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
  onActiveTableChange
}: AnalysisResultsPanelProps) {
  // Debug view toggle state
  const [showDebug, setShowDebug] = useState(false)
  // Force table view when no metrics are selected
  useEffect(() => {
    if (!hasMetrics && activeView === 'chart') {
      onActiveViewChange('table')
    }
  }, [hasMetrics, activeView, onActiveViewChange])

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

  // Render debug view
  const renderDebug = () => (
    <div className="p-4 space-y-4 overflow-auto h-full">
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
            <CodeBlock
              code={JSON.stringify(debugQuery, null, 2)}
              language="json"
              title="Cube Query"
              height="16rem"
            />
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
                {debugError}
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

  // Determine if we're in multi-query mode
  const isMultiQuery = queryCount > 1 && perQueryResults && perQueryResults.length > 1

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

            {/* Clear Button */}
            {onClearClick && canClear && (
              <button
                onClick={onClearClick}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface hover:bg-dc-surface-hover border border-dc-border rounded transition-colors"
                title="Clear all query data"
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
              {/* Error indicator dot */}
              {(executionError || debugError) && !showDebug && (
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
            <div className="h-full">{renderTable(activeTableIndex)}</div>
          ) : (
            <div className="h-full">{renderTable()}</div>
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
    </div>
  )
})

export default AnalysisResultsPanel

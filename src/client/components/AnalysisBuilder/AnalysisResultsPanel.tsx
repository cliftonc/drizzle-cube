/**
 * AnalysisResultsPanel Component
 *
 * Displays query execution results with chart and table views.
 * Used in the left panel of AnalysisBuilder.
 */

import { useState, useEffect } from 'react'
import type { AnalysisResultsPanelProps } from './types'
import { LazyChart, isValidChartType } from '../../charts/ChartLoader'
import { getIcon } from '../../icons'
import { QueryAnalysisPanel } from '../../shared'

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
export default function AnalysisResultsPanel({
  executionStatus,
  executionResults,
  executionError,
  totalRowCount,
  resultsStale = false,
  chartType = 'line',
  chartConfig = {},
  displayConfig = {},
  query,
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
  debugError
}: AnalysisResultsPanelProps) {
  // Debug view toggle state
  const [showDebug, setShowDebug] = useState(false)
  // Force table view when no metrics are selected
  useEffect(() => {
    if (!hasMetrics && activeView === 'chart') {
      onActiveViewChange('table')
    }
  }, [hasMetrics, activeView, onActiveViewChange])
  // Icons
  const SuccessIcon = getIcon('success')
  const ErrorIcon = getIcon('error')
  const WarningIcon = getIcon('warning')
  const TableIcon = getIcon('table')
  const ChartIcon = getIcon('measure')
  const TimeIcon = getIcon('timeDimension')
  const CodeIcon = getIcon('codeBracket')

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
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <ErrorIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <div className="text-sm font-semibold text-dc-text mb-2">
          Query Execution Failed
        </div>
        <div className="text-sm text-dc-text-secondary mb-4">
          There was an error executing your query. Please check the query and try again.
        </div>
        {executionError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
            <div className="text-xs font-mono text-red-800 break-words">
              {executionError}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Check if query has any content (pending execution)
  const hasQueryContent = !!(
    (query.measures && query.measures.length > 0) ||
    (query.dimensions && query.dimensions.length > 0) ||
    (query.timeDimensions && query.timeDimensions.length > 0)
  )

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
        <TimeIcon className="w-12 h-12 mx-auto text-dc-text-muted mb-3" />
        <div className="text-sm font-semibold text-dc-text-secondary mb-1">
          No Results Yet
        </div>
        <div className="text-xs text-dc-text-muted">
          Add metrics or breakdowns from the panel on the right to see results
        </div>
      </div>
    </div>
  )

  // No data returned state
  const renderNoData = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <SuccessIcon className="w-12 h-12 mx-auto text-green-500 mb-3" />
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
        queryObject={query}
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
            Execution Error
          </h4>
          <p className="text-sm text-red-600 dark:text-red-300">{executionError}</p>
        </div>
      )}

      {/* JSON Query and SQL Query in 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* JSON Query */}
        <div>
          <h4 className="text-sm font-semibold text-dc-text mb-2">JSON Query</h4>
          <pre className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-xs overflow-auto max-h-64 text-dc-text-secondary">
            {debugQuery ? JSON.stringify(debugQuery, null, 2) : 'No query'}
          </pre>
        </div>

        {/* Generated SQL */}
        <div>
          <h4 className="text-sm font-semibold text-dc-text mb-2">Generated SQL</h4>
          {debugLoading ? (
            <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm">
              Loading...
            </div>
          ) : debugError ? (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
              {debugError}
            </div>
          ) : debugSql ? (
            <pre className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-xs overflow-auto max-h-64 text-dc-text-secondary font-mono whitespace-pre-wrap">
              {debugSql.sql}
              {debugSql.params && debugSql.params.length > 0 && (
                <>
                  {'\n\n-- Parameters:\n'}
                  {JSON.stringify(debugSql.params, null, 2)}
                </>
              )}
            </pre>
          ) : (
            <div className="bg-dc-surface-secondary border border-dc-border rounded p-3 text-dc-text-muted text-sm">
              Add metrics to generate SQL
            </div>
          )}
        </div>
      </div>

      {/* Query Analysis - full width */}
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
    </div>
  )

  // Render table
  const renderTable = () => {
    if (!executionResults || executionResults.length === 0) {
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
    const limitedData = executionResults.slice(0, displayLimit)

    return (
      <LazyChart
        chartType="table"
        data={limitedData}
        queryObject={query}
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

  // Success state with data
  const renderSuccess = () => {
    if (!executionResults || executionResults.length === 0) {
      return renderNoData()
    }

    return (
      <div className="h-full flex flex-col">
        {/* Results Header - Compact status bar */}
        <div className="px-4 py-2 border-b border-dc-border bg-dc-surface-secondary flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left side: Status and row count */}
            <div className="flex items-center">
              {executionStatus === 'refreshing' ? (
                <div
                  className="w-4 h-4 mr-2 rounded-full border-b-2 animate-spin"
                  style={{ borderBottomColor: 'var(--dc-primary)' }}
                />
              ) : (
                <SuccessIcon className="w-4 h-4 text-green-500 mr-2" />
              )}
              <span className="text-sm text-dc-text-secondary">
                {executionResults.length} row{executionResults.length !== 1 ? 's' : ''}
                {totalRowCount !== null && totalRowCount > executionResults.length && (
                  <span className="text-dc-text-muted"> of {totalRowCount.toLocaleString()}</span>
                )}
                {resultsStale && (
                  <span className="text-dc-warning ml-2">• Results may be outdated</span>
                )}
              </span>
            </div>

            {/* Right side: Display limit (table only) and Debug toggle */}
            <div className="flex items-center gap-2">
              {/* Display Limit (only for table view) */}
              {activeView === 'table' && !showDebug && onDisplayLimitChange && (
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
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Performance Warning */}
          {totalRowCount !== null && totalRowCount > 1000 && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-start">
              <WarningIcon className="w-4 h-4 text-yellow-600 mr-2 shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <span className="font-semibold">Large dataset:</span> {totalRowCount.toLocaleString()} rows.
                Consider adding filters to improve performance.
              </div>
            </div>
          )}
        </div>

        {/* Results Content */}
        <div className="flex-1 min-h-0 relative overflow-auto">
          {showDebug ? (
            renderDebug()
          ) : activeView === 'chart' ? (
            <div className="p-4 h-full">{renderChart()}</div>
          ) : (
            <div className="h-full">{renderTable()}</div>
          )}
        </div>

        {/* View Toggle - Below content, centered */}
        {!showDebug && (
          <div className="px-4 py-3 border-t border-dc-border bg-dc-surface flex justify-center flex-shrink-0">
            <div className="flex items-center bg-dc-surface-secondary border border-dc-border rounded-md overflow-hidden">
              <button
                onClick={() => hasMetrics && onActiveViewChange('chart')}
                disabled={!hasMetrics}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeView === 'chart'
                    ? 'bg-dc-primary text-white'
                    : !hasMetrics
                      ? 'text-dc-text-muted cursor-not-allowed opacity-50'
                      : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                }`}
                title={hasMetrics ? 'Chart view' : 'Add metrics to enable chart view'}
              >
                <ChartIcon className="w-4 h-4" />
                Chart
              </button>
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
            </div>
          </div>
        )}
      </div>
    )
  }

  // Determine what to render based on execution status
  const hasResults = executionResults !== null

  return (
    <div className="h-full min-h-[400px] flex flex-col bg-dc-surface rounded-lg border border-dc-border relative">
      {/* Main content */}
      {executionStatus === 'idle' && !hasQueryContent && renderEmpty()}
      {executionStatus === 'idle' && hasQueryContent && !hasResults && renderWaiting()}
      {executionStatus === 'loading' && !hasResults && renderLoading()}
      {executionStatus === 'error' && !hasResults && renderError()}
      {(executionStatus === 'success' || hasResults) && renderSuccess()}

      {/* Overlay states */}
      {(executionStatus === 'loading' || executionStatus === 'refreshing') && hasResults && renderOverlaySpinner()}
    </div>
  )
}

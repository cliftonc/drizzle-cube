/**
 * ResultsPanel Component
 *
 * Displays query execution results, loading states, and errors.
 * Supports both table and chart visualization with configurable chart types.
 */

import React, { useState } from 'react'
import { LazyChart, isValidChartType } from '../../charts/ChartLoader'
import ChartTypeSelector from '../ChartTypeSelector'
import ChartConfigPanel from '../ChartConfigPanel'
import type { ResultsPanelProps } from './types'
import { getIcon } from '../../icons'

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  executionStatus,
  executionResults,
  executionError,
  resultsStale = false,
  query,
  displayLimit = 10,
  onDisplayLimitChange,
  totalRowCount,
  totalRowCountStatus,
  // Chart visualization props
  chartType = 'table',
  chartConfig = {},
  displayConfig = {},
  availableFields,
  onChartTypeChange,
  onChartConfigChange,
  onDisplayConfigChange,
  // View state props
  activeView: activeViewProp = 'table',
  onActiveViewChange
}) => {
  // Get icons
  const ErrorIcon = getIcon('error')
  const TimeIcon = getIcon('timeDimension')
  const SuccessIcon = getIcon('success')
  const WarningIcon = getIcon('warning')
  const ChevronDownIcon = getIcon('chevronDown')
  const ChevronUpIcon = getIcon('chevronUp')
  const TableIcon = getIcon('table')
  const MeasureIcon = getIcon('measure')
  const AdjustmentsIcon = getIcon('adjustments')

  // Use prop if provided, otherwise use local state for backwards compatibility
  const [localActiveView, setLocalActiveView] = useState<'table' | 'chart'>('table')
  const activeView = onActiveViewChange ? activeViewProp : localActiveView
  const setActiveView = onActiveViewChange || setLocalActiveView

  // Local state for config panel visibility
  const [showChartConfig, setShowChartConfig] = useState(false)

  const LoadingState = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderBottomColor: 'var(--dc-primary)' }}></div>
        <div className="text-sm font-semibold text-dc-text-secondary mb-1">Executing Query...</div>
        <div className="text-xs text-dc-text-muted">Running your query against the cube API</div>
      </div>
    </div>
  )

  const ErrorState = () => (
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <ErrorIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <div className="text-sm font-semibold text-dc-text mb-2">Query Execution Failed</div>
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

  const OverlaySpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-dc-surface-secondary bg-opacity-80">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-2" style={{ borderBottomColor: 'var(--dc-primary)' }}></div>
        <div className="text-xs text-dc-text-secondary">Refreshing results...</div>
      </div>
    </div>
  )

  const OverlayError = () => (
    <div className="absolute inset-x-4 top-4 bg-red-50 border border-red-200 rounded-lg p-3 text-left shadow">
      <div className="flex items-start gap-2">
        <ErrorIcon className="w-4 h-4 text-red-600 mt-0.5" />
        <div className="text-xs text-red-800">
          {executionError || 'Query execution failed'}
        </div>
      </div>
    </div>
  )

  const EmptyState = () => (
    <div className="h-full flex items-center justify-center pt-6">
      <div className="text-center mb-16">
        <TimeIcon className="w-12 h-12 mx-auto text-dc-text-muted mb-3" />
        <div className="text-sm font-semibold text-dc-text-secondary mb-1">No Results Yet</div>
        <div className="text-xs text-dc-text-muted">Build and run a query to see results here</div>
      </div>
    </div>
  )

  // Render the appropriate chart component using lazy loading
  const renderChart = () => {
    if (!executionResults || executionResults.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-dc-text-muted">
          <div className="text-center">
            <MeasureIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <div className="text-sm font-semibold mb-1">No data to display</div>
            <div className="text-xs">Run a query to see chart visualization</div>
          </div>
        </div>
      )
    }

    const chartHeight = 400
    const data = executionResults

    try {
      // Check if it's a valid chart type for lazy loading
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

      // For markdown chart, use empty data array
      const chartData = chartType === 'markdown' ? [] : data

      return (
        <LazyChart
          chartType={chartType}
          data={chartData}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
          queryObject={query}
          height={chartHeight}
          fallback={
            <div className="flex items-center justify-center" style={{ height: chartHeight }}>
              <div className="animate-pulse bg-dc-surface-secondary rounded w-full h-full" />
            </div>
          }
        />
      )
    } catch (error) {
      console.error('Chart rendering error:', error)
      return (
        <div className="flex items-center justify-center h-full text-dc-text-muted p-4">
          <div className="text-center">
            <ErrorIcon className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <div className="text-sm font-semibold mb-1">Unable to render chart</div>
            <div className="text-xs text-dc-text-secondary">{error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>
        </div>
      )
    }
  }

  const SuccessState = () => {
    if (!executionResults || executionResults.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <SuccessIcon className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <div className="text-sm font-semibold text-gray-700 mb-1">Query Successful</div>
            <div className="text-xs text-gray-500">No data returned from the query</div>
          </div>
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col">
        {/* Results Header with Chart Controls */}
        <div className="p-4 border-b border-dc-border bg-dc-surface-secondary">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left side: Status and row count */}
            <div className="flex items-center">
              {executionStatus === 'refreshing' ? (
                <div
                  className="w-5 h-5 mr-2 rounded-full border-b-2 animate-spin"
                  style={{ borderBottomColor: 'var(--dc-primary)' }}
                />
              ) : (
                <SuccessIcon className="w-5 h-5 text-green-500 mr-2" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-dc-text-secondary">
                  Query Results ({executionResults.length} row{executionResults.length !== 1 ? 's' : ''} shown)
                </span>
                {resultsStale && (
                  <span className="text-xs text-dc-text-muted">Showing previous results while updating.</span>
                )}
                {totalRowCountStatus === 'success' && totalRowCount !== null && totalRowCount !== undefined && (
                  <span className="text-xs text-dc-text-muted">
                    Total: {totalRowCount.toLocaleString()} row{totalRowCount !== 1 ? 's' : ''}
                  </span>
                )}
                {totalRowCountStatus === 'loading' && (
                  <span className="text-xs text-dc-text-muted">
                    Counting total rows...
                  </span>
                )}
              </div>
            </div>

            {/* Right side: View tabs and display limit */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* View Toggle Tabs */}
              <div className="flex items-center bg-dc-surface border border-dc-border rounded-md overflow-hidden">
                <button
                  onClick={() => setActiveView('table')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeView === 'table'
                      ? 'bg-dc-primary text-white'
                      : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Table
                </button>
                <button
                  onClick={() => setActiveView('chart')}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeView === 'chart'
                      ? 'bg-dc-primary text-white'
                      : 'text-dc-text-secondary hover:bg-dc-surface-hover'
                  }`}
                >
                  <MeasureIcon className="w-3.5 h-3.5" />
                  Chart
                </button>
              </div>

              {/* Display Limit (only show for table view) */}
              {activeView === 'table' && onDisplayLimitChange && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-dc-text-secondary">Show:</label>
                  <select
                    value={displayLimit}
                    onChange={(e) => onDisplayLimitChange(Number(e.target.value))}
                    className="text-xs border border-dc-border rounded-sm px-2 py-1 bg-dc-surface text-dc-text focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Chart Controls Row (only show when chart view is active) */}
          {activeView === 'chart' && onChartTypeChange && (
            <div className="mt-3 pt-3 border-t border-dc-border flex items-center justify-between gap-3 flex-wrap">
              {/* Chart Type Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-dc-text-secondary whitespace-nowrap">Chart Type:</label>
                <ChartTypeSelector
                  selectedType={chartType}
                  onTypeChange={onChartTypeChange}
                />
              </div>

              {/* Configure Chart Button (only show for non-table chart types) */}
              {chartType !== 'table' && onChartConfigChange && onDisplayConfigChange && (
                <button
                  onClick={() => setShowChartConfig(!showChartConfig)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    showChartConfig
                      ? 'bg-dc-primary text-white'
                      : 'text-dc-text-secondary bg-dc-surface hover:bg-dc-surface-hover border border-dc-border'
                  }`}
                >
                  <AdjustmentsIcon className="w-4 h-4" />
                  {showChartConfig ? 'Hide Config' : 'Configure'}
                  {showChartConfig ? (
                    <ChevronUpIcon className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Performance Warning */}
          {totalRowCountStatus === 'success' && totalRowCount !== null && totalRowCount !== undefined && totalRowCount > 500 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
              <WarningIcon className="w-5 h-5 text-yellow-600 mr-2 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <span className="font-semibold">Performance Warning:</span> This query returns {totalRowCount.toLocaleString()} rows,
                which may impact performance. Consider adding filters to reduce the dataset size.
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Chart Config Panel (only when chart view is active) */}
        {activeView === 'chart' && showChartConfig && chartType !== 'table' && onChartConfigChange && onDisplayConfigChange && (
          <div className="border-b border-dc-border bg-dc-surface-tertiary p-4">
            <ChartConfigPanel
              chartType={chartType}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              availableFields={availableFields || null}
              onChartConfigChange={onChartConfigChange}
              onDisplayConfigChange={onDisplayConfigChange}
            />
          </div>
        )}

        {/* Results Content - Table or Chart based on active view */}
        <div className="flex-1 min-h-0">
          {activeView === 'table' ? (
            <LazyChart
              chartType="table"
              data={executionResults}
              height="100%"
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-pulse bg-dc-surface-secondary rounded w-full h-full" />
                </div>
              }
            />
          ) : (
            <div className="p-4 h-full overflow-auto">
              {renderChart()}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-dc-surface border border-dc-border rounded-lg min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dc-border bg-dc-surface-secondary">
        <h3 className="text-sm font-semibold text-dc-text">Query Results</h3>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        {executionStatus === 'idle' && <EmptyState />}
        {(executionStatus === 'loading' || executionStatus === 'refreshing') && executionResults === null && (
          <LoadingState />
        )}
        {executionStatus === 'error' && executionResults === null && <ErrorState />}
        {(executionStatus === 'success' || executionResults !== null) && <SuccessState />}
        {(executionStatus === 'loading' || executionStatus === 'refreshing') && executionResults !== null && (
          <OverlaySpinner />
        )}
        {executionStatus === 'error' && executionResults !== null && <OverlayError />}
      </div>
    </div>
  )
}

export default ResultsPanel

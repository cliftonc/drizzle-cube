/**
 * ResultsPanel Component
 * 
 * Displays query execution results, loading states, and errors.
 * Reuses the existing DataTable component for result display.
 */

import React from 'react'
import { ExclamationCircleIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { DataTable } from '../../components/charts'
import type { ResultsPanelProps } from './types'

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  executionStatus,
  executionResults,
  executionError,
  query: _query,
  displayLimit = 10,
  onDisplayLimitChange,
  totalRowCount,
  totalRowCountStatus
}) => {

  const LoadingState = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-sm font-semibold text-gray-700 mb-1">Executing Query...</div>
        <div className="text-xs text-gray-500">Running your query against the cube API</div>
      </div>
    </div>
  )

  const ErrorState = () => (
    <div className="h-full flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <ExclamationCircleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <div className="text-sm font-semibold text-gray-900 mb-2">Query Execution Failed</div>
        <div className="text-sm text-gray-600 mb-4">
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

  const EmptyState = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center mb-16">
        <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <div className="text-sm font-semibold text-gray-700 mb-1">No Results Yet</div>
        <div className="text-xs text-gray-500">Build and run a query to see results here</div>
      </div>
    </div>
  )

  const SuccessState = () => {
    if (!executionResults || executionResults.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-3" />
            <div className="text-sm font-semibold text-gray-700 mb-1">Query Successful</div>
            <div className="text-xs text-gray-500">No data returned from the query</div>
          </div>
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col">
        {/* Results Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-700">
                  Query Results ({executionResults.length} row{executionResults.length !== 1 ? 's' : ''} shown)
                </span>
                {totalRowCountStatus === 'success' && totalRowCount !== null && totalRowCount !== undefined && (
                  <span className="text-xs text-gray-500">
                    Total: {totalRowCount.toLocaleString()} row{totalRowCount !== 1 ? 's' : ''}
                  </span>
                )}
                {totalRowCountStatus === 'loading' && (
                  <span className="text-xs text-gray-500">
                    Counting total rows...
                  </span>
                )}
              </div>
            </div>
            {onDisplayLimitChange && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Show:</label>
                <select
                  value={displayLimit}
                  onChange={(e) => onDisplayLimitChange(Number(e.target.value))}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Performance Warning */}
          {totalRowCountStatus === 'success' && totalRowCount !== null && totalRowCount !== undefined && totalRowCount > 500 && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <span className="font-semibold">Performance Warning:</span> This query returns {totalRowCount.toLocaleString()} rows, 
                which may impact performance. Consider adding filters to reduce the dataset size.
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-hidden">
          <DataTable 
            data={executionResults} 
            height="100%" 
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Query Results</h3>
      </div>

      {/* Content */}
      <div className="h-full">
        {executionStatus === 'loading' && <LoadingState />}
        {executionStatus === 'error' && <ErrorState />}
        {executionStatus === 'success' && <SuccessState />}
        {executionStatus === 'idle' && <EmptyState />}
      </div>
    </div>
  )
}

export default ResultsPanel
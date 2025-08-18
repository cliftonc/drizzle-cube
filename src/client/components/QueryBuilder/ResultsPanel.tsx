/**
 * ResultsPanel Component
 * 
 * Displays query execution results, loading states, and errors.
 * Reuses the existing DataTable component for result display.
 */

import React, { useState } from 'react'
import { ExclamationCircleIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { DataTable } from '../../components/charts'
import type { ResultsPanelProps } from './types'

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  executionStatus,
  executionResults,
  executionError,
  query
}) => {
  const [showQueryDetails, setShowQueryDetails] = useState(false)

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
      <div className="text-center">
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
              <span className="text-sm font-semibold text-gray-700">
                Query Results ({executionResults.length} row{executionResults.length !== 1 ? 's' : ''})
              </span>
            </div>
            <button
              onClick={() => setShowQueryDetails(!showQueryDetails)}
              className="text-xs text-gray-600 hover:text-gray-800 focus:outline-none focus:underline"
            >
              {showQueryDetails ? 'Hide' : 'Show'} Query Details
            </button>
          </div>

          {/* Query Details */}
          {showQueryDetails && (
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">Executed Query:</div>
              <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 p-2 rounded">
                {JSON.stringify(query, null, 2)}
              </pre>
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
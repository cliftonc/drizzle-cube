/**
 * QueryPanel Component
 * 
 * Displays the current query being built, with sections for measures, dimensions, and time dimensions.
 * Includes validation status, JSON preview, and action buttons.
 */

import React, { useState } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, TagIcon, CalendarIcon, PlayIcon, CheckIcon } from '@heroicons/react/24/solid'
import type { QueryPanelProps } from './types'
import { TIME_GRANULARITIES } from './types'
import { hasQueryContent, getSelectedFieldsCount } from './utils'

const QueryPanel: React.FC<QueryPanelProps> = ({
  query,
  validationStatus,
  validationError,
  onValidate,
  onExecute,
  onRemoveField,
  onTimeDimensionGranularityChange
}) => {
  const [showJsonPreview, setShowJsonPreview] = useState(false)

  const hasContent = hasQueryContent(query)
  const selectedCount = getSelectedFieldsCount(query)

  const RemovableChip: React.FC<{ 
    label: string
    fieldName: string
    fieldType: 'measures' | 'dimensions' | 'timeDimensions'
    icon: React.ReactNode
  }> = ({ label, fieldName, fieldType, icon }) => (
    <div className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full border border-blue-200">
      <div className="mr-2">
        {icon}
      </div>
      <span className="mr-2">{label}</span>
      <button
        onClick={() => onRemoveField(fieldName, fieldType)}
        className="text-blue-600 hover:text-blue-800 focus:outline-none"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )

  const TimeDimensionChip: React.FC<{ 
    timeDimension: { dimension: string; granularity?: string }
    label: string
  }> = ({ timeDimension, label }) => (
    <div className="inline-flex items-center bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full border border-purple-200">
      <div className="mr-2">
        <CalendarIcon className="w-4 h-4" />
      </div>
      <span className="mr-2">{label}</span>
      <select
        value={timeDimension.granularity || 'month'}
        onChange={(e) => onTimeDimensionGranularityChange(timeDimension.dimension, e.target.value)}
        className="bg-purple-100 border-none text-purple-800 text-xs rounded focus:ring-2 focus:ring-purple-500 mr-1"
        onClick={(e) => e.stopPropagation()}
      >
        {TIME_GRANULARITIES.map(granularity => (
          <option key={granularity.value} value={granularity.value}>
            {granularity.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => onRemoveField(timeDimension.dimension, 'timeDimensions')}
        className="text-purple-600 hover:text-purple-800 focus:outline-none"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )

  const ValidationStatusIcon = () => {
    switch (validationStatus) {
      case 'validating':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        )
      case 'valid':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />
      case 'invalid':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Query Builder</h3>
          <div className="flex items-center space-x-2">
            {hasContent && (
              <span className="text-sm text-gray-500">
                {selectedCount} field{selectedCount !== 1 ? 's' : ''} selected
              </span>
            )}
            <ValidationStatusIcon />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {!hasContent ? (
          <div className="py-8 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <div className="text-sm font-semibold mb-1">No fields selected</div>
              <div className="text-xs">Select measures, dimensions, or time dimensions from the schema explorer</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Measures */}
            {query.measures && query.measures.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  Measures ({query.measures.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {query.measures.map(measure => {
                    const label = measure.split('.')[1] || measure
                    return (
                      <RemovableChip
                        key={measure}
                        label={label}
                        fieldName={measure}
                        fieldType="measures"
                        icon={<ChartBarIcon className="w-4 h-4" />}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Dimensions */}
            {query.dimensions && query.dimensions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <TagIcon className="w-4 h-4 mr-2" />
                  Dimensions ({query.dimensions.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {query.dimensions.map(dimension => {
                    const label = dimension.split('.')[1] || dimension
                    return (
                      <RemovableChip
                        key={dimension}
                        label={label}
                        fieldName={dimension}
                        fieldType="dimensions"
                        icon={<TagIcon className="w-4 h-4" />}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Time Dimensions */}
            {query.timeDimensions && query.timeDimensions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Time Dimensions ({query.timeDimensions.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {query.timeDimensions.map(timeDimension => {
                    const label = timeDimension.dimension.split('.')[1] || timeDimension.dimension
                    return (
                      <TimeDimensionChip
                        key={timeDimension.dimension}
                        timeDimension={timeDimension}
                        label={label}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-red-800">Validation Error</h5>
                    <p className="text-sm text-red-700 mt-1">{validationError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* JSON Preview Toggle */}
            <div>
              <button
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:underline"
              >
                {showJsonPreview ? 'Hide' : 'Show'} JSON Query
              </button>

              {showJsonPreview && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(query, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {hasContent && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <button
              onClick={onValidate}
              disabled={validationStatus === 'validating'}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                validationStatus === 'validating'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : validationStatus === 'valid'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200'
              }`}
            >
              {validationStatus === 'validating' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Validating...
                </>
              ) : validationStatus === 'valid' ? (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Valid Query
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Validate Query
                </>
              )}
            </button>

            <button
              onClick={onExecute}
              disabled={validationStatus !== 'valid'}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                validationStatus !== 'valid'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500'
              }`}
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Run Query
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QueryPanel
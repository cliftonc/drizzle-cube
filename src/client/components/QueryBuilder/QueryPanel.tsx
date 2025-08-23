/**
 * QueryPanel Component
 * 
 * Displays the current query being built, with sections for measures, dimensions, and time dimensions.
 * Includes validation status, JSON preview, and action buttons.
 */

import React, { useState, useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, TrashIcon, ClipboardDocumentIcon, CogIcon, FunnelIcon, SparklesIcon, ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, TagIcon, CalendarIcon, PlayIcon, CheckIcon } from '@heroicons/react/24/solid'
import FilterBuilder from './FilterBuilder'
import DateRangeFilter from './DateRangeFilter'
import type { QueryPanelProps } from './types'
import { TIME_GRANULARITIES } from './types'
import { hasQueryContent, getSelectedFieldsCount, cleanQueryForServer, hasTimeDimensions, getFieldTitle, getSortDirection, getSortTooltip, getNextSortDirection } from './utils'

const QueryPanel: React.FC<QueryPanelProps> = ({
  query,
  schema,
  validationStatus,
  validationError,
  validationSql,
  onValidate,
  onExecute,
  onRemoveField,
  onTimeDimensionGranularityChange,
  onFiltersChange,
  onDateRangeChange,
  onDateRangeRemove,
  onOrderChange,
  onClearQuery,
  showSettings,
  onSettingsClick,
  onAIAssistantClick
}) => {
  const [showJsonPreview, setShowJsonPreview] = useState(false)
  const [showSqlPreview, setShowSqlPreview] = useState(false)

  // Trigger Prism highlighting when preview content changes
  useEffect(() => {
    if ((showJsonPreview || showSqlPreview) && typeof window !== 'undefined' && (window as any).Prism) {
      // Use setTimeout to ensure DOM is updated before highlighting
      setTimeout(() => {
        try {
          ;(window as any).Prism.highlightAll()
        } catch (error) {
          // Silently fail if Prism is not available or encounters an error
          console.debug('Prism highlighting failed:', error)
        }
      }, 0)
    }
  }, [showJsonPreview, showSqlPreview, query, validationSql])

  const hasContent = hasQueryContent(query)
  const selectedCount = getSelectedFieldsCount(query)
  
  const handleCopyQuery = async () => {
    const cleanedQuery = cleanQueryForServer(query)
    try {
      await navigator.clipboard.writeText(JSON.stringify(cleanedQuery, null, 2))
      // You could add a toast notification here if desired
    } catch (error) {
      console.error('Failed to copy query:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = JSON.stringify(cleanedQuery, null, 2)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  // Helper function to check if a field has filters applied
  const hasFiltersApplied = (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions'): boolean => {
    if (fieldType === 'timeDimensions') {
      // Check if time dimension has a date range
      return Boolean(query.timeDimensions?.some(td => td.dimension === fieldName && td.dateRange))
    } else {
      // Check if field has regular filters applied
      const currentFilters = query.filters || []
      
      const hasFieldInFilters = (filters: any[]): boolean => {
        return filters.some(filter => {
          if ('member' in filter) {
            // Simple filter
            return filter.member === fieldName
          } else if ('type' in filter && 'filters' in filter) {
            // Group filter - check recursively
            return hasFieldInFilters(filter.filters)
          }
          return false
        })
      }
      
      return hasFieldInFilters(currentFilters)
    }
  }

  const handleAddFilterFromField = (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => {
    if (fieldType === 'timeDimensions') {
      // For time dimensions, add a date range instead of a regular filter
      onDateRangeChange(fieldName, 'this month')
    } else {
      // For measures and dimensions, add a regular filter
      // Get current filters and add a new one
      const currentFilters = query.filters || []
      const newFilter = {
        member: fieldName,
        operator: 'equals' as const,
        values: []
      }
      
      // Use the same smart grouping logic as FilterBuilder
      if (currentFilters.length === 0) {
        onFiltersChange([newFilter])
      } else if (currentFilters.length === 1 && 'member' in currentFilters[0]) {
        // Create AND group with existing filter + new filter
        const andGroup = {
          type: 'and' as const,
          filters: [currentFilters[0], newFilter]
        }
        onFiltersChange([andGroup])
      } else if (currentFilters.length === 1 && 'type' in currentFilters[0] && currentFilters[0].type === 'and') {
        // Add to existing AND group
        const existingAndGroup = currentFilters[0]
        const updatedAndGroup = {
          type: 'and' as const,
          filters: [...existingAndGroup.filters, newFilter]
        }
        onFiltersChange([updatedAndGroup])
      } else if (currentFilters.length === 1 && 'type' in currentFilters[0] && currentFilters[0].type === 'or') {
        // Add to existing OR group
        const existingOrGroup = currentFilters[0]
        const updatedOrGroup = {
          type: 'or' as const,
          filters: [...existingOrGroup.filters, newFilter]
        }
        onFiltersChange([updatedOrGroup])
      } else {
        // Fallback: just add to the end
        onFiltersChange([...currentFilters, newFilter])
      }
    }
  }

  // Sorting helper functions
  const getSortIcon = (direction: 'asc' | 'desc' | null) => {
    switch (direction) {
      case 'asc':
        return <ChevronUpIcon className={`w-4 h-4 ${direction ? 'stroke-[3]' : ''}`} />
      case 'desc':
        return <ChevronDownIcon className={`w-4 h-4 ${direction ? 'stroke-[3]' : ''}`} />
      default:
        return <ChevronUpDownIcon className="w-4 h-4" />
    }
  }

  const handleToggleSort = (fieldName: string) => {
    const current = getSortDirection(fieldName, query.order)
    const next = getNextSortDirection(current)
    onOrderChange(fieldName, next)
  }

  const getSortButtonClasses = (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => {
    const sortDirection = getSortDirection(fieldName, query.order)
    const baseClasses = 'focus:outline-none flex-shrink-0 p-1 transition-colors'
    
    if (sortDirection) {
      // Active sort - use field type colors
      switch (fieldType) {
        case 'measures':
          return `${baseClasses} text-amber-800 hover:text-amber-900`
        case 'dimensions':
          return `${baseClasses} text-green-800 hover:text-green-900`
        case 'timeDimensions':
          return `${baseClasses} text-blue-800 hover:text-blue-900`
        default:
          return `${baseClasses} text-blue-800 hover:text-blue-900`
      }
    } else {
      // No sort - gray
      return `${baseClasses} text-gray-400 hover:text-gray-600`
    }
  }

  const RemovableChip: React.FC<{ 
    label: string
    fieldName: string
    fieldType: 'measures' | 'dimensions' | 'timeDimensions'
    icon: React.ReactNode
  }> = ({ fieldName, fieldType, icon }) => {
    const getChipClasses = () => {
      switch (fieldType) {
        case 'measures':
          return 'bg-amber-100 text-amber-800 border-amber-200'
        case 'dimensions':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'timeDimensions':
          return 'bg-blue-100 text-blue-800 border-blue-200'
        default:
          return 'bg-blue-100 text-blue-800 border-blue-200'
      }
    }

    return (
      <div className={`inline-flex items-center text-sm px-3 py-2 rounded-lg border w-full ${getChipClasses()}`}>
        <div className="mr-2 flex-shrink-0">
          {icon}
        </div>
        <span className="flex-1 flex flex-col min-w-0">
          <span className="text-xs font-medium truncate">{getFieldTitle(fieldName, schema)}</span>
          <span className="text-[10px] text-gray-500 truncate">{fieldName}</span>
        </span>
        <div className="flex items-center gap-2 ml-2">
          {/* Filter and Sort buttons - stacked vertically */}
          <div className="flex flex-col items-center">
            {/* Filter button */}
            {(() => {
              const hasFilters = hasFiltersApplied(fieldName, fieldType)
              const getActiveColorClasses = () => {
                switch (fieldType) {
                  case 'measures':
                    return 'text-amber-800 hover:text-amber-900'
                  case 'dimensions':
                    return 'text-green-800 hover:text-green-900'
                  case 'timeDimensions':
                    return 'text-blue-800 hover:text-blue-900'
                  default:
                    return 'text-blue-800 hover:text-blue-900'
                }
              }
              
              return (
                <button
                  onClick={() => handleAddFilterFromField(fieldName, fieldType)}
                  className={`focus:outline-none flex-shrink-0 p-0.5 transition-colors ${
                    hasFilters 
                      ? getActiveColorClasses()
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={fieldType === 'timeDimensions' ? 'Add date range' : 'Add filter'}
                >
                  <FunnelIcon className={`w-4 h-4 ${hasFilters ? 'stroke-[3]' : ''}`} />
                </button>
              )
            })()}
            
            {/* Sort button */}
            <button
              onClick={() => handleToggleSort(fieldName)}
              className={`focus:outline-none flex-shrink-0 p-0.5 transition-colors ${getSortButtonClasses(fieldName, fieldType).replace('p-1', 'p-0.5')}`}
              title={getSortTooltip(getSortDirection(fieldName, query.order))}
            >
              {getSortIcon(getSortDirection(fieldName, query.order))}
            </button>
          </div>
          
          {/* Remove button */}
          <button
            onClick={() => onRemoveField(fieldName, fieldType)}
            className="text-gray-600 hover:text-red-600 focus:outline-none flex-shrink-0"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const TimeDimensionChip: React.FC<{ 
    timeDimension: { dimension: string; granularity?: string }
    label: string
  }> = ({ timeDimension }) => (
    <div className="bg-blue-100 text-blue-800 text-sm px-3 py-2 rounded-lg border border-blue-200 w-full">
      {/* Top row with icon, label, filter button, sort button, and remove button */}
      <div className="flex items-center mb-1">
        <div className="mr-2">
          <CalendarIcon className="w-4 h-4" />
        </div>
        <span className="flex-1 flex flex-col min-w-0">
          <span className="text-xs font-medium truncate">{getFieldTitle(timeDimension.dimension, schema)}</span>
          <span className="text-[10px] text-gray-500 truncate">{timeDimension.dimension}</span>
        </span>
        <div className="flex items-center gap-2 ml-2">
          {/* Filter and Sort buttons - stacked vertically */}
          <div className="flex flex-col items-center">
            {/* Filter button */}
            {(() => {
              const hasDateRange = hasFiltersApplied(timeDimension.dimension, 'timeDimensions')
              return (
                <button
                  onClick={() => handleAddFilterFromField(timeDimension.dimension, 'timeDimensions')}
                  className={`focus:outline-none flex-shrink-0 p-0.5 transition-colors ${
                    hasDateRange 
                      ? 'text-blue-800 hover:text-blue-900' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Add date range"
                >
                  <FunnelIcon className={`w-4 h-4 ${hasDateRange ? 'stroke-[3]' : ''}`} />
                </button>
              )
            })()}
            
            {/* Sort button */}
            <button
              onClick={() => handleToggleSort(timeDimension.dimension)}
              className={`focus:outline-none flex-shrink-0 p-0.5 transition-colors ${getSortButtonClasses(timeDimension.dimension, 'timeDimensions').replace('p-1', 'p-0.5')}`}
              title={getSortTooltip(getSortDirection(timeDimension.dimension, query.order))}
            >
              {getSortIcon(getSortDirection(timeDimension.dimension, query.order))}
            </button>
          </div>
          
          {/* Remove button */}
          <button
            onClick={() => onRemoveField(timeDimension.dimension, 'timeDimensions')}
            className="text-gray-600 hover:text-red-600 focus:outline-none"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Bottom row with granularity dropdown */}
      <div className="ml-6 flex items-center">
        <span className="text-xs text-blue-700 mr-2">Granularity:</span>
        <select
          value={timeDimension.granularity || 'month'}
          onChange={(e) => onTimeDimensionGranularityChange(timeDimension.dimension, e.target.value)}
          className="bg-blue-100 border-none text-blue-800 text-xs rounded focus:ring-2 focus:ring-blue-500 flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          {TIME_GRANULARITIES.map(granularity => (
            <option key={granularity.value} value={granularity.value}>
              {granularity.label}
            </option>
          ))}
        </select>
      </div>
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
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">Query Builder</h3>
            {onAIAssistantClick && (
              <button
                onClick={onAIAssistantClick}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 flex-shrink-0"
                title="AI Assistant - Generate queries with AI"
              >
                <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>AI Assistant</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasContent && (
              <>
                <span className="hidden lg:inline text-xs text-gray-500 mr-1">
                  {selectedCount} field{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleCopyQuery}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  title="Copy query to clipboard"
                >
                  <ClipboardDocumentIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">Copy Query</span>
                </button>
                {onClearQuery && (
                  <button
                    onClick={onClearQuery}
                    className="text-gray-400 hover:text-red-600 focus:outline-none p-2"
                    title="Clear all fields"
                  >
                    <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                )}
              </>
            )}
            {showSettings && onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-2"
                title="API Configuration"
              >
                <CogIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
            <ValidationStatusIcon />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
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
            {/* Responsive Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dimensions Column */}
              <div className="min-h-24">
                <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center">
                  <TagIcon className="w-4 h-4 mr-2" />
                  Dimensions ({(query.dimensions || []).length})
                </h4>
                <div className="flex flex-col gap-2">
                  {(query.dimensions || []).map(dimension => (
                    <RemovableChip
                      key={dimension}
                      label={dimension}
                      fieldName={dimension}
                      fieldType="dimensions"
                      icon={<TagIcon className="w-4 h-4" />}
                    />
                  ))}
                </div>
              </div>

              {/* Time Dimensions Column */}
              <div className="min-h-24">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Time Dimensions ({(query.timeDimensions || []).length})
                </h4>
                <div className="flex flex-col gap-2">
                  {(query.timeDimensions || []).map(timeDimension => (
                    <TimeDimensionChip
                      key={timeDimension.dimension}
                      timeDimension={timeDimension}
                      label={timeDimension.dimension}
                    />
                  ))}
                </div>
              </div>

              {/* Measures Column */}
              <div className="min-h-24">
                <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  Measures ({(query.measures || []).length})
                </h4>
                <div className="flex flex-col gap-2">
                  {(query.measures || []).map(measure => (
                    <RemovableChip
                      key={measure}
                      label={measure}
                      fieldName={measure}
                      fieldType="measures"
                      icon={<ChartBarIcon className="w-4 h-4" />}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Date Range Section */}
            {hasTimeDimensions(query) && (
              <div className="mt-6">
                <DateRangeFilter
                  timeDimensions={query.timeDimensions || []}
                  onDateRangeChange={onDateRangeChange}
                  onDateRangeRemove={onDateRangeRemove}
                />
              </div>
            )}

            {/* Filters Section */}
            <div className="mt-6">
              <FilterBuilder
                filters={query.filters || []}
                schema={schema}
                query={query}
                onFiltersChange={onFiltersChange}
              />
            </div>

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

            {/* Preview Toggles */}
            <div className="space-y-3">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    const newJsonState = !showJsonPreview
                    setShowJsonPreview(newJsonState)
                    if (newJsonState) setShowSqlPreview(false) // Hide SQL when showing JSON
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:underline"
                >
                  {showJsonPreview ? 'Hide' : 'Show'} JSON Query
                </button>
                {validationSql && (
                  <button
                    onClick={() => {
                      const newSqlState = !showSqlPreview
                      setShowSqlPreview(newSqlState)
                      if (newSqlState) setShowJsonPreview(false) // Hide JSON when showing SQL
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:underline"
                  >
                    {showSqlPreview ? 'Hide' : 'Show'} SQL Generated
                  </button>
                )}
              </div>

              {showJsonPreview && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-700 mb-2">JSON Query:</div>
                  <pre className="text-gray-700 overflow-x-auto font-mono" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <code className="language-json">{JSON.stringify(cleanQueryForServer(query), null, 2)}</code>
                  </pre>
                </div>
              )}

              {showSqlPreview && validationSql && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Generated SQL:</div>
                  <pre className="text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <code className="language-sql">{validationSql.sql.join(';\n\n')}</code>
                  </pre>
                  {validationSql.params && validationSql.params.length > 0 && (
                    <>
                      <div className="text-xs font-semibold text-gray-700 mb-2 mt-4">Parameters:</div>
                      <pre className="text-gray-700 overflow-x-auto font-mono" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        <code className="language-json">{JSON.stringify(validationSql.params, null, 2)}</code>
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {(hasContent || validationStatus === 'valid' || validationStatus === 'invalid') && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <button
              onClick={onValidate}
              disabled={validationStatus === 'validating'}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                validationStatus === 'validating'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : validationStatus === 'valid'
                  ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                  : validationStatus === 'invalid'
                  ? 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200'
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
                  Re-validate Query
                </>
              ) : validationStatus === 'invalid' ? (
                <>
                  <ExclamationCircleIcon className="w-4 h-4 mr-2" />
                  Validate Again
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
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 border border-green-700'
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
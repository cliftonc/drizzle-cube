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
import QueryAnalysisPanel from './QueryAnalysisPanel'
import type { QueryPanelProps } from './types'
import { TIME_GRANULARITIES } from './types'
import { hasQueryContent, getSelectedFieldsCount, cleanQueryForServer, hasTimeDimensions, getFieldTitle, getSortDirection, getSortTooltip, getNextSortDirection, getFieldType } from './utils'
import { getMeasureIcon } from '../../utils/measureIcons'

const QueryPanel: React.FC<QueryPanelProps> = ({
  query,
  schema,
  validationStatus,
  validationError,
  validationSql,
  validationAnalysis,
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
  onAIAssistantClick,
  onSchemaClick
}) => {
  const [showJsonPreview, setShowJsonPreview] = useState(false)
  const [showSqlPreview, setShowSqlPreview] = useState(false)
  const [showAnalysisPreview, setShowAnalysisPreview] = useState(false)

  // Trigger Prism highlighting when preview content changes
  useEffect(() => {
    if ((showJsonPreview || showSqlPreview) && typeof window !== 'undefined' && (window as any).Prism) {
      // Use setTimeout to ensure DOM is updated before highlighting
      setTimeout(() => {
        try {
          ;(window as any).Prism.highlightAll()
        } catch (error) {
          // Silently fail if Prism is not available or encounters an error
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
      // Failed to copy query
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
        return <ChevronUpIcon className={`w-4 h-4 ${direction ? 'stroke-3' : ''}`} />
      case 'desc':
        return <ChevronDownIcon className={`w-4 h-4 ${direction ? 'stroke-3' : ''}`} />
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
    const baseClasses = 'focus:outline-hidden shrink-0 p-1 transition-colors'

    if (sortDirection) {
      // Active sort - use field type colors
      switch (fieldType) {
        case 'measures':
          return `${baseClasses} text-dc-measure hover:opacity-80`
        case 'dimensions':
          return `${baseClasses} text-dc-dimension hover:opacity-80`
        case 'timeDimensions':
          return `${baseClasses} text-dc-time-dimension hover:opacity-80`
        default:
          return `${baseClasses} text-dc-time-dimension hover:opacity-80`
      }
    } else {
      // No sort - gray
      return `${baseClasses} text-dc-text-muted hover:text-dc-text-secondary`
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
          return 'bg-dc-measure text-dc-measure border-dc-measure'
        case 'dimensions':
          return 'bg-dc-dimension text-dc-dimension border-dc-dimension'
        case 'timeDimensions':
          return 'bg-dc-time-dimension text-dc-time-dimension border-dc-time-dimension'
        default:
          return 'bg-dc-time-dimension text-dc-time-dimension border-dc-time-dimension'
      }
    }

    return (
      <div className={`inline-flex items-center text-sm px-3 py-2 rounded-lg border w-full ${getChipClasses()}`}>
        <div className="mr-2 shrink-0">
          {icon}
        </div>
        <span className="flex-1 flex flex-col min-w-0">
          <span className="text-xs font-medium truncate">{getFieldTitle(fieldName, schema)}</span>
          <span className="text-[10px] text-dc-text-muted truncate">{fieldName}</span>
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
                    return 'text-dc-measure hover:opacity-80'
                  case 'dimensions':
                    return 'text-dc-dimension hover:opacity-80'
                  case 'timeDimensions':
                    return 'text-dc-time-dimension hover:opacity-80'
                  default:
                    return 'text-dc-time-dimension hover:opacity-80'
                }
              }

              return (
                <button
                  onClick={() => handleAddFilterFromField(fieldName, fieldType)}
                  className={`focus:outline-hidden shrink-0 p-0.5 transition-colors ${
                    hasFilters
                      ? getActiveColorClasses()
                      : 'text-dc-text-muted hover:text-dc-text-secondary'
                  }`}
                  title={fieldType === 'timeDimensions' ? 'Add date range' : 'Add filter'}
                >
                  <FunnelIcon className={`w-4 h-4 ${hasFilters ? 'stroke-3' : ''}`} />
                </button>
              )
            })()}
            
            {/* Sort button */}
            <button
              onClick={() => handleToggleSort(fieldName)}
              className={`focus:outline-hidden shrink-0 p-0.5 transition-colors ${getSortButtonClasses(fieldName, fieldType).replace('p-1', 'p-0.5')}`}
              title={getSortTooltip(getSortDirection(fieldName, query.order))}
            >
              {getSortIcon(getSortDirection(fieldName, query.order))}
            </button>
          </div>
          
          {/* Remove button */}
          <button
            onClick={() => onRemoveField(fieldName, fieldType)}
            className="text-dc-text-secondary hover:text-red-600 focus:outline-hidden shrink-0"
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
    <div className="bg-dc-time-dimension text-dc-time-dimension text-sm px-3 py-2 rounded-lg border border-dc-time-dimension w-full">
      {/* Top row with icon, label, filter button, sort button, and remove button */}
      <div className="flex items-center mb-1">
        <div className="mr-2">
          <CalendarIcon className="w-4 h-4" />
        </div>
        <span className="flex-1 flex flex-col min-w-0">
          <span className="text-xs font-medium truncate">{getFieldTitle(timeDimension.dimension, schema)}</span>
          <span className="text-[10px] text-dc-text-muted truncate">{timeDimension.dimension}</span>
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
                  className={`focus:outline-hidden shrink-0 p-0.5 transition-colors ${
                    hasDateRange
                      ? 'text-dc-time-dimension hover:opacity-80'
                      : 'text-dc-text-muted hover:text-dc-text-secondary'
                  }`}
                  title="Add date range"
                >
                  <FunnelIcon className={`w-4 h-4 ${hasDateRange ? 'stroke-3' : ''}`} />
                </button>
              )
            })()}
            
            {/* Sort button */}
            <button
              onClick={() => handleToggleSort(timeDimension.dimension)}
              className={`focus:outline-hidden shrink-0 p-0.5 transition-colors ${getSortButtonClasses(timeDimension.dimension, 'timeDimensions').replace('p-1', 'p-0.5')}`}
              title={getSortTooltip(getSortDirection(timeDimension.dimension, query.order))}
            >
              {getSortIcon(getSortDirection(timeDimension.dimension, query.order))}
            </button>
          </div>
          
          {/* Remove button */}
          <button
            onClick={() => onRemoveField(timeDimension.dimension, 'timeDimensions')}
            className="text-dc-text-secondary hover:text-red-600 focus:outline-hidden"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Bottom row with granularity dropdown */}
      <div className="ml-6 flex items-center">
        <span className="text-xs text-dc-time-dimension mr-2">Granularity:</span>
        <select
          value={timeDimension.granularity || 'month'}
          onChange={(e) => onTimeDimensionGranularityChange(timeDimension.dimension, e.target.value)}
          className="bg-dc-time-dimension border-none text-dc-time-dimension text-xs rounded-sm focus:ring-2 focus:ring-blue-500 flex-1"
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
    <div className="flex flex-col bg-dc-surface border border-dc-border rounded-lg">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-dc-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <h3 className="text-sm sm:text-lg font-semibold text-dc-text truncate">Query Builder</h3>
            {onSchemaClick && (
              <button
                onClick={onSchemaClick}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all duration-200 shrink-0"
                title="Schema Explorer - View cube relationships and fields"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                <span>Schema</span>
              </button>
            )}
            {onAIAssistantClick && (
              <button
                onClick={onAIAssistantClick}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all duration-200 shrink-0"
                title="AI Assistant - Generate queries with AI"
              >
                <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>AI Assistant</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasContent && (
              <>
                <span className="hidden lg:inline text-xs text-dc-text-muted mr-1">
                  {selectedCount} field{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleCopyQuery}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  title="Copy query to clipboard"
                >
                  <ClipboardDocumentIcon className="w-3 h-3" />
                  <span className="hidden sm:inline">Copy Query</span>
                </button>
                {onClearQuery && (
                  <button
                    onClick={onClearQuery}
                    className="text-dc-text-muted hover:text-red-600 focus:outline-hidden p-2"
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
                className="text-dc-text-muted hover:text-dc-text-secondary focus:outline-hidden p-2"
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
          <div className="py-8 flex items-center justify-center text-dc-text-muted">
            <div className="text-center">
              <ChartBarIcon className="w-12 h-12 mx-auto text-dc-text-muted mb-3" />
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
                <h4 className="text-sm font-semibold text-dc-dimension mb-3 flex items-center">
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
                <h4 className="text-sm font-semibold text-dc-time-dimension mb-3 flex items-center">
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
                <h4 className="text-sm font-semibold text-dc-measure mb-3 flex items-center">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  Measures ({(query.measures || []).length})
                </h4>
                <div className="flex flex-col gap-2">
                  {(query.measures || []).map(measure => {
                    const measureType = schema ? getFieldType(measure, schema) : undefined
                    return (
                      <RemovableChip
                        key={measure}
                        label={measure}
                        fieldName={measure}
                        fieldType="measures"
                        icon={getMeasureIcon(measureType, 'w-4 h-4')}
                      />
                    )
                  })}
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
              <div className="flex space-x-4 flex-wrap gap-y-2">
                <button
                  onClick={() => {
                    const newJsonState = !showJsonPreview
                    setShowJsonPreview(newJsonState)
                    if (newJsonState) {
                      setShowSqlPreview(false)
                      setShowAnalysisPreview(false)
                    }
                  }}
                  className="text-sm text-dc-text-secondary hover:text-dc-text focus:outline-hidden focus:underline"
                >
                  {showJsonPreview ? 'Hide' : 'Show'} JSON Query
                </button>
                {validationSql && (
                  <button
                    onClick={() => {
                      const newSqlState = !showSqlPreview
                      setShowSqlPreview(newSqlState)
                      if (newSqlState) {
                        setShowJsonPreview(false)
                        setShowAnalysisPreview(false)
                      }
                    }}
                    className="text-sm text-dc-text-secondary hover:text-dc-text focus:outline-hidden focus:underline"
                  >
                    {showSqlPreview ? 'Hide' : 'Show'} SQL Generated
                  </button>
                )}
                {validationAnalysis && (
                  <button
                    onClick={() => {
                      const newAnalysisState = !showAnalysisPreview
                      setShowAnalysisPreview(newAnalysisState)
                      if (newAnalysisState) {
                        setShowJsonPreview(false)
                        setShowSqlPreview(false)
                      }
                    }}
                    className="text-sm text-dc-text-secondary hover:text-dc-text focus:outline-hidden focus:underline"
                  >
                    {showAnalysisPreview ? 'Hide' : 'Show'} Query Analysis
                  </button>
                )}
              </div>

              {showJsonPreview && (
                <div className="bg-dc-surface-secondary border border-dc-border rounded-lg p-4">
                  <div className="text-xs font-semibold text-dc-text-secondary mb-2">JSON Query:</div>
                  <pre className="text-dc-text-secondary overflow-x-auto font-mono" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <code className="language-json">{JSON.stringify(cleanQueryForServer(query), null, 2)}</code>
                  </pre>
                </div>
              )}

              {showSqlPreview && validationSql && (
                <div className="bg-dc-surface-secondary border border-dc-border rounded-lg p-4">
                  <div className="text-xs font-semibold text-dc-text-secondary mb-2">Generated SQL:</div>
                  <pre className="text-dc-text-secondary overflow-x-auto whitespace-pre-wrap font-mono" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    <code className="language-sql">{validationSql.sql.join(';\n\n')}</code>
                  </pre>
                  {validationSql.params && validationSql.params.length > 0 && (
                    <>
                      <div className="text-xs font-semibold text-dc-text-secondary mb-2 mt-4">Parameters:</div>
                      <pre className="text-dc-text-secondary overflow-x-auto font-mono" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        <code className="language-json">{JSON.stringify(validationSql.params, null, 2)}</code>
                      </pre>
                    </>
                  )}
                </div>
              )}

              {showAnalysisPreview && validationAnalysis && (
                <QueryAnalysisPanel analysis={validationAnalysis} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {(hasContent || validationStatus === 'valid' || validationStatus === 'invalid') && (
        <div className="border-t border-dc-border p-4">
          <div className="flex space-x-3">
            <button
              onClick={onValidate}
              disabled={validationStatus === 'validating'}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                validationStatus === 'validating'
                  ? 'bg-dc-surface-secondary text-dc-text-muted cursor-not-allowed'
                  : validationStatus === 'valid'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50'
                  : validationStatus === 'invalid'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900/50'
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
                  ? 'bg-dc-surface-secondary text-dc-text-muted cursor-not-allowed border border-dc-border'
                  : 'text-white border border-green-700 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
              }`}
              style={validationStatus === 'valid' ? { backgroundColor: 'var(--dc-primary)' } : undefined}
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
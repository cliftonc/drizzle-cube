/**
 * QueryPanel Component
 * 
 * Displays the current query being built, with sections for measures, dimensions, and time dimensions.
 * Includes validation status, JSON preview, and action buttons.
 */

import React, { useState, useEffect, memo, useMemo, useRef, useCallback } from 'react'
import { getIcon } from '../../icons'
import FilterBuilder from './FilterBuilder'
import DateRangeFilter from './DateRangeFilter'
import QueryAnalysisPanel from './QueryAnalysisPanel'
import type { QueryPanelProps } from './types'
import { TIME_GRANULARITIES } from './types'
import { hasQueryContent, getSelectedFieldsCount, cleanQueryForServer, hasTimeDimensions, getFieldTitle, getSortDirection, getSortTooltip, getNextSortDirection, getFieldType } from './utils'
import { getMeasureIcon } from '../../utils/measureIcons'

type IconComponent = React.ComponentType<{ className?: string }>

interface QueryPanelHeaderProps {
  hasContent: boolean
  selectedCount: number
  copyButtonState: 'idle' | 'copied'
  shareButtonState: QueryPanelProps['shareButtonState']
  canShare: boolean
  onShareClick?: () => void
  onClearQuery?: () => void
  onSettingsClick?: () => void
  onAIAssistantClick?: () => void
  onSchemaClick?: () => void
  showSettings?: boolean
  handleCopyQuery: () => void
  icons: {
    SettingsIcon: ReturnType<typeof getIcon>
    CopyIcon: ReturnType<typeof getIcon>
    ShareIcon: ReturnType<typeof getIcon>
    CheckIcon: ReturnType<typeof getIcon>
    DeleteIcon: ReturnType<typeof getIcon>
    SparklesIcon: ReturnType<typeof getIcon>
  }
}

const QueryPanelHeader = memo(({
  hasContent,
  selectedCount,
  copyButtonState,
  shareButtonState,
  canShare,
  onShareClick,
  onClearQuery,
  onSettingsClick,
  onAIAssistantClick,
  onSchemaClick,
  showSettings,
  handleCopyQuery,
  icons
}: QueryPanelHeaderProps) => {
  const {
    SettingsIcon,
    CopyIcon,
    ShareIcon,
    CheckIcon,
    DeleteIcon,
    SparklesIcon
  } = icons

  return (
    <div className="p-3 sm:p-4 border-b border-dc-border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <h3 className="text-sm sm:text-lg font-semibold text-dc-text truncate">Query Builder</h3>
          {onSchemaClick && (
            <button
              onClick={onSchemaClick}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg border border-dc-accent dark:border-dc-accent rounded-lg hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg focus:outline-hidden focus:ring-2 focus:ring-dc-accent transition-all duration-200 shrink-0"
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
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg border border-dc-accent dark:border-dc-accent rounded-lg hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg focus:outline-hidden focus:ring-2 focus:ring-dc-accent transition-all duration-200 shrink-0"
              title="AI Assistant - Generate queries with AI"
            >
              <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>AI Assistant</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="hidden lg:inline text-xs text-dc-text-muted mr-1">
            {selectedCount} field{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleCopyQuery}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-sm focus:outline-hidden focus:ring-2 ${
              hasContent
                ? 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg focus:ring-dc-accent'
                : 'text-dc-text-muted bg-dc-surface-secondary border border-dc-border cursor-not-allowed'
            }`}
            title={copyButtonState === 'idle' ? 'Copy query to clipboard' : 'Copied!'}
            disabled={!hasContent}
          >
            {copyButtonState === 'idle' ? (
              <>
                <CopyIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Copy Query</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            )}
          </button>
          {onShareClick && (
            <button
              onClick={onShareClick}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-sm focus:outline-hidden focus:ring-2 transition-colors ${
                shareButtonState === 'idle' && canShare
                  ? 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg focus:ring-dc-accent'
                  : shareButtonState !== 'idle'
                  ? 'text-dc-success dark:text-dc-success bg-dc-success-bg dark:bg-dc-success-bg border border-dc-success dark:border-dc-success focus:ring-dc-success'
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
          {onClearQuery && (
            <button
              onClick={onClearQuery}
              className={`p-2 focus:outline-hidden ${
                hasContent ? 'text-dc-text-muted hover:text-dc-error' : 'text-dc-text-muted opacity-40 cursor-not-allowed'
              }`}
              title="Clear all fields"
              disabled={!hasContent}
            >
              <DeleteIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
          {showSettings && onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="text-dc-text-muted hover:text-dc-text-secondary focus:outline-hidden p-2"
              title="API Configuration"
            >
              <SettingsIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

interface RemovableChipProps {
  fieldName: string
  fieldType: 'measures' | 'dimensions' | 'timeDimensions'
  schema: QueryPanelProps['schema']
  icon: React.ReactNode
  hasFilters: boolean
  sortDirection: 'asc' | 'desc' | null
  sortTooltip: string
  onAddFilter: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onToggleSort: (fieldName: string) => void
  onRemoveField: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  FilterIcon: IconComponent
  ChevronUpIcon: IconComponent
  ChevronDownIcon: IconComponent
  ChevronUpDownIcon: IconComponent
  CloseIcon: IconComponent
}

const RemovableChip = memo(({
  fieldName,
  fieldType,
  schema,
  icon,
  hasFilters,
  sortDirection,
  sortTooltip,
  onAddFilter,
  onToggleSort,
  onRemoveField,
  FilterIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  CloseIcon
}: RemovableChipProps) => {
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

  const getSortIcon = () => {
    switch (sortDirection) {
      case 'asc':
        return <ChevronUpIcon className="w-4 h-4 stroke-3" />
      case 'desc':
        return <ChevronDownIcon className="w-4 h-4 stroke-3" />
      default:
        return <ChevronUpDownIcon className="w-4 h-4" />
    }
  }

  const getSortButtonClasses = () => {
    const baseClasses = 'focus:outline-hidden shrink-0 p-0.5 transition-colors'
    if (sortDirection) {
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
    }
    return `${baseClasses} text-dc-text-muted hover:text-dc-text-secondary`
  }

  const filterColorClasses = () => {
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
    <div className={`inline-flex items-center text-sm px-3 py-2 rounded-lg border w-full ${getChipClasses()}`}>
      <div className="mr-2 shrink-0">
        {icon}
      </div>
      <span className="flex-1 flex flex-col min-w-0">
        <span className="text-xs font-medium truncate">{getFieldTitle(fieldName, schema)}</span>
        <span className="text-[10px] text-dc-text-muted truncate">{fieldName}</span>
      </span>
      <div className="flex items-center gap-2 ml-2">
        <div className="flex flex-col items-center">
          <button
            onClick={() => onAddFilter(fieldName, fieldType)}
            className={`focus:outline-hidden shrink-0 p-0.5 transition-colors ${
              hasFilters
                ? filterColorClasses()
                : 'text-dc-text-muted hover:text-dc-text-secondary'
            }`}
            title={fieldType === 'timeDimensions' ? 'Add date range' : 'Add filter'}
          >
            <FilterIcon className={`w-4 h-4 ${hasFilters ? 'stroke-3' : ''}`} />
          </button>
          <button
            onClick={() => onToggleSort(fieldName)}
            className={getSortButtonClasses()}
            title={sortTooltip}
          >
            {getSortIcon()}
          </button>
        </div>
        <button
          onClick={() => onRemoveField(fieldName, fieldType)}
          className="text-dc-text-secondary hover:text-dc-error focus:outline-hidden shrink-0"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
})

interface TimeDimensionChipProps {
  timeDimension: { dimension: string; granularity?: string }
  schema: QueryPanelProps['schema']
  hasDateRange: boolean
  sortDirection: 'asc' | 'desc' | null
  sortTooltip: string
  onAddFilter: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onToggleSort: (fieldName: string) => void
  onRemoveField: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onGranularityChange: (dimensionName: string, granularity: string) => void
  TimeDimensionIcon: IconComponent
  FilterIcon: IconComponent
  ChevronUpIcon: IconComponent
  ChevronDownIcon: IconComponent
  ChevronUpDownIcon: IconComponent
  CloseIcon: IconComponent
}

const TimeDimensionChip = memo(({
  timeDimension,
  schema,
  hasDateRange,
  sortDirection,
  sortTooltip,
  onAddFilter,
  onToggleSort,
  onRemoveField,
  onGranularityChange,
  TimeDimensionIcon,
  FilterIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  CloseIcon
}: TimeDimensionChipProps) => {
  const getSortIcon = () => {
    switch (sortDirection) {
      case 'asc':
        return <ChevronUpIcon className="w-4 h-4 stroke-3" />
      case 'desc':
        return <ChevronDownIcon className="w-4 h-4 stroke-3" />
      default:
        return <ChevronUpDownIcon className="w-4 h-4" />
    }
  }

  const getSortButtonClasses = () => {
    const baseClasses = 'focus:outline-hidden shrink-0 p-0.5 transition-colors'
    if (sortDirection) {
      return `${baseClasses} text-dc-time-dimension hover:opacity-80`
    }
    return `${baseClasses} text-dc-text-muted hover:text-dc-text-secondary`
  }

  return (
    <div className="bg-dc-time-dimension text-dc-time-dimension text-sm px-3 py-2 rounded-lg border border-dc-time-dimension w-full">
      <div className="flex items-center mb-1">
        <div className="mr-2">
          <TimeDimensionIcon className="w-4 h-4" />
        </div>
        <span className="flex-1 flex flex-col min-w-0">
          <span className="text-xs font-medium truncate">{getFieldTitle(timeDimension.dimension, schema)}</span>
          <span className="text-[10px] text-dc-text-muted truncate">{timeDimension.dimension}</span>
        </span>
        <div className="flex items-center gap-2 ml-2">
          <div className="flex flex-col items-center">
            <button
              onClick={() => onAddFilter(timeDimension.dimension, 'timeDimensions')}
              className={`focus:outline-hidden shrink-0 p-0.5 transition-colors ${
                hasDateRange
                  ? 'text-dc-time-dimension hover:opacity-80'
                  : 'text-dc-text-muted hover:text-dc-text-secondary'
              }`}
              title="Add date range"
            >
              <FilterIcon className={`w-4 h-4 ${hasDateRange ? 'stroke-3' : ''}`} />
            </button>
            <button
              onClick={() => onToggleSort(timeDimension.dimension)}
              className={getSortButtonClasses()}
              title={sortTooltip}
            >
              {getSortIcon()}
            </button>
          </div>
          <button
            onClick={() => onRemoveField(timeDimension.dimension, 'timeDimensions')}
            className="text-dc-text-secondary hover:text-dc-error focus:outline-hidden"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="ml-6 flex items-center">
        <span className="text-xs text-dc-time-dimension mr-2">Granularity:</span>
        <select
          value={timeDimension.granularity || 'month'}
          onChange={(e) => onGranularityChange(timeDimension.dimension, e.target.value)}
          className="bg-dc-time-dimension border-none text-dc-time-dimension text-xs rounded-sm focus:ring-2 focus:ring-dc-accent flex-1"
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
})

const QueryPanel: React.FC<QueryPanelProps> = ({
  query,
  schema,
  validationStatus,
  validationError,
  validationSql,
  validationAnalysis,
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
  onSchemaClick,
  onShareClick,
  canShare = false,
  shareButtonState = 'idle',
  isViewingShared = false
}) => {
  const [showJsonPreview, setShowJsonPreview] = useState(false)
  const [showSqlPreview, setShowSqlPreview] = useState(false)
  const [showAnalysisPreview, setShowAnalysisPreview] = useState(false)
  const [copyButtonState, setCopyButtonState] = useState<'idle' | 'copied'>('idle')
  const queryRef = useRef(query)

  useEffect(() => {
    queryRef.current = query
  }, [query])

  // Trigger Prism highlighting when preview content changes
  useEffect(() => {
    if ((showJsonPreview || showSqlPreview) && typeof window !== 'undefined' && (window as any).Prism) {
      // Use setTimeout to ensure DOM is updated before highlighting
      setTimeout(() => {
        try {
          ;(window as any).Prism.highlightAll()
        } catch {
          // Silently fail if Prism is not available or encounters an error
        }
      }, 0)
    }
  }, [showJsonPreview, showSqlPreview, query, validationSql])

  const hasContent = hasQueryContent(query)
  const selectedCount = getSelectedFieldsCount(query)

  const CloseIcon = useMemo(() => getIcon('close'), [])
  const ErrorIcon = useMemo(() => getIcon('error'), [])
  const DeleteIcon = useMemo(() => getIcon('delete'), [])
  const CopyIcon = useMemo(() => getIcon('copy'), [])
  const SettingsIcon = useMemo(() => getIcon('settings'), [])
  const FilterIcon = useMemo(() => getIcon('filter'), [])
  const SparklesIcon = useMemo(() => getIcon('sparkles'), [])
  const ChevronUpIcon = useMemo(() => getIcon('chevronUp'), [])
  const ChevronDownIcon = useMemo(() => getIcon('chevronDown'), [])
  const ChevronUpDownIcon = useMemo(() => getIcon('chevronUpDown'), [])
  const ShareIcon = useMemo(() => getIcon('share'), [])
  const MeasureIcon = useMemo(() => getIcon('measure'), [])
  const DimensionIcon = useMemo(() => getIcon('dimension'), [])
  const TimeDimensionIcon = useMemo(() => getIcon('timeDimension'), [])
  const RunIcon = useMemo(() => getIcon('run'), [])
  const CheckIcon = useMemo(() => getIcon('check'), [])

  const handleCopyQuery = useCallback(async () => {
    const cleanedQuery = cleanQueryForServer(queryRef.current)
    try {
      await navigator.clipboard.writeText(JSON.stringify(cleanedQuery, null, 2))
      // You could add a toast notification here if desired
    } catch {
      // Failed to copy query
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = JSON.stringify(cleanedQuery, null, 2)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    setCopyButtonState('copied')
    setTimeout(() => {
      setCopyButtonState('idle')
    }, 1500)
  }, [])

  // Helper function to check if a field has filters applied
  const hasFiltersApplied = useCallback((fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions'): boolean => {
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
  }, [query.timeDimensions, query.filters])

  const handleAddFilterFromField = useCallback((fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => {
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
  }, [onDateRangeChange, onFiltersChange, query.filters])

  const handleToggleSort = useCallback((fieldName: string) => {
    const current = getSortDirection(fieldName, query.order)
    const next = getNextSortDirection(current)
    onOrderChange(fieldName, next)
  }, [query.order, onOrderChange])

  const headerIcons = useMemo(() => ({
    SettingsIcon,
    CopyIcon,
    ShareIcon,
    CheckIcon,
    DeleteIcon,
    SparklesIcon
  }), [SettingsIcon, CopyIcon, ShareIcon, CheckIcon, DeleteIcon, SparklesIcon])

  return (
    <div className="flex flex-col bg-dc-surface border border-dc-border rounded-lg">
      <QueryPanelHeader
        hasContent={hasContent}
        selectedCount={selectedCount}
        copyButtonState={copyButtonState}
        shareButtonState={shareButtonState}
        canShare={canShare}
        onShareClick={onShareClick}
        onClearQuery={onClearQuery}
        onSettingsClick={onSettingsClick}
        onAIAssistantClick={onAIAssistantClick}
        onSchemaClick={onSchemaClick}
        showSettings={showSettings}
        handleCopyQuery={handleCopyQuery}
        icons={headerIcons}
      />

      {/* Viewing Shared Indicator */}
      {isViewingShared && (
        <div className="px-4 py-2 bg-dc-accent-bg dark:bg-dc-accent-bg border-b border-dc-accent dark:border-dc-accent flex items-center gap-2 text-sm text-dc-accent dark:text-dc-accent">
          <ShareIcon className="w-4 h-4" />
          <span>Viewing shared analysis</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {!hasContent ? (
          <div className="py-8 flex items-center justify-center text-dc-text-muted">
            <div className="text-center">
              <MeasureIcon className="w-12 h-12 mx-auto text-dc-text-muted mb-3" />
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
                  <DimensionIcon className="w-4 h-4 mr-2" />
                  Dimensions ({(query.dimensions || []).length})
                </h4>
                <div className="flex flex-col gap-2">
                  {(query.dimensions || []).map(dimension => (
                    <RemovableChip
                      key={dimension}
                      fieldName={dimension}
                      fieldType="dimensions"
                      schema={schema}
                      icon={<DimensionIcon className="w-4 h-4" />}
                      hasFilters={hasFiltersApplied(dimension, 'dimensions')}
                      sortDirection={getSortDirection(dimension, query.order)}
                      sortTooltip={getSortTooltip(getSortDirection(dimension, query.order))}
                      onAddFilter={handleAddFilterFromField}
                      onToggleSort={handleToggleSort}
                      onRemoveField={onRemoveField}
                      FilterIcon={FilterIcon}
                      ChevronUpIcon={ChevronUpIcon}
                      ChevronDownIcon={ChevronDownIcon}
                      ChevronUpDownIcon={ChevronUpDownIcon}
                      CloseIcon={CloseIcon}
                    />
                  ))}
                </div>
              </div>

              {/* Time Dimensions Column */}
              <div className="min-h-24">
                <h4 className="text-sm font-semibold text-dc-time-dimension mb-3 flex items-center">
                  <TimeDimensionIcon className="w-4 h-4 mr-2" />
                  Time Dimensions ({(query.timeDimensions || []).length})
                </h4>
                <div className="flex flex-col gap-2">
                  {(query.timeDimensions || []).map(timeDimension => (
                    <TimeDimensionChip
                      key={timeDimension.dimension}
                      timeDimension={timeDimension}
                      schema={schema}
                      hasDateRange={hasFiltersApplied(timeDimension.dimension, 'timeDimensions')}
                      sortDirection={getSortDirection(timeDimension.dimension, query.order)}
                      sortTooltip={getSortTooltip(getSortDirection(timeDimension.dimension, query.order))}
                      onAddFilter={handleAddFilterFromField}
                      onToggleSort={handleToggleSort}
                      onRemoveField={onRemoveField}
                      onGranularityChange={onTimeDimensionGranularityChange}
                      TimeDimensionIcon={TimeDimensionIcon}
                      FilterIcon={FilterIcon}
                      ChevronUpIcon={ChevronUpIcon}
                      ChevronDownIcon={ChevronDownIcon}
                      ChevronUpDownIcon={ChevronUpDownIcon}
                      CloseIcon={CloseIcon}
                    />
                  ))}
                </div>
              </div>

              {/* Measures Column */}
              <div className="min-h-24">
                <h4 className="text-sm font-semibold text-dc-measure mb-3 flex items-center">
                  <MeasureIcon className="w-4 h-4 mr-2" />
                  Measures ({(query.measures || []).length})
                </h4>
                <div className="flex flex-col gap-2">
                  {(query.measures || []).map(measure => {
                    const measureType = schema ? getFieldType(measure, schema) : undefined
                    return (
                      <RemovableChip
                        key={measure}
                        fieldName={measure}
                        fieldType="measures"
                        schema={schema}
                        icon={getMeasureIcon(measureType, 'w-4 h-4')}
                        hasFilters={hasFiltersApplied(measure, 'measures')}
                        sortDirection={getSortDirection(measure, query.order)}
                        sortTooltip={getSortTooltip(getSortDirection(measure, query.order))}
                        onAddFilter={handleAddFilterFromField}
                        onToggleSort={handleToggleSort}
                        onRemoveField={onRemoveField}
                        FilterIcon={FilterIcon}
                        ChevronUpIcon={ChevronUpIcon}
                        ChevronDownIcon={ChevronDownIcon}
                        ChevronUpDownIcon={ChevronUpDownIcon}
                        CloseIcon={CloseIcon}
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
              <div className="bg-dc-danger-bg border border-dc-error rounded-lg p-4">
                <div className="flex items-start">
                  <ErrorIcon className="w-5 h-5 text-dc-error mr-2 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-dc-error">Validation Error</h5>
                    <p className="text-sm text-dc-error mt-1">{validationError}</p>
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
                <button
                  onClick={() => {
                    if (!validationSql) return
                    const newSqlState = !showSqlPreview
                    setShowSqlPreview(newSqlState)
                    if (newSqlState) {
                      setShowJsonPreview(false)
                      setShowAnalysisPreview(false)
                    }
                  }}
                  className={`text-sm focus:outline-hidden focus:underline ${
                    validationSql
                      ? 'text-dc-text-secondary hover:text-dc-text'
                      : 'text-dc-text-muted cursor-not-allowed'
                  }`}
                  disabled={!validationSql}
                  title={validationSql ? 'Toggle SQL preview' : 'Run a query to view SQL'}
                >
                  {showSqlPreview ? 'Hide' : 'Show'} SQL Generated
                </button>
                <button
                  onClick={() => {
                    if (!validationAnalysis) return
                    const newAnalysisState = !showAnalysisPreview
                    setShowAnalysisPreview(newAnalysisState)
                    if (newAnalysisState) {
                      setShowJsonPreview(false)
                      setShowSqlPreview(false)
                    }
                  }}
                  className={`text-sm focus:outline-hidden focus:underline ${
                    validationAnalysis
                      ? 'text-dc-text-secondary hover:text-dc-text'
                      : 'text-dc-text-muted cursor-not-allowed'
                  }`}
                  disabled={!validationAnalysis}
                  title={validationAnalysis ? 'Toggle analysis preview' : 'Run a query to view analysis'}
                >
                  {showAnalysisPreview ? 'Hide' : 'Show'} Query Analysis
                </button>
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
      {hasContent && (
        <div className="border-t border-dc-border p-4">
          <div className="flex">
            <button
              onClick={onExecute}
              disabled={validationStatus === 'validating' || !hasContent}
              className={`flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                validationStatus === 'validating' || !hasContent
                  ? 'bg-dc-surface-secondary text-dc-text-muted cursor-not-allowed border border-dc-border'
                  : 'text-white border border-dc-success hover:bg-dc-success focus:ring-2 focus:ring-dc-success'
              }`}
              style={!hasContent || validationStatus === 'validating' ? undefined : { backgroundColor: 'var(--dc-primary)' }}
            >
              <RunIcon className="w-4 h-4 mr-2" />
              Run Query
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(QueryPanel)

/**
 * AnalysisFilterSection Component
 *
 * Compact filter section for the AnalysisBuilder's narrow column layout.
 * Renders hierarchical filter structure with AND/OR groups.
 * Uses FieldSearchModal for field selection.
 */

import { useState, useCallback, useRef, DragEvent } from 'react'
import { getIcon } from '../../icons/index.js'
import SectionHeading from './SectionHeading.js'
import type { Filter, SimpleFilter } from '../../types.js'
import type { MetaResponse, MetaField } from '../../shared/types.js'
import FieldSearchModal from './FieldSearchModal.js'
import AnalysisFilterItem from './AnalysisFilterItem.js'
import AnalysisFilterGroup from './AnalysisFilterGroup.js'
import { convertDateRangeTypeToValue } from '../../shared/utils.js'
import {
  isSimpleFilter,
  isGroupFilter,
  countFilters,
  addFilterAtPath,
  removeFilterAtIndex,
  extractFilterMembers
} from '../../shared/filters/index.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const AddIcon = getIcon('add')

interface AnalysisFilterSectionProps {
  /** Current filters */
  filters: Filter[]
  /** Schema for field metadata */
  schema: MetaResponse | null
  /** Callback when filters change */
  onFiltersChange: (filters: Filter[]) => void
  /** Callback when a field is dropped from another section */
  onFieldDropped?: (field: string) => void
  /** Only allow dimension filters (no measures) - used for funnel step filters */
  dimensionsOnly?: boolean
}

export default function AnalysisFilterSection({
  filters,
  schema,
  onFiltersChange,
  onFieldDropped,
  dimensionsOnly = false
}: AnalysisFilterSectionProps) {
  const { t } = useTranslation()
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  // Track which group we're adding a filter to (path of indices, empty = root)
  const pendingAddPath = useRef<number[]>([])

  // Get total filter count for display
  const totalFilterCount = countFilters(filters)

  // Handle drag over for drop zone
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.field && onFieldDropped) {
        onFieldDropped(data.field)
      }
    } catch {
      // Ignore invalid drop data
    }
  }, [onFieldDropped])

  // Get selected field names for the modal
  const selectedFields = extractFilterMembers(filters)

  // Handle adding a new filter via field selection
  const handleFieldSelected = useCallback(
    (field: MetaField, _fieldType: 'measure' | 'dimension' | 'timeDimension', _cubeName: string) => {
      // Determine default operator based on field type
      const isTime = field.type === 'time'
      const defaultOperator = isTime ? 'inDateRange' : 'equals'

      // Create new filter with appropriate defaults
      const newFilter: SimpleFilter = {
        member: field.name,
        operator: defaultOperator,
        values: []
      }

      // For time fields with inDateRange, set a default dateRange so the filter is immediately active
      if (isTime && defaultOperator === 'inDateRange') {
        (newFilter as any).dateRange = convertDateRangeTypeToValue('this_month')
      }

      // Add filter at the pending path
      const updatedFilters = addFilterAtPath(filters, pendingAddPath.current, newFilter)
      onFiltersChange(updatedFilters)

      setShowFieldModal(false)
      pendingAddPath.current = []
    },
    [filters, onFiltersChange]
  )

  // Handle updating a top-level filter
  const handleUpdateTopLevelFilter = useCallback(
    (index: number, newFilter: Filter) => {
      const newFilters = [...filters]
      newFilters[index] = newFilter
      onFiltersChange(newFilters)
    },
    [filters, onFiltersChange]
  )

  // Handle removing a top-level filter
  const handleRemoveTopLevelFilter = useCallback(
    (index: number) => {
      onFiltersChange(removeFilterAtIndex(filters, index))
    },
    [filters, onFiltersChange]
  )

  // Handle clearing all filters
  const handleClearAll = useCallback(() => {
    onFiltersChange([])
  }, [onFiltersChange])

  // Handle add filter button at root level
  const handleAddFilterClick = useCallback(() => {
    pendingAddPath.current = []
    setShowFieldModal(true)
  }, [])

  // Create a handler for adding filters at a specific path
  // The handler receives an optional relativePath from nested groups
  const createAddFilterHandler = useCallback((basePath: number[]) => {
    return (relativePath: number[] = []) => {
      pendingAddPath.current = [...basePath, ...relativePath]
      setShowFieldModal(true)
    }
  }, [])

  // Render a single filter (SimpleFilter or GroupFilter)
  const renderFilter = (filter: Filter, index: number, parentPath: number[] = []) => {
    const currentPath = [...parentPath, index]

    if (isSimpleFilter(filter)) {
      return (
        <AnalysisFilterItem
          key={`filter-${currentPath.join('-')}`}
          filter={filter}
          schema={schema}
          onUpdate={(newFilter) => handleUpdateTopLevelFilter(index, newFilter)}
          onRemove={() => handleRemoveTopLevelFilter(index)}
        />
      )
    } else if (isGroupFilter(filter)) {
      return (
        <AnalysisFilterGroup
          key={`group-${currentPath.join('-')}`}
          group={filter}
          schema={schema}
          onUpdate={(newGroup) => handleUpdateTopLevelFilter(index, newGroup)}
          onRemove={() => handleRemoveTopLevelFilter(index)}
          onAddFilter={createAddFilterHandler(currentPath)}
          hideRemoveButton={filters.length === 1}
        />
      )
    }
    return null
  }

  return (
    <div>
      {/* Header - entire row is clickable to add filter */}
      <button
        onClick={handleAddFilterClick}
        className="dc:flex dc:items-center dc:justify-between dc:mb-3 dc:w-full dc:py-1 dc:px-2 dc:-ml-2 dc:rounded-lg hover:bg-dc-primary/10 dc:transition-colors dc:group"
        title="Add filter"
      >
        <SectionHeading>
          {t('analysis.sections.filters')}
          {totalFilterCount > 0 && (
            <span className="dc:ml-1.5 dc:text-xs dc:font-normal text-dc-text-muted dc:normal-case dc:tracking-normal">
              ({totalFilterCount})
            </span>
          )}
        </SectionHeading>
        <div className="dc:flex dc:items-center dc:gap-2">
          {totalFilterCount > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                handleClearAll()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  handleClearAll()
                }
              }}
              className="dc:text-xs text-dc-text-muted hover:text-dc-error dc:underline dc:cursor-pointer"
            >
              {t('filter.section.clearAll')}
            </span>
          )}
          <AddIcon className="dc:w-5 dc:h-5 text-dc-text-secondary group-hover:text-dc-primary dc:transition-colors" />
        </div>
      </button>

      {/* Drop Zone Container - Only wraps content, not header */}
      <div
        onDragOver={onFieldDropped ? handleDragOver : undefined}
        onDragLeave={onFieldDropped ? handleDragLeave : undefined}
        onDrop={onFieldDropped ? handleDrop : undefined}
        className={`dc:p-2 dc:-mx-2 dc:rounded-lg dc:border-2 dc:border-dashed dc:transition-all ${
          isDragOver
            ? 'border-dc-primary bg-dc-primary/5'
            : 'border-transparent'
        }`}
      >
        {/* Filter List - Hierarchical Rendering */}
        {filters.length === 0 ? (
          <p className={`dc:text-sm ${isDragOver ? 'text-dc-primary dc:font-medium' : 'text-dc-text-muted'}`}>
            {isDragOver ? t('filter.section.dropHint') : t('filter.section.empty')}
          </p>
        ) : (
          <div className="dc:flex dc:flex-wrap dc:gap-2">
            {filters.map((filter, index) => renderFilter(filter, index))}
          </div>
        )}
      </div>

      {/* Field Search Modal - mode determines which field types to show */}
      <FieldSearchModal
        isOpen={showFieldModal}
        onClose={() => {
          setShowFieldModal(false)
          pendingAddPath.current = []
        }}
        onSelect={handleFieldSelected}
        mode={dimensionsOnly ? 'dimensionFilter' : 'filter'}
        schema={schema}
        selectedFields={selectedFields}
      />
    </div>
  )
}

/**
 * AnalysisFilterSection Component
 *
 * Compact filter section for the AnalysisBuilder's narrow column layout.
 * Renders hierarchical filter structure with AND/OR groups.
 * Uses FieldSearchModal for field selection.
 */

import { useState, useCallback, useRef } from 'react'
import { getIcon } from '../../icons'
import type { Filter, SimpleFilter, GroupFilter } from '../../types'
import type { MetaResponse, MetaField } from '../../shared/types'
import FieldSearchModal from './FieldSearchModal'
import AnalysisFilterItem from './AnalysisFilterItem'
import AnalysisFilterGroup from './AnalysisFilterGroup'

const AddIcon = getIcon('add')

interface AnalysisFilterSectionProps {
  /** Current filters */
  filters: Filter[]
  /** Schema for field metadata */
  schema: MetaResponse | null
  /** Callback when filters change */
  onFiltersChange: (filters: Filter[]) => void
}

/**
 * Check if a filter is a simple filter (has member property)
 */
function isSimpleFilter(filter: Filter): filter is SimpleFilter {
  return 'member' in filter && typeof (filter as SimpleFilter).member === 'string'
}

/**
 * Check if a filter is a group filter
 */
function isGroupFilter(filter: Filter): filter is GroupFilter {
  return 'type' in filter && ((filter as GroupFilter).type === 'and' || (filter as GroupFilter).type === 'or')
}

/**
 * Count all simple filters in a filter tree
 */
function countFilters(filters: Filter[]): number {
  let count = 0
  for (const filter of filters) {
    if (isSimpleFilter(filter)) {
      count++
    } else if (isGroupFilter(filter)) {
      count += countFilters(filter.filters)
    }
  }
  return count
}

/**
 * Get all simple filter member names from a filter tree
 */
function getSelectedFields(filters: Filter[]): string[] {
  const fields: string[] = []
  for (const filter of filters) {
    if (isSimpleFilter(filter)) {
      fields.push(filter.member)
    } else if (isGroupFilter(filter)) {
      fields.push(...getSelectedFields(filter.filters))
    }
  }
  return fields
}

/**
 * Add a filter at a specific path in the filter tree
 * Path is an array of indices, e.g., [0, 2] means filters[0].filters[2]
 */
function addFilterAtPath(filters: Filter[], path: number[], newFilter: SimpleFilter): Filter[] {
  if (path.length === 0) {
    // Add to root level
    if (filters.length === 0) {
      return [newFilter]
    } else if (filters.length === 1 && isSimpleFilter(filters[0])) {
      // Wrap in AND group
      return [{ type: 'and', filters: [filters[0], newFilter] }]
    } else if (filters.length === 1 && isGroupFilter(filters[0])) {
      // Add to existing group
      return [{
        ...filters[0],
        filters: [...filters[0].filters, newFilter]
      }]
    } else {
      // Wrap all in AND group
      return [{ type: 'and', filters: [...filters, newFilter] }]
    }
  }

  // Navigate to the target group and add
  const [firstIndex, ...restPath] = path
  const newFilters = [...filters]
  const targetFilter = newFilters[firstIndex]

  if (isGroupFilter(targetFilter)) {
    if (restPath.length === 0) {
      // Add to this group
      newFilters[firstIndex] = {
        ...targetFilter,
        filters: [...targetFilter.filters, newFilter]
      }
    } else {
      // Recurse deeper
      newFilters[firstIndex] = {
        ...targetFilter,
        filters: addFilterAtPath(targetFilter.filters, restPath, newFilter)
      }
    }
  }

  return newFilters
}

export default function AnalysisFilterSection({
  filters,
  schema,
  onFiltersChange
}: AnalysisFilterSectionProps) {
  const [showFieldModal, setShowFieldModal] = useState(false)
  // Track which group we're adding a filter to (path of indices, empty = root)
  const pendingAddPath = useRef<number[]>([])

  // Get total filter count for display
  const totalFilterCount = countFilters(filters)

  // Get selected field names for the modal
  const selectedFields = getSelectedFields(filters)

  // Handle adding a new filter via field selection
  const handleFieldSelected = useCallback(
    (field: MetaField, _fieldType: 'measure' | 'dimension' | 'timeDimension', _cubeName: string) => {
      // Determine default operator based on field type
      const isTime = field.type === 'time'
      const defaultOperator = isTime ? 'inDateRange' : 'equals'

      // Create new filter
      const newFilter: SimpleFilter = {
        member: field.name,
        operator: defaultOperator,
        values: []
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
      const newFilters = filters.filter((_, i) => i !== index)

      // If we have a single group with one filter, unwrap it
      if (newFilters.length === 1 && isGroupFilter(newFilters[0])) {
        const group = newFilters[0]
        if (group.filters.length === 1) {
          onFiltersChange([group.filters[0]])
          return
        }
      }

      onFiltersChange(newFilters)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dc-text">
          Filter
          {totalFilterCount > 0 && (
            <span className="ml-1.5 text-xs font-normal text-dc-text-muted">
              ({totalFilterCount})
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {totalFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-dc-text-muted hover:text-red-600 underline"
            >
              Clear all
            </button>
          )}
          <button
            onClick={handleAddFilterClick}
            className="p-1 text-dc-text-secondary hover:text-dc-primary hover:bg-dc-surface-secondary rounded transition-colors"
            title="Add filter"
          >
            <AddIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter List - Hierarchical Rendering */}
      {filters.length === 0 ? (
        <p className="text-sm text-dc-text-muted">No filters applied</p>
      ) : (
        <div className="space-y-2">
          {filters.map((filter, index) => renderFilter(filter, index))}
        </div>
      )}

      {/* Field Search Modal - mode 'filter' shows all fields (measures + dimensions) */}
      <FieldSearchModal
        isOpen={showFieldModal}
        onClose={() => {
          setShowFieldModal(false)
          pendingAddPath.current = []
        }}
        onSelect={handleFieldSelected}
        mode="filter"
        schema={schema}
        selectedFields={selectedFields}
      />
    </div>
  )
}

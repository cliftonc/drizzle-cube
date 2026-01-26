/**
 * AnalysisFilterGroup Component
 *
 * Renders a group of filters with AND/OR logic.
 * Supports infinite nesting for complex filter conditions.
 * Compact design for the AnalysisBuilder's narrow column.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { getIcon } from '../../icons'
import type { Filter, SimpleFilter, GroupFilter } from '../../types'
import type { MetaResponse } from '../../shared/types'
import AnalysisFilterItem from './AnalysisFilterItem'

const AddIcon = getIcon('add')
const CloseIcon = getIcon('close')

interface AnalysisFilterGroupProps {
  /** The group filter to render */
  group: GroupFilter
  /** Schema for field metadata */
  schema: MetaResponse | null
  /** Callback when group changes */
  onUpdate: (group: GroupFilter) => void
  /** Callback to remove this group */
  onRemove: () => void
  /** Callback to add a new filter - receives path relative to this group */
  onAddFilter: (relativePath?: number[]) => void
  /** Depth level for styling */
  depth?: number
  /** Whether to hide the remove button (for top-level groups) */
  hideRemoveButton?: boolean
}

/**
 * Check if a filter is a simple filter
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

export default function AnalysisFilterGroup({
  group,
  schema,
  onUpdate,
  onRemove,
  onAddFilter,
  depth = 0,
  hideRemoveButton = false
}: AnalysisFilterGroupProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Toggle group type (AND <-> OR)
  const handleToggleType = useCallback(() => {
    const newType = group.type === 'and' ? 'or' : 'and'
    onUpdate({ ...group, type: newType })
  }, [group, onUpdate])

  // Update a nested filter at a specific index
  const handleUpdateFilter = useCallback((index: number, newFilter: Filter) => {
    const newFilters = [...group.filters]
    newFilters[index] = newFilter
    onUpdate({ ...group, filters: newFilters })
  }, [group, onUpdate])

  // Remove a filter at a specific index
  const handleRemoveFilter = useCallback((index: number) => {
    const newFilters = group.filters.filter((_, i) => i !== index)

    // If only one filter remains, we might want to unwrap
    // But for now, just update with remaining filters
    if (newFilters.length === 0) {
      // If group is empty, remove the group itself
      onRemove()
    } else if (newFilters.length === 1 && depth > 0) {
      // Unwrap single-filter groups at non-root level by updating parent
      // This is handled by the parent component
      onUpdate({ ...group, filters: newFilters })
    } else {
      onUpdate({ ...group, filters: newFilters })
    }
  }, [group, onUpdate, onRemove, depth])

  // Add a nested group at a specific index
  const handleAddNestedGroup = useCallback((type: 'and' | 'or') => {
    const newGroup: GroupFilter = { type, filters: [] }
    onUpdate({ ...group, filters: [...group.filters, newGroup] })
    setIsAddMenuOpen(false)
  }, [group, onUpdate])

  // Handle add filter button - add to this group
  const handleAddFilterClick = useCallback(() => {
    onAddFilter([]) // Empty path means add to this group
    setIsAddMenuOpen(false)
  }, [onAddFilter])

  // Create handler for nested group to add filters
  const createNestedAddFilterHandler = useCallback((nestedIndex: number) => {
    return (relativePath: number[] = []) => {
      // Prepend this nested index to the relative path
      onAddFilter([nestedIndex, ...relativePath])
    }
  }, [onAddFilter])

  // Get border color based on depth
  const getBorderColor = () => {
    if (depth % 2 === 0) {
      return 'border-dc-border'
    }
    return 'border-dc-border dark:border-dc-border'
  }

  // Get background color based on group type
  const getGroupBgColor = () => {
    return group.type === 'and' ? 'bg-dc-info-bg/50' : 'bg-dc-warning-bg/50'
  }

  const conditionCount = group.filters.length
  const conditionLabel = conditionCount === 1 ? 'condition' : 'conditions'

  return (
    <div className={`dc:border ${getBorderColor()} dc:rounded-lg bg-dc-surface dc:w-full`}>
      {/* Group Header */}
      <div className={`dc:flex dc:items-center dc:justify-between dc:px-2 dc:py-1.5 dc:border-b border-dc-border/50 dc:rounded-t-lg ${getGroupBgColor()}`}>
        <div className="dc:flex dc:items-center dc:gap-2">
          {/* AND/OR Toggle Button */}
          <button
            onClick={handleToggleType}
            className={`dc:px-2 dc:py-0.5 dc:text-xs dc:font-semibold dc:rounded dc:transition-colors ${
              group.type === 'and'
                ? 'bg-dc-info-bg text-dc-info dc:hover:opacity-80'
                : 'bg-dc-warning-bg text-dc-warning dc:hover:opacity-80'
            }`}
            title={`Click to switch to ${group.type === 'and' ? 'OR' : 'AND'}`}
          >
            {group.type.toUpperCase()}
          </button>

          {/* Condition Count */}
          <span className="dc:text-xs text-dc-text-muted">
            {conditionCount} {conditionLabel}
          </span>
        </div>

        <div className="dc:flex dc:items-center dc:gap-1">
          {/* Add Button with Dropdown */}
          <div className="dc:relative" ref={addMenuRef}>
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="dc:p-1 text-dc-text-secondary hover:text-dc-primary hover:bg-dc-surface-hover dc:rounded dc:transition-colors"
              title="Add condition"
            >
              <AddIcon className="dc:w-4 dc:h-4" />
            </button>

            {isAddMenuOpen && (
              <div className="dc:absolute dc:right-0 dc:mt-1 dc:z-40 bg-dc-surface dc:border border-dc-border dc:rounded dc:shadow-lg dc:py-1 dc:min-w-[120px]">
                <button
                  onClick={handleAddFilterClick}
                  className="dc:w-full text-left dc:px-3 dc:py-1.5 dc:text-xs text-dc-text hover:bg-dc-surface-hover"
                >
                  Add Filter
                </button>
                <button
                  onClick={() => handleAddNestedGroup('and')}
                  className="dc:w-full text-left dc:px-3 dc:py-1.5 dc:text-xs text-dc-text hover:bg-dc-surface-hover"
                >
                  Add AND Group
                </button>
                <button
                  onClick={() => handleAddNestedGroup('or')}
                  className="dc:w-full text-left dc:px-3 dc:py-1.5 dc:text-xs text-dc-text hover:bg-dc-surface-hover"
                >
                  Add OR Group
                </button>
              </div>
            )}
          </div>

          {/* Remove Group Button */}
          {!hideRemoveButton && (
            <button
              onClick={onRemove}
              className="dc:p-1 text-dc-text-muted hover:text-dc-danger dc:transition-colors"
              title="Remove group"
            >
              <CloseIcon className="dc:w-4 dc:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Group Body - Filter List */}
      <div className="dc:p-1.5 dc:flex dc:flex-wrap dc:gap-2">
        {group.filters.length === 0 ? (
          <div className="text-center dc:py-3">
            <p className="dc:text-xs text-dc-text-muted dc:mb-1">No conditions in this group</p>
            <button
              onClick={() => onAddFilter([])}
              className="dc:text-xs text-dc-primary dc:hover:underline"
            >
              Add a filter
            </button>
          </div>
        ) : (
          group.filters.map((filter, index) => {
            if (isSimpleFilter(filter)) {
              return (
                <AnalysisFilterItem
                  key={`filter-${index}`}
                  filter={filter}
                  schema={schema}
                  onUpdate={(newFilter) => handleUpdateFilter(index, newFilter)}
                  onRemove={() => handleRemoveFilter(index)}
                />
              )
            } else if (isGroupFilter(filter)) {
              return (
                <AnalysisFilterGroup
                  key={`group-${index}`}
                  group={filter}
                  schema={schema}
                  onUpdate={(newGroup) => handleUpdateFilter(index, newGroup)}
                  onRemove={() => handleRemoveFilter(index)}
                  onAddFilter={createNestedAddFilterHandler(index)}
                  depth={depth + 1}
                />
              )
            }
            return null
          })
        )}
      </div>
    </div>
  )
}

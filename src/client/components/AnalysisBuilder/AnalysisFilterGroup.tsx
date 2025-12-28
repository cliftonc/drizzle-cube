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
    return 'border-slate-300 dark:border-slate-600'
  }

  // Get background color based on group type
  const getGroupBgColor = () => {
    return group.type === 'and' ? 'bg-dc-info-bg/50' : 'bg-dc-warning-bg/50'
  }

  const conditionCount = group.filters.length
  const conditionLabel = conditionCount === 1 ? 'condition' : 'conditions'

  return (
    <div className={`border ${getBorderColor()} rounded-lg ${getGroupBgColor()} ${depth > 0 ? 'ml-3' : ''}`}>
      {/* Group Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-dc-border/50">
        <div className="flex items-center gap-2">
          {/* AND/OR Toggle Button */}
          <button
            onClick={handleToggleType}
            className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
              group.type === 'and'
                ? 'bg-dc-info-bg text-dc-info hover:opacity-80'
                : 'bg-dc-warning-bg text-dc-warning hover:opacity-80'
            }`}
            title={`Click to switch to ${group.type === 'and' ? 'OR' : 'AND'}`}
          >
            {group.type.toUpperCase()}
          </button>

          {/* Condition Count */}
          <span className="text-xs text-dc-text-muted">
            {conditionCount} {conditionLabel}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Add Button with Dropdown */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="p-1 text-dc-text-secondary hover:text-dc-primary hover:bg-dc-surface-hover rounded transition-colors"
              title="Add condition"
            >
              <AddIcon className="w-4 h-4" />
            </button>

            {isAddMenuOpen && (
              <div className="absolute right-0 mt-1 z-40 bg-dc-surface border border-dc-border rounded shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={handleAddFilterClick}
                  className="w-full text-left px-3 py-1.5 text-xs text-dc-text hover:bg-dc-surface-hover"
                >
                  Add Filter
                </button>
                <button
                  onClick={() => handleAddNestedGroup('and')}
                  className="w-full text-left px-3 py-1.5 text-xs text-dc-text hover:bg-dc-surface-hover"
                >
                  Add AND Group
                </button>
                <button
                  onClick={() => handleAddNestedGroup('or')}
                  className="w-full text-left px-3 py-1.5 text-xs text-dc-text hover:bg-dc-surface-hover"
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
              className="p-1 text-dc-text-muted hover:text-dc-danger transition-colors"
              title="Remove group"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Group Body - Filter List */}
      <div className="p-2 space-y-2">
        {group.filters.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-dc-text-muted mb-1">No conditions in this group</p>
            <button
              onClick={() => onAddFilter([])}
              className="text-xs text-dc-primary hover:underline"
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
                  depth={depth + 1}
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

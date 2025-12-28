/**
 * FilterGroup Component
 * 
 * Handles AND/OR logical groups with support for infinite nesting.
 * Renders child filters with proper indentation and group controls.
 */

import React, { useState } from 'react'
import { getIcon } from '../../icons'
import FilterItem from './FilterItem'
import type { FilterGroupProps } from './types'
import type { SimpleFilter, GroupFilter } from '../../types'
import {
  isSimpleFilter,
  isGroupFilter,
  createSimpleFilter,
  createAndFilter,
  createOrFilter,
  getFilterableFields
} from './utils'

const CloseIcon = getIcon('close')
const AddIcon = getIcon('add')

const FilterGroup: React.FC<FilterGroupProps> = ({
  group,
  index,
  onGroupChange,
  onGroupChangeWithUnwrap,
  onGroupRemove,
  schema,
  query,
  depth = 0
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  const isAndGroup = group.type === 'and'
  const groupType = isAndGroup ? 'AND' : 'OR'
  const filters = group.filters
  
  // Style based on depth for visual nesting
  const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : ''
  const borderColor = 'border-dc-border'
  const bgColor = 'bg-dc-bg-secondary'
  const textColor = 'text-dc-text-secondary'
  
  const handleGroupTypeToggle = () => {
    if (isAndGroup) {
      const newGroup = createOrFilter(filters)
      onGroupChange(index, newGroup)
    } else {
      const newGroup = createAndFilter(filters)
      onGroupChange(index, newGroup)
    }
  }
  
  const handleAddSimpleFilter = () => {
    if (!schema) return
    
    // Get the first available field as default
    const filterableFields = getFilterableFields(schema, query)
    const defaultField = filterableFields[0]?.name || ''
    const newFilter = createSimpleFilter(defaultField, 'equals', [])
    const newFilters = [...filters, newFilter]
    
    if (isAndGroup) {
      onGroupChange(index, createAndFilter(newFilters))
    } else {
      onGroupChange(index, createOrFilter(newFilters))
    }
    setShowAddMenu(false)
  }
  
  const handleAddAndGroup = () => {
    if (!schema) return
    
    // Get the first available field as default
    const filterableFields = getFilterableFields(schema, query)
    const defaultField = filterableFields[0]?.name || ''
    const newGroup = createAndFilter([createSimpleFilter(defaultField, 'equals', [])])
    const newFilters = [...filters, newGroup]
    
    if (isAndGroup) {
      onGroupChange(index, createAndFilter(newFilters))
    } else {
      onGroupChange(index, createOrFilter(newFilters))
    }
    setShowAddMenu(false)
  }
  
  const handleAddOrGroup = () => {
    if (!schema) return
    
    // Get the first available field as default
    const filterableFields = getFilterableFields(schema, query)
    const defaultField = filterableFields[0]?.name || ''
    const newGroup = createOrFilter([createSimpleFilter(defaultField, 'equals', [])])
    const newFilters = [...filters, newGroup]
    
    if (isAndGroup) {
      onGroupChange(index, createAndFilter(newFilters))
    } else {
      onGroupChange(index, createOrFilter(newFilters))
    }
    setShowAddMenu(false)
  }
  
  const handleFilterChange = (filterIndex: number, newFilter: SimpleFilter) => {
    const newFilters = [...filters]
    newFilters[filterIndex] = newFilter
    
    if (isAndGroup) {
      onGroupChange(index, createAndFilter(newFilters))
    } else {
      onGroupChange(index, createOrFilter(newFilters))
    }
  }
  
  const handleFilterRemove = (filterIndex: number) => {
    const newFilters = filters.filter((_, i) => i !== filterIndex)
    
    // If no filters left, remove the entire group
    if (newFilters.length === 0) {
      onGroupRemove(index)
      return
    }
    
    // If only one filter left, use unwrapping handler if available
    if (newFilters.length === 1) {
      const newGroup = group.type === 'and' ? createAndFilter(newFilters) : createOrFilter(newFilters)
      
      if (onGroupChangeWithUnwrap) {
        // Use the unwrapping handler for removal scenarios
        onGroupChangeWithUnwrap(index, newGroup)
      } else {
        // Fallback to regular handler (for nested groups)
        onGroupChange(index, newGroup)
      }
      return
    }
    
    // Otherwise, update the group with remaining filters (preserve the group type)
    const updatedGroup = group.type === 'and' ? createAndFilter(newFilters) : createOrFilter(newFilters)
    onGroupChange(index, updatedGroup)
  }
  
  const handleNestedGroupChange = (filterIndex: number, newGroup: GroupFilter) => {
    const newFilters = [...filters]
    newFilters[filterIndex] = newGroup
    
    if (isAndGroup) {
      onGroupChange(index, createAndFilter(newFilters))
    } else {
      onGroupChange(index, createOrFilter(newFilters))
    }
  }
  
  const handleNestedGroupRemove = (filterIndex: number) => {
    handleFilterRemove(filterIndex)
  }
  
  return (
    <div className={`${indentClass} ${borderColor} border-2 ${bgColor} rounded-lg p-4 space-y-3`}>
      {/* Group header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleGroupTypeToggle}
            className={`px-3 py-1 rounded-sm text-sm font-semibold ${textColor} border border-current hover:bg-dc-surface hover:bg-opacity-20 focus:outline-hidden focus:ring-2 focus:ring-current focus:ring-opacity-50`}
          >
            {groupType}
          </button>
          <span className="text-sm text-dc-text-secondary">
            {filters.length} condition{filters.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Add menu */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="text-dc-text-muted hover:text-dc-text-secondary focus:outline-hidden"
              title="Add condition"
            >
              <AddIcon className="w-4 h-4" />
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-dc-surface border border-dc-border rounded-md shadow-lg z-30">
                <button
                  onClick={handleAddSimpleFilter}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover"
                >
                  Add Filter
                </button>
                <button
                  onClick={handleAddAndGroup}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover"
                >
                  Add AND Group
                </button>
                <button
                  onClick={handleAddOrGroup}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover"
                >
                  Add OR Group
                </button>
              </div>
            )}
          </div>

          {/* Remove group button */}
          <button
            onClick={() => onGroupRemove(index)}
            className="text-dc-text-muted hover:text-dc-error focus:outline-hidden"
            title="Remove group"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Group content */}
      <div className="space-y-3">
        {filters.map((filter, filterIndex) => {
          if (isSimpleFilter(filter)) {
            return (
              <FilterItem
                key={filterIndex}
                filter={filter}
                index={filterIndex}
                onFilterChange={handleFilterChange}
                onFilterRemove={handleFilterRemove}
                schema={schema}
                query={query}
              />
            )
          } else if (isGroupFilter(filter)) {
            return (
              <FilterGroup
                key={filterIndex}
                group={filter}
                index={filterIndex}
                onGroupChange={handleNestedGroupChange}
                onGroupRemove={handleNestedGroupRemove}
                schema={schema}
                query={query}
                depth={depth + 1}
              />
            )
          }
          return null
        })}
        
        {/* Empty state */}
        {filters.length === 0 && (
          <div className="text-center py-4 text-dc-text-muted text-sm">
            No conditions in this group.
            <button
              onClick={handleAddSimpleFilter}
              className="ml-2 text-dc-accent hover:text-dc-accent focus:outline-hidden underline"
            >
              Add a filter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterGroup
/**
 * FilterGroup Component
 * 
 * Handles AND/OR logical groups with support for infinite nesting.
 * Renders child filters with proper indentation and group controls.
 */

import React, { useState } from 'react'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
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
  const borderColor = 'border-slate-200'
  const bgColor = 'bg-slate-50'
  const textColor = 'text-slate-700'
  
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
            className={`px-3 py-1 rounded-sm text-sm font-semibold ${textColor} border border-current hover:bg-white hover:bg-opacity-20 focus:outline-hidden focus:ring-2 focus:ring-current focus:ring-opacity-50`}
          >
            {groupType}
          </button>
          <span className="text-sm text-gray-600">
            {filters.length} condition{filters.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Add menu */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="text-gray-500 hover:text-gray-700 focus:outline-hidden"
              title="Add condition"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            
            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-30">
                <button
                  onClick={handleAddSimpleFilter}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100"
                >
                  Add Filter
                </button>
                <button
                  onClick={handleAddAndGroup}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100"
                >
                  Add AND Group
                </button>
                <button
                  onClick={handleAddOrGroup}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100"
                >
                  Add OR Group
                </button>
              </div>
            )}
          </div>
          
          {/* Remove group button */}
          <button
            onClick={() => onGroupRemove(index)}
            className="text-gray-400 hover:text-red-600 focus:outline-hidden"
            title="Remove group"
          >
            <XMarkIcon className="w-4 h-4" />
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
          <div className="text-center py-4 text-gray-500 text-sm">
            No conditions in this group.
            <button
              onClick={handleAddSimpleFilter}
              className="ml-2 text-purple-600 hover:text-purple-800 focus:outline-hidden underline"
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
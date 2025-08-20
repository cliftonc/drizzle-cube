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
import type { SimpleFilter, AndFilter, OrFilter } from '../../types'
import { 
  isSimpleFilter, 
  isAndFilter, 
  isOrFilter, 
  createSimpleFilter, 
  createAndFilter, 
  createOrFilter
} from './utils'

const FilterGroup: React.FC<FilterGroupProps> = ({
  group,
  index,
  onGroupChange,
  onGroupRemove,
  schema,
  depth = 0
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  const isAndGroup = isAndFilter(group)
  const groupType = isAndGroup ? 'AND' : 'OR'
  const filters = isAndGroup ? group.and : group.or
  
  // Style based on depth for visual nesting
  const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : ''
  const borderColor = isAndGroup ? 'border-blue-200' : 'border-orange-200'
  const bgColor = isAndGroup ? 'bg-blue-50' : 'bg-orange-50'
  const textColor = isAndGroup ? 'text-blue-800' : 'text-orange-800'
  
  const handleGroupTypeToggle = () => {
    if (isAndGroup) {
      const newGroup: OrFilter = createOrFilter(filters)
      onGroupChange(index, newGroup)
    } else {
      const newGroup: AndFilter = createAndFilter(filters)
      onGroupChange(index, newGroup)
    }
  }
  
  const handleAddSimpleFilter = () => {
    const newFilter = createSimpleFilter('', 'equals', [])
    const newFilters = [...filters, newFilter]
    
    if (isAndGroup) {
      onGroupChange(index, createAndFilter(newFilters))
    } else {
      onGroupChange(index, createOrFilter(newFilters))
    }
    setShowAddMenu(false)
  }
  
  const handleAddAndGroup = () => {
    const newGroup = createAndFilter([createSimpleFilter('', 'equals', [])])
    const newFilters = [...filters, newGroup]
    
    if (isAndGroup) {
      onGroupChange(index, createAndFilter(newFilters))
    } else {
      onGroupChange(index, createOrFilter(newFilters))
    }
    setShowAddMenu(false)
  }
  
  const handleAddOrGroup = () => {
    const newGroup = createOrFilter([createSimpleFilter('', 'equals', [])])
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
    
    if (isAndGroup) {
      onGroupChange(index, createAndFilter(newFilters))
    } else {
      onGroupChange(index, createOrFilter(newFilters))
    }
  }
  
  const handleNestedGroupChange = (filterIndex: number, newGroup: AndFilter | OrFilter) => {
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
            className={`px-3 py-1 rounded text-sm font-semibold ${textColor} border border-current hover:bg-white hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-current focus:ring-opacity-50`}
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
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Add condition"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            
            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-30">
                <button
                  onClick={handleAddSimpleFilter}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Add Filter
                </button>
                <button
                  onClick={handleAddAndGroup}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Add AND Group
                </button>
                <button
                  onClick={handleAddOrGroup}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  Add OR Group
                </button>
              </div>
            )}
          </div>
          
          {/* Remove group button */}
          <button
            onClick={() => onGroupRemove(index)}
            className="text-gray-400 hover:text-red-600 focus:outline-none"
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
              />
            )
          } else if (isAndFilter(filter) || isOrFilter(filter)) {
            return (
              <FilterGroup
                key={filterIndex}
                group={filter}
                index={filterIndex}
                onGroupChange={handleNestedGroupChange}
                onGroupRemove={handleNestedGroupRemove}
                schema={schema}
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
              className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none underline"
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
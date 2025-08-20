/**
 * FilterBuilder Component
 * 
 * Main component for managing all filters in the query.
 * Handles the top-level filter state and provides controls for adding new filters and groups.
 */

import React, { useState } from 'react'
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import FilterItem from './FilterItem'
import FilterGroup from './FilterGroup'
import type { FilterBuilderProps } from './types'
import type { SimpleFilter, AndFilter, OrFilter } from '../../types'
import { 
  isSimpleFilter, 
  isAndFilter, 
  isOrFilter, 
  createSimpleFilter, 
  createAndFilter, 
  createOrFilter,
  countFilters
} from './utils'

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  filters,
  schema,
  onFiltersChange
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  const totalFilterCount = countFilters(filters)
  
  const handleAddSimpleFilter = () => {
    const newFilter = createSimpleFilter('', 'equals', [])
    onFiltersChange([...filters, newFilter])
    setShowAddMenu(false)
  }
  
  const handleAddAndGroup = () => {
    const newGroup = createAndFilter([createSimpleFilter('', 'equals', [])])
    onFiltersChange([...filters, newGroup])
    setShowAddMenu(false)
  }
  
  const handleAddOrGroup = () => {
    const newGroup = createOrFilter([createSimpleFilter('', 'equals', [])])
    onFiltersChange([...filters, newGroup])
    setShowAddMenu(false)
  }
  
  const handleFilterChange = (index: number, newFilter: SimpleFilter) => {
    const newFilters = [...filters]
    newFilters[index] = newFilter
    onFiltersChange(newFilters)
  }
  
  const handleFilterRemove = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index)
    onFiltersChange(newFilters)
  }
  
  const handleGroupChange = (index: number, newGroup: AndFilter | OrFilter) => {
    const newFilters = [...filters]
    newFilters[index] = newGroup
    onFiltersChange(newFilters)
  }
  
  const handleGroupRemove = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index)
    onFiltersChange(newFilters)
  }
  
  const handleClearAllFilters = () => {
    onFiltersChange([])
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FunnelIcon className="w-4 h-4 text-gray-500 mr-2" />
          <h4 className="text-sm font-semibold text-gray-700">
            Filters ({totalFilterCount})
          </h4>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Clear all button */}
          {filters.length > 0 && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-gray-500 hover:text-red-600 focus:outline-none underline"
            >
              Clear all
            </button>
          )}
          
          {/* Add menu */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-3 h-3" />
              <span>Add Filter</span>
            </button>
            
            {showAddMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-20">
                <button
                  onClick={handleAddSimpleFilter}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  <div className="font-medium">Add Filter</div>
                  <div className="text-xs text-gray-500">Single condition</div>
                </button>
                <button
                  onClick={handleAddAndGroup}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  <div className="font-medium">Add AND Group</div>
                  <div className="text-xs text-gray-500">All conditions must be true</div>
                </button>
                <button
                  onClick={handleAddOrGroup}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  <div className="font-medium">Add OR Group</div>
                  <div className="text-xs text-gray-500">Any condition can be true</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Filters list */}
      <div className="space-y-3">
        {filters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FunnelIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <div className="text-sm font-medium mb-1">No filters applied</div>
            <div className="text-xs mb-3">Add filters to narrow down your results</div>
            <button
              onClick={handleAddSimpleFilter}
              className="inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add your first filter</span>
            </button>
          </div>
        ) : (
          filters.map((filter, index) => {
            if (isSimpleFilter(filter)) {
              return (
                <FilterItem
                  key={index}
                  filter={filter}
                  index={index}
                  onFilterChange={handleFilterChange}
                  onFilterRemove={handleFilterRemove}
                  schema={schema}
                />
              )
            } else if (isAndFilter(filter) || isOrFilter(filter)) {
              return (
                <FilterGroup
                  key={index}
                  group={filter}
                  index={index}
                  onGroupChange={handleGroupChange}
                  onGroupRemove={handleGroupRemove}
                  schema={schema}
                  depth={0}
                />
              )
            }
            return null
          })
        )}
      </div>
      
      {/* Help text */}
      {filters.length > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div className="font-medium mb-1">Filter Logic:</div>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>AND groups:</strong> All conditions in the group must be true</li>
            <li><strong>OR groups:</strong> At least one condition in the group must be true</li>
            <li><strong>Nesting:</strong> Groups can contain other groups for complex logic</li>
            <li><strong>Multiple top-level filters:</strong> Combined with AND logic</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default FilterBuilder
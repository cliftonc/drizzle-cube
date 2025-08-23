/**
 * FilterBuilder Component
 * 
 * Main component for managing all filters in the query.
 * Handles the top-level filter state and provides controls for adding new filters and groups.
 */

import React from 'react'
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import FilterItem from './FilterItem'
import FilterGroup from './FilterGroup'
import type { FilterBuilderProps } from './types'
import type { SimpleFilter, GroupFilter } from '../../types'
import { 
  isSimpleFilter, 
  isGroupFilter,
  isAndFilter, 
  isOrFilter, 
  createSimpleFilter, 
  createAndFilter, 
  createOrFilter,
  countFilters,
  getFilterableFields
} from './utils'

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  filters,
  schema,
  query,
  onFiltersChange
}) => {
  
  
  const totalFilterCount = countFilters(filters)
  
  // Get filterable fields from currently selected query fields
  const filterableFields = schema ? getFilterableFields(schema, query) : []
  const hasFilterableFields = filterableFields.length > 0
  
  const handleAddSimpleFilter = () => {
    if (!hasFilterableFields) return
    
    // Use the first available field as default
    const defaultField = filterableFields[0]?.name || ''
    const newFilter = createSimpleFilter(defaultField, 'equals', [])
    
    // Smart filter grouping logic:
    // - First filter: add as simple filter
    // - Second filter: create AND group with first filter + new filter
    // - Additional filters: add to existing group (AND or OR, respecting current type)
    
    if (filters.length === 0) {
      // First filter - add as simple filter
      onFiltersChange([newFilter])
    } else if (filters.length === 1 && isSimpleFilter(filters[0])) {
      // Second filter - create AND group with existing filter + new filter
      const andGroup = createAndFilter([filters[0], newFilter])
      onFiltersChange([andGroup])
    } else if (filters.length === 1 && isAndFilter(filters[0])) {
      // Additional filter - add to existing AND group
      const existingAndGroup = filters[0]
      const updatedAndGroup = createAndFilter([...existingAndGroup.filters, newFilter])
      onFiltersChange([updatedAndGroup])
    } else if (filters.length === 1 && isOrFilter(filters[0])) {
      // Additional filter - add to existing OR group
      const existingOrGroup = filters[0]
      const updatedOrGroup = createOrFilter([...existingOrGroup.filters, newFilter])
      onFiltersChange([updatedOrGroup])
    } else {
      // Fallback: just add to the end (shouldn't happen with new logic)
      onFiltersChange([...filters, newFilter])
    }
  }
  
  
  const handleFilterChange = (index: number, newFilter: SimpleFilter) => {
    const newFilters = [...filters]
    newFilters[index] = newFilter
    onFiltersChange(newFilters)
  }
  
  const handleFilterRemove = (index: number) => {
    // Simple case: just remove the filter
    // The handleGroupChange method will automatically handle unwrapping if needed
    const newFilters = filters.filter((_, i) => i !== index)
    onFiltersChange(newFilters)
  }
  
  const handleGroupChange = (index: number, newGroup: GroupFilter) => {
    const newFilters = [...filters]
    newFilters[index] = newGroup
    onFiltersChange(newFilters)
  }
  
  const handleGroupChangeWithUnwrap = (index: number, newGroup: GroupFilter) => {
    const newFilters = [...filters]
    
    // Check if the group has been reduced to a single filter and should be unwrapped
    // This is only used during filter removal operations
    if (newGroup.filters.length === 1 && isSimpleFilter(newGroup.filters[0])) {
      // Unwrap the single filter from the group
      newFilters[index] = newGroup.filters[0]
    } else {
      newFilters[index] = newGroup
    }
    
    onFiltersChange(newFilters)
  }
  
  const handleGroupRemove = () => {
    // When removing an AND group, we should remove all filters
    onFiltersChange([])
  }
  
  const handleClearAllFilters = () => {
    onFiltersChange([])
  }
  
  return (
    <div className="space-y-4 bg-gray-50 rounded-lg p-4">
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
          
          {/* Add Filter button */}
          <button
            onClick={handleAddSimpleFilter}
            disabled={!hasFilterableFields}
            className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-2 ${
              hasFilterableFields
                ? 'text-purple-700 bg-purple-100 border border-purple-200 hover:bg-purple-200 focus:ring-purple-500'
                : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
            }`}
          >
            <PlusIcon className="w-3 h-3" />
            <span>Add Filter</span>
          </button>
        </div>
      </div>
      
      {/* Filters list */}
      {filters.length > 0 && (
        <div className="space-y-3">
          {filters.map((filter, index) => {
            
            if (isSimpleFilter(filter)) {
              return (
                <FilterItem
                  key={index}
                  filter={filter}
                  index={index}
                  onFilterChange={handleFilterChange}
                  onFilterRemove={handleFilterRemove}
                  schema={schema}
                  query={query}
                />
              )
            } else if (isGroupFilter(filter)) {
              return (
                <FilterGroup
                  key={index}
                  group={filter}
                  index={index}
                  onGroupChange={handleGroupChange}
                  onGroupChangeWithUnwrap={handleGroupChangeWithUnwrap}
                  onGroupRemove={handleGroupRemove}
                  schema={schema}
                  query={query}
                  depth={0}
                />
              )
            }
            return null
          })}
        </div>
      )}
      
    </div>
  )
}

export default FilterBuilder
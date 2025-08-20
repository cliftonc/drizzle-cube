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
import type { SimpleFilter, AndFilter, OrFilter } from '../../types'
import { 
  isSimpleFilter, 
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
      const updatedAndGroup = createAndFilter([...existingAndGroup.and, newFilter])
      onFiltersChange([updatedAndGroup])
    } else if (filters.length === 1 && isOrFilter(filters[0])) {
      // Additional filter - add to existing OR group
      const existingOrGroup = filters[0]
      const updatedOrGroup = createOrFilter([...existingOrGroup.or, newFilter])
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
    // Handle removal with automatic group unwrapping logic:
    // - If we have a group with 2 filters and remove 1, unwrap to simple filter
    // - Otherwise, just remove the filter from the group
    
    if (filters.length === 1 && isAndFilter(filters[0])) {
      const andGroup = filters[0]
      if (andGroup.and.length === 2) {
        // Removing one filter from a 2-filter AND group - unwrap to simple filter
        const remainingFilter = andGroup.and.filter((_, i) => i !== index)[0]
        onFiltersChange([remainingFilter])
      } else if (andGroup.and.length > 2) {
        // Removing one filter from 3+ filter AND group - keep the group
        const updatedAndFilters = andGroup.and.filter((_, i) => i !== index)
        const updatedAndGroup = createAndFilter(updatedAndFilters)
        onFiltersChange([updatedAndGroup])
      } else {
        // Edge case: AND group with 1 or 0 filters - remove everything
        onFiltersChange([])
      }
    } else if (filters.length === 1 && isOrFilter(filters[0])) {
      const orGroup = filters[0]
      if (orGroup.or.length === 2) {
        // Removing one filter from a 2-filter OR group - unwrap to simple filter
        const remainingFilter = orGroup.or.filter((_, i) => i !== index)[0]
        onFiltersChange([remainingFilter])
      } else if (orGroup.or.length > 2) {
        // Removing one filter from 3+ filter OR group - keep the group
        const updatedOrFilters = orGroup.or.filter((_, i) => i !== index)
        const updatedOrGroup = createOrFilter(updatedOrFilters)
        onFiltersChange([updatedOrGroup])
      } else {
        // Edge case: OR group with 1 or 0 filters - remove everything
        onFiltersChange([])
      }
    } else {
      // Simple case: just remove the filter
      const newFilters = filters.filter((_, i) => i !== index)
      onFiltersChange(newFilters)
    }
  }
  
  const handleGroupChange = (index: number, newGroup: AndFilter | OrFilter) => {
    const newFilters = [...filters]
    newFilters[index] = newGroup
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
            } else if (isAndFilter(filter) || isOrFilter(filter)) {
              return (
                <FilterGroup
                  key={index}
                  group={filter}
                  index={index}
                  onGroupChange={handleGroupChange}
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
/**
 * FilterItem Component
 * 
 * Renders a single filter with field selection, operator selection, and value input.
 * Handles all the logic for individual filter management.
 */

import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon, FunnelIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/solid'
import FilterValueSelector from './FilterValueSelector'
import type { FilterItemProps, MetaField } from './types'
import { getAllFilterableFields, getOrganizedFilterFields, getFieldType, getAvailableOperators } from './utils'

const FilterItem: React.FC<FilterItemProps> = ({
  filter,
  index,
  onFilterChange,
  onFilterRemove,
  schema,
  query
}) => {
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false)
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false)
  const [fieldSearchTerm, setFieldSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFieldDropdownOpen(false)
        setIsOperatorDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Close other dropdowns when opening one
  const handleFieldDropdownToggle = () => {
    setIsOperatorDropdownOpen(false)
    const newOpen = !isFieldDropdownOpen
    setIsFieldDropdownOpen(newOpen)
    setFieldSearchTerm('') // Reset search when toggling
    
    // Focus search input when opening
    if (newOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }
  
  const handleOperatorDropdownToggle = () => {
    setIsFieldDropdownOpen(false)
    setIsOperatorDropdownOpen(!isOperatorDropdownOpen)
  }
  
  if (!schema) {
    return (
      <div className="text-sm text-gray-500">
        Schema not loaded
      </div>
    )
  }
  
  // Get all available fields and organize them
  const allFields = getAllFilterableFields(schema)
  const { queryFields } = getOrganizedFilterFields(schema, query)
  const selectedField = allFields.find(f => f.name === filter.member)
  const fieldType = selectedField ? selectedField.type : 'string'
  const availableOperators = getAvailableOperators(fieldType)
  
  // Filter fields based on search term
  const filterFieldsBySearch = (fields: MetaField[]) => {
    if (!fieldSearchTerm) return fields
    const searchTerm = fieldSearchTerm.toLowerCase()
    return fields.filter(field => 
      field.name.toLowerCase().includes(searchTerm) ||
      field.title.toLowerCase().includes(searchTerm) ||
      field.shortTitle.toLowerCase().includes(searchTerm)
    )
  }
  
  const filteredQueryFields = filterFieldsBySearch(queryFields)
  const filteredAllFields = filterFieldsBySearch(allFields)
  
  // Helper function to get field type icon
  const getFieldTypeIcon = (field: MetaField) => {
    if (field.type === 'time') {
      return <CalendarIcon className="w-3 h-3 text-blue-500" />
    } else if (['count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'number'].includes(field.type)) {
      return <ChartBarIcon className="w-3 h-3 text-amber-500" />
    } else {
      return <TagIcon className="w-3 h-3 text-green-500" />
    }
  }

  // Helper function to get field type badge
  const getFieldTypeBadge = (field: MetaField) => {
    if (field.type === 'time') {
      return <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">T</span>
    } else if (['count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'number'].includes(field.type)) {
      return <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">M</span>
    } else {
      return <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">D</span>
    }
  }

  const handleFieldChange = (fieldName: string) => {
    // When field changes, reset operator and values
    const newFieldType = getFieldType(fieldName, schema)
    const newAvailableOperators = getAvailableOperators(newFieldType)
    const defaultOperator = newAvailableOperators[0]?.operator || 'equals'
    
    onFilterChange(index, {
      member: fieldName,
      operator: defaultOperator as any,
      values: []
    })
    setIsFieldDropdownOpen(false)
  }
  
  const handleOperatorChange = (operator: string) => {
    onFilterChange(index, {
      ...filter,
      operator: operator as any,
      values: [] // Reset values when operator changes
    })
    setIsOperatorDropdownOpen(false)
  }
  
  const handleValuesChange = (values: any[]) => {
    onFilterChange(index, {
      ...filter,
      values
    })
  }
  
  return (
    <div ref={containerRef} className="bg-white border border-gray-200 rounded-lg p-3">
      {/* Responsive layout - stacks on mobile, single row on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        {/* Row 1 on mobile: Filter icon and field selection */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FunnelIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          
          {/* Field selection */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={handleFieldDropdownToggle}
              className="w-full flex items-center justify-between text-left text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
            >
              <span className="truncate">
                {selectedField ? (
                  <span className="font-medium">{selectedField.name}</span>
                ) : (
                  <span className="text-gray-500">Select field...</span>
                )}
              </span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-1 transition-transform ${
                isFieldDropdownOpen ? 'transform rotate-180' : ''
              }`} />
            </button>
            
            {isFieldDropdownOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
                {/* Search input */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search fields..."
                      value={fieldSearchTerm}
                      onChange={(e) => setFieldSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Fields list */}
                <div className="max-h-60 overflow-y-auto">
                  {/* Query fields section */}
                  {filteredQueryFields.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                        Fields in Query ({filteredQueryFields.length})
                      </div>
                      {filteredQueryFields.map((field) => (
                        <button
                          key={`query-${field.name}`}
                          onClick={() => handleFieldChange(field.name)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                            field.name === filter.member ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getFieldTypeIcon(field)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{field.name}</span>
                                {getFieldTypeBadge(field)}
                              </div>
                              {field.title !== field.name && (
                                <div className="text-xs text-gray-500 truncate">{field.title}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* All fields section */}
                  <div>
                    {filteredQueryFields.length > 0 && (
                      <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                        All Available Fields ({filteredAllFields.length})
                      </div>
                    )}
                    {filteredAllFields.map((field) => (
                      <button
                        key={`all-${field.name}`}
                        onClick={() => handleFieldChange(field.name)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                          field.name === filter.member ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getFieldTypeIcon(field)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{field.name}</span>
                              {getFieldTypeBadge(field)}
                            </div>
                            {field.title !== field.name && (
                              <div className="text-xs text-gray-500 truncate">{field.title}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* No results message */}
                  {filteredAllFields.length === 0 && (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      No fields found matching "{fieldSearchTerm}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Row 2 on mobile: Operator and Value selection */}
        {selectedField && (
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
            {/* Operator selection */}
            <div className="relative flex-shrink-0">
              <button
                onClick={handleOperatorDropdownToggle}
                className="w-full sm:w-32 flex items-center justify-between text-left text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="truncate">
                  {availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-1 transition-transform ${
                  isOperatorDropdownOpen ? 'transform rotate-180' : ''
                }`} />
              </button>
              
              {isOperatorDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {availableOperators.map((operator) => (
                    <button
                      key={operator.operator}
                      onClick={() => handleOperatorChange(operator.operator)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                        operator.operator === filter.operator ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {operator.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Value input */}
            <div className="flex-1 min-w-0">
              <FilterValueSelector
                fieldName={filter.member}
                operator={filter.operator}
                values={filter.values}
                onValuesChange={handleValuesChange}
                schema={schema}
              />
            </div>
          </div>
        )}
        
        {/* Row 3 on mobile: Remove button - positioned at the end */}
        <div className="flex justify-end sm:justify-start">
          <button
            onClick={() => onFilterRemove(index)}
            className="text-gray-400 hover:text-red-600 focus:outline-none flex-shrink-0"
            title="Remove filter"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterItem
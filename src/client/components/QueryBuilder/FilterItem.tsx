/**
 * FilterItem Component
 * 
 * Renders a single filter with field selection, operator selection, and value input.
 * Handles all the logic for individual filter management.
 */

import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import FilterValueSelector from './FilterValueSelector'
import type { FilterItemProps } from './types'
import { getFilterableFields, getFieldType, getAvailableOperators } from './utils'

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
  const containerRef = useRef<HTMLDivElement>(null)
  
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
    setIsFieldDropdownOpen(!isFieldDropdownOpen)
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
  
  const filterableFields = getFilterableFields(schema, query)
  const selectedField = filterableFields.find(f => f.name === filter.member)
  const fieldType = selectedField ? selectedField.type : 'string'
  const availableOperators = getAvailableOperators(fieldType)
  
  // If no filterable fields are available, show a message
  if (filterableFields.length === 0) {
    return (
      <div ref={containerRef} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <FunnelIcon className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <div className="flex-1 text-yellow-600 text-sm">
            ⚠️ No fields available for filtering. Select measures, dimensions, or time dimensions first.
          </div>
          <button
            onClick={() => onFilterRemove(index)}
            className="text-gray-400 hover:text-red-600 focus:outline-none flex-shrink-0"
            title="Remove filter"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
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
      {/* Responsive layout - row on desktop, column on mobile */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Filter icon and field selection - combined on mobile */}
        <div className="flex items-center gap-3 flex-1">
          <FunnelIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          
          {/* Field selection */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={handleFieldDropdownToggle}
              className="w-full flex items-center justify-between text-left text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filterableFields.map((field) => (
                  <button
                    key={field.name}
                    onClick={() => handleFieldChange(field.name)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                      field.name === filter.member ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{field.name}</div>
                    {field.title !== field.name && (
                      <div className="text-xs text-gray-500">{field.title}</div>
                    )}
                    <div className="text-xs text-gray-400">Type: {field.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Operator and Value selection - row on mobile, but each takes full width */}
        {selectedField && (
          <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1 md:flex-initial">
            {/* Operator selection */}
            <div className="relative w-full md:w-32 flex-shrink-0">
              <button
                onClick={handleOperatorDropdownToggle}
                className="w-full flex items-center justify-between text-left text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="truncate">
                  {availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-1 transition-transform ${
                  isOperatorDropdownOpen ? 'transform rotate-180' : ''
                }`} />
              </button>
              
              {isOperatorDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
        
        {/* Remove button */}
        <button
          onClick={() => onFilterRemove(index)}
          className="text-gray-400 hover:text-red-600 focus:outline-none flex-shrink-0 self-start md:self-center"
          title="Remove filter"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default FilterItem
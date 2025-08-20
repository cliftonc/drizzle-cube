/**
 * FilterItem Component
 * 
 * Renders a single filter with field selection, operator selection, and value input.
 * Handles all the logic for individual filter management.
 */

import React, { useState } from 'react'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-yellow-600 text-sm">
              ⚠️ No fields available for filtering. Select measures, dimensions, or time dimensions first.
            </div>
          </div>
          <button
            onClick={() => onFilterRemove(index)}
            className="text-gray-400 hover:text-red-600 focus:outline-none"
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header with remove button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FunnelIcon className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">Filter</span>
        </div>
        <button
          onClick={() => onFilterRemove(index)}
          className="text-gray-400 hover:text-red-600 focus:outline-none"
          title="Remove filter"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      
      {/* Filter configuration */}
      <div className="grid grid-cols-1 gap-3">
        {/* Field selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field
          </label>
          <div className="relative">
            <button
              onClick={() => setIsFieldDropdownOpen(!isFieldDropdownOpen)}
              className="w-full text-left text-sm border border-gray-300 rounded px-3 py-2 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {selectedField ? (
                <div>
                  <div className="font-medium">{selectedField.name}</div>
                  {selectedField.title !== selectedField.name && (
                    <div className="text-xs text-gray-500">{selectedField.title}</div>
                  )}
                </div>
              ) : (
                <span className="text-gray-500">Select field...</span>
              )}
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
        
        {/* Operator selection */}
        {selectedField && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Operator
            </label>
            <div className="relative">
              <button
                onClick={() => setIsOperatorDropdownOpen(!isOperatorDropdownOpen)}
                className="w-full text-left text-sm border border-gray-300 rounded px-3 py-2 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator}
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
          </div>
        )}
        
        {/* Value input */}
        {selectedField && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Value{availableOperators.find(op => op.operator === filter.operator)?.operator === 'equals' && 's'}
            </label>
            <FilterValueSelector
              fieldName={filter.member}
              operator={filter.operator}
              values={filter.values}
              onValuesChange={handleValuesChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterItem
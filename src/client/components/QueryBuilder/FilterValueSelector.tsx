/**
 * FilterValueSelector Component
 * 
 * Smart input component that adapts to operator type:
 * - Combo box for equals/notEquals with API-fetched values
 * - Number input for numeric operators
 * - Date picker for date operators
 * - No input for set/notSet operators
 */

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useFilterValues } from '../../hooks/useFilterValues'
import type { FilterValueSelectorProps } from './types'
import { FILTER_OPERATORS } from './types'

const FilterValueSelector: React.FC<FilterValueSelectorProps> = ({
  fieldName,
  operator,
  values,
  onValuesChange
}) => {
  const operatorMeta = FILTER_OPERATORS[operator]
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Fetch distinct values for combo box (only for equals/notEquals)
  const shouldFetchValues = operator === 'equals' || operator === 'notEquals'
  const { 
    values: distinctValues, 
    loading: valuesLoading, 
    error: valuesError 
  } = useFilterValues(fieldName, shouldFetchValues)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Filter values based on search text
  const filteredValues = distinctValues.filter(value => 
    String(value).toLowerCase().includes(searchText.toLowerCase())
  )
  
  // Handle value selection for combo box
  const handleValueSelect = (value: any) => {
    if (operatorMeta.supportsMultipleValues) {
      // Add to selection if not already selected
      if (!values.includes(value)) {
        onValuesChange([...values, value])
      }
    } else {
      // Replace current value
      onValuesChange([value])
      setIsOpen(false)
    }
    setSearchText('')
  }
  
  // Handle value removal for multi-select
  const handleValueRemove = (valueToRemove: any) => {
    onValuesChange(values.filter(v => v !== valueToRemove))
  }
  
  // Handle direct text input for non-combo operators
  const handleDirectInput = (value: string) => {
    if (operatorMeta.valueType === 'number') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        onValuesChange([numValue])
      } else if (value === '') {
        onValuesChange([])
      }
    } else {
      onValuesChange(value ? [value] : [])
    }
  }
  
  // Handle date input
  const handleDateInput = (value: string) => {
    if (operator === 'inDateRange') {
      // For date range, we need two values
      const currentValues = values.length >= 2 ? values : ['', '']
      onValuesChange([value, currentValues[1]])
    } else {
      // Single date value
      onValuesChange(value ? [value] : [])
    }
  }
  
  const handleDateRangeEndInput = (value: string) => {
    const currentValues = values.length >= 2 ? values : ['', '']
    onValuesChange([currentValues[0], value])
  }
  
  // Render based on operator type
  if (!operatorMeta.requiresValues) {
    // No input needed for set/notSet
    return (
      <div className="text-sm text-gray-500 italic">
        No value required
      </div>
    )
  }
  
  if (operator === 'inDateRange') {
    // Date range picker
    return (
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={values[0] || ''}
          onChange={(e) => handleDateInput(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-sm text-gray-500">to</span>
        <input
          type="date"
          value={values[1] || ''}
          onChange={(e) => handleDateRangeEndInput(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    )
  }
  
  if (operatorMeta.valueType === 'date') {
    // Single date picker
    return (
      <input
        type="date"
        value={values[0] || ''}
        onChange={(e) => handleDateInput(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    )
  }
  
  if (operatorMeta.valueType === 'number') {
    // Number input
    return (
      <input
        type="number"
        value={values[0] || ''}
        onChange={(e) => handleDirectInput(e.target.value)}
        placeholder="Enter number"
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    )
  }
  
  if (shouldFetchValues && distinctValues.length > 0) {
    // Combo box with API-fetched values
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Selected values display (for multi-select) */}
        {operatorMeta.supportsMultipleValues && values.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {values.map((value, index) => (
              <div
                key={index}
                className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200"
              >
                <span className="mr-1">{String(value)}</span>
                <button
                  onClick={() => handleValueRemove(value)}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Single value display (for single-select) */}
        {!operatorMeta.supportsMultipleValues && values.length > 0 && (
          <div className="mb-2">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
              <span className="mr-1">{String(values[0])}</span>
              <button
                onClick={() => onValuesChange([])}
                className="text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        
        {/* Dropdown trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
        >
          <span className="text-gray-500">
            {valuesLoading ? 'Loading values...' : 'Select value...'}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </button>
        
        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search values..."
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            
            {/* Values list */}
            <div className="max-h-48 overflow-y-auto">
              {valuesError ? (
                <div className="p-2 text-sm text-red-600">
                  Error loading values: {valuesError}
                </div>
              ) : filteredValues.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">
                  {searchText ? 'No matching values' : 'No values available'}
                </div>
              ) : (
                filteredValues.map((value, index) => {
                  const isSelected = values.includes(value)
                  return (
                    <button
                      key={index}
                      onClick={() => handleValueSelect(value)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {String(value)}
                      {isSelected && (
                        <span className="float-right text-blue-600">✓</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Fallback to text input
  return (
    <input
      type="text"
      value={values[0] || ''}
      onChange={(e) => handleDirectInput(e.target.value)}
      placeholder={`Enter ${operatorMeta.valueType} value`}
      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  )
}

export default FilterValueSelector
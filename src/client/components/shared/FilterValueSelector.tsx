/**
 * FilterValueSelector Component
 * 
 * Smart input component that adapts to operator type:
 * - Combo box for equals/notEquals with API-fetched values
 * - Number input for numeric operators
 * - Date picker for date operators
 * - No input for set/notSet operators
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getIcon } from '../../icons'
import { useFilterValues } from '../../hooks/useFilterValues'
import { useDebounce } from '../../hooks/useDebounce'
import type { FilterValueSelectorProps } from './types'
import { FILTER_OPERATORS } from './types'

const ChevronDownIcon = getIcon('chevronDown')
const CloseIcon = getIcon('close')

const FilterValueSelector: React.FC<FilterValueSelectorProps> = ({
  fieldName,
  operator,
  values,
  onValuesChange,
  schema
}) => {
  const operatorMeta = FILTER_OPERATORS[operator]
  const [isOpen, setIsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const lastSearchedTerm = useRef<string>('')
  
  // Debounce the search text
  const debouncedSearchText = useDebounce(searchText, 300)
  
  // Check if the field is a dimension (not a measure)
  const isDimension = useMemo(() => schema ? schema.cubes.some(cube => 
    cube.dimensions.some(dim => dim.name === fieldName)
  ) : false, [schema, fieldName])
  
  // Check if the field is a time dimension
  const isTimeDimension = useMemo(() => schema ? schema.cubes.some(cube => 
    cube.dimensions.some(dim => dim.name === fieldName && dim.type === 'time')
  ) : false, [schema, fieldName])
  
  // Fetch distinct values for combo box (only for equals/notEquals/in/notIn on non-time dimensions)
  const shouldFetchValues = useMemo(() => 
    (['equals', 'notEquals', 'in', 'notIn'].includes(operator)) && isDimension && !isTimeDimension,
    [operator, isDimension, isTimeDimension]
  )
  const shouldShowComboBox = shouldFetchValues
  
  const { 
    values: distinctValues, 
    loading: valuesLoading, 
    error: valuesError,
    searchValues
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
  
  // Load initial values when dropdown opens
  useEffect(() => {
    if (isOpen && shouldFetchValues && searchValues) {
      searchValues('', true) // Force load with empty search
      setHasLoadedInitial(true)
      lastSearchedTerm.current = ''
    }
  }, [isOpen, shouldFetchValues, searchValues])
  
  // Trigger search when debounced search text changes
  useEffect(() => {
    if (hasLoadedInitial && shouldFetchValues && searchValues && debouncedSearchText !== lastSearchedTerm.current) {
      lastSearchedTerm.current = debouncedSearchText
      searchValues(debouncedSearchText)
    }
  }, [debouncedSearchText, hasLoadedInitial, shouldFetchValues, searchValues])
  
  // Handle dropdown toggle
  const handleDropdownToggle = useCallback(() => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    
    // Reset search when closing dropdown
    if (!newIsOpen) {
      setSearchText('')
      lastSearchedTerm.current = ''
    }
  }, [isOpen])
  
  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchText = e.target.value
    setSearchText(newSearchText)
  }, [])
  
  // Handle value selection for combo box
  const handleValueSelect = useCallback((value: any) => {
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
    // Clear search after selection
    setSearchText('')
  }, [operatorMeta.supportsMultipleValues, values, onValuesChange])
  
  // Handle value removal for multi-select
  const handleValueRemove = useCallback((valueToRemove: any) => {
    onValuesChange(values.filter(v => v !== valueToRemove))
  }, [values, onValuesChange])
  
  // Handle direct text input for non-combo operators
  const handleDirectInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (operatorMeta.valueType === 'number') {
      const numValue = parseFloat(value)
      // Accept valid numbers including zero
      if (!isNaN(numValue)) {
        onValuesChange([numValue])
      } else if (value === '' || value === '-') {
        // Allow empty string or just a minus sign for negative numbers being typed
        onValuesChange([])
      }
    } else {
      onValuesChange(value ? [value] : [])
    }
  }, [operatorMeta.valueType, onValuesChange])
  
  // Handle date input
  const handleDateInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (operator === 'inDateRange') {
      // For date range, we need two values
      const currentValues = values.length >= 2 ? values : ['', '']
      onValuesChange([value, currentValues[1]])
    } else {
      // Single date value
      onValuesChange(value ? [value] : [])
    }
  }, [operator, values, onValuesChange])
  
  const handleDateRangeEndInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const currentValues = values.length >= 2 ? values : ['', '']
    onValuesChange([currentValues[0], value])
  }, [values, onValuesChange])

  // Handle between/notBetween range inputs (must be defined at top level, not inside conditionals)
  const handleBetweenStartInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = values.length >= 2 ? values : ['', '']
    const newValues = [!isNaN(value) ? value : e.target.value === '' ? '' : currentValues[0], currentValues[1]]
    onValuesChange(newValues.filter(v => v !== ''))
  }, [values, onValuesChange])

  const handleBetweenEndInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = values.length >= 2 ? values : ['', '']
    const newValues = [currentValues[0], !isNaN(value) ? value : e.target.value === '' ? '' : currentValues[1]]
    onValuesChange(newValues.filter(v => v !== ''))
  }, [values, onValuesChange])

  // Render based on operator type
  if (!operatorMeta.requiresValues) {
    // No input needed for set/notSet
    return (
      <div className="dc:text-sm text-dc-text-muted dc:italic">
        No value required
      </div>
    )
  }
  
  if (operator === 'inDateRange') {
    // Date range picker
    return (
      <div className="dc:flex dc:items-center dc:space-x-2">
        <input
          type="date"
          value={values[0] || ''}
          onChange={handleDateInput}
          className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
        />
        <span className="dc:text-sm text-dc-text-muted">to</span>
        <input
          type="date"
          value={values[1] || ''}
          onChange={handleDateRangeEndInput}
          className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
        />
      </div>
    )
  }
  
  if (operator === 'between' || operator === 'notBetween') {
    // Between range picker (for numbers)
    return (
      <div className="dc:flex dc:items-center dc:space-x-2">
        <input
          type="number"
          value={values[0] !== undefined && values[0] !== null ? values[0] : ''}
          onChange={handleBetweenStartInput}
          placeholder="Min"
          className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
        />
        <span className="dc:text-sm text-dc-text-muted">to</span>
        <input
          type="number"
          value={values[1] !== undefined && values[1] !== null ? values[1] : ''}
          onChange={handleBetweenEndInput}
          placeholder="Max"
          className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
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
        onChange={handleDateInput}
        className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
      />
    )
  }
  
  if (operatorMeta.valueType === 'number') {
    // Number input
    return (
      <input
        type="number"
        value={values[0] !== undefined && values[0] !== null ? values[0] : ''}
        onChange={handleDirectInput}
        placeholder="Enter number"
        className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
      />
    )
  }
  
  // Time dimension with equals/notEquals/in/notIn - use date picker
  if (isTimeDimension && (['equals', 'notEquals', 'in', 'notIn'].includes(operator))) {
    if (operatorMeta.supportsMultipleValues) {
      // Multi-select date picker (for notEquals that supports multiple values)
      return (
        <div className="dc:space-y-2 dc:min-w-0 dc:max-w-full">
          {/* Selected dates display */}
          {values.length > 0 && (
            <div className="dc:flex dc:flex-wrap dc:gap-1 dc:max-w-full">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="dc:inline-flex dc:items-center bg-dc-time-dimension text-dc-time-dimension dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-time-dimension"
                >
                  <span className="dc:mr-1">{String(value)}</span>
                  <button
                    onClick={() => handleValueRemove(value)}
                    className="text-dc-accent hover:text-dc-accent focus:outline-hidden"
                  >
                    <CloseIcon className="dc:w-3 dc:h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add new date */}
          <input
            type="date"
            onChange={(e) => {
              if (e.target.value && !values.includes(e.target.value)) {
                onValuesChange([...values, e.target.value])
                e.target.value = '' // Clear the input
              }
            }}
            className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
            placeholder="Add date..."
          />
        </div>
      )
    } else {
      // Single date picker
      return (
        <input
          type="date"
          value={values[0] || ''}
          onChange={handleDateInput}
          className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
        />
      )
    }
  }
  
  if (shouldShowComboBox) {
    // Combo box with API-fetched values
    return (
      <div className="dc:relative dc:min-w-0 dc:max-w-full" ref={dropdownRef}>
        {/* Selected values display (for multi-select) */}
        {operatorMeta.supportsMultipleValues && values.length > 0 && (
          <div className="dc:flex dc:flex-wrap dc:gap-1 dc:mb-2 dc:max-w-full">
            {values.map((value, index) => (
              <div
                key={index}
                className="dc:inline-flex dc:items-center bg-dc-time-dimension text-dc-time-dimension dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-time-dimension"
              >
                <span className="dc:mr-1">{String(value)}</span>
                <button
                  onClick={() => handleValueRemove(value)}
                  className="text-dc-accent hover:text-dc-accent focus:outline-hidden"
                >
                  <CloseIcon className="dc:w-3 dc:h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Single value display (for single-select) */}
        {!operatorMeta.supportsMultipleValues && values.length > 0 && (
          <div className="dc:mb-2">
            <div className="dc:inline-flex dc:items-center bg-dc-time-dimension text-dc-time-dimension dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-time-dimension">
              <span className="dc:mr-1">{String(values[0])}</span>
              <button
                onClick={() => onValuesChange([])}
                className="text-dc-accent hover:text-dc-accent focus:outline-hidden"
              >
                <CloseIcon className="dc:w-3 dc:h-3" />
              </button>
            </div>
          </div>
        )}
        
        {/* Dropdown trigger */}
        <button
          onClick={handleDropdownToggle}
          className="dc:w-full text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent dc:flex dc:items-center dc:justify-between dc:min-w-0"
        >
          <span className="text-dc-text-muted dc:truncate">
            {valuesLoading && !hasLoadedInitial ? 'Loading values...' : 'Select value...'}
          </span>
          <ChevronDownIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="dc:absolute dc:z-30 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-60 dc:overflow-y-auto">
            {/* Search input */}
            <div className="dc:p-2 dc:border-b border-dc-border">
              <input
                type="text"
                value={searchText}
                onChange={handleSearchChange}
                placeholder="Search values..."
                className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                autoFocus
              />
            </div>

            {/* Values list */}
            <div className="dc:max-h-48 dc:overflow-y-auto">
              {valuesLoading ? (
                <div className="dc:p-2 dc:text-sm text-dc-text-muted">
                  {searchText ? 'Searching...' : 'Loading values...'}
                </div>
              ) : valuesError ? (
                <div className="dc:p-2 dc:text-sm text-dc-error">
                  Error loading values: {valuesError}
                </div>
              ) : distinctValues.length === 0 ? (
                <div className="dc:p-2 dc:text-sm text-dc-text-muted">
                  {searchText ? 'No matching values' : 'No values available'}
                </div>
              ) : (
                distinctValues.map((value, index) => {
                  const isSelected = values.includes(value)

                  return (
                    <button
                      key={`${value}-${index}`}
                      onClick={() => handleValueSelect(value)}
                      className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover ${
                        isSelected ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                      }`}
                    >
                      {String(value)}
                      {isSelected && (
                        <span className="dc:float-right text-dc-accent">✓</span>
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
      value={values[0] !== undefined && values[0] !== null ? values[0] : ''}
      onChange={handleDirectInput}
      placeholder={`Enter ${operatorMeta.valueType} value`}
      className="dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
    />
  )
}

export default FilterValueSelector
/**
 * State + effect cluster for FilterValueSelector, extracted to keep the
 * component a thin presentational dispatcher.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ChangeEvent } from 'react'
import { useFilterValues } from '../../../hooks/useFilterValues.js'
import { useDebounce } from '../../../hooks/useDebounce.js'
import { FILTER_OPERATORS } from '../types.js'
import type { FilterValueSelectorProps } from '../types.js'

const COMBO_OPERATORS = ['equals', 'notEquals', 'in', 'notIn']

export function useFilterValueSelectorState({
  fieldName,
  operator,
  values,
  onValuesChange,
  schema
}: FilterValueSelectorProps) {
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
    COMBO_OPERATORS.includes(operator) && isDimension && !isTimeDimension,
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
  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
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
  const handleDirectInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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
  const handleDateInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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

  const handleDateRangeEndInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const currentValues = values.length >= 2 ? values : ['', '']
    onValuesChange([currentValues[0], value])
  }, [values, onValuesChange])

  // Handle between/notBetween range inputs (must be defined at top level, not inside conditionals)
  const handleBetweenStartInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = values.length >= 2 ? values : ['', '']
    const newValues = [!isNaN(value) ? value : e.target.value === '' ? '' : currentValues[0], currentValues[1]]
    onValuesChange(newValues.filter(v => v !== ''))
  }, [values, onValuesChange])

  const handleBetweenEndInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = values.length >= 2 ? values : ['', '']
    const newValues = [currentValues[0], !isNaN(value) ? value : e.target.value === '' ? '' : currentValues[1]]
    onValuesChange(newValues.filter(v => v !== ''))
  }, [values, onValuesChange])

  return {
    operatorMeta,
    isOpen,
    searchText,
    hasLoadedInitial,
    dropdownRef,
    isTimeDimension,
    shouldShowComboBox,
    distinctValues,
    valuesLoading,
    valuesError,
    handleDropdownToggle,
    handleSearchChange,
    handleValueSelect,
    handleValueRemove,
    handleDirectInput,
    handleDateInput,
    handleDateRangeEndInput,
    handleBetweenStartInput,
    handleBetweenEndInput
  }
}

export { COMBO_OPERATORS }

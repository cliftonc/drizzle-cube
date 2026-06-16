/**
 * useFilterValueFetch
 *
 * Owns the combo-box value concern: the search text, its debounce, the distinct
 * value list fetched from `useFilterValues`, the effects that (re)load options
 * when the value dropdown opens or the search text changes, and the
 * select/remove handlers that write the chosen value(s) back onto the filter.
 *
 * Behaviour is identical to the previous inline implementation — same effects,
 * same dependency arrays, same handler bodies.
 */

import { useState, useEffect, useCallback } from 'react'
import type { SimpleFilter } from '../../types.js'
import { useFilterValues } from '../../hooks/useFilterValues.js'
import { useDebounce } from '../../hooks/useDebounce.js'

interface OperatorMetaLike {
  supportsMultipleValues?: boolean
}

interface UseFilterValueFetchParams {
  localFilter: SimpleFilter
  setLocalFilter: (filter: SimpleFilter) => void
  operatorMeta: OperatorMetaLike | undefined
  shouldShowComboBox: boolean
  isValueDropdownOpen: boolean
  setIsValueDropdownOpen: (open: boolean) => void
}

export function useFilterValueFetch({
  localFilter,
  setLocalFilter,
  operatorMeta,
  shouldShowComboBox,
  isValueDropdownOpen,
  setIsValueDropdownOpen
}: UseFilterValueFetchParams) {
  const [searchText, setSearchText] = useState('')

  // Debounce search text for API calls
  const debouncedSearchText = useDebounce(searchText, 300)

  // Fetch distinct values for combo box
  const {
    values: distinctValues,
    loading: valuesLoading,
    error: valuesError,
    searchValues
  } = useFilterValues(localFilter.member, shouldShowComboBox)

  // Load values when dropdown opens
  useEffect(() => {
    if (isValueDropdownOpen && shouldShowComboBox && searchValues) {
      searchValues('', true)
    }
  }, [isValueDropdownOpen, shouldShowComboBox, searchValues])

  // Search when debounced text changes
  useEffect(() => {
    if (isValueDropdownOpen && shouldShowComboBox && searchValues && debouncedSearchText !== undefined) {
      searchValues(debouncedSearchText)
    }
  }, [debouncedSearchText, isValueDropdownOpen, shouldShowComboBox, searchValues])

  // Handle value selection from combo box
  const handleValueSelect = useCallback((value: unknown) => {
    const values = localFilter.values || []
    if (operatorMeta?.supportsMultipleValues) {
      if (!values.includes(value)) {
        setLocalFilter({ ...localFilter, values: [...values, value] })
      }
    } else {
      setLocalFilter({ ...localFilter, values: [value] })
      setIsValueDropdownOpen(false)
    }
    setSearchText('')
  }, [localFilter, operatorMeta?.supportsMultipleValues, setLocalFilter, setIsValueDropdownOpen])

  // Handle value removal
  const handleValueRemove = useCallback((valueToRemove: unknown) => {
    const values = (localFilter.values || []).filter((v: unknown) => v !== valueToRemove)
    setLocalFilter({ ...localFilter, values })
  }, [localFilter, setLocalFilter])

  return {
    searchText,
    setSearchText,
    distinctValues,
    valuesLoading,
    valuesError,
    handleValueSelect,
    handleValueRemove
  }
}

export type UseFilterValueFetch = ReturnType<typeof useFilterValueFetch>

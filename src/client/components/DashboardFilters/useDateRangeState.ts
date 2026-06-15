/**
 * useDateRangeState
 *
 * Owns the date-range editing concern for time fields using `inDateRange`:
 * the selected preset (`rangeType`), the "last N" number input (`numberValue`),
 * the effect that syncs those back from the filter's `dateRange`, and the four
 * handlers that translate UI changes into a new `dateRange` on the filter.
 *
 * Behaviour is identical to the previous inline implementation — same effect,
 * same dependency arrays, same handler bodies.
 */

import { useState, useEffect, useCallback, ChangeEvent } from 'react'
import type { SimpleFilter } from '../../types'
import type { DateRangeType } from '../../shared/types'
import {
  convertDateRangeTypeToValue,
  requiresNumberInput
} from '../../shared/utils'
import { deriveRangeFromDateRange } from './dashboardFilterConfigModalUtils'

interface UseDateRangeStateParams {
  localFilter: SimpleFilter
  setLocalFilter: (filter: SimpleFilter) => void
  shouldShowDateRange: boolean
  setIsDateRangeDropdownOpen: (open: boolean) => void
}

export function useDateRangeState({
  localFilter,
  setLocalFilter,
  shouldShowDateRange,
  setIsDateRangeDropdownOpen
}: UseDateRangeStateParams) {
  const [rangeType, setRangeType] = useState<DateRangeType>('this_month')
  const [numberValue, setNumberValue] = useState(1)

  // Sync rangeType state with filter.dateRange
  useEffect(() => {
    if (!shouldShowDateRange) return
    const derived = deriveRangeFromDateRange(localFilter.dateRange)
    if (!derived) return
    setRangeType(derived.rangeType)
    if (derived.numberValue !== undefined) {
      setNumberValue(derived.numberValue)
    }
  }, [localFilter.dateRange, shouldShowDateRange])

  // Handle date range type change
  const handleRangeTypeChange = useCallback((newRangeType: DateRangeType) => {
    setRangeType(newRangeType)
    setIsDateRangeDropdownOpen(false)

    let dateRange: string | string[]
    if (newRangeType === 'custom') {
      const today = new Date().toISOString().split('T')[0]
      dateRange = [today, today]
    } else if (requiresNumberInput(newRangeType)) {
      dateRange = convertDateRangeTypeToValue(newRangeType, numberValue)
    } else {
      dateRange = convertDateRangeTypeToValue(newRangeType)
    }

    setLocalFilter({ ...localFilter, dateRange } as SimpleFilter)
  }, [localFilter, numberValue, setLocalFilter, setIsDateRangeDropdownOpen])

  // Handle number value change for "last N days/weeks/etc"
  const handleNumberValueChange = useCallback((value: number) => {
    setNumberValue(value)
    if (requiresNumberInput(rangeType)) {
      const dateRange = convertDateRangeTypeToValue(rangeType, value)
      setLocalFilter({ ...localFilter, dateRange } as SimpleFilter)
    }
  }, [localFilter, rangeType, setLocalFilter])

  // Handle custom date range inputs
  const handleCustomStartDate = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value
    const currentRange = Array.isArray(localFilter.dateRange) ? localFilter.dateRange : [localFilter.dateRange || '', '']
    const end = currentRange[1] || start
    setLocalFilter({ ...localFilter, dateRange: [start, end] } as SimpleFilter)
  }, [localFilter, setLocalFilter])

  const handleCustomEndDate = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const end = e.target.value
    const currentRange = Array.isArray(localFilter.dateRange) ? localFilter.dateRange : ['', localFilter.dateRange || '']
    const start = currentRange[0] || end
    setLocalFilter({ ...localFilter, dateRange: [start, end] } as SimpleFilter)
  }, [localFilter, setLocalFilter])

  return {
    rangeType,
    numberValue,
    handleRangeTypeChange,
    handleNumberValueChange,
    handleCustomStartDate,
    handleCustomEndDate
  }
}

export type UseDateRangeState = ReturnType<typeof useDateRangeState>

/**
 * useCompactFilterBar
 *
 * State + derived values + handlers backing CompactFilterBar. Extracted from the
 * component so the render stays flat. Behaviour is identical to the previous
 * inline implementation.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { DashboardFilter, SimpleFilter } from '../../types'
import {
  detectPresetFromDateRange,
  calculateDateRange,
  formatDateRangeDisplay,
  XTD_OPTIONS
} from '../shared/utils'

export function useCompactFilterBar(
  dashboardFilters: DashboardFilter[],
  onDashboardFiltersChange: (filters: DashboardFilter[]) => void
) {
  // Local state for immediate UI feedback on filter value changes.
  // Without this, changes require a full round-trip through the parent's
  // onConfigChange → state update → re-render cycle before being visible.
  // If the parent doesn't handle onConfigChange (or uses dashboardFilters prop),
  // the round-trip never completes and clicks appear to do nothing.
  const [localFilters, setLocalFilters] = useState<DashboardFilter[]>(dashboardFilters)

  // Sync from props when parent updates (e.g., after round-trip completes,
  // or when filters change externally)
  useEffect(() => {
    setLocalFilters(dashboardFilters)
  }, [dashboardFilters])

  // Dropdown state
  const [showCustomDropdown, setShowCustomDropdown] = useState(false)
  const [showXTDDropdown, setShowXTDDropdown] = useState(false)

  // Refs for dropdown positioning
  const customButtonRef = useRef<HTMLButtonElement>(null)
  const xtdButtonRef = useRef<HTMLButtonElement>(null)

  // Find universal time filter
  const universalTimeFilter = useMemo(() => {
    return localFilters.find(df => df.isUniversalTime)
  }, [localFilters])

  // Get current date range from universal time filter
  const currentDateRange = useMemo(() => {
    if (!universalTimeFilter) return null
    const filter = universalTimeFilter.filter as SimpleFilter
    // Handle both dateRange property and values array
    if (filter.dateRange) return filter.dateRange
    if (filter.values && filter.values.length > 0) {
      // Single string value (preset) - return as string
      if (filter.values.length === 1 && typeof filter.values[0] === 'string') {
        return filter.values[0]
      }
      // Array of dates for custom range
      return filter.values
    }
    return null
  }, [universalTimeFilter])

  // Detect active preset from current date range
  const activePresetId = useMemo(() => {
    return detectPresetFromDateRange(currentDateRange as string | string[] | undefined)
  }, [currentDateRange])

  // Check if XTD is active
  const activeXTDId = useMemo(() => {
    if (!currentDateRange || Array.isArray(currentDateRange)) return null
    const preset = detectPresetFromDateRange(currentDateRange)
    return XTD_OPTIONS.find(opt => opt.id === preset)?.id || null
  }, [currentDateRange])

  // Get non-date filters (exclude universal time filter)
  const nonDateFilters = useMemo(() => {
    return localFilters.filter(df => !df.isUniversalTime)
  }, [localFilters])

  // Generate unique ID for new filters
  const generateFilterId = useCallback(() => {
    return `df_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }, [])

  // Handle date range change (preset, custom, or XTD)
  const handleDateRangeChange = useCallback((newDateRange: string | string[]) => {
    if (universalTimeFilter) {
      // Update existing filter
      const updatedFilters = localFilters.map(df => {
        if (df.id === universalTimeFilter.id) {
          return {
            ...df,
            filter: {
              ...(df.filter as SimpleFilter),
              values: Array.isArray(newDateRange) ? newDateRange : [newDateRange],
              dateRange: newDateRange
            }
          }
        }
        return df
      })
      setLocalFilters(updatedFilters)
      onDashboardFiltersChange(updatedFilters)
    } else {
      // Create new universal time filter
      const newFilter: DashboardFilter = {
        id: generateFilterId(),
        label: 'Date Range',
        isUniversalTime: true,
        filter: {
          member: '__universal_time__',
          operator: 'inDateRange',
          values: Array.isArray(newDateRange) ? newDateRange : [newDateRange],
          dateRange: newDateRange
        }
      }
      const updatedFilters = [...localFilters, newFilter]
      setLocalFilters(updatedFilters)
      onDashboardFiltersChange(updatedFilters)
    }
  }, [localFilters, universalTimeFilter, onDashboardFiltersChange, generateFilterId])

  // Handle preset selection
  const handlePresetSelect = useCallback((presetValue: string) => {
    handleDateRangeChange(presetValue)
  }, [handleDateRangeChange])

  // Handle XTD selection
  const handleXTDSelect = useCallback((xtdValue: string) => {
    handleDateRangeChange(xtdValue)
    setShowXTDDropdown(false)
  }, [handleDateRangeChange])

  // Handle custom date selection
  const handleCustomDateSelect = useCallback((dateRange: string | string[]) => {
    handleDateRangeChange(dateRange)
    setShowCustomDropdown(false)
  }, [handleDateRangeChange])

  // Handle filter value change (for non-date filters)
  const handleFilterChange = useCallback((filterId: string, updatedFilter: DashboardFilter) => {
    const updatedFilters = localFilters.map(df =>
      df.id === filterId ? updatedFilter : df
    )
    setLocalFilters(updatedFilters)
    onDashboardFiltersChange(updatedFilters)
  }, [localFilters, onDashboardFiltersChange])

  // Calculate tooltip for active date range
  const dateRangeTooltip = useMemo(() => {
    if (!currentDateRange) return null

    if (Array.isArray(currentDateRange)) {
      // Custom date range - format the dates
      const start = new Date(currentDateRange[0])
      const end = new Date(currentDateRange[1] || currentDateRange[0])
      return formatDateRangeDisplay(start, end)
    }

    // Preset - calculate the actual range
    const range = calculateDateRange(currentDateRange)
    if (range) {
      return formatDateRangeDisplay(range.start, range.end)
    }

    return currentDateRange
  }, [currentDateRange])

  return {
    localFilters,
    showCustomDropdown,
    setShowCustomDropdown,
    showXTDDropdown,
    setShowXTDDropdown,
    customButtonRef,
    xtdButtonRef,
    currentDateRange,
    activePresetId,
    activeXTDId,
    nonDateFilters,
    handlePresetSelect,
    handleXTDSelect,
    handleCustomDateSelect,
    handleFilterChange,
    dateRangeTooltip
  }
}

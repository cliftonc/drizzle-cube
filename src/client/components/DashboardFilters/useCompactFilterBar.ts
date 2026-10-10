/**
 * useCompactFilterBar
 *
 * State + derived values + handlers backing CompactFilterBar. Extracted from the
 * component so the render stays flat. Behaviour is identical to the previous
 * inline implementation.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { DashboardFilter, SimpleFilter } from '../../types.js'
import {
  detectPresetFromDateRange,
  calculateDateRange,
  formatDateRangeDisplay,
  XTD_OPTIONS
} from '../shared/utils.js'

/**
 * Find the dashboard filter the date control is bound to: the universal time
 * filter when present, otherwise the first simple `inDateRange` filter.
 */
export function findDateControlFilter(filters: DashboardFilter[]): DashboardFilter | undefined {
  return filters.find(df => df.isUniversalTime) ?? filters.find(df =>
    'member' in df.filter && (df.filter as SimpleFilter).operator === 'inDateRange'
  )
}

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

  // The filter the date control drives: the universal time filter if there is
  // one, otherwise the first plain inDateRange filter. Binding to a plain filter
  // lets a dashboard declare a single date filter that narrows every portlet
  // mapped to it, including KPIs and breakdowns without time dimensions.
  const dateControlFilter = useMemo(() => findDateControlFilter(localFilters), [localFilters])

  // Get current date range from the bound date filter
  const currentDateRange = useMemo(() => {
    if (!dateControlFilter) return null
    const filter = dateControlFilter.filter as SimpleFilter
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
  }, [dateControlFilter])

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

  // Get non-date filters (exclude universal time filter). A plain inDateRange
  // filter bound to the date control keeps its chip, which names its field and
  // allows clearing or editing either endpoint.
  const nonDateFilters = useMemo(() => {
    return localFilters.filter(df => !df.isUniversalTime)
  }, [localFilters])

  // Generate unique ID for new filters
  const generateFilterId = useCallback(() => {
    return `df_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }, [])

  // Handle date range change (preset, custom, or XTD)
  const handleDateRangeChange = useCallback((newDateRange: string | string[]) => {
    if (dateControlFilter) {
      // Update the bound filter, whichever kind it is
      const updatedFilters = localFilters.map(df => {
        if (df.id === dateControlFilter.id) {
          return {
            ...df,
            filter: {
              ...(df.filter as SimpleFilter),
              values: [],
              dateRange: newDateRange
            }
          }
        }
        return df
      })
      setLocalFilters(updatedFilters)
      onDashboardFiltersChange(updatedFilters)
    } else {
      // No date filter yet - create a universal time filter
      const newFilter: DashboardFilter = {
        id: generateFilterId(),
        label: 'Date Range',
        isUniversalTime: true,
        filter: {
          member: '__universal_time__',
          operator: 'inDateRange',
          values: [],
          dateRange: newDateRange
        }
      }
      const updatedFilters = [...localFilters, newFilter]
      setLocalFilters(updatedFilters)
      onDashboardFiltersChange(updatedFilters)
    }
  }, [localFilters, dateControlFilter, onDashboardFiltersChange, generateFilterId])

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

  // Resolve relative labels on each render because the UTC day can change
  // without a change to the saved expression.
  let dateRangeTooltip: string | null = null
  if (currentDateRange) {
    if (Array.isArray(currentDateRange)) {
      const start = new Date(currentDateRange[0])
      const end = new Date(currentDateRange[1] || currentDateRange[0])
      dateRangeTooltip = formatDateRangeDisplay(start, end)
    } else {
      const range = calculateDateRange(currentDateRange)
      dateRangeTooltip = range
        ? formatDateRangeDisplay(range.start, range.end)
        : currentDateRange
    }
  }

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

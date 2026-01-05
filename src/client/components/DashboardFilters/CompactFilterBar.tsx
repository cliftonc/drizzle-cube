/**
 * CompactFilterBar Component
 *
 * A Mixpanel-inspired compact horizontal filter bar for dashboards.
 * Provides quick preset date selection, custom date options, XTD options,
 * and compact non-date filter display.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { getIcon } from '../../icons'
import DatePresetChips from './DatePresetChips'
import CustomDateDropdown from './CustomDateDropdown'
import XTDDropdown from './XTDDropdown'
import FilterChip from './FilterChip'
import type { DashboardFilter, CubeMeta, SimpleFilter } from '../../types'
import {
  detectPresetFromDateRange,
  calculateDateRange,
  formatDateRangeDisplay,
  XTD_OPTIONS
} from '../shared/utils'

const AddIcon = getIcon('add')
const CalendarIcon = getIcon('timeDimension')
const ChevronDownIcon = getIcon('chevronDown')
const FilterIcon = getIcon('filter')

interface CompactFilterBarProps {
  dashboardFilters: DashboardFilter[]
  schema: CubeMeta | null
  isEditMode: boolean
  onDashboardFiltersChange: (filters: DashboardFilter[]) => void
  onAddFilter?: () => void
  onEditFilter?: (filterId: string) => void
  onRemoveFilter?: (filterId: string) => void
}

const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  dashboardFilters,
  schema,
  isEditMode,
  onDashboardFiltersChange,
  onAddFilter,
  onEditFilter,
  onRemoveFilter
}) => {
  // Dropdown state
  const [showCustomDropdown, setShowCustomDropdown] = useState(false)
  const [showXTDDropdown, setShowXTDDropdown] = useState(false)

  // Refs for dropdown positioning
  const customButtonRef = useRef<HTMLButtonElement>(null)
  const xtdButtonRef = useRef<HTMLButtonElement>(null)

  // Find universal time filter
  const universalTimeFilter = useMemo(() => {
    return dashboardFilters.find(df => df.isUniversalTime)
  }, [dashboardFilters])

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
    return dashboardFilters.filter(df => !df.isUniversalTime)
  }, [dashboardFilters])

  // Generate unique ID for new filters
  const generateFilterId = useCallback(() => {
    return `df_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }, [])

  // Handle date range change (preset, custom, or XTD)
  const handleDateRangeChange = useCallback((newDateRange: string | string[]) => {
    if (universalTimeFilter) {
      // Update existing filter
      const updatedFilters = dashboardFilters.map(df => {
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
      onDashboardFiltersChange([...dashboardFilters, newFilter])
    }
  }, [dashboardFilters, universalTimeFilter, onDashboardFiltersChange, generateFilterId])

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
    const updatedFilters = dashboardFilters.map(df =>
      df.id === filterId ? updatedFilter : df
    )
    onDashboardFiltersChange(updatedFilters)
  }, [dashboardFilters, onDashboardFiltersChange])

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

  // If no filters and not in edit mode, don't show anything
  if (!isEditMode && dashboardFilters.length === 0) {
    return null
  }

  return (
    <div
      className="border rounded-lg"
      style={{
        borderColor: 'var(--dc-border)',
        backgroundColor: 'var(--dc-surface)'
      }}
    >
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2">
        {/* Filter Icon */}
        <FilterIcon
          className="w-4 h-4 shrink-0"
          style={{ color: 'var(--dc-text-secondary)' }}
        />

        {/* Date Preset Chips */}
        <DatePresetChips
          activePreset={activePresetId !== 'custom' && !activeXTDId ? activePresetId : null}
          onPresetSelect={handlePresetSelect}
        />

        {/* Custom Date Button */}
        <div className="relative">
          <button
            ref={customButtonRef}
            type="button"
            onClick={() => {
              setShowCustomDropdown(!showCustomDropdown)
              setShowXTDDropdown(false)
            }}
            title={activePresetId === 'custom' && dateRangeTooltip ? dateRangeTooltip : 'Custom date range'}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
            `}
            style={{
              backgroundColor: activePresetId === 'custom' ? 'var(--dc-primary)' : 'var(--dc-surface)',
              color: activePresetId === 'custom' ? 'white' : 'var(--dc-text)',
              borderColor: activePresetId === 'custom' ? 'transparent' : 'var(--dc-border)'
            }}
          >
            <CalendarIcon className="w-3 h-3" />
            <span>Custom</span>
            <ChevronDownIcon className="w-3 h-3" />
          </button>

          {showCustomDropdown && (
            <CustomDateDropdown
              isOpen={showCustomDropdown}
              onClose={() => setShowCustomDropdown(false)}
              onDateRangeChange={handleCustomDateSelect}
              currentDateRange={currentDateRange as string | string[] | undefined}
              anchorRef={customButtonRef}
            />
          )}
        </div>

        {/* XTD Button */}
        <div className="relative">
          <button
            ref={xtdButtonRef}
            type="button"
            onClick={() => {
              setShowXTDDropdown(!showXTDDropdown)
              setShowCustomDropdown(false)
            }}
            title={activeXTDId && dateRangeTooltip ? dateRangeTooltip : 'X to Date options'}
            className={`
              flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
            `}
            style={{
              backgroundColor: activeXTDId ? 'var(--dc-primary)' : 'var(--dc-surface)',
              color: activeXTDId ? 'white' : 'var(--dc-text)',
              borderColor: activeXTDId ? 'transparent' : 'var(--dc-border)'
            }}
          >
            <span>XTD</span>
            <ChevronDownIcon className="w-3 h-3" />
          </button>

          {showXTDDropdown && (
            <XTDDropdown
              isOpen={showXTDDropdown}
              onClose={() => setShowXTDDropdown(false)}
              onSelect={handleXTDSelect}
              currentXTD={activeXTDId}
              anchorRef={xtdButtonRef}
            />
          )}
        </div>

        {/* Separator */}
        {nonDateFilters.length > 0 && (
          <div
            className="h-5 w-px mx-1"
            style={{ backgroundColor: 'var(--dc-border)' }}
          />
        )}

        {/* Non-date Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {nonDateFilters.map(filter => (
            <FilterChip
              key={filter.id}
              filter={filter}
              schema={schema}
              isEditMode={isEditMode}
              onChange={(updatedFilter) => handleFilterChange(filter.id, updatedFilter)}
              onEdit={() => onEditFilter?.(filter.id)}
              onRemove={() => onRemoveFilter?.(filter.id)}
            />
          ))}
        </div>

        {/* Add Filter Button (Edit Mode) */}
        {isEditMode && onAddFilter && (
          <button
            type="button"
            onClick={onAddFilter}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors"
            style={{
              borderColor: 'var(--dc-border)',
              color: 'var(--dc-text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <AddIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Presets row with horizontal scroll */}
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 scrollbar-thin">
          {/* Filter Icon */}
          <FilterIcon
            className="w-4 h-4 shrink-0"
            style={{ color: 'var(--dc-text-secondary)' }}
          />
          <DatePresetChips
            activePreset={activePresetId !== 'custom' && !activeXTDId ? activePresetId : null}
            onPresetSelect={handlePresetSelect}
          />
        </div>

        {/* Custom, XTD, and Add buttons */}
        <div
          className="flex items-center justify-between px-3 py-2 border-t"
          style={{ borderColor: 'var(--dc-border)' }}
        >
          <div className="flex items-center gap-2">
            {/* Custom Button */}
            <div className="relative">
              <button
                ref={customButtonRef}
                type="button"
                onClick={() => {
                  setShowCustomDropdown(!showCustomDropdown)
                  setShowXTDDropdown(false)
                }}
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border
                  transition-colors
                `}
                style={{
                  backgroundColor: activePresetId === 'custom' ? 'var(--dc-primary)' : 'var(--dc-surface)',
                  color: activePresetId === 'custom' ? 'white' : 'var(--dc-text)',
                  borderColor: activePresetId === 'custom' ? 'transparent' : 'var(--dc-border)'
                }}
              >
                <CalendarIcon className="w-3 h-3" />
                <span>Custom</span>
              </button>

              {showCustomDropdown && (
                <CustomDateDropdown
                  isOpen={showCustomDropdown}
                  onClose={() => setShowCustomDropdown(false)}
                  onDateRangeChange={handleCustomDateSelect}
                  currentDateRange={currentDateRange as string | string[] | undefined}
                  anchorRef={customButtonRef}
                />
              )}
            </div>

            {/* XTD Button */}
            <div className="relative">
              <button
                ref={xtdButtonRef}
                type="button"
                onClick={() => {
                  setShowXTDDropdown(!showXTDDropdown)
                  setShowCustomDropdown(false)
                }}
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border
                  transition-colors
                `}
                style={{
                  backgroundColor: activeXTDId ? 'var(--dc-primary)' : 'var(--dc-surface)',
                  color: activeXTDId ? 'white' : 'var(--dc-text)',
                  borderColor: activeXTDId ? 'transparent' : 'var(--dc-border)'
                }}
              >
                <span>XTD</span>
                <ChevronDownIcon className="w-3 h-3" />
              </button>

              {showXTDDropdown && (
                <XTDDropdown
                  isOpen={showXTDDropdown}
                  onClose={() => setShowXTDDropdown(false)}
                  onSelect={handleXTDSelect}
                  currentXTD={activeXTDId}
                  anchorRef={xtdButtonRef}
                />
              )}
            </div>
          </div>

          {/* Add Filter Button (Edit Mode) */}
          {isEditMode && onAddFilter && (
            <button
              type="button"
              onClick={onAddFilter}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors"
              style={{
                borderColor: 'var(--dc-border)',
                color: 'var(--dc-text-secondary)',
                backgroundColor: 'transparent'
              }}
            >
              <AddIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Non-date Filter Chips (Mobile) */}
        {nonDateFilters.length > 0 && (
          <div
            className="px-3 py-2 border-t"
            style={{ borderColor: 'var(--dc-border)' }}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              {nonDateFilters.map(filter => (
                <FilterChip
                  key={filter.id}
                  filter={filter}
                  schema={schema}
                  isEditMode={isEditMode}
                  onChange={(updatedFilter) => handleFilterChange(filter.id, updatedFilter)}
                  onEdit={() => onEditFilter?.(filter.id)}
                  onRemove={() => onRemoveFilter?.(filter.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompactFilterBar

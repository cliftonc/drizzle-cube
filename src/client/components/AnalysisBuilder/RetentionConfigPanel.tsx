/**
 * RetentionConfigPanel Component
 *
 * Collapsible configuration panel for retention analysis settings:
 * - Cube selector
 * - Binding key (user ID) selector
 * - Timestamp dimension selector
 * - Date Range picker
 *
 * The config section is collapsible and auto-collapses once all fields are set.
 * Pattern matches FlowConfigPanel for consistency.
 */

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import type { CubeMeta, FunnelBindingKey } from '../../types'
import type { DateRange, DateRangePreset } from '../../types/retention'
import {
  RETENTION_DATE_RANGE_PRESETS,
  getDateRangeFromPreset,
  detectDateRangePreset,
} from '../../types/retention'
import { getIcon } from '../../icons'
import { getAvailableBindingKeyDimensions } from '../../utils/funnelValidation'
import SectionHeading from './SectionHeading'

const ChevronDownIcon = getIcon('chevronDown')
const ChevronRightIcon = getIcon('chevronRight')
const CheckIcon = getIcon('check')
const SearchIcon = getIcon('search')
const CubeIcon = getIcon('dimension')
const LinkIcon = getIcon('link')
const TimeDimensionIcon = getIcon('timeDimension')
const CalendarIcon = getIcon('timeDimension')

export interface RetentionConfigPanelProps {
  /** Currently selected cube */
  selectedCube: string | null
  /** Binding key that identifies entities */
  bindingKey: FunnelBindingKey | null
  /** Timestamp dimension for the analysis */
  timeDimension: string | null
  /** Date range for cohort analysis (for collapsed summary display) */
  dateRange: DateRange
  /** Cube metadata for field selection */
  schema: CubeMeta | null
  /** Callback when cube changes */
  onCubeChange: (cube: string | null) => void
  /** Callback when binding key changes */
  onBindingKeyChange: (bindingKey: FunnelBindingKey | null) => void
  /** Callback when timestamp dimension changes */
  onTimeDimensionChange: (dimension: string | null) => void
}

/**
 * Get available cubes from schema (only those with eventStream metadata)
 * Matches FunnelConfigPanel pattern - retention requires eventStream for proper analysis
 */
function getAvailableCubes(schema: CubeMeta | null): Array<{
  cube: string
  dimension: string
  label: string
  eventStream?: { bindingKey: string; timeDimension: string }
}> {
  if (!schema?.cubes) return []

  return schema.cubes
    .filter((cube) => cube.meta?.eventStream) // Only eventStream cubes
    .map((cube) => ({
      cube: cube.name,
      dimension: cube.name,
      label: cube.title || cube.name,
      eventStream: cube.meta?.eventStream as { bindingKey: string; timeDimension: string } | undefined,
    }))
}

/**
 * Get available time dimensions from schema
 */
function getAvailableTimeDimensions(schema: CubeMeta | null): Array<{
  cube: string
  dimension: string
  label: string
}> {
  if (!schema?.cubes) return []

  const timeDimensions: Array<{ cube: string; dimension: string; label: string }> = []

  for (const cube of schema.cubes) {
    for (const dim of cube.dimensions || []) {
      if (dim.type === 'time') {
        timeDimensions.push({
          cube: cube.name,
          dimension: dim.name,
          label: dim.shortTitle || dim.title || dim.name.split('.').pop() || dim.name,
        })
      }
    }
  }

  return timeDimensions
}

/**
 * Format date for display (short format)
 */
function formatDateDisplay(date: string): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Dropdown selector component (same pattern as FlowConfigPanel)
 */
interface DropdownSelectorProps {
  value: string | null
  label: string
  placeholder: string
  icon: React.ComponentType<{ className?: string }> | null
  options: Array<{ cube: string; dimension: string; label: string }>
  onChange: (value: string | null) => void
  helpText: string
}

const DropdownSelector = memo(function DropdownSelector({
  value,
  label,
  placeholder,
  icon: Icon,
  options,
  onChange,
  helpText,
}: DropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Group options by cube
  const groupedOptions = useMemo(() => {
    const groups: Record<string, typeof options> = {}
    for (const opt of options) {
      if (!groups[opt.cube]) {
        groups[opt.cube] = []
      }
      groups[opt.cube].push(opt)
    }
    return groups
  }, [options])

  // Filter based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedOptions

    const query = searchQuery.toLowerCase()
    const filtered: Record<string, typeof options> = {}

    for (const [cube, dims] of Object.entries(groupedOptions)) {
      const matchingDims = dims.filter(
        (d) =>
          d.label.toLowerCase().includes(query) ||
          d.dimension.toLowerCase().includes(query) ||
          cube.toLowerCase().includes(query)
      )
      if (matchingDims.length > 0) {
        filtered[cube] = matchingDims
      }
    }

    return filtered
  }, [groupedOptions, searchQuery])

  // Handle selection
  const handleSelect = useCallback(
    (dimension: string) => {
      onChange(dimension)
      setIsOpen(false)
      setSearchQuery('')
    },
    [onChange]
  )

  // Handle clear
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(null)
    },
    [onChange]
  )

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const hasValue = value !== null

  return (
    <div className="dc:flex-1 dc:min-w-0">
      <label className="dc:flex dc:items-center dc:gap-1.5 dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
        {Icon && <Icon className="dc:w-3.5 dc:h-3.5" />}
        {label}
      </label>

      <div ref={dropdownRef} className="dc:relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2.5 dc:py-1.5 dc:text-sm
            bg-dc-surface dc:border border-dc-border dc:rounded
            dc:transition-colors hover:border-dc-primary dc:cursor-pointer
            ${isOpen ? 'border-dc-primary dc:ring-1 ring-dc-primary' : ''}
          `}
        >
          <span className={`dc:truncate ${hasValue ? 'text-dc-text' : 'text-dc-text-muted'}`}>
            {hasValue ? options.find((o) => o.dimension === value)?.label || value : placeholder}
          </span>
          <span className="dc:flex dc:items-center dc:gap-1 dc:ml-2">
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                className="dc:p-0.5 dc:rounded hover:bg-dc-surface-hover text-dc-text-muted hover:text-dc-text"
                title="Clear"
              >
                ×
              </span>
            )}
            {ChevronDownIcon && (
              <ChevronDownIcon
                className={`dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform ${isOpen ? 'dc:rotate-180' : ''}`}
              />
            )}
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="dc:absolute dc:z-50 dc:mt-1 dc:left-0 dc:right-0 dc:min-w-[200px] bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg">
            {/* Search Input */}
            <div className="dc:p-2 dc:border-b border-dc-border">
              <div className="dc:relative">
                {SearchIcon && (
                  <SearchIcon className="dc:absolute dc:left-2 dc:top-1/2 dc:-translate-y-1/2 dc:w-4 dc:h-4 text-dc-text-muted" />
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="dc:w-full dc:pl-8 dc:pr-3 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded text-dc-text placeholder:text-dc-text-muted dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="dc:max-h-48 dc:overflow-y-auto dc:p-1">
              {Object.entries(filteredGroups).length === 0 ? (
                <div className="dc:px-3 dc:py-4 dc:text-sm text-dc-text-muted text-center">
                  No matching fields found
                </div>
              ) : (
                Object.entries(filteredGroups).map(([cubeName, dims]) => (
                  <div key={cubeName} className="dc:mb-2 dc:last:mb-0">
                    <div className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wide">
                      {cubeName}
                    </div>
                    {dims.map((dim) => (
                      <button
                        key={dim.dimension}
                        onClick={() => handleSelect(dim.dimension)}
                        className={`
                          dc:flex dc:items-center dc:justify-between dc:w-full dc:px-3 dc:py-1.5 dc:text-sm
                          dc:rounded dc:transition-colors
                          ${value === dim.dimension
                            ? 'bg-dc-primary-bg text-dc-primary'
                            : 'text-dc-text hover:bg-dc-surface-hover'
                          }
                        `}
                      >
                        <span>{dim.label}</span>
                        {value === dim.dimension && CheckIcon && (
                          <CheckIcon className="dc:w-4 dc:h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Help Text */}
            <div className="dc:px-3 dc:py-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted">
              {helpText}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * Date range selector component
 * Exported for use in RetentionModeContent
 */
export interface DateRangeSelectorProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export const DateRangeSelector = memo(function DateRangeSelector({
  dateRange,
  onDateRangeChange,
}: DateRangeSelectorProps) {
  // Safe defaults if dateRange is undefined
  const safeDateRange = dateRange ?? { start: '', end: '' }
  const safeStart = safeDateRange.start ?? ''
  const safeEnd = safeDateRange.end ?? ''

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(() =>
    safeStart && safeEnd ? detectDateRangePreset(safeDateRange) : 'last_3_months'
  )
  const [customStart, setCustomStart] = useState(safeStart)
  const [customEnd, setCustomEnd] = useState(safeEnd)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update custom inputs when date range changes externally
  useEffect(() => {
    const start = dateRange?.start ?? ''
    const end = dateRange?.end ?? ''
    setCustomStart(start)
    setCustomEnd(end)
    if (start && end) {
      setSelectedPreset(detectDateRangePreset({ start, end }))
    }
  }, [dateRange?.start, dateRange?.end])

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (preset: DateRangePreset) => {
      setSelectedPreset(preset)
      if (preset !== 'custom') {
        const range = getDateRangeFromPreset(preset)
        onDateRangeChange(range)
        setCustomStart(range.start)
        setCustomEnd(range.end)
        setShowDatePicker(false)
      }
    },
    [onDateRangeChange]
  )

  // Handle custom date apply
  const handleCustomDateApply = useCallback(() => {
    if (customStart && customEnd) {
      onDateRangeChange({ start: customStart, end: customEnd })
      setSelectedPreset('custom')
      setShowDatePicker(false)
    }
  }, [customStart, customEnd, onDateRangeChange])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  // Get display text for date range
  const dateRangeDisplay = useMemo(() => {
    const preset = RETENTION_DATE_RANGE_PRESETS.find((p) => p.value === selectedPreset)
    if (preset && selectedPreset !== 'custom') {
      return preset.label
    }
    const start = dateRange?.start ?? ''
    const end = dateRange?.end ?? ''
    if (!start || !end) return 'Select date range'
    return `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`
  }, [selectedPreset, dateRange])

  return (
    <div className="dc:flex-1 dc:min-w-0">
      <label className="dc:flex dc:items-center dc:gap-1.5 dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
        {CalendarIcon && <CalendarIcon className="dc:w-3.5 dc:h-3.5" />}
        Date Range
      </label>

      <div ref={dropdownRef} className="dc:relative">
        <button
          type="button"
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`
            dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2.5 dc:py-1.5 dc:text-sm
            bg-dc-surface dc:border border-dc-border dc:rounded
            hover:border-dc-primary dc:cursor-pointer dc:transition-colors
            ${showDatePicker ? 'border-dc-primary dc:ring-1 ring-dc-primary' : ''}
          `}
        >
          <span className="text-dc-text dc:truncate">{dateRangeDisplay}</span>
          {ChevronDownIcon && (
            <ChevronDownIcon
              className={`dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform dc:ml-2 ${showDatePicker ? 'dc:rotate-180' : ''}`}
            />
          )}
        </button>

        {/* Date Range Dropdown */}
        {showDatePicker && (
          <div className="dc:absolute dc:z-50 dc:mt-1 dc:left-0 dc:right-0 dc:min-w-[280px] bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:shadow-lg dc:p-3">
            {/* Presets */}
            <div className="dc:grid dc:grid-cols-2 dc:gap-2 dc:mb-3">
              {RETENTION_DATE_RANGE_PRESETS.filter((p) => p.value !== 'custom').map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`dc:px-3 dc:py-1.5 dc:text-xs dc:rounded dc:transition-colors ${
                    selectedPreset === preset.value
                      ? 'bg-dc-primary text-white'
                      : 'bg-dc-surface-secondary text-dc-text hover:bg-dc-surface-hover'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Range */}
            <div className="dc:border-t border-dc-border dc:pt-3">
              <div className="dc:text-xs dc:font-medium text-dc-text-muted dc:mb-2">Custom Range</div>
              <div className="dc:flex dc:gap-2 dc:items-center dc:mb-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value)
                    setSelectedPreset('custom')
                  }}
                  className="dc:flex-1 dc:px-2 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
                />
                <span className="text-dc-text-muted dc:text-xs">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value)
                    setSelectedPreset('custom')
                  }}
                  className="dc:flex-1 dc:px-2 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleCustomDateApply}
                disabled={!customStart || !customEnd}
                className="dc:w-full dc:px-3 dc:py-1.5 dc:text-xs bg-dc-primary text-white dc:rounded hover:bg-dc-primary-hover dc:disabled:opacity-50 dc:disabled:cursor-not-allowed dc:transition-colors"
              >
                Apply Custom Range
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * RetentionConfigPanel displays selectors for cube, binding key, time dimension,
 * and date range in a collapsible section.
 */
const RetentionConfigPanel = memo(function RetentionConfigPanel({
  selectedCube = null,
  bindingKey = null,
  timeDimension = null,
  dateRange = { start: '', end: '' },
  schema = null,
  onCubeChange = () => {},
  onBindingKeyChange = () => {},
  onTimeDimensionChange = () => {},
}: RetentionConfigPanelProps) {
  // Get available options
  const availableCubes = useMemo(() => getAvailableCubes(schema), [schema])

  // Filter binding keys by selected cube
  const availableBindingKeys = useMemo(() => {
    const allKeys = getAvailableBindingKeyDimensions(schema)
    if (!selectedCube) return []
    return allKeys.filter((key) => key.cube === selectedCube)
  }, [schema, selectedCube])

  // Filter time dimensions by selected cube
  const availableTimeDimensions = useMemo(() => {
    const allTimeDims = getAvailableTimeDimensions(schema)
    if (!selectedCube) return []
    return allTimeDims.filter((dim) => dim.cube === selectedCube)
  }, [schema, selectedCube])

  // Check if all config is complete
  const isConfigComplete = Boolean(
    selectedCube && bindingKey?.dimension && timeDimension && dateRange?.start && dateRange?.end
  )

  // Collapsed state - start expanded if config is incomplete
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-collapse when config becomes complete (only once)
  const hasAutoCollapsedRef = useRef(false)
  useEffect(() => {
    if (isConfigComplete && !hasAutoCollapsedRef.current) {
      hasAutoCollapsedRef.current = true
      setIsCollapsed(true)
    }
  }, [isConfigComplete])

  // Convert FunnelBindingKey to string for simpler handling
  const bindingKeyValue = bindingKey?.dimension
    ? typeof bindingKey.dimension === 'string'
      ? bindingKey.dimension
      : bindingKey.dimension[0]?.dimension || null
    : null

  const handleBindingKeyChange = useCallback(
    (value: string | null) => {
      onBindingKeyChange(value ? { dimension: value } : null)
    },
    [onBindingKeyChange]
  )

  // Get display label for the collapsed summary
  const cubeLabel = availableCubes.find((c) => c.dimension === selectedCube)?.label || selectedCube
  const dateLabel = dateRange?.start
    ? `${formatDateDisplay(dateRange.start)} - ${formatDateDisplay(dateRange.end)}`
    : ''

  return (
    <div className="bg-dc-surface-secondary dc:border-b border-dc-border">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="dc:flex dc:items-center dc:justify-between dc:w-full dc:px-4 dc:py-2.5 hover:bg-dc-surface-hover dc:transition-colors"
      >
        <div className="dc:flex dc:items-center dc:gap-2">
          {isCollapsed ? (
            ChevronRightIcon && <ChevronRightIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
          ) : (
            ChevronDownIcon && <ChevronDownIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
          )}
          <SectionHeading className="dc:mb-0">Configuration</SectionHeading>
          {isConfigComplete && (
            <span className="dc:flex dc:items-center dc:gap-1 dc:text-xs text-dc-success">
              {CheckIcon && <CheckIcon className="dc:w-3.5 dc:h-3.5" />}
            </span>
          )}
        </div>

        {/* Collapsed Summary */}
        {isCollapsed && isConfigComplete && (
          <span className="dc:text-xs text-dc-text-muted dc:truncate dc:max-w-[200px]">
            {cubeLabel} • {dateLabel}
          </span>
        )}
      </button>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="dc:flex dc:flex-col dc:gap-3 dc:px-4 dc:pb-3">
          {/* Cube Selector */}
          <DropdownSelector
            value={selectedCube}
            label="Cube"
            placeholder="Select cube"
            icon={CubeIcon}
            options={availableCubes}
            onChange={onCubeChange}
            helpText="Select the cube containing your user events"
          />

          {/* Binding Key Selector */}
          <DropdownSelector
            value={bindingKeyValue}
            label="Binding Key"
            placeholder={selectedCube ? 'Select user identifier' : 'Select cube first'}
            icon={LinkIcon}
            options={availableBindingKeys}
            onChange={handleBindingKeyChange}
            helpText="Dimension that identifies entities across events (e.g., user ID, customer ID)"
          />

          {/* Time Dimension Selector */}
          <DropdownSelector
            value={timeDimension}
            label="Timestamp"
            placeholder={selectedCube ? 'Select timestamp' : 'Select cube first'}
            icon={TimeDimensionIcon}
            options={availableTimeDimensions}
            onChange={onTimeDimensionChange}
            helpText="Timestamp field for cohort entry and activity"
          />
        </div>
      )}
    </div>
  )
})

export default RetentionConfigPanel

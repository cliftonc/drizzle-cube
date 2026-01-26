/**
 * FlowConfigPanel Component
 *
 * Configuration panel for flow analysis settings:
 * - Cube selector (only cubes with eventStream metadata)
 * - Binding key selector (entity linking)
 * - Time dimension selector (event ordering)
 * - Event dimension selector (node labels in Sankey)
 *
 * The config section is collapsible and auto-collapses once all fields are set.
 */

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import type { CubeMeta, FunnelBindingKey } from '../../types'
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
const TagIcon = getIcon('dimension') // Used for event dimension

export interface FlowConfigPanelProps {
  /** Currently selected cube for flow analysis */
  selectedCube: string | null
  /** Current binding key */
  bindingKey: FunnelBindingKey | null
  /** Current time dimension */
  timeDimension: string | null
  /** Current event dimension */
  eventDimension: string | null
  /** Cube metadata */
  schema: CubeMeta | null
  /** Callback when cube changes */
  onCubeChange: (cube: string | null) => void
  /** Callback when binding key changes */
  onBindingKeyChange: (bindingKey: FunnelBindingKey | null) => void
  /** Callback when time dimension changes */
  onTimeDimensionChange: (dimension: string | null) => void
  /** Callback when event dimension changes */
  onEventDimensionChange: (dimension: string | null) => void
}

/**
 * Get available flow cubes from schema (only those with eventStream metadata)
 */
function getAvailableFlowCubes(schema: CubeMeta | null): Array<{
  cube: string
  dimension: string
  label: string
  eventStream?: { bindingKey: string; timeDimension: string }
}> {
  if (!schema?.cubes) return []

  return schema.cubes
    .filter((cube) => cube.meta?.eventStream)
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
 * Get available string dimensions from schema (for event categorization)
 */
function getAvailableStringDimensions(schema: CubeMeta | null): Array<{
  cube: string
  dimension: string
  label: string
}> {
  if (!schema?.cubes) return []

  const stringDimensions: Array<{ cube: string; dimension: string; label: string }> = []

  for (const cube of schema.cubes) {
    for (const dim of cube.dimensions || []) {
      if (dim.type === 'string') {
        stringDimensions.push({
          cube: cube.name,
          dimension: dim.name,
          label: dim.shortTitle || dim.title || dim.name.split('.').pop() || dim.name,
        })
      }
    }
  }

  return stringDimensions
}

/**
 * Dropdown selector component
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
                x
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
 * FlowConfigPanel displays selectors for cube, binding key, time dimension,
 * and event dimension in a collapsible section.
 */
const FlowConfigPanel = memo(function FlowConfigPanel({
  selectedCube,
  bindingKey,
  timeDimension,
  eventDimension,
  schema,
  onCubeChange,
  onBindingKeyChange,
  onTimeDimensionChange,
  onEventDimensionChange,
}: FlowConfigPanelProps) {
  // Get available cubes (only those with eventStream metadata)
  const availableCubes = useMemo(() => getAvailableFlowCubes(schema), [schema])

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

  // Filter string dimensions by selected cube (for event categorization)
  const availableEventDimensions = useMemo(() => {
    const allStringDims = getAvailableStringDimensions(schema)
    if (!selectedCube) return []
    return allStringDims.filter((dim) => dim.cube === selectedCube)
  }, [schema, selectedCube])

  // Check if all config is complete
  const isConfigComplete = Boolean(selectedCube && bindingKey && timeDimension && eventDimension)

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

  // Auto-populate binding key and time dimension from eventStream when cube is selected
  useEffect(() => {
    if (!selectedCube || !schema) return

    const cube = schema.cubes?.find((c) => c.name === selectedCube)
    if (cube?.meta?.eventStream) {
      const eventStream = cube.meta.eventStream as { bindingKey?: string; timeDimension?: string }

      // Auto-set binding key from eventStream
      if (!bindingKey && eventStream.bindingKey) {
        onBindingKeyChange({ dimension: eventStream.bindingKey })
      }
      // Auto-set time dimension from eventStream
      if (!timeDimension && eventStream.timeDimension) {
        onTimeDimensionChange(eventStream.timeDimension)
      }
    }
  }, [selectedCube, schema, bindingKey, timeDimension, onBindingKeyChange, onTimeDimensionChange])

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
            {cubeLabel}
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
            placeholder="Select event stream cube"
            icon={CubeIcon}
            options={availableCubes}
            onChange={onCubeChange}
            helpText="Select a cube configured for flow analysis"
          />

          {/* Binding Key Selector */}
          <DropdownSelector
            value={bindingKeyValue}
            label="Binding Key"
            placeholder={selectedCube ? 'Select binding key' : 'Select cube first'}
            icon={LinkIcon}
            options={availableBindingKeys}
            onChange={handleBindingKeyChange}
            helpText="Entity that links events together (e.g., user ID)"
          />

          {/* Time Dimension Selector */}
          <DropdownSelector
            value={timeDimension}
            label="Time Dimension"
            placeholder={selectedCube ? 'Select time dimension' : 'Select cube first'}
            icon={TimeDimensionIcon}
            options={availableTimeDimensions}
            onChange={onTimeDimensionChange}
            helpText="Timestamp field for event ordering"
          />

          {/* Event Dimension Selector */}
          <DropdownSelector
            value={eventDimension}
            label="Event Dimension"
            placeholder={selectedCube ? 'Select event dimension' : 'Select cube first'}
            icon={TagIcon}
            options={availableEventDimensions}
            onChange={onEventDimensionChange}
            helpText="Dimension that categorizes events (node labels in Sankey)"
          />
        </div>
      )}
    </div>
  )
})

export default FlowConfigPanel

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
    <div className="flex-1 min-w-0">
      <label className="flex items-center gap-1.5 text-xs font-medium text-dc-text-muted mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center justify-between w-full px-2.5 py-1.5 text-sm
            bg-dc-surface border border-dc-border rounded
            transition-colors hover:border-dc-primary cursor-pointer
            ${isOpen ? 'border-dc-primary ring-1 ring-dc-primary' : ''}
          `}
        >
          <span className={`truncate ${hasValue ? 'text-dc-text' : 'text-dc-text-muted'}`}>
            {hasValue ? options.find((o) => o.dimension === value)?.label || value : placeholder}
          </span>
          <span className="flex items-center gap-1 ml-2">
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
                className="p-0.5 rounded hover:bg-dc-surface-hover text-dc-text-muted hover:text-dc-text"
                title="Clear"
              >
                x
              </span>
            )}
            {ChevronDownIcon && (
              <ChevronDownIcon
                className={`w-4 h-4 text-dc-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            )}
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 left-0 right-0 min-w-[200px] bg-dc-surface border border-dc-border rounded-md shadow-lg">
            {/* Search Input */}
            <div className="p-2 border-b border-dc-border">
              <div className="relative">
                {SearchIcon && (
                  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-dc-text-muted" />
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-dc-surface-secondary border border-dc-border rounded text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto p-1">
              {Object.entries(filteredGroups).length === 0 ? (
                <div className="px-3 py-4 text-sm text-dc-text-muted text-center">
                  No matching fields found
                </div>
              ) : (
                Object.entries(filteredGroups).map(([cubeName, dims]) => (
                  <div key={cubeName} className="mb-2 last:mb-0">
                    <div className="px-2 py-1 text-xs font-medium text-dc-text-muted uppercase tracking-wide">
                      {cubeName}
                    </div>
                    {dims.map((dim) => (
                      <button
                        key={dim.dimension}
                        onClick={() => handleSelect(dim.dimension)}
                        className={`
                          flex items-center justify-between w-full px-3 py-1.5 text-sm
                          rounded transition-colors
                          ${value === dim.dimension
                            ? 'bg-dc-primary-bg text-dc-primary'
                            : 'text-dc-text hover:bg-dc-surface-hover'
                          }
                        `}
                      >
                        <span>{dim.label}</span>
                        {value === dim.dimension && CheckIcon && (
                          <CheckIcon className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Help Text */}
            <div className="px-3 py-2 border-t border-dc-border text-xs text-dc-text-muted">
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
    <div className="bg-dc-surface-secondary border-b border-dc-border">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-dc-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            ChevronRightIcon && <ChevronRightIcon className="w-4 h-4 text-dc-text-muted" />
          ) : (
            ChevronDownIcon && <ChevronDownIcon className="w-4 h-4 text-dc-text-muted" />
          )}
          <SectionHeading className="mb-0">Configuration</SectionHeading>
          {isConfigComplete && (
            <span className="flex items-center gap-1 text-xs text-dc-success">
              {CheckIcon && <CheckIcon className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>

        {/* Collapsed Summary */}
        {isCollapsed && isConfigComplete && (
          <span className="text-xs text-dc-text-muted truncate max-w-[200px]">
            {cubeLabel}
          </span>
        )}
      </button>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="flex flex-col gap-3 px-4 pb-3">
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

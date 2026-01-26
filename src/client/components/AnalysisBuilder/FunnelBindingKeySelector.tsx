/**
 * FunnelBindingKeySelector Component
 *
 * Dimension picker for selecting the binding key that links funnel steps together.
 * The binding key is typically a user ID, session ID, or order ID that exists
 * across all cubes in the funnel.
 */

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import type { CubeMeta, FunnelBindingKey } from '../../types'
import { getIcon } from '../../icons'
import { getAvailableBindingKeyDimensions, getBindingKeyLabel } from '../../utils/funnelValidation'

const ChevronDownIcon = getIcon('chevronDown')
const CheckIcon = getIcon('check')
const SearchIcon = getIcon('search')

export interface FunnelBindingKeySelectorProps {
  /** Current binding key value */
  bindingKey: FunnelBindingKey | null
  /** Callback when binding key changes */
  onChange: (bindingKey: FunnelBindingKey | null) => void
  /** Cube metadata for available dimensions */
  schema: CubeMeta | null
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Optional class name */
  className?: string
}

/**
 * FunnelBindingKeySelector allows users to select a dimension that links
 * funnel steps together. It shows available dimensions from all cubes
 * and supports search filtering.
 */
const FunnelBindingKeySelector = memo(function FunnelBindingKeySelector({
  bindingKey,
  onChange,
  schema,
  disabled = false,
  className = '',
}: FunnelBindingKeySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get available dimensions
  const availableDimensions = useMemo(() => {
    return getAvailableBindingKeyDimensions(schema)
  }, [schema])

  // Group dimensions by cube
  const groupedDimensions = useMemo(() => {
    const groups: Record<string, typeof availableDimensions> = {}
    for (const dim of availableDimensions) {
      if (!groups[dim.cube]) {
        groups[dim.cube] = []
      }
      groups[dim.cube].push(dim)
    }
    return groups
  }, [availableDimensions])

  // Filter dimensions based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedDimensions

    const query = searchQuery.toLowerCase()
    const filtered: Record<string, typeof availableDimensions> = {}

    for (const [cube, dims] of Object.entries(groupedDimensions)) {
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
  }, [groupedDimensions, searchQuery])

  // Handle selecting a dimension
  const handleSelect = useCallback(
    (dimension: string) => {
      onChange({ dimension })
      setIsOpen(false)
      setSearchQuery('')
    },
    [onChange]
  )

  // Handle clearing the binding key
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(null)
    },
    [onChange]
  )

  // Close dropdown on outside click
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Check if a dimension is currently selected
  const isSelected = useCallback(
    (dimension: string) => {
      if (!bindingKey) return false
      if (typeof bindingKey.dimension === 'string') {
        return bindingKey.dimension === dimension
      }
      return bindingKey.dimension.some((m) => m.dimension === dimension)
    },
    [bindingKey]
  )

  const label = getBindingKeyLabel(bindingKey)
  const hasSelection = bindingKey?.dimension !== null && bindingKey?.dimension !== undefined

  return (
    <div className={className}>
      <div ref={dropdownRef} className="dc:relative">
        {/* Trigger Button - compact to match select dropdown */}
        <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2 dc:py-1 dc:text-xs
          bg-dc-surface dc:border border-dc-border dc:rounded
          dc:transition-colors
          ${disabled ? 'dc:opacity-50 dc:cursor-not-allowed' : 'hover:border-dc-primary dc:cursor-pointer'}
          ${isOpen ? 'border-dc-primary dc:ring-1 ring-dc-primary' : ''}
        `}
      >
        <span className={`dc:truncate ${hasSelection ? 'text-dc-text' : 'text-dc-text-muted'}`}>
          {label}
        </span>
        <span className="dc:flex dc:items-center dc:gap-1">
          {hasSelection && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="dc:p-0.5 dc:rounded hover:bg-dc-surface-hover text-dc-text-muted hover:text-dc-text"
              title="Clear binding key"
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
        <div className="dc:absolute dc:z-50 dc:mt-1 dc:right-0 dc:w-[280px] bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg">
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
                placeholder="Search dimensions..."
                className="dc:w-full dc:pl-8 dc:pr-3 dc:py-1.5 dc:text-sm bg-dc-surface-secondary dc:border border-dc-border dc:rounded text-dc-text placeholder:text-dc-text-muted dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary"
              />
            </div>
          </div>

          {/* Dimension List */}
          <div className="dc:max-h-64 dc:overflow-y-auto dc:p-1">
            {Object.entries(filteredGroups).length === 0 ? (
              <div className="dc:px-3 dc:py-4 dc:text-sm text-dc-text-muted text-center">
                No matching dimensions found
              </div>
            ) : (
              Object.entries(filteredGroups).map(([cubeName, dims]) => (
                <div key={cubeName} className="dc:mb-2 dc:last:mb-0">
                  {/* Cube Header */}
                  <div className="dc:px-2 dc:py-1 dc:text-xs dc:font-medium text-dc-text-muted dc:uppercase dc:tracking-wide">
                    {cubeName}
                  </div>
                  {/* Dimensions */}
                  {dims.map((dim) => (
                    <button
                      key={dim.dimension}
                      onClick={() => handleSelect(dim.dimension)}
                      className={`
                        dc:flex dc:items-center dc:justify-between dc:w-full dc:px-3 dc:py-1.5 dc:text-sm
                        dc:rounded dc:transition-colors
                        ${isSelected(dim.dimension)
                          ? 'bg-dc-primary-bg text-dc-primary'
                          : 'text-dc-text hover:bg-dc-surface-hover'
                        }
                      `}
                    >
                      <span>{dim.label}</span>
                      {isSelected(dim.dimension) && CheckIcon && (
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
            Select a dimension that identifies entities across funnel steps (e.g., user ID, order ID)
          </div>
        </div>
      )}
      </div>
    </div>
  )
})

export default FunnelBindingKeySelector

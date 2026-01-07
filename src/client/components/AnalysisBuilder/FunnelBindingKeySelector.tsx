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
      <div ref={dropdownRef} className="relative">
        {/* Trigger Button - compact to match select dropdown */}
        <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-2 py-1 text-xs
          bg-dc-surface border border-dc-border rounded
          transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-dc-primary cursor-pointer'}
          ${isOpen ? 'border-dc-primary ring-1 ring-dc-primary' : ''}
        `}
      >
        <span className={`truncate ${hasSelection ? 'text-dc-text' : 'text-dc-text-muted'}`}>
          {label}
        </span>
        <span className="flex items-center gap-1">
          {hasSelection && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="p-0.5 rounded hover:bg-dc-surface-hover text-dc-text-muted hover:text-dc-text"
              title="Clear binding key"
            >
              ×
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
        <div className="absolute z-50 mt-1 right-0 w-[280px] bg-dc-surface border border-dc-border rounded-md shadow-lg">
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
                placeholder="Search dimensions..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-dc-surface-secondary border border-dc-border rounded text-dc-text placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary"
              />
            </div>
          </div>

          {/* Dimension List */}
          <div className="max-h-64 overflow-y-auto p-1">
            {Object.entries(filteredGroups).length === 0 ? (
              <div className="px-3 py-4 text-sm text-dc-text-muted text-center">
                No matching dimensions found
              </div>
            ) : (
              Object.entries(filteredGroups).map(([cubeName, dims]) => (
                <div key={cubeName} className="mb-2 last:mb-0">
                  {/* Cube Header */}
                  <div className="px-2 py-1 text-xs font-medium text-dc-text-muted uppercase tracking-wide">
                    {cubeName}
                  </div>
                  {/* Dimensions */}
                  {dims.map((dim) => (
                    <button
                      key={dim.dimension}
                      onClick={() => handleSelect(dim.dimension)}
                      className={`
                        flex items-center justify-between w-full px-3 py-1.5 text-sm
                        rounded transition-colors
                        ${isSelected(dim.dimension)
                          ? 'bg-dc-primary-bg text-dc-primary'
                          : 'text-dc-text hover:bg-dc-surface-hover'
                        }
                      `}
                    >
                      <span>{dim.label}</span>
                      {isSelected(dim.dimension) && CheckIcon && (
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
            Select a dimension that identifies entities across funnel steps (e.g., user ID, order ID)
          </div>
        </div>
      )}
      </div>
    </div>
  )
})

export default FunnelBindingKeySelector

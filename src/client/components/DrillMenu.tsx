/**
 * DrillMenu - Popover menu for drill-down options
 * Shows available drill directions (down/up) grouped by type (time, hierarchy, details)
 * Rendered in a portal to avoid stacking context issues with react-grid-layout
 */

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DrillMenuProps, DrillOption } from '../types/drill'

/**
 * Icon components for drill options
 */
function TimeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function HierarchyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="2" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="11" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5V8M8 8L4 11M8 8L12 11" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 6H14M6 6V14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function DrillDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2V10M6 10L3 7M6 10L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DrillUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10V2M6 2L3 5M6 2L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Get the direction indicator for a drill option
 */
function getDirectionIndicator(option: DrillOption) {
  if (option.type === 'drillDown') {
    return <DrillDownIcon className="dc:w-3 dc:h-3 text-dc-success" />
  }
  if (option.type === 'drillUp') {
    return <DrillUpIcon className="dc:w-3 dc:h-3 text-dc-warning" />
  }
  return null
}

/**
 * Group options by category (time, hierarchy, details)
 */
function groupOptions(options: DrillOption[]): Map<string, DrillOption[]> {
  const groups = new Map<string, DrillOption[]>()

  for (const option of options) {
    const category = option.icon || 'other'
    const existing = groups.get(category) || []
    existing.push(option)
    groups.set(category, existing)
  }

  return groups
}

/**
 * Get display name for a category
 */
function getCategoryLabel(category: string): string {
  switch (category) {
    case 'time':
      return 'Time'
    case 'hierarchy':
      return 'Hierarchy'
    case 'table':
      return 'Details'
    default:
      return 'Options'
  }
}

/**
 * DrillMenu component
 * Uses createPortal to render directly to document.body, avoiding stacking context issues
 */
export function DrillMenu({ options, position, onSelect, onClose }: DrillMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Track if we're mounted (for SSR safety)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Close on scroll to avoid menu getting out of sync with clicked element
    function handleScroll() {
      onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    // Listen to scroll on capture phase to catch scrolling containers
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  if (options.length === 0 || !mounted) {
    return null
  }

  // Position menu near clicked point but within viewport
  // Use very high z-index to ensure menu appears above everything
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 250),
    top: Math.min(position.y, window.innerHeight - 300),
    zIndex: 99999
  }

  const groupedOptions = groupOptions(options)

  const menuContent = (
    <div
      ref={menuRef}
      className="dc:min-w-[200px] dc:max-w-[280px] bg-dc-surface dc:rounded-lg dc:shadow-lg border border-dc-border dc:overflow-hidden"
      style={menuStyle}
    >
      {Array.from(groupedOptions.entries()).map(([category, categoryOptions], categoryIndex) => (
        <div key={category}>
          {/* Category header */}
          <div className="dc:px-3 dc:py-2 dc:flex dc:items-center dc:gap-2 bg-dc-surface-secondary text-dc-text-secondary dc:text-xs dc:font-medium dc:uppercase dc:tracking-wide">
            {category === 'time' && <TimeIcon className="dc:w-3 dc:h-3" />}
            {category === 'hierarchy' && <HierarchyIcon className="dc:w-3 dc:h-3" />}
            {category === 'table' && <TableIcon className="dc:w-3 dc:h-3" />}
            {getCategoryLabel(category)}
          </div>

          {/* Options in this category */}
          <div className="dc:py-1">
            {categoryOptions.map((option) => (
              <button
                key={option.id}
                className="dc:w-full dc:px-3 dc:py-2 dc:flex dc:items-center dc:gap-2 dc:cursor-pointer text-dc-text dc:text-sm dc:text-left hover:bg-dc-surface-hover hover:text-dc-accent dc:transition-colors dc:rounded-sm"
                onClick={() => {
                  onSelect(option)
                  onClose()
                }}
              >
                {/* Direction indicator */}
                <span className="dc:w-4 dc:flex dc:justify-center">
                  {getDirectionIndicator(option)}
                </span>

                {/* Label */}
                <span className="dc:flex-1">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Separator between categories */}
          {categoryIndex < groupedOptions.size - 1 && (
            <div className="border-t border-dc-border" />
          )}
        </div>
      ))}
    </div>
  )

  // Render in a portal to avoid stacking context issues with react-grid-layout
  return createPortal(menuContent, document.body)
}

export default DrillMenu

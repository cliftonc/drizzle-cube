/**
 * DrillBreadcrumb - Navigation breadcrumb for drill path
 * Shows the current drill history and allows navigating back
 */

import React from 'react'
import type { DrillBreadcrumbProps } from '../types/drill'

/**
 * Home icon for the root level
 */
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 7L7 2L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6V11.5C3 11.7761 3.22386 12 3.5 12H5.5V9H8.5V12H10.5C10.7761 12 11 11.7761 11 11.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Chevron separator between breadcrumb items
 */
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Back arrow icon
 */
function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 7H2M2 7L6 3M2 7L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Get a safe display label, handling edge cases
 */
function getSafeLabel(label: string | undefined | null): string {
  if (!label || label === 'undefined' || label === 'null' || label === '') {
    return '(empty)'
  }
  // Handle labels that are just whitespace
  if (label.trim() === '') {
    return '(empty)'
  }
  return label
}

/**
 * DrillBreadcrumb component
 */
export function DrillBreadcrumb({ path, onNavigate, onLevelClick }: DrillBreadcrumbProps) {
  if (path.length === 0) {
    return null
  }

  return (
    <div className="dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1.5 bg-dc-surface-secondary dc:rounded-md dc:text-xs">
      {/* Back button */}
      <button
        className="dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded dc:cursor-pointer dc:hover:bg-dc-surface-hover text-dc-text-secondary dc:hover:text-dc-text dc:transition-colors"
        onClick={onNavigate}
        title="Go back one level"
      >
        <BackIcon className="dc:w-3.5 dc:h-3.5" />
        <span className="dc:sr-only">Back</span>
      </button>

      <span className="text-dc-text-muted">|</span>

      {/* Home / root level */}
      <button
        className="dc:flex dc:items-center dc:gap-1 dc:px-1.5 dc:py-1 dc:rounded dc:cursor-pointer dc:hover:bg-dc-surface-hover text-dc-text-secondary dc:hover:text-dc-text dc:transition-colors"
        onClick={() => onLevelClick?.(0)}
        title="Return to top level"
      >
        <HomeIcon className="dc:w-3.5 dc:h-3.5" />
      </button>

      {/* Path items */}
      {path.map((entry, index) => {
        const safeLabel = getSafeLabel(entry.label)
        return (
          <React.Fragment key={entry.id}>
            <ChevronIcon className="dc:w-3 dc:h-3 text-dc-text-muted" />

            {index === path.length - 1 ? (
              // Current level (not clickable)
              <span className="dc:px-1.5 dc:py-1 text-dc-text dc:font-medium" title={safeLabel}>
                {safeLabel}
              </span>
            ) : (
              // Previous levels (clickable)
              <button
                className="dc:px-1.5 dc:py-1 dc:rounded dc:cursor-pointer dc:hover:bg-dc-surface-hover text-dc-text-secondary dc:hover:text-dc-text dc:transition-colors"
                onClick={() => onLevelClick?.(index + 1)}
                title={`Navigate to ${safeLabel}`}
              >
                {safeLabel}
              </button>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default DrillBreadcrumb

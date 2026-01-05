/**
 * XTDDropdown Component
 *
 * Dropdown for X-to-Date period selections (Week, Month, Quarter, Year to Date).
 */

import React, { useEffect, useRef } from 'react'
import { getIcon } from '../../icons'
import { XTD_OPTIONS, calculateDateRange, formatDateRangeDisplay } from '../shared/utils'

const CheckIcon = getIcon('check')

interface XTDDropdownProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (xtdValue: string) => void
  currentXTD?: string | null
  anchorRef: React.RefObject<HTMLElement>
}

const XTDDropdown: React.FC<XTDDropdownProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentXTD
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Delay adding listener to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Stop propagation to prevent parent handlers from interfering
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-lg min-w-[180px] py-1"
      style={{
        backgroundColor: 'var(--dc-surface)',
        borderColor: 'var(--dc-border)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}
      onClick={handleDropdownClick}
      onMouseDown={handleDropdownClick}
    >
      {XTD_OPTIONS.map(option => {
        const isActive = currentXTD === option.id
        const dateRange = calculateDateRange(option.value)
        const dateRangeText = dateRange
          ? formatDateRangeDisplay(dateRange.start, dateRange.end)
          : ''

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.value)}
            className="w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between gap-2"
            style={{
              backgroundColor: isActive ? 'var(--dc-primary-bg)' : 'transparent',
              color: 'var(--dc-text)'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              {dateRangeText && (
                <span
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--dc-text-secondary)' }}
                >
                  {dateRangeText}
                </span>
              )}
            </div>
            {isActive && (
              <CheckIcon
                className="w-4 h-4 shrink-0"
                style={{ color: 'var(--dc-primary)' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default XTDDropdown

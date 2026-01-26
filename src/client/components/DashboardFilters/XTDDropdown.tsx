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
      className="dc:absolute dc:top-full dc:left-0 dc:mt-1 dc:z-50 dc:border dc:rounded-lg dc:shadow-lg dc:min-w-[180px] dc:py-1"
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
            className="dc:w-full dc:px-3 dc:py-2 text-left dc:text-sm dc:transition-colors dc:flex dc:items-center dc:justify-between dc:gap-2"
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
            <div className="dc:flex dc:flex-col">
              <span className="dc:font-medium">{option.label}</span>
              {dateRangeText && (
                <span
                  className="dc:text-xs dc:mt-0.5"
                  style={{ color: 'var(--dc-text-secondary)' }}
                >
                  {dateRangeText}
                </span>
              )}
            </div>
            {isActive && (
              <CheckIcon
                className="dc:w-4 dc:h-4 dc:shrink-0"
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

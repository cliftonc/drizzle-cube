/**
 * CustomDateDropdown Component
 *
 * Tabbed dropdown for custom date selection with Fixed, Since, and Last tabs.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { formatDateForCube, convertDateRangeTypeToValue } from '../shared/utils'

type TabType = 'fixed' | 'since' | 'last'
type LastUnit = 'days' | 'weeks' | 'months' | 'quarters' | 'years'

interface CustomDateDropdownProps {
  isOpen: boolean
  onClose: () => void
  onDateRangeChange: (dateRange: string | string[]) => void
  currentDateRange?: string | string[]
  anchorRef: React.RefObject<HTMLElement>
}

const LAST_UNITS: { value: LastUnit; label: string }[] = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'quarters', label: 'Quarters' },
  { value: 'years', label: 'Years' }
]

const CustomDateDropdown: React.FC<CustomDateDropdownProps> = ({
  isOpen,
  onClose,
  onDateRangeChange,
  currentDateRange
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('fixed')

  // Fixed tab state
  const [fixedStartDate, setFixedStartDate] = useState('')
  const [fixedEndDate, setFixedEndDate] = useState('')

  // Since tab state
  const [sinceDate, setSinceDate] = useState('')

  // Last tab state
  const [lastNumber, setLastNumber] = useState(7)
  const [lastUnit, setLastUnit] = useState<LastUnit>('days')

  // Initialize state from current date range
  useEffect(() => {
    if (!currentDateRange) return

    if (Array.isArray(currentDateRange)) {
      // Custom date range - set fixed tab
      setActiveTab('fixed')
      setFixedStartDate(currentDateRange[0] || '')
      setFixedEndDate(currentDateRange[1] || currentDateRange[0] || '')
    } else {
      // Check for "last N units" pattern
      const lastNMatch = currentDateRange.match(/^last\s+(\d+)\s+(day|days|week|weeks|month|months|quarter|quarters|year|years)$/i)
      if (lastNMatch) {
        setActiveTab('last')
        setLastNumber(parseInt(lastNMatch[1], 10))
        const unit = lastNMatch[2].toLowerCase()
        if (unit === 'day') setLastUnit('days')
        else if (unit === 'week') setLastUnit('weeks')
        else if (unit === 'month') setLastUnit('months')
        else if (unit === 'quarter') setLastUnit('quarters')
        else if (unit === 'year') setLastUnit('years')
        else setLastUnit(unit.endsWith('s') ? unit as LastUnit : `${unit}s` as LastUnit)
      }
    }
  }, [currentDateRange])

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

  // Handle apply for Fixed tab
  const handleApplyFixed = useCallback(() => {
    if (fixedStartDate && fixedEndDate) {
      onDateRangeChange([fixedStartDate, fixedEndDate])
    } else if (fixedStartDate) {
      onDateRangeChange([fixedStartDate, fixedStartDate])
    }
  }, [fixedStartDate, fixedEndDate, onDateRangeChange])

  // Handle apply for Since tab
  const handleApplySince = useCallback(() => {
    if (sinceDate) {
      const today = formatDateForCube(new Date())
      onDateRangeChange([sinceDate, today])
    }
  }, [sinceDate, onDateRangeChange])

  // Handle apply for Last tab
  const handleApplyLast = useCallback(() => {
    if (lastNumber > 0) {
      // Convert to the internal DateRangeType format then to value
      const rangeType = `last_n_${lastUnit}`
      const value = convertDateRangeTypeToValue(rangeType, lastNumber)
      onDateRangeChange(value)
    }
  }, [lastNumber, lastUnit, onDateRangeChange])

  if (!isOpen) return null

  const tabButtonStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? 'var(--dc-primary)' : 'transparent',
    color: isActive ? 'white' : 'var(--dc-text)',
    borderBottom: isActive ? 'none' : `2px solid var(--dc-border)`
  })

  // Stop propagation to prevent parent handlers from interfering
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-lg min-w-[280px]"
      style={{
        backgroundColor: 'var(--dc-surface)',
        borderColor: 'var(--dc-border)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}
      onClick={handleDropdownClick}
      onMouseDown={handleDropdownClick}
    >
      {/* Tab Headers */}
      <div
        className="flex border-b"
        style={{ borderColor: 'var(--dc-border)' }}
      >
        {(['fixed', 'since', 'last'] as TabType[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors"
            style={tabButtonStyle(activeTab === tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Fixed Tab */}
        {activeTab === 'fixed' && (
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--dc-text-secondary)' }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={fixedStartDate}
                onChange={(e) => setFixedStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--dc-border)',
                  backgroundColor: 'var(--dc-bg)',
                  color: 'var(--dc-text)'
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--dc-text-secondary)' }}
              >
                End Date
              </label>
              <input
                type="date"
                value={fixedEndDate}
                onChange={(e) => setFixedEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--dc-border)',
                  backgroundColor: 'var(--dc-bg)',
                  color: 'var(--dc-text)'
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleApplyFixed}
              disabled={!fixedStartDate}
              className="w-full py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--dc-primary)',
                color: 'white'
              }}
            >
              Apply
            </button>
          </div>
        )}

        {/* Since Tab */}
        {activeTab === 'since' && (
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--dc-text-secondary)' }}
              >
                Since Date
              </label>
              <input
                type="date"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--dc-border)',
                  backgroundColor: 'var(--dc-bg)',
                  color: 'var(--dc-text)'
                }}
              />
            </div>
            <p
              className="text-xs"
              style={{ color: 'var(--dc-text-secondary)' }}
            >
              From selected date to today
            </p>
            <button
              type="button"
              onClick={handleApplySince}
              disabled={!sinceDate}
              className="w-full py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--dc-primary)',
                color: 'white'
              }}
            >
              Apply
            </button>
          </div>
        )}

        {/* Last Tab */}
        {activeTab === 'last' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--dc-text-secondary)' }}
                >
                  Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={lastNumber}
                  onChange={(e) => setLastNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--dc-border)',
                    backgroundColor: 'var(--dc-bg)',
                    color: 'var(--dc-text)'
                  }}
                />
              </div>
              <div className="flex-1">
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--dc-text-secondary)' }}
                >
                  Unit
                </label>
                <select
                  value={lastUnit}
                  onChange={(e) => setLastUnit(e.target.value as LastUnit)}
                  className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2"
                  style={{
                    borderColor: 'var(--dc-border)',
                    backgroundColor: 'var(--dc-bg)',
                    color: 'var(--dc-text)'
                  }}
                >
                  {LAST_UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p
              className="text-xs"
              style={{ color: 'var(--dc-text-secondary)' }}
            >
              Last {lastNumber} {lastNumber === 1 ? lastUnit.slice(0, -1) : lastUnit}
            </p>
            <button
              type="button"
              onClick={handleApplyLast}
              disabled={lastNumber < 1}
              className="w-full py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--dc-primary)',
                color: 'white'
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Cancel Button */}
      <div
        className="px-4 pb-4"
      >
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-sm font-medium rounded border transition-colors"
          style={{
            borderColor: 'var(--dc-border)',
            color: 'var(--dc-text-secondary)',
            backgroundColor: 'transparent'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default CustomDateDropdown

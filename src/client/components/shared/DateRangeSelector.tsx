/**
 * DateRangeSelector Component
 * 
 * Individual date range selector for a specific time dimension
 * Styled to match FilterItem component exactly
 */

import React, { useState, useEffect, useRef } from 'react'
import { getIcon } from '../../icons'
import { DATE_RANGE_OPTIONS, type DateRangeType } from './types'
import { convertDateRangeTypeToValue, formatDateForCube, requiresNumberInput } from './utils'

const CloseIcon = getIcon('close')
const CalendarIcon = getIcon('timeDimension')
const ChevronDownIcon = getIcon('chevronDown')

interface DateRangeSelectorProps {
  timeDimension: string
  availableTimeDimensions: string[]
  currentDateRange?: string | string[]
  onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void
  onTimeDimensionChange: (oldTimeDimension: string, newTimeDimension: string) => void
  onRemove: (timeDimension: string) => void
  hideFieldSelector?: boolean // Hide the time dimension field selector (for read-only filters)
  hideRemoveButton?: boolean // Hide the remove button (for read-only filters)
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  timeDimension,
  availableTimeDimensions,
  currentDateRange,
  onDateRangeChange,
  onTimeDimensionChange,
  onRemove,
  hideFieldSelector = false,
  hideRemoveButton = false
}) => {
  // Parse current date range to determine the type and custom dates
  const getCurrentRangeType = (): DateRangeType => {
    if (!currentDateRange) return 'this_month'
    
    if (Array.isArray(currentDateRange)) {
      return 'custom'
    }
    
    // Check if it's a flexible range with number (e.g., "last 9 weeks")
    const flexibleRangeMatch = currentDateRange.match(/^last (\d+) (days|weeks|months|quarters|years)$/)
    if (flexibleRangeMatch) {
      const [, , unit] = flexibleRangeMatch
      const unitPlural = unit === 'days' ? 'days' : unit === 'weeks' ? 'weeks' : unit === 'months' ? 'months' : unit === 'quarters' ? 'quarters' : 'years'
      return `last_n_${unitPlural}` as DateRangeType
    }
    
    // Find matching predefined range
    for (const option of DATE_RANGE_OPTIONS) {
      if (option.value !== 'custom' && !requiresNumberInput(option.value) && convertDateRangeTypeToValue(option.value) === currentDateRange) {
        return option.value
      }
    }
    
    return 'custom'
  }

  const getCurrentDates = (): { startDate: string; endDate: string } => {
    if (Array.isArray(currentDateRange) && currentDateRange.length >= 1) {
      return {
        startDate: currentDateRange[0] || '',
        endDate: currentDateRange[1] || currentDateRange[0] || ''
      }
    }
    
    // Default to today for custom ranges
    const today = formatDateForCube(new Date())
    return { startDate: today, endDate: today }
  }

  const getCurrentNumber = (): number => {
    if (!currentDateRange || Array.isArray(currentDateRange)) return 1
    
    // Check if it's a flexible range with number (e.g., "last 9 weeks")
    const flexibleRangeMatch = currentDateRange.match(/^last (\d+) (days|weeks|months|quarters|years)$/)
    if (flexibleRangeMatch) {
      return parseInt(flexibleRangeMatch[1]) || 1
    }
    
    return 1
  }

  const [rangeType, setRangeType] = useState<DateRangeType>(getCurrentRangeType())
  const [customDates, setCustomDates] = useState(getCurrentDates())
  const [numberValue, setNumberValue] = useState<number>(getCurrentNumber())
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false)
  const [isTimeDimensionDropdownOpen, setIsTimeDimensionDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsRangeDropdownOpen(false)
        setIsTimeDimensionDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close other dropdowns when opening one
  const handleTimeDimensionDropdownToggle = () => {
    setIsRangeDropdownOpen(false)
    setIsTimeDimensionDropdownOpen(!isTimeDimensionDropdownOpen)
  }
  
  const handleRangeDropdownToggle = () => {
    setIsTimeDimensionDropdownOpen(false)
    setIsRangeDropdownOpen(!isRangeDropdownOpen)
  }

  const handleRangeTypeChange = (newRangeType: DateRangeType) => {
    setRangeType(newRangeType)
    setIsRangeDropdownOpen(false)
    
    if (newRangeType === 'custom') {
      // For custom, use current custom dates or default to today
      if (customDates.startDate && customDates.endDate) {
        const dateRange = customDates.startDate === customDates.endDate 
          ? customDates.startDate
          : [customDates.startDate, customDates.endDate]
        onDateRangeChange(timeDimension, dateRange)
      }
    } else if (requiresNumberInput(newRangeType)) {
      // For number-based ranges, use the number value
      const cubeRangeValue = convertDateRangeTypeToValue(newRangeType, numberValue)
      onDateRangeChange(timeDimension, cubeRangeValue)
    } else {
      // For predefined ranges, use the converted value
      const cubeRangeValue = convertDateRangeTypeToValue(newRangeType)
      onDateRangeChange(timeDimension, cubeRangeValue)
    }
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newCustomDates = { ...customDates, [field]: value }
    setCustomDates(newCustomDates)
    
    if (rangeType === 'custom' && newCustomDates.startDate) {
      const dateRange = !newCustomDates.endDate || newCustomDates.startDate === newCustomDates.endDate
        ? newCustomDates.startDate
        : [newCustomDates.startDate, newCustomDates.endDate]
      onDateRangeChange(timeDimension, dateRange)
    }
  }

  const handleNumberChange = (value: number) => {
    setNumberValue(value)
    
    if (requiresNumberInput(rangeType)) {
      const cubeRangeValue = convertDateRangeTypeToValue(rangeType, value)
      onDateRangeChange(timeDimension, cubeRangeValue)
    }
  }

  const handleTimeDimensionChange = (newTimeDimension: string) => {
    setIsTimeDimensionDropdownOpen(false)
    onTimeDimensionChange(timeDimension, newTimeDimension)
  }

  const selectedRangeLabel = DATE_RANGE_OPTIONS.find(opt => opt.value === rangeType)?.label || 'Custom'

  return (
    <div ref={containerRef} className="bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:p-3">
      {/* Responsive layout - stacks on mobile, single row on desktop */}
      <div className="dc:flex dc:flex-col dc:sm:flex-row dc:sm:items-center dc:gap-3 dc:min-w-0">
        {/* Row 1: Filter icon and time dimension field - conditionally hidden */}
        {!hideFieldSelector && (
          <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
            <CalendarIcon className="dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0" />

            {/* Time dimension field selector */}
            <div className="dc:relative dc:flex-1 dc:min-w-0">
              <button
                onClick={handleTimeDimensionDropdownToggle}
                className="dc:w-full dc:flex dc:items-center dc:justify-between text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent dc:min-w-0"
              >
                <span className="dc:truncate">{timeDimension}</span>
                <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:transition-transform ${
                  isTimeDimensionDropdownOpen ? 'dc:transform dc:rotate-180' : ''
                }`} />
              </button>

              {isTimeDimensionDropdownOpen && (
                <div className="dc:absolute dc:z-20 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-60 dc:overflow-y-auto">
                  {availableTimeDimensions.map((td) => (
                    <button
                      key={td}
                      onClick={() => handleTimeDimensionChange(td)}
                      className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover ${
                        td === timeDimension ? 'bg-dc-accent-bg dark:bg-dc-accent-bg text-dc-accent dark:text-dc-accent' : 'text-dc-text-secondary'
                      }`}
                    >
                      {td}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Row 2: Date range selector */}
        <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:sm:flex-initial dc:min-w-0">
          {/* Range type selector with custom dropdown */}
          <div className="dc:relative dc:shrink-0">
            <button
              onClick={handleRangeDropdownToggle}
              className="dc:w-full dc:sm:w-40 dc:flex dc:items-center dc:justify-between text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
            >
              <span className="dc:truncate">{selectedRangeLabel}</span>
              <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-1 dc:transition-transform ${
                isRangeDropdownOpen ? 'dc:transform dc:rotate-180' : ''
              }`} />
            </button>

            {isRangeDropdownOpen && (
              <div className="dc:absolute dc:z-20 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-60 dc:overflow-y-auto">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleRangeTypeChange(option.value)}
                    className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover ${
                      option.value === rangeType ? 'bg-dc-accent-bg dark:bg-dc-accent-bg text-dc-accent dark:text-dc-accent' : 'text-dc-text-secondary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Custom date inputs, number input, or remove button */}
        <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
          {rangeType === 'custom' ? (
            <>
              {/* Start date */}
              <div className="dc:flex-1 dc:min-w-0">
                <input
                  type="date"
                  value={customDates.startDate}
                  onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                />
              </div>

              {/* End date (optional) */}
              <div className="dc:flex-1 dc:min-w-0">
                <input
                  type="date"
                  value={customDates.endDate}
                  onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                />
              </div>
            </>
          ) : requiresNumberInput(rangeType) ? (
            <>
              {/* Number input for flexible ranges */}
              <div className="dc:flex-1 dc:min-w-0">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={numberValue}
                  onChange={(e) => handleNumberChange(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Number"
                  className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                />
              </div>

              {/* Unit display */}
              <div className="dc:shrink-0 dc:text-sm text-dc-text-secondary">
                {rangeType.replace('last_n_', '').replace('_', ' ')}
              </div>
            </>
          ) : (
            // Empty placeholder to maintain layout consistency
            <div className="dc:flex-1"></div>
          )}

          {/* Remove button - conditionally hidden */}
          {!hideRemoveButton && (
            <button
              onClick={() => onRemove(timeDimension)}
              className="text-dc-text-muted hover:text-dc-error focus:outline-hidden dc:shrink-0 dc:p-1"
              title="Remove date range"
            >
              <CloseIcon className="dc:w-4 dc:h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DateRangeSelector
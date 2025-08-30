/**
 * DateRangeSelector Component
 * 
 * Individual date range selector for a specific time dimension
 * Styled to match FilterItem component exactly
 */

import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon, CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { DATE_RANGE_OPTIONS, type DateRangeType } from './types'
import { convertDateRangeTypeToValue, formatDateForCube, requiresNumberInput } from './utils'

interface DateRangeSelectorProps {
  timeDimension: string
  availableTimeDimensions: string[]
  currentDateRange?: string | string[]
  onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void
  onTimeDimensionChange: (oldTimeDimension: string, newTimeDimension: string) => void
  onRemove: (timeDimension: string) => void
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  timeDimension,
  availableTimeDimensions,
  currentDateRange,
  onDateRangeChange,
  onTimeDimensionChange,
  onRemove
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
    <div ref={containerRef} className="bg-white border border-gray-200 rounded-lg p-3">
      {/* Responsive layout - stacks on mobile, single row on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        {/* Row 1: Filter icon and time dimension field */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <CalendarIcon className="w-4 h-4 text-gray-500 shrink-0" />
          
          {/* Time dimension field selector */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={handleTimeDimensionDropdownToggle}
              className="w-full flex items-center justify-between text-left text-sm border border-gray-300 rounded-sm px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
            >
              <span className="truncate">{timeDimension}</span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                isTimeDimensionDropdownOpen ? 'transform rotate-180' : ''
              }`} />
            </button>
            
            {isTimeDimensionDropdownOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {availableTimeDimensions.map((td) => (
                  <button
                    key={td}
                    onClick={() => handleTimeDimensionChange(td)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${
                      td === timeDimension ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {td}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Date range selector */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
          {/* Range type selector with custom dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={handleRangeDropdownToggle}
              className="w-full sm:w-40 flex items-center justify-between text-left text-sm border border-gray-300 rounded-sm px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="truncate">{selectedRangeLabel}</span>
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 shrink-0 ml-1 transition-transform ${
                isRangeDropdownOpen ? 'transform rotate-180' : ''
              }`} />
            </button>
            
            {isRangeDropdownOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleRangeTypeChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 ${
                      option.value === rangeType ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
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
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {rangeType === 'custom' ? (
            <>
              {/* Start date */}
              <div className="flex-1 min-w-0">
                <input
                  type="date"
                  value={customDates.startDate}
                  onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full text-sm border border-gray-300 rounded-sm px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* End date (optional) */}
              <div className="flex-1 min-w-0">
                <input
                  type="date"
                  value={customDates.endDate}
                  onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full text-sm border border-gray-300 rounded-sm px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          ) : requiresNumberInput(rangeType) ? (
            <>
              {/* Number input for flexible ranges */}
              <div className="flex-1 min-w-0">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={numberValue}
                  onChange={(e) => handleNumberChange(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Number"
                  className="w-full text-sm border border-gray-300 rounded-sm px-2 py-1 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Unit display */}
              <div className="shrink-0 text-sm text-gray-600">
                {rangeType.replace('last_n_', '').replace('_', ' ')}
              </div>
            </>
          ) : (
            // Empty placeholder to maintain layout consistency
            <div className="flex-1"></div>
          )}
          
          {/* Remove button */}
          <button
            onClick={() => onRemove(timeDimension)}
            className="text-gray-400 hover:text-red-600 focus:outline-hidden shrink-0 p-1"
            title="Remove date range"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DateRangeSelector
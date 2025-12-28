/**
 * DateRangeFilter Component
 * 
 * Container component for managing date ranges on time dimensions.
 * Shows all time dimensions with date ranges and provides controls for adding new ones.
 */

import React from 'react'
import { getIcon } from '../../icons'
import DateRangeSelector from './DateRangeSelector'
import type { DateRangeFilterProps } from './types'
import { getTimeDimensionsWithDateRanges } from './utils'

const AddIcon = getIcon('add')
const CalendarIcon = getIcon('timeDimension')

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  timeDimensions,
  onDateRangeChange,
  onDateRangeRemove
}) => {
  // Get current date ranges from time dimensions
  const currentDateRanges = getTimeDimensionsWithDateRanges({ timeDimensions })
  
  // Get time dimensions that don't have date ranges yet
  const availableTimeDimensions = timeDimensions.filter(td => !td.dateRange)
  
  // Count of time dimensions with date ranges
  const dateRangeCount = Object.keys(currentDateRanges).length

  const handleAddDateRange = () => {
    if (availableTimeDimensions.length === 0) return
    
    // Add date range to the first available time dimension with default "this month"
    const firstAvailable = availableTimeDimensions[0]
    onDateRangeChange(firstAvailable.dimension, 'this month')
  }

  const handleClearAllDateRanges = () => {
    // Remove all date ranges
    Object.keys(currentDateRanges).forEach(timeDimension => {
      onDateRangeRemove(timeDimension)
    })
  }

  // Don't render if there are no time dimensions
  if (!timeDimensions || timeDimensions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 bg-dc-surface-secondary rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CalendarIcon className="w-4 h-4 text-dc-text-muted mr-2" />
          <h4 className="text-sm font-semibold text-dc-text-secondary">
            Date Ranges ({dateRangeCount})
          </h4>
        </div>

        <div className="flex items-center space-x-2">
          {/* Clear all button */}
          {dateRangeCount > 0 && (
            <button
              onClick={handleClearAllDateRanges}
              className="text-xs text-dc-text-muted hover:text-dc-error focus:outline-hidden underline"
            >
              Clear all
            </button>
          )}
          
          {/* Add Date Range button */}
          <button
            onClick={handleAddDateRange}
            disabled={availableTimeDimensions.length === 0}
            className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded focus:outline-hidden focus:ring-2 ${
              availableTimeDimensions.length > 0
                ? 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg focus:ring-dc-accent'
                : 'text-dc-text-muted bg-dc-surface-secondary border border-dc-border cursor-not-allowed'
            }`}
            title={availableTimeDimensions.length === 0 ? 'All time dimensions already have date ranges' : 'Add date range'}
          >
            <AddIcon className="w-3 h-3" />
            <span>Add Date Range</span>
          </button>
        </div>
      </div>
      
      {/* Date Range List */}
      {dateRangeCount > 0 && (
        <div className="space-y-3">
          {timeDimensions.map(td => {
            if (!td.dateRange) return null
            
            const allTimeDimensions = timeDimensions.map(t => t.dimension)
            
            return (
              <DateRangeSelector
                key={td.dimension}
                timeDimension={td.dimension}
                availableTimeDimensions={allTimeDimensions}
                currentDateRange={td.dateRange}
                onDateRangeChange={onDateRangeChange}
                onTimeDimensionChange={(oldTd, newTd) => {
                  // Remove date range from old time dimension and add it to new one
                  onDateRangeRemove(oldTd)
                  onDateRangeChange(newTd, td.dateRange!)
                }}
                onRemove={onDateRangeRemove}
              />
            )
          })}
        </div>
      )}
      
    </div>
  )
}

export default DateRangeFilter
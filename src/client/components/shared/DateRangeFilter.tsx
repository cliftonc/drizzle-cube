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
    <div className="dc:space-y-4 bg-dc-surface-secondary dc:rounded-lg dc:p-4">
      {/* Header */}
      <div className="dc:flex dc:items-center dc:justify-between">
        <div className="dc:flex dc:items-center">
          <CalendarIcon className="dc:w-4 dc:h-4 text-dc-text-muted dc:mr-2" />
          <h4 className="dc:text-sm dc:font-semibold text-dc-text-secondary">
            Date Ranges ({dateRangeCount})
          </h4>
        </div>

        <div className="dc:flex dc:items-center dc:space-x-2">
          {/* Clear all button */}
          {dateRangeCount > 0 && (
            <button
              onClick={handleClearAllDateRanges}
              className="dc:text-xs text-dc-text-muted hover:text-dc-error focus:outline-hidden dc:underline"
            >
              Clear all
            </button>
          )}
          
          {/* Add Date Range button */}
          <button
            onClick={handleAddDateRange}
            disabled={availableTimeDimensions.length === 0}
            className={`dc:flex dc:items-center dc:space-x-1 dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:rounded focus:outline-hidden dc:focus:ring-2 ${
              availableTimeDimensions.length > 0
                ? 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg dc:border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg focus:ring-dc-accent'
                : 'text-dc-text-muted bg-dc-surface-secondary dc:border border-dc-border dc:cursor-not-allowed'
            }`}
            title={availableTimeDimensions.length === 0 ? 'All time dimensions already have date ranges' : 'Add date range'}
          >
            <AddIcon className="dc:w-3 dc:h-3" />
            <span>Add Date Range</span>
          </button>
        </div>
      </div>
      
      {/* Date Range List */}
      {dateRangeCount > 0 && (
        <div className="dc:space-y-3">
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
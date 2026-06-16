/**
 * DateRangeFilter Component
 * 
 * Container component for managing date ranges on time dimensions.
 * Shows all time dimensions with date ranges and provides controls for adding new ones.
 */

import React from 'react'
import { getIcon } from '../../icons/index.js'
import DateRangeSelector from './DateRangeSelector.js'
import type { DateRangeFilterProps } from './types.js'
import { getTimeDimensionsWithDateRanges } from './utils.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const AddIcon = getIcon('add')
const CalendarIcon = getIcon('timeDimension')

interface DateRangeFilterHeaderProps {
  dateRangeCount: number
  canAdd: boolean
  onAdd: () => void
  onClearAll: () => void
}

/** Header row: title, clear-all and add buttons. */
const DateRangeFilterHeader: React.FC<DateRangeFilterHeaderProps> = ({
  dateRangeCount,
  canAdd,
  onAdd,
  onClearAll
}) => {
  const { t } = useTranslation()
  return (
    <div className="dc:flex dc:items-center dc:justify-between">
      <div className="dc:flex dc:items-center">
        <CalendarIcon className="dc:w-4 dc:h-4 text-dc-text-muted dc:mr-2" />
        <h4 className="dc:text-sm dc:font-semibold text-dc-text-secondary">
          {t('filter.shared.dateRange.title', { count: dateRangeCount })}
        </h4>
      </div>

      <div className="dc:flex dc:items-center dc:space-x-2">
        {/* Clear all button */}
        {dateRangeCount > 0 && (
          <button
            onClick={onClearAll}
            className="dc:text-xs text-dc-text-muted hover:text-dc-error focus:outline-hidden dc:underline"
          >
            {t('filter.shared.dateRange.clearAll')}
          </button>
        )}

        {/* Add Date Range button */}
        <button
          onClick={onAdd}
          disabled={!canAdd}
          className={`dc:flex dc:items-center dc:space-x-1 dc:px-2 dc:py-1 dc:text-xs dc:font-medium dc:rounded focus:outline-hidden dc:focus:ring-2 ${
            canAdd
              ? 'text-dc-accent dark:text-dc-accent bg-dc-accent-bg dark:bg-dc-accent-bg dc:border border-dc-accent dark:border-dc-accent hover:bg-dc-accent-bg dark:hover:bg-dc-accent-bg focus:ring-dc-accent'
              : 'text-dc-text-muted bg-dc-surface-secondary dc:border border-dc-border dc:cursor-not-allowed'
          }`}
          title={!canAdd ? t('filter.shared.dateRange.allHaveDateRanges') : t('filter.shared.dateRange.addDateRange')}
        >
          <AddIcon className="dc:w-3 dc:h-3" />
          <span>{t('filter.shared.dateRange.addDateRange')}</span>
        </button>
      </div>
    </div>
  )
}

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

  const allTimeDimensions = timeDimensions.map(td => td.dimension)

  return (
    <div className="dc:space-y-4 bg-dc-surface-secondary dc:rounded-lg dc:p-4">
      <DateRangeFilterHeader
        dateRangeCount={dateRangeCount}
        canAdd={availableTimeDimensions.length > 0}
        onAdd={handleAddDateRange}
        onClearAll={handleClearAllDateRanges}
      />

      {/* Date Range List */}
      {dateRangeCount > 0 && (
        <div className="dc:space-y-3">
          {timeDimensions.map(td => {
            if (!td.dateRange) return null

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

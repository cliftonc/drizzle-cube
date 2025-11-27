/**
 * ReadOnlyFilterList Component
 *
 * Displays filters in read-only mode with interactive value selectors
 */

import React, { useCallback } from 'react'
import { FunnelIcon, ClockIcon } from '@heroicons/react/24/outline'
import FilterItem from '../QueryBuilder/FilterItem'
import DateRangeSelector from '../QueryBuilder/DateRangeSelector'
import type { DashboardFilter, CubeMeta, SimpleFilter } from '../../types'
import type { MetaResponse } from '../QueryBuilder/types'

interface ReadOnlyFilterListProps {
  dashboardFilters: DashboardFilter[]
  schema: CubeMeta | null
  onFilterChange: (filterId: string, updatedFilter: DashboardFilter) => void
  onDateRangeChange: (filterId: string, dateRange: string | string[]) => void
  convertToMetaResponse: (cubeMeta: CubeMeta | null) => MetaResponse | null
  isTimeDimensionField: (fieldName: string) => boolean
}

const ReadOnlyFilterList: React.FC<ReadOnlyFilterListProps> = ({
  dashboardFilters,
  schema,
  onFilterChange,
  onDateRangeChange,
  convertToMetaResponse,
  isTimeDimensionField
}) => {
  // Render individual read-only filter
  const renderReadOnlyFilter = useCallback((dashboardFilter: DashboardFilter) => {
    const { id, label, filter, isUniversalTime } = dashboardFilter

    // Only render SimpleFilter in read-only mode (skip GroupFilters for now)
    if (!('member' in filter)) {
      return null
    }

    const simpleFilter = filter as SimpleFilter
    const isTimeDim = isTimeDimensionField(simpleFilter.member)

    // For universal time filters OR time dimensions with inDateRange, use DateRangeSelector
    if (isUniversalTime || (isTimeDim && simpleFilter.operator === 'inDateRange')) {
      // Get date range - handle both dateRange property and values array
      // If values is a single-element array with a preset string, use that string directly
      let dateRangeValue: string | string[] | undefined = simpleFilter.dateRange
      if (!dateRangeValue && simpleFilter.values) {
        if (Array.isArray(simpleFilter.values) && simpleFilter.values.length === 1 && typeof simpleFilter.values[0] === 'string') {
          // Single string value (preset like "last 30 days") - pass as string
          dateRangeValue = simpleFilter.values[0]
        } else {
          dateRangeValue = simpleFilter.values
        }
      }

      return (
        <div key={id} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 px-1">
            {isUniversalTime && (
              <ClockIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--dc-primary)' }} />
            )}
            <label
              className="text-xs font-semibold uppercase tracking-wide truncate"
              style={{ color: 'var(--dc-text-secondary)' }}
              title={isUniversalTime ? `${label} (applies to all time dimensions)` : label}
            >
              {label}
            </label>
          </div>
          <DateRangeSelector
            timeDimension={isUniversalTime ? '__universal_time__' : simpleFilter.member}
            availableTimeDimensions={isUniversalTime ? ['__universal_time__'] : [simpleFilter.member]}
            currentDateRange={dateRangeValue}
            onDateRangeChange={(_timeDim, dateRange) => onDateRangeChange(id, dateRange)}
            onTimeDimensionChange={() => {}} // Not editable in read-only mode
            onRemove={() => {}} // Not removable in read-only mode
            hideFieldSelector={true}
            hideRemoveButton={true}
          />
        </div>
      )
    }

    // For regular filters, use FilterItem
    return (
      <div key={id} className="flex flex-col gap-1.5">
        <label
          className="text-xs font-semibold uppercase tracking-wide truncate px-1"
          style={{ color: 'var(--dc-text-secondary)' }}
          title={label}
        >
          {label}
        </label>
        <FilterItem
          filter={simpleFilter}
          index={0} // Not used in read-only mode
          onFilterChange={(_index, updatedFilter) => {
            onFilterChange(id, {
              ...dashboardFilter,
              filter: updatedFilter
            })
          }}
          onFilterRemove={() => {}} // Not removable in read-only mode
          schema={convertToMetaResponse(schema)}
          query={{}} // Empty query object for read-only mode
          hideFieldSelector={true}
          hideOperatorSelector={true}
          hideRemoveButton={true}
        />
      </div>
    )
  }, [schema, convertToMetaResponse, isTimeDimensionField, onFilterChange, onDateRangeChange])

  if (dashboardFilters.length === 0) {
    return null
  }

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <FunnelIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--dc-primary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--dc-text)' }}>
          Filters
        </h3>
        {dashboardFilters.length > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 'var(--dc-primary)',
              color: 'white'
            }}
          >
            {dashboardFilters.length}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboardFilters.map(renderReadOnlyFilter)}
      </div>
    </div>
  )
}

export default ReadOnlyFilterList

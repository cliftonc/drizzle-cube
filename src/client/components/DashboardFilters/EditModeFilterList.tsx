/**
 * EditModeFilterList Component
 *
 * Displays filters in edit mode with chips showing filter labels and edit/delete actions
 */

import React from 'react'
import { getIcon } from '../../icons'
import type { DashboardFilter } from '../../types'

const FilterIcon = getIcon('filter')
const AddIcon = getIcon('add')
const CloseIcon = getIcon('close')
const EditIcon = getIcon('edit')
const ChevronDownIcon = getIcon('chevronDown')
const ClockIcon = getIcon('timeDimension')

interface EditModeFilterListProps {
  dashboardFilters: DashboardFilter[]
  onAddFilter: () => void
  onAddTimeFilter: () => void
  onEditFilter: (filterId: string) => void
  onRemoveFilter: (filterId: string) => void
  selectedFilterId?: string | null
  onFilterSelect?: (filterId: string) => void
}

const EditModeFilterList: React.FC<EditModeFilterListProps> = ({
  dashboardFilters,
  onAddFilter,
  onAddTimeFilter,
  onEditFilter,
  onRemoveFilter,
  selectedFilterId,
  onFilterSelect
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  // Render compact filter chip - just label + edit + delete
  const renderFilterChip = (dashboardFilter: DashboardFilter) => {
    const { id, label, isUniversalTime } = dashboardFilter
    const isSelected = selectedFilterId === id

    // Use calendar icon for universal time filters, funnel for regular filters
    const IconComponent = isUniversalTime ? ClockIcon : FilterIcon

    return (
      <div
        key={id}
        className={`dc:inline-flex dc:items-center dc:gap-1.5 dc:px-2.5 dc:py-1 dc:rounded-md dc:border dc:text-xs dc:transition-all ${
          'dc:cursor-pointer dc:hover:shadow-md'
        }`}
        style={{
          backgroundColor: isSelected ? 'var(--dc-primary)' : 'var(--dc-surface)',
          borderColor: isSelected ? 'var(--dc-primary)' : 'var(--dc-border)',
          borderWidth: isSelected ? '2px' : '1px',
          color: isSelected ? 'white' : 'var(--dc-text)',
          boxShadow: isSelected ? '0 0 0 3px rgba(var(--dc-primary-rgb), 0.1)' : 'none'
        }}
        onClick={() => {
          if (onFilterSelect) {
            onFilterSelect(id)
          }
        }}
      >
        <IconComponent
          className="dc:w-3.5 dc:h-3.5 dc:shrink-0"
          style={{ color: isSelected ? 'white' : 'var(--dc-primary)' }}
        />
        <span className="dc:font-medium dc:truncate">{label}</span>

        {!isSelected && (
          <div className="dc:flex dc:items-center dc:gap-0.5 dc:ml-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEditFilter(id)}
              className="dc:p-0.5 hover:bg-dc-hover dc:rounded dc:transition-colors"
              title="Edit filter"
            >
              <EditIcon className="dc:w-3 dc:h-3" />
            </button>
            <button
              onClick={() => onRemoveFilter(id)}
              className="dc:p-0.5 hover:bg-dc-danger-bg hover:text-dc-danger dc:rounded dc:transition-colors"
              title="Remove filter"
            >
              <CloseIcon className="dc:w-3 dc:h-3" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile: Header + collapsible content */}
      <div className="dc:md:hidden">
        {/* Header - clickable to toggle */}
        <div
          className="dc:px-4 dc:py-2 dc:flex dc:items-center dc:justify-between dc:cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="dc:flex dc:items-center dc:gap-2">
            <FilterIcon className="dc:w-4 dc:h-4 dc:shrink-0" style={{ color: 'var(--dc-primary)' }} />
            <h3 className="dc:text-sm dc:font-semibold" style={{ color: 'var(--dc-text)' }}>
              Filters
            </h3>
            {dashboardFilters.length > 0 && (
              <span
                className="dc:px-1.5 dc:py-0.5 dc:rounded-full dc:text-xs dc:font-medium"
                style={{
                  backgroundColor: 'var(--dc-primary)',
                  color: 'white'
                }}
              >
                {dashboardFilters.length}
              </span>
            )}
            <ChevronDownIcon
              className={`dc:w-4 dc:h-4 dc:transition-transform ${isCollapsed ? '' : 'dc:rotate-180'}`}
              style={{ color: 'var(--dc-text-secondary)' }}
            />
          </div>

          <div className="dc:flex dc:items-center dc:gap-1">
            {/* Only show Date Range button if no universal time filter exists */}
            {!dashboardFilters.some(f => f.isUniversalTime) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddTimeFilter()
                }}
                className="dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-md dc:text-xs dc:font-medium dc:transition-colors dc:hover:opacity-80"
                style={{
                  backgroundColor: 'var(--dc-surface)',
                  color: 'var(--dc-primary)',
                  border: '1px solid var(--dc-border)'
                }}
                title="Add date range filter (applies to all time dimensions)"
              >
                <AddIcon className="dc:w-3.5 dc:h-3.5" />
                <ClockIcon className="dc:w-3.5 dc:h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddFilter()
              }}
              className="dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-md dc:text-xs dc:font-medium dc:transition-colors dc:hover:opacity-80"
              style={{
                backgroundColor: 'var(--dc-primary)',
                color: 'white'
              }}
            >
              <AddIcon className="dc:w-3.5 dc:h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Filter Chips - Collapsible */}
        {dashboardFilters.length > 0 && !isCollapsed && (
          <div className="dc:px-4 dc:pb-2 dc:flex dc:flex-col dc:gap-2">
            {dashboardFilters.map(renderFilterChip)}
          </div>
        )}

        {/* Mobile Empty State */}
        {dashboardFilters.length === 0 && !isCollapsed && (
          <div className="dc:px-4 dc:pb-2">
            <div
              className="dc:text-xs dc:p-2 dc:rounded-md text-center"
              style={{
                backgroundColor: 'var(--dc-surface-secondary)',
                color: 'var(--dc-text-secondary)'
              }}
            >
              No filters configured. Click "Add" to create one.
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Single row layout */}
      <div className="dc:hidden dc:md:flex dc:md:items-center dc:md:gap-3 dc:px-4 dc:py-2">
        {/* Header Section */}
        <div className="dc:flex dc:items-center dc:gap-2 dc:shrink-0">
          <FilterIcon className="dc:w-4 dc:h-4 dc:shrink-0" style={{ color: 'var(--dc-primary)' }} />
          <h3 className="dc:text-sm dc:font-semibold dc:whitespace-nowrap" style={{ color: 'var(--dc-text)' }}>
            Filters
          </h3>
          {dashboardFilters.length > 0 && (
            <span
              className="dc:px-1.5 dc:py-0.5 dc:rounded-full dc:text-xs dc:font-medium"
              style={{
                backgroundColor: 'var(--dc-primary)',
                color: 'white'
              }}
            >
              {dashboardFilters.length}
            </span>
          )}
        </div>

        {/* Filter Chips Section - grows to fill space */}
        {dashboardFilters.length > 0 ? (
          <div className="dc:flex dc:flex-wrap dc:gap-2 dc:flex-1 dc:min-w-0">
            {dashboardFilters.map(renderFilterChip)}
          </div>
        ) : (
          <div className="dc:flex-1 dc:min-w-0">
            <div
              className="dc:text-xs dc:px-3 dc:py-1 dc:rounded-md dc:inline-block"
              style={{
                backgroundColor: 'var(--dc-surface-secondary)',
                color: 'var(--dc-text-secondary)'
              }}
            >
              No filters configured. Click "Add" to create one.
            </div>
          </div>
        )}

        {/* Add Button Section */}
        <div className="dc:flex dc:items-center dc:gap-1 dc:shrink-0">
          {/* Only show Date Range button if no universal time filter exists */}
          {!dashboardFilters.some(f => f.isUniversalTime) && (
            <button
              onClick={onAddTimeFilter}
              className="dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-md dc:text-xs dc:font-medium dc:transition-colors dc:hover:opacity-80"
              style={{
                backgroundColor: 'var(--dc-surface)',
                color: 'var(--dc-primary)',
                border: '1px solid var(--dc-border)'
              }}
              title="Add date range filter (applies to all time dimensions)"
            >
              <AddIcon className="dc:w-3.5 dc:h-3.5" />
              <span>Date Range</span>
            </button>
          )}
          <button
            onClick={onAddFilter}
            className="dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-md dc:text-xs dc:font-medium dc:transition-colors dc:hover:opacity-80"
            style={{
              backgroundColor: 'var(--dc-primary)',
              color: 'white'
            }}
          >
            <AddIcon className="dc:w-3.5 dc:h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default EditModeFilterList

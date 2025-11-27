/**
 * EditModeFilterList Component
 *
 * Displays filters in edit mode with chips showing filter labels and edit/delete actions
 */

import React from 'react'
import { FunnelIcon, PlusIcon, XMarkIcon, PencilIcon, ChevronDownIcon, ClockIcon } from '@heroicons/react/24/outline'
import type { DashboardFilter } from '../../types'

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
    const IconComponent = isUniversalTime ? ClockIcon : FunnelIcon

    return (
      <div
        key={id}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-all ${
          'cursor-pointer hover:shadow-md'
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
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: isSelected ? 'white' : 'var(--dc-primary)' }}
        />
        <span className="font-medium truncate">{label}</span>

        {!isSelected && (
          <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onEditFilter(id)}
              className="p-0.5 hover:bg-dc-hover rounded transition-colors"
              title="Edit filter"
            >
              <PencilIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => onRemoveFilter(id)}
              className="p-0.5 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
              title="Remove filter"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile: Header + collapsible content */}
      <div className="md:hidden">
        {/* Header - clickable to toggle */}
        <div
          className="px-4 py-2 flex items-center justify-between cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
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
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              style={{ color: 'var(--dc-text-secondary)' }}
            />
          </div>

          <div className="flex items-center gap-1">
            {/* Only show Date Range button if no universal time filter exists */}
            {!dashboardFilters.some(f => f.isUniversalTime) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddTimeFilter()
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--dc-surface)',
                  color: 'var(--dc-primary)',
                  border: '1px solid var(--dc-border)'
                }}
                title="Add date range filter (applies to all time dimensions)"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <ClockIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddFilter()
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--dc-primary)',
                color: 'white'
              }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Filter Chips - Collapsible */}
        {dashboardFilters.length > 0 && !isCollapsed && (
          <div className="px-4 pb-2 flex flex-col gap-2">
            {dashboardFilters.map(renderFilterChip)}
          </div>
        )}

        {/* Mobile Empty State */}
        {dashboardFilters.length === 0 && !isCollapsed && (
          <div className="px-4 pb-2">
            <div
              className="text-xs p-2 rounded-md text-center"
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
      <div className="hidden md:flex md:items-center md:gap-3 px-4 py-2">
        {/* Header Section */}
        <div className="flex items-center gap-2 shrink-0">
          <FunnelIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--dc-primary)' }} />
          <h3 className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--dc-text)' }}>
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

        {/* Filter Chips Section - grows to fill space */}
        {dashboardFilters.length > 0 ? (
          <div className="flex flex-wrap gap-2 flex-1 min-w-0">
            {dashboardFilters.map(renderFilterChip)}
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div
              className="text-xs px-3 py-1 rounded-md inline-block"
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
        <div className="flex items-center gap-1 shrink-0">
          {/* Only show Date Range button if no universal time filter exists */}
          {!dashboardFilters.some(f => f.isUniversalTime) && (
            <button
              onClick={onAddTimeFilter}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--dc-surface)',
                color: 'var(--dc-primary)',
                border: '1px solid var(--dc-border)'
              }}
              title="Add date range filter (applies to all time dimensions)"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Date Range</span>
            </button>
          )}
          <button
            onClick={onAddFilter}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--dc-primary)',
              color: 'white'
            }}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default EditModeFilterList

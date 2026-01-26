/**
 * Portlet Filter Configuration Modal
 * Allows users to configure which dashboard filters apply to a specific portlet
 */

import { useState, useEffect } from 'react'
import type { DashboardFilter } from '../types'

interface PortletFilterConfigModalProps {
  isOpen: boolean
  onClose: () => void
  dashboardFilters: DashboardFilter[]
  currentMapping: string[]
  onSave: (mapping: string[]) => void
  portletTitle: string
}

export default function PortletFilterConfigModal({
  isOpen,
  onClose,
  dashboardFilters = [],
  currentMapping = [],
  onSave,
  portletTitle
}: PortletFilterConfigModalProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(currentMapping)

  // Update local state when props change
  useEffect(() => {
    setSelectedFilters(currentMapping)
  }, [currentMapping, isOpen])

  const handleToggleFilter = (filterId: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId)
      } else {
        return [...prev, filterId]
      }
    })
  }

  const handleSave = () => {
    onSave(selectedFilters)
    onClose()
  }

  const handleCancel = () => {
    setSelectedFilters(currentMapping) // Reset to original
    onClose()
  }

  // Format filter preview text
  const formatFilterPreview = (filter: DashboardFilter): string => {
    if (!filter.filter) return ''

    // Handle simple filters
    if ('member' in filter.filter && filter.filter.member) {
      const values = filter.filter.values || []
      const valuesText = values.length > 0 ? values.join(', ') : 'no value'
      return `${filter.filter.member} ${filter.filter.operator} ${valuesText}`
    }

    // Handle group filters (AND/OR)
    if ('type' in filter.filter && filter.filter.type) {
      const filterCount = filter.filter.filters?.length || 0
      return `${filter.filter.type.toUpperCase()} group with ${filterCount} filter${filterCount !== 1 ? 's' : ''}`
    }

    return 'Complex filter'
  }

  if (!isOpen) return null

  return (
    <div className="dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center bg-black bg-opacity-50" onClick={handleCancel}>
      <div
        className="bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:max-w-2xl dc:w-full dc:mx-4 dc:max-h-[80vh] dc:flex dc:flex-col"
        style={{ boxShadow: 'var(--dc-shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dc:px-6 dc:py-4 dc:border-b border-dc-border bg-dc-surface-secondary dc:rounded-t-lg">
          <h2 className="dc:text-lg dc:font-semibold text-dc-text">Configure Dashboard Filters</h2>
          <p className="dc:text-sm text-dc-text-secondary dc:mt-1">
            Choose which dashboard filters apply to "{portletTitle}"
          </p>
        </div>

        {/* Content */}
        <div className="dc:flex-1 dc:overflow-y-auto dc:px-6 dc:py-4">
          {dashboardFilters.length === 0 ? (
            <div className="text-center dc:py-8 text-dc-text-muted">
              <svg
                className="dc:mx-auto dc:h-12 dc:w-12 dc:mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <p className="dc:text-sm dc:font-medium">No dashboard filters available</p>
              <p className="dc:text-xs dc:mt-1">Add filters at the dashboard level first</p>
            </div>
          ) : (
            <div className="dc:space-y-3">
              <div className="dc:flex dc:items-center dc:justify-between dc:mb-4 dc:pb-2 dc:border-b border-dc-border">
                <span className="dc:text-sm dc:font-medium text-dc-text">Available Filters</span>
                <span className="dc:text-xs text-dc-text-secondary">
                  {selectedFilters.length} of {dashboardFilters.length} selected
                </span>
              </div>

              {dashboardFilters.map(filter => {
                const isSelected = selectedFilters.includes(filter.id)

                return (
                  <label
                    key={filter.id}
                    className={`dc:flex dc:items-start dc:p-3 dc:rounded-md dc:border dc:cursor-pointer dc:transition-colors ${
                      isSelected
                        ? 'border-dc-primary bg-dc-surface-secondary'
                        : 'border-dc-border hover:bg-dc-surface-hover'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleFilter(filter.id)}
                      className="dc:mt-0.5 dc:mr-3 dc:h-4 dc:w-4 dc:rounded border-dc-border dc:focus:ring-2 focus:ring-dc-primary"
                      style={{
                        accentColor: 'var(--dc-primary)'
                      }}
                    />
                    <div className="dc:flex-1 dc:min-w-0">
                      <div className="dc:flex dc:items-center dc:gap-2">
                        <span className="dc:font-medium dc:text-sm text-dc-text dc:truncate">
                          {filter.label}
                        </span>
                        {isSelected && (
                          <span
                            className="dc:px-2 dc:py-0.5 dc:text-xs dc:rounded-full"
                            style={{
                              backgroundColor: 'var(--dc-primary)',
                              color: 'white'
                            }}
                          >
                            Applied
                          </span>
                        )}
                      </div>
                      <div className="dc:mt-1 dc:text-xs text-dc-text-secondary dc:break-words">
                        {formatFilterPreview(filter)}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dc:px-6 dc:py-4 dc:border-t border-dc-border bg-dc-surface-secondary dc:rounded-b-lg dc:flex dc:justify-end dc:gap-3">
          <button
            onClick={handleCancel}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md dc:border border-dc-border bg-dc-surface hover:bg-dc-surface-hover dc:transition-colors text-dc-text"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium dc:rounded-md text-white dc:transition-colors"
            style={{
              backgroundColor: 'var(--dc-primary)'
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

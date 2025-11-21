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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCancel}>
      <div
        className="bg-dc-surface border border-dc-border rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        style={{ boxShadow: 'var(--dc-shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-dc-border bg-dc-surface-secondary rounded-t-lg">
          <h2 className="text-lg font-semibold text-dc-text">Configure Dashboard Filters</h2>
          <p className="text-sm text-dc-text-secondary mt-1">
            Choose which dashboard filters apply to "{portletTitle}"
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {dashboardFilters.length === 0 ? (
            <div className="text-center py-8 text-dc-text-muted">
              <svg
                className="mx-auto h-12 w-12 mb-3"
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
              <p className="text-sm font-medium">No dashboard filters available</p>
              <p className="text-xs mt-1">Add filters at the dashboard level first</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-dc-border">
                <span className="text-sm font-medium text-dc-text">Available Filters</span>
                <span className="text-xs text-dc-text-secondary">
                  {selectedFilters.length} of {dashboardFilters.length} selected
                </span>
              </div>

              {dashboardFilters.map(filter => {
                const isSelected = selectedFilters.includes(filter.id)

                return (
                  <label
                    key={filter.id}
                    className={`flex items-start p-3 rounded-md border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-dc-primary bg-dc-surface-secondary'
                        : 'border-dc-border hover:bg-dc-surface-hover'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleFilter(filter.id)}
                      className="mt-0.5 mr-3 h-4 w-4 rounded border-dc-border focus:ring-2 focus:ring-dc-primary"
                      style={{
                        accentColor: 'var(--dc-primary)'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-dc-text truncate">
                          {filter.label}
                        </span>
                        {isSelected && (
                          <span
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: 'var(--dc-primary)',
                              color: 'white'
                            }}
                          >
                            Applied
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-dc-text-secondary break-words">
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
        <div className="px-6 py-4 border-t border-dc-border bg-dc-surface-secondary rounded-b-lg flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium rounded-md border border-dc-border bg-dc-surface hover:bg-dc-surface-hover transition-colors text-dc-text"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-md text-white transition-colors"
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

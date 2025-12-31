/**
 * FilterEditModal Component
 *
 * Modal for editing dashboard filter details including label, field, operator, and values
 *
 * Pattern: Self-contained modal with local state (matches PortletEditModal pattern)
 * - All editing state is local to the modal
 * - Changes only propagate on "Done" button click via onSave callback
 * - Cancel/close resets local state without saving
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { getIcon } from '../../icons'
import FilterBuilder from '../shared/FilterBuilder'

const CloseIcon = getIcon('close')
const EyeIcon = getIcon('eye')
const EyeOffIcon = getIcon('eyeOff')
import DateRangeSelector from '../shared/DateRangeSelector'
import CubeMetaExplorer from '../shared/CubeMetaExplorer'
import { extractDashboardFields } from '../../utils/filterUtils'
import type { DashboardFilter, CubeMeta, Filter, DashboardConfig, SimpleFilter } from '../../types'
import type { MetaResponse } from '../../shared/types'

interface FilterEditModalProps {
  filter: DashboardFilter
  schema: CubeMeta | null
  dashboardConfig: DashboardConfig
  isOpen: boolean
  onSave: (filter: DashboardFilter) => void | Promise<void>
  onClose: () => void
  onDelete: () => void
  convertToMetaResponse: (cubeMeta: CubeMeta | null) => MetaResponse | null
}

const FilterEditModal: React.FC<FilterEditModalProps> = ({
  filter,
  schema,
  dashboardConfig,
  isOpen,
  onSave,
  onClose,
  onDelete,
  convertToMetaResponse
}) => {
  // Local state for editing - all changes stay local until "Done"
  const [localLabel, setLocalLabel] = useState(filter.label)
  const [localFilter, setLocalFilter] = useState(filter.filter)
  const [showAllFields, setShowAllFields] = useState(false)

  // Sync local state when filter prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalLabel(filter.label)
      setLocalFilter(filter.filter)
    }
  }, [filter, isOpen])

  // Extract fields used in dashboard
  const dashboardFields = useMemo(() => {
    return extractDashboardFields(dashboardConfig)
  }, [dashboardConfig])

  // Create filtered schema showing only dashboard fields
  const filteredSchema = useMemo<MetaResponse | null>(() => {
    if (!schema) return null

    if (showAllFields) {
      return convertToMetaResponse(schema)
    }

    const filteredCubes = schema.cubes
      .map(cube => {
        const cubeName = cube.name

        const filteredMeasures = cube.measures.filter(measure => {
          const fullName = measure.name.includes('.')
            ? measure.name
            : `${cubeName}.${measure.name}`
          return dashboardFields.measures.has(fullName)
        })

        const filteredDimensions = cube.dimensions.filter(dimension => {
          const fullName = dimension.name.includes('.')
            ? dimension.name
            : `${cubeName}.${dimension.name}`
          return dashboardFields.dimensions.has(fullName) ||
                 dashboardFields.timeDimensions.has(fullName)
        })

        if (filteredMeasures.length > 0 || filteredDimensions.length > 0) {
          return {
            ...cube,
            measures: filteredMeasures,
            dimensions: filteredDimensions
          }
        }

        return null
      })
      .filter((cube): cube is NonNullable<typeof cube> => cube !== null)

    const filteredCubeMeta: CubeMeta = {
      ...schema,
      cubes: filteredCubes
    }

    return convertToMetaResponse(filteredCubeMeta)
  }, [schema, dashboardFields, showAllFields, convertToMetaResponse])

  // Extract the currently selected field to highlight it in the schema
  const selectedFieldInFilter = useMemo(() => {
    if ('member' in localFilter && localFilter.member) {
      return localFilter.member
    }
    return null
  }, [localFilter])

  // Handle label change - updates local state only
  const handleLabelChange = useCallback((newLabel: string) => {
    setLocalLabel(newLabel)
  }, [])

  // Handle filter changes from FilterBuilder - updates local state only
  const handleFilterBuilderChange = useCallback((filters: Filter[]) => {
    setLocalFilter(filters[0] || localFilter)
  }, [localFilter])

  // Handle field selection from schema explorer - updates local state only
  const handleFieldSelect = useCallback((fieldName: string) => {
    if ('member' in localFilter) {
      setLocalFilter({
        ...localFilter,
        member: fieldName,
        values: [] // Reset values when changing field
      })
    }
  }, [localFilter])

  // Handle date range change for universal time filters
  const handleDateRangeChange = useCallback((_timeDim: string, dateRange: string | string[]) => {
    if ('member' in localFilter) {
      setLocalFilter({
        ...localFilter,
        values: Array.isArray(dateRange) ? dateRange : [dateRange]
      } as SimpleFilter)
    }
  }, [localFilter])

  // Validate filter before saving
  const validateFilter = useCallback((): { isValid: boolean; message?: string } => {
    if (!localLabel.trim()) {
      return { isValid: false, message: 'Filter label is required' }
    }

    // Skip member validation for universal time filters (member is placeholder)
    if (!filter.isUniversalTime && 'member' in localFilter && !localFilter.member) {
      return { isValid: false, message: 'Please select a field for the filter' }
    }

    return { isValid: true }
  }, [localLabel, localFilter, filter.isUniversalTime])

  // Handle save - validate then call onSave with complete filter data
  const handleSave = useCallback(async () => {
    const validation = validateFilter()
    if (!validation.isValid) {
      alert(validation.message)
      return
    }

    const updatedFilter: DashboardFilter = {
      id: filter.id,
      label: localLabel,
      filter: localFilter,
      // Preserve isUniversalTime flag if present
      ...(filter.isUniversalTime && { isUniversalTime: true })
    }

    try {
      await onSave(updatedFilter)
      onClose()
    } catch (error) {
      console.error('Failed to save filter:', error)
      alert('Failed to save filter. Please try again.')
    }
  }, [filter.id, filter.isUniversalTime, localLabel, localFilter, validateFilter, onSave, onClose])

  // Handle cancel/close - reset local state
  const handleCancel = useCallback(() => {
    setLocalLabel(filter.label)
    setLocalFilter(filter.filter)
    onClose()
  }, [filter, onClose])

  return (
    <div
      className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-2"
      style={{ backgroundColor: 'var(--dc-overlay)' }}
    >
      <div
        className="rounded-lg max-w-7xl w-full h-[95vh] overflow-hidden flex flex-col bg-dc-surface border border-dc-border"
        style={{ boxShadow: 'var(--dc-shadow-2xl)' }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-dc-border flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-dc-text">
              Filter Label
            </label>
            <input
              type="text"
              value={localLabel}
              onChange={(e) => handleLabelChange(e.target.value)}
              className="w-full px-3 py-2 border border-dc-border rounded-md text-sm bg-dc-surface-secondary text-dc-text"
              placeholder="Enter filter label"
            />
          </div>
          <button
            onClick={handleCancel}
            className="ml-4 p-2 hover:bg-dc-surface-hover rounded-md transition-colors text-dc-text-secondary"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Two Column Layout (or single column for universal time filters) */}
        <div className="flex-1 flex">
          {/* Left Column - Schema Explorer (hidden for universal time filters) */}
          {!filter.isUniversalTime && (
            <div className="w-80 border-r border-dc-border bg-dc-surface overflow-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-dc-text">
                    Available Fields
                  </h3>
                  <button
                    onClick={() => setShowAllFields(!showAllFields)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-dc-surface-hover text-dc-text-muted"
                    title={showAllFields ? 'Show dashboard fields only' : 'Show all fields'}
                  >
                    {showAllFields ? (
                      <>
                        <EyeOffIcon className="w-3.5 h-3.5" />
                        <span>Dashboard</span>
                      </>
                    ) : (
                      <>
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span>All</span>
                      </>
                    )}
                  </button>
                </div>

                {!showAllFields && (
                  <div className="text-xs text-dc-info mb-3 p-2 bg-dc-info-bg rounded border border-dc-info-border">
                    Showing only fields used in this dashboard
                  </div>
                )}

                {filteredSchema && filteredSchema.cubes.length > 0 ? (
                  <CubeMetaExplorer
                    schema={filteredSchema}
                    schemaStatus="success"
                    schemaError={null}
                    selectedFields={{
                      measures: selectedFieldInFilter ? [selectedFieldInFilter] : [],
                      dimensions: selectedFieldInFilter ? [selectedFieldInFilter] : [],
                      timeDimensions: selectedFieldInFilter ? [selectedFieldInFilter] : []
                    }}
                    onFieldSelect={(fieldName) => handleFieldSelect(fieldName)}
                    onFieldDeselect={() => {}}
                  />
                ) : (
                  <div className="text-center py-8 text-dc-text-muted text-sm">
                    {showAllFields ? (
                      <div>
                        <p className="mb-2">No schema available</p>
                        <p className="text-xs">Check your API connection</p>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-2">No fields used in dashboard</p>
                        <p className="text-xs">Add portlets to the dashboard first, or toggle to show all fields</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Column - Filter Builder or Date Range Selector */}
          <div className="flex-1 overflow-auto px-6 py-4 bg-dc-surface-secondary">
            {filter.isUniversalTime ? (
              /* Universal time filter - show DateRangeSelector */
              <div>
                <div className="mb-4 p-3 rounded-md bg-dc-info-bg border border-dc-info-border">
                  <div className="text-sm font-medium text-dc-info mb-1">
                    Universal Time Filter
                  </div>
                  <div className="text-xs text-dc-text-secondary">
                    This filter applies to all time dimensions in portlets it&apos;s mapped to.
                    Select a date range below to filter data across all time-based charts.
                  </div>
                </div>
                <div className="mt-4">
                  <DateRangeSelector
                    timeDimension="__universal_time__"
                    availableTimeDimensions={['__universal_time__']}
                    currentDateRange={(() => {
                      // Handle both dateRange property and values array
                      const simpleFilter = localFilter as SimpleFilter
                      if (simpleFilter.dateRange) return simpleFilter.dateRange
                      if (simpleFilter.values) {
                        // Single string value (preset like "last 30 days") - pass as string
                        if (Array.isArray(simpleFilter.values) && simpleFilter.values.length === 1 && typeof simpleFilter.values[0] === 'string') {
                          return simpleFilter.values[0]
                        }
                        return simpleFilter.values
                      }
                      return undefined
                    })()}
                    onDateRangeChange={handleDateRangeChange}
                    onTimeDimensionChange={() => {}}
                    onRemove={() => {}}
                    hideFieldSelector={true}
                    hideRemoveButton={true}
                  />
                </div>
              </div>
            ) : (
              /* Regular filter - show FilterBuilder */
              <FilterBuilder
                filters={[localFilter]}
                schema={convertToMetaResponse(schema)}
                query={{}} // Empty query object - not needed for standalone filter editing
                onFiltersChange={handleFilterBuilderChange}
              />
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-dc-border flex items-center justify-between bg-dc-surface">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium text-dc-danger hover:bg-dc-danger-bg rounded-md transition-colors"
          >
            Delete Filter
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-dc-primary hover:bg-dc-primary-hover text-dc-primary-content"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterEditModal

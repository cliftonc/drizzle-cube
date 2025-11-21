/**
 * DashboardFilterPanel Component
 *
 * Always-visible panel for dashboard-level filtering
 * - Edit mode: Allows adding/editing/removing filters
 * - View mode: Shows read-only filter chips
 */

import React, { useState, useCallback, useMemo } from 'react'
import { FunnelIcon, PlusIcon, XMarkIcon, PencilIcon, EyeIcon, EyeSlashIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import FilterBuilder from './QueryBuilder/FilterBuilder'
import CubeMetaExplorer from './QueryBuilder/CubeMetaExplorer'
import { extractDashboardFields } from '../utils/filterUtils'
import type { DashboardFilter, CubeMeta, Filter, DashboardConfig } from '../types'
import type { MetaResponse } from './QueryBuilder/types'

interface DashboardFilterPanelProps {
  dashboardFilters: DashboardFilter[]
  editable: boolean
  schema: CubeMeta | null
  dashboardConfig: DashboardConfig
  onDashboardFiltersChange: (filters: DashboardFilter[]) => void
  onSaveFilters?: () => void | Promise<void>
  selectedFilterId?: string | null
  onFilterSelect?: (filterId: string) => void
  isEditMode?: boolean
}

const DashboardFilterPanel: React.FC<DashboardFilterPanelProps> = ({
  dashboardFilters,
  editable,
  schema,
  dashboardConfig,
  onDashboardFiltersChange,
  onSaveFilters,
  selectedFilterId,
  onFilterSelect,
  isEditMode = false
}) => {
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null)
  const [showFilterBuilder, setShowFilterBuilder] = useState(false)
  const [showAllFields, setShowAllFields] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false) // For mobile collapse

  // Convert CubeMeta to MetaResponse (QueryBuilder type)
  const convertToMetaResponse = useCallback((cubeMeta: CubeMeta | null): MetaResponse | null => {
    if (!cubeMeta) return null

    return {
      cubes: cubeMeta.cubes.map(cube => ({
        name: cube.name,
        title: cube.title || cube.name,
        description: cube.description || '',
        measures: cube.measures.map(m => ({
          name: m.name,
          title: m.title,
          type: m.type,
          description: '', // CubeMetaField doesn't have description
          shortTitle: m.shortTitle
        })),
        dimensions: cube.dimensions.map(d => ({
          name: d.name,
          title: d.title,
          type: d.type,
          description: '', // CubeMetaField doesn't have description
          shortTitle: d.shortTitle
        })),
        segments: cube.segments?.map(s => ({
          name: s.name,
          title: s.title,
          type: s.type,
          description: '', // CubeMetaField doesn't have description
          shortTitle: s.shortTitle
        })) || []
      }))
    }
  }, [])

  // Extract fields used in dashboard
  const dashboardFields = useMemo(() => {
    const fields = extractDashboardFields(dashboardConfig)
    console.log('DashboardFilterPanel - Extracted dashboard fields:', {
      measures: Array.from(fields.measures),
      dimensions: Array.from(fields.dimensions),
      timeDimensions: Array.from(fields.timeDimensions),
      portletCount: dashboardConfig.portlets.length
    })
    return fields
  }, [dashboardConfig])

  // Create filtered schema showing only dashboard fields
  const filteredSchema = useMemo<MetaResponse | null>(() => {
    if (!schema) return null

    if (showAllFields) {
      return convertToMetaResponse(schema)
    }

    // Filter cubes and their fields to only show what's used in the dashboard
    const filteredCubes = schema.cubes
      .map(cube => {
        const cubeName = cube.name

        // Filter measures
        // Note: measure.name might be "totalLinesOfCode" or "Productivity.totalLinesOfCode"
        const filteredMeasures = cube.measures.filter(measure => {
          // Check if the measure name already includes the cube prefix
          const fullName = measure.name.includes('.')
            ? measure.name
            : `${cubeName}.${measure.name}`
          return dashboardFields.measures.has(fullName)
        })

        // Filter dimensions (regular + time)
        const filteredDimensions = cube.dimensions.filter(dimension => {
          // Check if the dimension name already includes the cube prefix
          const fullName = dimension.name.includes('.')
            ? dimension.name
            : `${cubeName}.${dimension.name}`
          return dashboardFields.dimensions.has(fullName) ||
                 dashboardFields.timeDimensions.has(fullName)
        })

        // Only include cube if it has any filtered fields
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

    const result = convertToMetaResponse(filteredCubeMeta)
    console.log('DashboardFilterPanel - Filtered schema:', {
      showAllFields,
      cubeCount: result?.cubes.length || 0,
      cubes: result?.cubes.map(c => ({
        name: c.name,
        measureCount: c.measures.length,
        dimensionCount: c.dimensions.length
      }))
    })
    return result
  }, [schema, dashboardFields, showAllFields, convertToMetaResponse])

  // Generate unique ID for new filters
  const generateFilterId = useCallback(() => {
    return `df_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }, [])

  // Handle adding a new filter
  const handleAddFilter = useCallback(() => {
    const newFilter: DashboardFilter = {
      id: generateFilterId(),
      label: `Filter ${dashboardFilters.length + 1}`,
      filter: {
        member: '',
        operator: 'equals',
        values: []
      }
    }
    setEditingFilterId(newFilter.id)
    setShowFilterBuilder(true)
    onDashboardFiltersChange([...dashboardFilters, newFilter])
  }, [dashboardFilters, onDashboardFiltersChange, generateFilterId])

  // Handle editing an existing filter
  const handleEditFilter = useCallback((filterId: string) => {
    setEditingFilterId(filterId)
    setShowFilterBuilder(true)
  }, [])

  // Handle removing a filter
  const handleRemoveFilter = useCallback((filterId: string) => {
    const updatedFilters = dashboardFilters.filter(df => df.id !== filterId)
    onDashboardFiltersChange(updatedFilters)
    if (editingFilterId === filterId) {
      setEditingFilterId(null)
      setShowFilterBuilder(false)
    }
  }, [dashboardFilters, editingFilterId, onDashboardFiltersChange])

  // Handle filter changes from FilterBuilder
  const handleFilterBuilderChange = useCallback((filters: Filter[]) => {
    if (!editingFilterId) return

    const updatedFilters = dashboardFilters.map(df => {
      if (df.id === editingFilterId) {
        // Update the filter - take the first filter from the array
        // (FilterBuilder works with arrays, but we store single filters in DashboardFilter)
        return {
          ...df,
          filter: filters[0] || df.filter
        }
      }
      return df
    })

    onDashboardFiltersChange(updatedFilters)
  }, [editingFilterId, dashboardFilters, onDashboardFiltersChange])

  // Handle field selection from schema explorer - update the member field of the current filter
  const handleFieldSelect = useCallback((fieldName: string) => {
    if (!editingFilterId) return

    const updatedFilters = dashboardFilters.map(df => {
      if (df.id === editingFilterId) {
        // Get the current filter
        const currentFilter = df.filter

        // If it's a simple filter, update its member
        if ('member' in currentFilter) {
          return {
            ...df,
            filter: {
              ...currentFilter,
              member: fieldName,
              values: [] // Reset values when changing field
            }
          }
        }

        // If it's a group filter, we'll just update the first simple filter we find
        // This is a simple implementation - could be enhanced later
        return df
      }
      return df
    })

    onDashboardFiltersChange(updatedFilters)
  }, [editingFilterId, dashboardFilters, onDashboardFiltersChange])

  // Handle label changes
  const handleLabelChange = useCallback((filterId: string, newLabel: string) => {
    const updatedFilters = dashboardFilters.map(df =>
      df.id === filterId ? { ...df, label: newLabel } : df
    )
    onDashboardFiltersChange(updatedFilters)
  }, [dashboardFilters, onDashboardFiltersChange])

  // Get the filter being edited
  const editingFilter = editingFilterId
    ? dashboardFilters.find(df => df.id === editingFilterId)
    : null

  // Validate a filter before saving
  const validateFilter = useCallback((filter: Filter): { isValid: boolean; message?: string } => {
    if ('member' in filter) {
      // Simple filter validation
      if (!filter.member || filter.member.trim() === '') {
        return { isValid: false, message: 'Filter must have a field selected' }
      }
      if (!filter.operator) {
        return { isValid: false, message: 'Filter must have an operator' }
      }
      return { isValid: true }
    } else if ('type' in filter && 'filters' in filter) {
      // Group filter validation - check all nested filters
      if (!filter.filters || filter.filters.length === 0) {
        return { isValid: false, message: 'Group filter must contain at least one filter' }
      }
      // Recursively validate nested filters
      for (const nestedFilter of filter.filters) {
        const result = validateFilter(nestedFilter)
        if (!result.isValid) {
          return result
        }
      }
      return { isValid: true }
    }
    return { isValid: false, message: 'Invalid filter structure' }
  }, [])

  // Close filter builder with validation
  const handleCloseFilterBuilder = useCallback(async () => {
    // Validate the filter before closing
    if (editingFilter) {
      const validation = validateFilter(editingFilter.filter)
      if (!validation.isValid) {
        if (window.confirm(`${validation.message}\n\nDo you want to close anyway? The filter may not work correctly.`)) {
          setEditingFilterId(null)
          setShowFilterBuilder(false)
        }
        return
      }
    }

    setEditingFilterId(null)
    setShowFilterBuilder(false)

    // Save filters when Done is clicked
    if (onSaveFilters) {
      try {
        await onSaveFilters()
      } catch (error) {
        console.error('Failed to save filters:', error)
      }
    }
  }, [editingFilter, validateFilter, onSaveFilters])

  // Extract the currently selected field from the editing filter to highlight it in the schema
  const selectedFieldInFilter = useMemo(() => {
    if (!editingFilter) return null

    const filter = editingFilter.filter
    if ('member' in filter && filter.member) {
      return filter.member
    }

    return null
  }, [editingFilter])

  // Render compact filter chip - just label + edit + delete
  const renderFilterChip = (dashboardFilter: DashboardFilter) => {
    const { id, label } = dashboardFilter
    const isSelected = selectedFilterId === id

    return (
      <div
        key={id}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs transition-all ${
          editable && isEditMode ? 'cursor-pointer hover:shadow-md' : ''
        }`}
        style={{
          backgroundColor: isSelected ? 'var(--dc-primary)' : 'var(--dc-surface)',
          borderColor: isSelected ? 'var(--dc-primary)' : 'var(--dc-border)',
          borderWidth: isSelected ? '2px' : '1px',
          color: isSelected ? 'white' : 'var(--dc-text)',
          boxShadow: isSelected ? '0 0 0 3px rgba(var(--dc-primary-rgb), 0.1)' : 'none'
        }}
        onClick={() => {
          if (editable && isEditMode && onFilterSelect) {
            onFilterSelect(id)
          }
        }}
      >
        <FunnelIcon
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: isSelected ? 'white' : 'var(--dc-primary)' }}
        />
        <span className="font-medium truncate">{label}</span>

        {editable && !isSelected && (
          <div className="flex items-center gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleEditFilter(id)}
              className="p-0.5 hover:bg-dc-hover rounded transition-colors"
              title="Edit filter"
            >
              <PencilIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleRemoveFilter(id)}
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

  // Don't show filter panel when not in edit mode
  if (!editable || !isEditMode) {
    return null
  }

  return (
    <div
      className="mb-4 border rounded-lg"
      style={{
        borderColor: 'var(--dc-border)',
        backgroundColor: 'var(--dc-surface)',
        boxShadow: 'var(--dc-shadow-sm)'
      }}
    >
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

          {editable && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleAddFilter()
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: 'var(--dc-primary)',
                color: 'white'
              }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
          )}
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
              No filters configured.
              {editable && ' Click "Add" to create one.'}
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
              No filters configured.
              {editable && ' Click "Add" to create one.'}
            </div>
          </div>
        )}

        {/* Add Button Section */}
        {editable && (
          <button
            onClick={handleAddFilter}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:opacity-80 shrink-0"
            style={{
              backgroundColor: 'var(--dc-primary)',
              color: 'white'
            }}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Filter Builder Modal */}
      {editable && showFilterBuilder && editingFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
          <div className="rounded-lg shadow-xl max-w-7xl w-full h-[95vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Filter Label
                </label>
                <input
                  type="text"
                  value={editingFilter.label}
                  onChange={(e) => handleLabelChange(editingFilter.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Enter filter label"
                />
              </div>
              <button
                onClick={handleCloseFilterBuilder}
                className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-700 dark:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Two Column Layout */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left Column - Schema Explorer */}
              <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Available Fields
                    </h3>
                    <button
                      onClick={() => setShowAllFields(!showAllFields)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                      title={showAllFields ? 'Show dashboard fields only' : 'Show all fields'}
                    >
                      {showAllFields ? (
                        <>
                          <EyeSlashIcon className="w-3.5 h-3.5" />
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
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
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
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
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

              {/* Right Column - Filter Builder */}
              <div className="flex-1 overflow-auto px-6 py-4 bg-gray-50 dark:bg-gray-800">
                <FilterBuilder
                  filters={[editingFilter.filter]}
                  schema={convertToMetaResponse(schema)}
                  query={{}} // Empty query object - not needed for standalone filter editing
                  onFiltersChange={handleFilterBuilderChange}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
              <button
                onClick={() => handleRemoveFilter(editingFilter.id)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                Delete Filter
              </button>
              <button
                onClick={handleCloseFilterBuilder}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-blue-600 hover:bg-blue-700 text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardFilterPanel

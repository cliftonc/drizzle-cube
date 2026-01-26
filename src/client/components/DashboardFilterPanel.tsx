/**
 * DashboardFilterPanel Component
 *
 * Orchestrates dashboard-level filtering UI
 * - Edit mode: Shows filter chips with edit/delete actions
 * - View mode: Shows interactive read-only filters
 *
 * Pattern: Simplified coordination layer (matches portlet editing pattern)
 * - No local editing state (modal owns all edit state)
 * - Just tracks which filter is being edited and modal visibility
 * - Delegates to FilterEditModal for all editing logic
 */

import React, { useState, useCallback } from 'react'
import FilterEditModal from './DashboardFilters/FilterEditModal'
import EditModeFilterList from './DashboardFilters/EditModeFilterList'
import CompactFilterBar from './DashboardFilters/CompactFilterBar'
import type { DashboardFilter, CubeMeta, DashboardConfig } from '../types'
import type { MetaResponse } from '../shared/types'

interface DashboardFilterPanelProps {
  dashboardFilters: DashboardFilter[]
  editable: boolean
  schema: CubeMeta | null
  dashboardConfig: DashboardConfig
  onDashboardFiltersChange: (filters: DashboardFilter[]) => void
  onSaveFilters?: (filters: DashboardFilter[]) => void | Promise<void>
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
  // Track which filter is being edited and modal visibility (no local editing state)
  const [editingFilter, setEditingFilter] = useState<DashboardFilter | null>(null)
  const [showFilterBuilder, setShowFilterBuilder] = useState(false)

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
          description: '',
          shortTitle: m.shortTitle
        })),
        dimensions: cube.dimensions.map(d => ({
          name: d.name,
          title: d.title,
          type: d.type,
          description: '',
          shortTitle: d.shortTitle
        })),
        segments: cube.segments?.map(s => ({
          name: s.name,
          title: s.title,
          type: s.type,
          description: '',
          shortTitle: s.shortTitle
        })) || []
      }))
    }
  }, [])

  // Generate unique ID for new filters
  const generateFilterId = useCallback(() => {
    return `df_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }, [])

  // Handle adding a new filter - create temporary filter for modal
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
    setEditingFilter(newFilter)
    setShowFilterBuilder(true)
  }, [dashboardFilters.length, generateFilterId])

  // Handle adding a universal time filter - applies to all time dimensions
  // Creates filter directly without opening modal (fixed name, user just sets date range in view mode)
  const handleAddTimeFilter = useCallback(() => {
    const newFilter: DashboardFilter = {
      id: generateFilterId(),
      label: 'Date Range Filter',
      isUniversalTime: true,
      filter: {
        member: '__universal_time__', // Placeholder, not used in merge logic
        operator: 'inDateRange',
        values: ['last 30 days']
      }
    }
    // Add directly to filters without opening modal
    const updatedFilters = [...dashboardFilters, newFilter]
    onDashboardFiltersChange(updatedFilters)
  }, [generateFilterId, dashboardFilters, onDashboardFiltersChange])

  // Handle editing an existing filter - just open modal with filter
  const handleEditFilter = useCallback((filterId: string) => {
    const filterToEdit = dashboardFilters.find(df => df.id === filterId)
    if (filterToEdit) {
      setEditingFilter(filterToEdit)
      setShowFilterBuilder(true)
    }
  }, [dashboardFilters])

  // Handle removing a filter - simple filter list update
  const handleRemoveFilter = useCallback((filterId: string) => {
    const updatedFilters = dashboardFilters.filter(df => df.id !== filterId)
    onDashboardFiltersChange(updatedFilters)

    // Close modal if we're deleting the filter being edited
    if (editingFilter?.id === filterId) {
      setEditingFilter(null)
      setShowFilterBuilder(false)
    }
  }, [dashboardFilters, editingFilter, onDashboardFiltersChange])

  // Handle save from modal - update or add filter and save
  const handleSaveFilter = useCallback(async (filterData: DashboardFilter) => {
    // Check if this is a new filter (not in current list) or an update
    const existingFilterIndex = dashboardFilters.findIndex(f => f.id === filterData.id)

    let updatedFilters: DashboardFilter[]
    if (existingFilterIndex >= 0) {
      // Update existing filter
      updatedFilters = dashboardFilters.map(f =>
        f.id === filterData.id ? filterData : f
      )
    } else {
      // Add new filter
      updatedFilters = [...dashboardFilters, filterData]
    }

    // Update dashboard state
    onDashboardFiltersChange(updatedFilters)

    // Trigger save if callback provided
    if (onSaveFilters) {
      try {
        await onSaveFilters(updatedFilters)
      } catch (error) {
        console.error('Failed to save filters:', error)
        throw error // Re-throw so modal can handle it
      }
    }
  }, [dashboardFilters, onDashboardFiltersChange, onSaveFilters])

  // Handle modal close - just clean up state
  const handleCloseFilterBuilder = useCallback(() => {
    setEditingFilter(null)
    setShowFilterBuilder(false)
  }, [])

  // Hide filter panel completely when not editable (fully embedded mode without filter support)
  if (!editable) {
    return null
  }

  // Hide if no filters exist and not in edit mode (nothing to show)
  if (!isEditMode && dashboardFilters.length === 0) {
    return null
  }

  return (
    <div className="dc:mb-4">
      {/* Edit Mode - Full filter management with chips and actions */}
      {isEditMode ? (
        <div
          className="dc:border dc:rounded-lg"
          style={{
            borderColor: 'var(--dc-border)',
            backgroundColor: 'var(--dc-surface)',
            boxShadow: 'var(--dc-shadow-sm)'
          }}
        >
          <EditModeFilterList
            dashboardFilters={dashboardFilters}
            onAddFilter={handleAddFilter}
            onAddTimeFilter={handleAddTimeFilter}
            onEditFilter={handleEditFilter}
            onRemoveFilter={handleRemoveFilter}
            selectedFilterId={selectedFilterId}
            onFilterSelect={onFilterSelect}
          />
        </div>
      ) : (
        /* View Mode - Compact Mixpanel-style filter bar */
        <CompactFilterBar
          dashboardFilters={dashboardFilters}
          schema={schema}
          isEditMode={false}
          onDashboardFiltersChange={onDashboardFiltersChange}
          onAddFilter={handleAddFilter}
          onEditFilter={handleEditFilter}
          onRemoveFilter={handleRemoveFilter}
        />
      )}

      {/* Filter Edit Modal */}
      {editable && showFilterBuilder && editingFilter && (
        <FilterEditModal
          filter={editingFilter}
          schema={schema}
          dashboardConfig={dashboardConfig}
          isOpen={showFilterBuilder}
          onSave={handleSaveFilter}
          onClose={handleCloseFilterBuilder}
          onDelete={() => handleRemoveFilter(editingFilter.id)}
          convertToMetaResponse={convertToMetaResponse}
        />
      )}
    </div>
  )
}

export default DashboardFilterPanel

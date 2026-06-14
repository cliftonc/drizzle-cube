/**
 * CompactFilterBar Component
 *
 * A Mixpanel-inspired compact horizontal filter bar for dashboards.
 * Provides quick preset date selection, custom date options, XTD options,
 * and compact non-date filter display.
 *
 * State, derived values, and handlers live in `useCompactFilterBar`; the
 * desktop/mobile layouts live in `CompactFilterBarParts`. This file is the
 * layout shell.
 */

import React from 'react'
import type { DashboardFilter, CubeMeta } from '../../types'
import { useCompactFilterBar } from './useCompactFilterBar'
import { DesktopLayout, MobileLayout, type CompactFilterBarViewProps } from './CompactFilterBarParts'

interface CompactFilterBarProps {
  dashboardFilters: DashboardFilter[]
  schema: CubeMeta | null
  isEditMode: boolean
  onDashboardFiltersChange: (filters: DashboardFilter[]) => void
  onAddFilter?: () => void
  onEditFilter?: (filterId: string) => void
  onRemoveFilter?: (filterId: string) => void
}

const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  dashboardFilters,
  schema,
  isEditMode,
  onDashboardFiltersChange,
  onAddFilter,
  onEditFilter,
  onRemoveFilter
}) => {
  const bar = useCompactFilterBar(dashboardFilters, onDashboardFiltersChange)

  // If no filters and not in edit mode, don't show anything
  if (!isEditMode && bar.localFilters.length === 0) {
    return null
  }

  const viewProps: CompactFilterBarViewProps = {
    schema,
    isEditMode,
    onAddFilter,
    onEditFilter,
    onRemoveFilter,
    currentDateRange: bar.currentDateRange as string | string[] | null,
    activePresetId: bar.activePresetId as string | null,
    activeXTDId: bar.activeXTDId,
    nonDateFilters: bar.nonDateFilters,
    dateRangeTooltip: bar.dateRangeTooltip as string | null,
    showCustomDropdown: bar.showCustomDropdown,
    setShowCustomDropdown: bar.setShowCustomDropdown,
    showXTDDropdown: bar.showXTDDropdown,
    setShowXTDDropdown: bar.setShowXTDDropdown,
    customButtonRef: bar.customButtonRef,
    xtdButtonRef: bar.xtdButtonRef,
    handlePresetSelect: bar.handlePresetSelect,
    handleXTDSelect: bar.handleXTDSelect,
    handleCustomDateSelect: bar.handleCustomDateSelect,
    handleFilterChange: bar.handleFilterChange
  }

  return (
    <div
      className="dc:border dc:rounded-lg"
      style={{
        borderColor: 'var(--dc-border)',
        backgroundColor: 'var(--dc-surface)'
      }}
    >
      <DesktopLayout {...viewProps} />
      <MobileLayout {...viewProps} />
    </div>
  )
}

export default CompactFilterBar

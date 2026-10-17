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

import React, { useId } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import type { DashboardFilter, CubeMeta } from '../../types.js'
import { useCompactFilterBar } from './useCompactFilterBar.js'
import { DesktopLayout, MobileLayout, type CompactFilterBarViewProps } from './CompactFilterBarParts.js'

interface CompactFilterBarProps {
  dashboardFilters: DashboardFilter[]
  readOnlyFilterIds?: string[]
  schema: CubeMeta | null
  isEditMode: boolean
  allowDateFilterCreation?: boolean
  onDashboardFiltersChange: (filters: DashboardFilter[], changedFilterId: string) => void
  onAddFilter?: () => void
  onEditFilter?: (filterId: string) => void
  onRemoveFilter?: (filterId: string) => void
}

const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  dashboardFilters,
  readOnlyFilterIds = [],
  schema,
  isEditMode,
  allowDateFilterCreation,
  onDashboardFiltersChange,
  onAddFilter,
  onEditFilter,
  onRemoveFilter
}) => {
  const { t } = useTranslation()
  const readOnlyDescriptionId = useId()
  const bar = useCompactFilterBar(dashboardFilters, onDashboardFiltersChange, allowDateFilterCreation)

  // If no filters and not in edit mode, don't show anything
  if (!isEditMode && dashboardFilters.length === 0) {
    return null
  }

  const viewProps: CompactFilterBarViewProps = {
    schema,
    readOnlyFilterIds,
    readOnlyDescriptionId,
    dateReadOnly: !!bar.dateControlFilter && readOnlyFilterIds.includes(bar.dateControlFilter.id),
    showDateControls: bar.showDateControls,
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
      {readOnlyFilterIds.length > 0 && (
        <span id={readOnlyDescriptionId} className="dc:sr-only">{t('dashboard.filterControlledByHost')}</span>
      )}
      <DesktopLayout {...viewProps} />
      <MobileLayout {...viewProps} />
    </div>
  )
}

export default CompactFilterBar

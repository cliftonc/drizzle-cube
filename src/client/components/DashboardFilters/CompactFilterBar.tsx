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

import React, { useEffect, useState } from 'react'
import type { DashboardFilter, CubeMeta } from '../../types.js'
import { useCompactFilterBar } from './useCompactFilterBar.js'
import { DesktopLayout, MobileLayout, type CompactFilterBarViewProps } from './CompactFilterBarParts.js'

interface CompactFilterBarProps {
  dashboardFilters: DashboardFilter[]
  schema: CubeMeta | null
  isEditMode: boolean
  onDashboardFiltersChange: (filters: DashboardFilter[]) => void
  onAddFilter?: () => void
  onEditFilter?: (filterId: string) => void
  onRemoveFilter?: (filterId: string) => void
}

/**
 * Mount ONE layout, chosen by media query, instead of rendering both and
 * hiding one with CSS. The layouts share the dropdown open-state, so mounting
 * both used to mount two CustomDate/XTD dropdowns at once — and each
 * dropdown's document-level outside-click handler treated clicks inside the
 * *other* instance as "outside", closing the shared state on any interaction.
 * (768px matches the dc:md: breakpoint previously used to swap them.)
 */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return isDesktop
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
  const isDesktop = useIsDesktop()

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
      {isDesktop ? <DesktopLayout {...viewProps} /> : <MobileLayout {...viewProps} />}
    </div>
  )
}

export default CompactFilterBar

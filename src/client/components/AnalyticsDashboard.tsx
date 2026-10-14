/**
 * Analytics Dashboard Component
 * Main dashboard container that uses CubeProvider context
 * Minimal dependencies, designed to be embedded in existing apps
 */

import { useMemo } from 'react'
import DashboardGrid from './DashboardGrid.js'
import { useCubeFeatures, useCubeMeta } from '../providers/CubeProvider.js'
import { getColorPalette } from '../utils/colorPalettes.js'
import { useDirtyStateTracking } from '../hooks/useDirtyStateTracking.js'
import { useDashboardFilters } from '../hooks/useDashboardFilters.js'
import type { AnalyticsDashboardProps, DashboardConfig } from '../types.js'

export default function AnalyticsDashboard({
  config,
  editable = false,
  dashboardFilters: propDashboardFilters,
  onDashboardFiltersChange: onPropFiltersChange,
  loadingComponent,
  onConfigChange,
  onSave,
  onSaveThumbnail,
  onDirtyStateChange,
  dashboardMeta,
  onDashboardMetaChange,
  onPortletExpand
}: AnalyticsDashboardProps) {
  // Get cube metadata for filter building
  const { meta } = useCubeMeta()
  const { dashboardModes } = useCubeFeatures()

  // Track dirty state and wrap save/change handlers
  const {
    handleConfigChange: handleConfigChangeWithDirtyTracking,
    handleSave: handleSaveWithDirtyTracking,
  } = useDirtyStateTracking<DashboardConfig>({
    initialConfig: config,
    onConfigChange,
    onSave,
    onDirtyStateChange,
  })

  const { dashboardFilters, onDashboardFiltersChange, readOnlyFilterIds } = useDashboardFilters(
    config,
    propDashboardFilters,
    onConfigChange ? handleConfigChangeWithDirtyTracking : undefined,
    onPropFiltersChange
  )

  // Resolve complete palette object based on config
  const colorPalette = useMemo(() => {
    const paletteName = config.colorPalette
    return getColorPalette(paletteName)
  }, [config.colorPalette])

  return (
    <div className="dc:w-full">
      {/* Dashboard Grid (owns its store via DashboardProvider, includes filter panel) */}
      <DashboardGrid
        config={config}
        editable={editable}
        dashboardFilters={dashboardFilters}
        readOnlyFilterIds={readOnlyFilterIds}
        loadingComponent={loadingComponent}
        onConfigChange={handleConfigChangeWithDirtyTracking}
        onSave={handleSaveWithDirtyTracking}
        onSaveThumbnail={onSaveThumbnail}
        colorPalette={colorPalette}
        schema={meta}
        dashboardModes={dashboardModes}
        onDashboardFiltersChange={onDashboardFiltersChange}
        dashboardMeta={dashboardMeta}
        onDashboardMetaChange={onDashboardMetaChange}
        onPortletExpand={onPortletExpand}
      />
    </div>
  )
}

/**
 * Analytics Dashboard Component
 * Main dashboard container that uses CubeProvider context
 * Minimal dependencies, designed to be embedded in existing apps
 */

import { useCallback, useMemo } from 'react'
import DashboardGrid from './DashboardGrid'
import { useCubeFeatures, useCubeMeta } from '../providers/CubeProvider'
import { DashboardStoreProvider } from '../stores/dashboardStore'
import { getColorPalette } from '../utils/colorPalettes'
import { useDirtyStateTracking } from '../hooks/useDirtyStateTracking'
import type { AnalyticsDashboardProps, DashboardConfig, DashboardFilter } from '../types'

export default function AnalyticsDashboard({
  config,
  editable = false,
  dashboardFilters: propDashboardFilters,
  loadingComponent,
  onConfigChange,
  onSave,
  onSaveThumbnail,
  onDirtyStateChange
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

  // Merge programmatic filters (props) with config filters by ID
  // Config provides structure/metadata, props provide value overrides
  const mergedDashboardFilters = useMemo<DashboardFilter[]>(() => {
    const configFilters = config.filters || []
    const propFilters = propDashboardFilters || []

    // If no prop filters, use config filters as-is
    if (propFilters.length === 0) {
      return configFilters
    }

    // If no config filters, use prop filters as-is
    if (configFilters.length === 0) {
      return propFilters
    }

    // Merge by ID: config filters provide structure, prop filters provide values
    const mergedFilters: DashboardFilter[] = configFilters.map(configFilter => {
      // Find matching prop filter by ID
      const propFilter = propFilters.find(pf => pf.id === configFilter.id)

      if (propFilter) {
        // Merge: preserve config metadata, use prop filter values
        return {
          ...configFilter,           // Preserve id, label, isUniversalTime from config
          filter: propFilter.filter  // Use filter values from prop override
        }
      }

      // No override for this filter, use config as-is
      return configFilter
    })

    // Add any prop filters that don't exist in config (new filters)
    const configIds = new Set(configFilters.map(cf => cf.id))
    const newFilters = propFilters.filter(pf => !configIds.has(pf.id))

    return [...mergedFilters, ...newFilters]
  }, [config.filters, propDashboardFilters])

  // Handle dashboard filter changes
  const handleDashboardFiltersChange = useCallback((filters: DashboardFilter[]) => {
    // Only update config if we're not using programmatic filters
    if (!propDashboardFilters || propDashboardFilters.length === 0) {
      const updatedConfig = {
        ...config,
        filters
      }
      handleConfigChangeWithDirtyTracking(updatedConfig)
    } else {
      console.warn('Dashboard filters are controlled via props - config changes ignored')
    }
  }, [config, propDashboardFilters, handleConfigChangeWithDirtyTracking])

  // Resolve complete palette object based on config
  const colorPalette = useMemo(() => {
    const paletteName = config.colorPalette
    return getColorPalette(paletteName)
  }, [config.colorPalette])

  return (
    <DashboardStoreProvider>
      <div className="w-full">
        {/* Dashboard Grid (now includes filter panel) */}
        <DashboardGrid
          config={config}
          editable={editable}
          dashboardFilters={mergedDashboardFilters}
          loadingComponent={loadingComponent}
          onConfigChange={handleConfigChangeWithDirtyTracking}
          onSave={handleSaveWithDirtyTracking}
          onSaveThumbnail={onSaveThumbnail}
          colorPalette={colorPalette}
          schema={meta}
          dashboardModes={dashboardModes}
          onDashboardFiltersChange={handleDashboardFiltersChange}
        />
      </div>
    </DashboardStoreProvider>
  )
}

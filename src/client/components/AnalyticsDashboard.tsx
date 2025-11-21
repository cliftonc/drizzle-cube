/**
 * Analytics Dashboard Component
 * Main dashboard container that uses CubeProvider context
 * Minimal dependencies, designed to be embedded in existing apps
 */

import { useCallback, useRef, useMemo } from 'react'
import DashboardGrid from './DashboardGrid'
import { useCubeContext } from '../providers/CubeProvider'
import { getColorPalette } from '../utils/colorPalettes'
import type { AnalyticsDashboardProps, DashboardConfig, DashboardFilter } from '../types'

export default function AnalyticsDashboard({
  config,
  editable = false,
  dashboardFilters: propDashboardFilters,
  onConfigChange,
  onSave,
  onDirtyStateChange
}: AnalyticsDashboardProps) {
  // Get cube metadata for filter building
  const { meta } = useCubeContext()

  // Track initial config to prevent saves during initial load
  const initialConfigRef = useRef(config)
  const hasConfigChangedFromInitial = useRef(false)

  // Merge programmatic filters (props) with config filters
  // Programmatic filters take precedence
  const mergedDashboardFilters = useMemo<DashboardFilter[]>(() => {
    const configFilters = config.filters || []
    const propFilters = propDashboardFilters || []

    // If we have prop filters, use only those (they override config)
    if (propFilters.length > 0) {
      return propFilters
    }

    // Otherwise use config filters
    return configFilters
  }, [config.filters, propDashboardFilters])

  // Enhanced save handler that tracks dirty state and prevents saves during initial load
  const handleSaveWithDirtyTracking = useCallback(async (config: DashboardConfig) => {
    // Don't save if this config hasn't actually changed from the initial load
    if (!hasConfigChangedFromInitial.current) {
      return // Prevent saves during initial load/responsive changes
    }
    
    if (onDirtyStateChange) {
      onDirtyStateChange(true) // Mark as dirty when save starts
    }
    
    try {
      if (onSave) {
        await onSave(config)
      }
      
      // Update our reference point after successful save
      initialConfigRef.current = config
      
      // Mark as clean after successful save
      if (onDirtyStateChange) {
        onDirtyStateChange(false)
      }
    } catch (error) {
      // Keep dirty state if save failed
      console.error('Save failed:', error)
      throw error
    }
  }, [onSave, onDirtyStateChange])

  // Enhanced config change handler that marks as dirty (only after initial load)
  const handleConfigChangeWithDirtyTracking = useCallback((config: DashboardConfig) => {
    if (onConfigChange) {
      onConfigChange(config)
    }
    
    // Check if this is a meaningful change from the initial config
    const configString = JSON.stringify(config)
    const initialConfigString = JSON.stringify(initialConfigRef.current)
    
    if (configString !== initialConfigString) {
      hasConfigChangedFromInitial.current = true
      
      if (onDirtyStateChange) {
        onDirtyStateChange(true)
      }
    }
  }, [onConfigChange, onDirtyStateChange])

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
    <div className="w-full">
      {/* Dashboard Grid (now includes filter panel) */}
      <DashboardGrid
        config={config}
        editable={editable}
        dashboardFilters={mergedDashboardFilters}
        onConfigChange={handleConfigChangeWithDirtyTracking}
        onSave={handleSaveWithDirtyTracking}
        colorPalette={colorPalette}
        schema={meta}
        onDashboardFiltersChange={handleDashboardFiltersChange}
      />
    </div>
  )
}
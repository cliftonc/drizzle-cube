/**
 * Analytics Dashboard Component
 * Main dashboard container that uses CubeProvider context
 * Minimal dependencies, designed to be embedded in existing apps
 */

import { useCallback, useRef } from 'react'
import DashboardGrid from './DashboardGrid'
import type { AnalyticsDashboardProps, DashboardConfig } from '../types'

export default function AnalyticsDashboard({
  config,
  editable = false,
  onConfigChange,
  onSave,
  onDirtyStateChange
}: AnalyticsDashboardProps) {
  // Track initial config to prevent saves during initial load
  const initialConfigRef = useRef(config)
  const hasConfigChangedFromInitial = useRef(false)

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

  return (
    <div className="w-full">
      <DashboardGrid 
        config={config}
        editable={editable}
        onConfigChange={handleConfigChangeWithDirtyTracking}
        onSave={handleSaveWithDirtyTracking}
      />
    </div>
  )
}
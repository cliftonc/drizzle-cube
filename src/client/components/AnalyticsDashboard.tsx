/**
 * Analytics Dashboard Component
 * Main dashboard container with configurable API endpoint
 * Minimal dependencies, designed to be embedded in existing apps
 */

import { useMemo, useCallback } from 'react'
import { CubeProvider } from '../providers/CubeProvider'
import { createCubeClient } from '../client/CubeClient'
import DashboardGrid from './DashboardGrid'
import type { AnalyticsDashboardProps, DashboardConfig } from '../types'

export default function AnalyticsDashboard({
  config,
  apiUrl = '/cubejs-api/v1',
  apiOptions = {},
  editable = false,
  onConfigChange,
  onSave,
  onDirtyStateChange
}: AnalyticsDashboardProps) {
  // Create Cube.js client instance
  const cubeApi = useMemo(() => {
    return createCubeClient(
      undefined, // No token - assumes session auth
      { 
        apiUrl,
        ...apiOptions
      }
    )
  }, [apiUrl, apiOptions])

  // Enhanced save handler that tracks dirty state
  const handleSaveWithDirtyTracking = useCallback(async (config: DashboardConfig) => {
    if (onDirtyStateChange) {
      onDirtyStateChange(true) // Mark as dirty when save starts
    }
    
    try {
      if (onSave) {
        await onSave(config)
      }
      
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

  // Enhanced config change handler that marks as dirty
  const handleConfigChangeWithDirtyTracking = useCallback((config: DashboardConfig) => {
    if (onConfigChange) {
      onConfigChange(config)
    }
    
    if (onDirtyStateChange) {
      onDirtyStateChange(true)
    }
  }, [onConfigChange, onDirtyStateChange])

  return (
    <CubeProvider cubeApi={cubeApi}>
      <div className="w-full">
        <DashboardGrid 
          config={config}
          editable={editable}
          onConfigChange={handleConfigChangeWithDirtyTracking}
          onSave={handleSaveWithDirtyTracking}
          apiUrl={apiUrl}
        />
      </div>
    </CubeProvider>
  )
}
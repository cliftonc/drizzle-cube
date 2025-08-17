/**
 * Analytics Dashboard Component
 * Main dashboard container with configurable API endpoint
 * Minimal dependencies, designed to be embedded in existing apps
 */

import { useMemo } from 'react'
import { CubeProvider } from '../providers/CubeProvider'
import { createCubeClient } from '../client/CubeClient'
import DashboardGrid from './DashboardGrid'
import type { AnalyticsDashboardProps } from '../types'

export default function AnalyticsDashboard({
  config,
  apiUrl = '/cubejs-api/v1',
  apiOptions = {},
  editable = false,
  onConfigChange
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

  return (
    <CubeProvider cubeApi={cubeApi}>
      <div className="w-full">
        <DashboardGrid 
          config={config}
          editable={editable}
          onConfigChange={onConfigChange}
        />
      </div>
    </CubeProvider>
  )
}
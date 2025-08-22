'use client'

import { useState, useEffect } from 'react'
import { AnalyticsDashboard } from 'drizzle-cube/client'
import { dashboardConfig as defaultDashboardConfig } from '@/lib/dashboard-config'

export default function DashboardTab() {
  const [dashboardConfig, setDashboardConfig] = useState(defaultDashboardConfig)
  const [isEditing, setIsEditing] = useState(false)

  // Load dashboard config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('nextjs-dashboard-config')
    if (savedConfig) {
      try {
        setDashboardConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error('Failed to load dashboard config from localStorage:', error)
      }
    }
  }, [])

  // Save dashboard config to localStorage
  const saveDashboardConfig = (newConfig: any) => {
    setDashboardConfig(newConfig)
    localStorage.setItem('nextjs-dashboard-config', JSON.stringify(newConfig))
  }

  // Reset to default configuration
  const resetDashboard = () => {
    setDashboardConfig(defaultDashboardConfig)
    localStorage.removeItem('nextjs-dashboard-config')
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium text-gray-900">
            Analytics Dashboard
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                isEditing
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {isEditing ? 'Done Editing' : 'Edit Dashboard'}
            </button>
            <button
              onClick={resetDashboard}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
              title="Reset to default"
            >
              Reset
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {isEditing 
            ? 'Edit mode: Drag charts to rearrange, resize using corner handles, or edit chart settings. Changes are saved automatically to localStorage.'
            : 'View employee and productivity metrics across departments. Use the controls above to customize layout and charts.'
          }
        </p>
      </div>
      <AnalyticsDashboard 
        config={dashboardConfig}
        apiUrl="/api/cubejs-api/v1"
        editable={isEditing}
        onConfigChange={saveDashboardConfig}
      />
    </div>
  )
}
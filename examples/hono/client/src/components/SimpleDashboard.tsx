import React from 'react'
import { CubeProvider, createCubeClient, AnalyticsPortlet } from 'drizzle-cube/client'
import type { DashboardConfig } from '../types'

interface SimpleDashboardProps {
  config: DashboardConfig
  apiUrl?: string
}

export default function SimpleDashboard({ config, apiUrl = '/cubejs-api/v1' }: SimpleDashboardProps) {
  const cubeApi = React.useMemo(() => {
    return createCubeClient(undefined, { apiUrl })
  }, [apiUrl])

  if (!config.portlets || config.portlets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No portlets configured
      </div>
    )
  }

  return (
    <CubeProvider cubeApi={cubeApi}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.portlets.map((portlet) => (
          <div key={portlet.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">{portlet.title}</h3>
            <div style={{ height: '300px' }}>
              <AnalyticsPortlet
                query={portlet.query}
                chartType={portlet.chartType}
                chartConfig={portlet.chartConfig}
                displayConfig={portlet.displayConfig}
                height="100%"
                title={portlet.title}
              />
            </div>
          </div>
        ))}
      </div>
    </CubeProvider>
  )
}
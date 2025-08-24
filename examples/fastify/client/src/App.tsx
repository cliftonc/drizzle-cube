import { useState, useEffect } from 'react'
import { QueryBuilder, AnalyticsDashboard, CubeProvider } from 'drizzle-cube/client'
import { dashboardConfig as defaultDashboardConfig } from './dashboard-config'

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'query'>('dashboard')
  const [dashboardConfig, setDashboardConfig] = useState(defaultDashboardConfig)

  // Load dashboard config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('fastify-dashboard-config')
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
    localStorage.setItem('fastify-dashboard-config', JSON.stringify(newConfig))
  }

  // Reset to default configuration
  const resetDashboard = () => {
    setDashboardConfig(defaultDashboardConfig)
    localStorage.removeItem('fastify-dashboard-config')
  }
  
  return (
    <CubeProvider 
      apiOptions={{ apiUrl: '/cubejs-api/v1' }}
      features={{ enableAI: false }}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Drizzle Cube Fastify Example
              </h1>
              <p className="text-sm text-gray-500">
                Simple analytics dashboard with Fastify backend
              </p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('query')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'query'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Query Builder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-medium text-gray-900">
                  Analytics Dashboard
                </h2>
                <button
                  onClick={resetDashboard}
                  className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                  title="Reset to default"
                >
                  Reset
                </button>
              </div>
              <p className="text-sm text-gray-600">
                View employee and productivity metrics across departments. Use the Edit Mode toggle to customize layout and charts.
              </p>
            </div>
            <AnalyticsDashboard 
              config={dashboardConfig}
              editable={true}
              onConfigChange={saveDashboardConfig}
            />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Query Builder
              </h2>
              <p className="text-sm text-gray-600">
                Build custom queries using the interactive query builder
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border">
              <QueryBuilder />
            </div>
          </div>
        )}
      </div>
      </div>
    </CubeProvider>
  )
}
/**
 * Analytics Portlet Component
 * Simplified version with minimal dependencies
 */

import { useMemo, useState, forwardRef, useImperativeHandle } from 'react'
import { useCubeQuery } from '../hooks/useCubeQuery'
import ChartErrorBoundary from './ChartErrorBoundary'
import { 
  RechartsBarChart, 
  RechartsLineChart, 
  RechartsAreaChart, 
  RechartsPieChart, 
  RechartsScatterChart, 
  RechartsRadarChart, 
  RechartsRadialBarChart, 
  RechartsTreeMapChart, 
  DataTable 
} from './charts'
import type { AnalyticsPortletProps } from '../types'


interface AnalyticsPortletRef {
  refresh: () => void
}

const AnalyticsPortlet = forwardRef<AnalyticsPortletRef, AnalyticsPortletProps>(({ 
  query, 
  chartType, 
  chartConfig, 
  displayConfig, 
  height = 300, 
  title: _title 
}, ref) => {
  const [refreshCounter, setRefreshCounter] = useState(0)

  // Parse query from JSON string and include refresh counter to force re-query
  const queryObject = useMemo(() => {
    try {
      const parsed = JSON.parse(query)
      const result = {
        ...parsed,
        __refresh_counter: refreshCounter
      }
      return result
    } catch (e) {
      console.error('AnalyticsPortlet: Invalid query JSON:', e)
      return null
    }
  }, [query, refreshCounter])

  // Use the cube React hook
  const { resultSet, isLoading, error } = useCubeQuery(queryObject, {
    skip: !queryObject,
    resetResultSetOnChange: true
  })

  // Expose refresh function through ref
  useImperativeHandle(ref, () => ({
    refresh: () => {
      setRefreshCounter(prev => prev + 1)
    }
  }), [])

  // Validate that chartConfig is provided
  if (!chartConfig) {
    return (
      <div className="flex items-center justify-center w-full text-red-500" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Error</div>
          <div className="text-xs">chartConfig is required but not provided</div>
        </div>
      </div>
    )
  }

  if (isLoading || (queryObject && !resultSet && !error)) {
    return (
      <div className="flex items-center justify-center w-full" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded" style={{ height }}>
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <span className="text-red-600 font-medium text-sm">⚠️ Query Error</span>
            <button
              onClick={() => setRefreshCounter(prev => prev + 1)}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="text-xs text-red-700 bg-white p-2 rounded border">
            {error.message || error.toString()}
          </div>
        </div>
        
        <div className="space-y-2 text-xs">
          <details>
            <summary className="cursor-pointer text-gray-700 font-medium">Original Query</summary>
            <pre className="mt-1 bg-blue-50 p-2 rounded text-xs overflow-auto max-h-20">
              {query}
            </pre>
          </details>
          
          <details>
            <summary className="cursor-pointer text-gray-700 font-medium">Chart Config</summary>
            <pre className="mt-1 bg-purple-50 p-2 rounded text-xs overflow-auto max-h-20">
              {JSON.stringify({
                chartType,
                chartConfig,
                displayConfig
              }, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    )
  }

  if (!resultSet || !queryObject) {
    return (
      <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs">Invalid query or no results</div>
        </div>
      </div>
    )
  }

  // Get data based on chart type needs
  const getData = () => {
    switch (chartType) {
      case 'pie':
      case 'table':
        return resultSet.tablePivot()
      default:
        return resultSet.rawData()
    }
  }

  const data = getData()

  // Render appropriate chart component
  const renderChart = () => {
    try {
      switch (chartType) {
        case 'bar':
          return (
            <RechartsBarChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={height}
            />
          )
        case 'line':
          return (
            <RechartsLineChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={height}
            />
          )
        case 'area':
          return (
            <RechartsAreaChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={height}
            />
          )
        case 'pie':
          return (
            <RechartsPieChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={height}
            />
          )
        case 'scatter':
          return (
            <RechartsScatterChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={height}
            />
          )
        case 'radar':
          return (
            <RechartsRadarChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={height}
            />
          )
        case 'radialBar':
          return (
            <RechartsRadialBarChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={height}
            />
          )
        case 'treemap':
          return (
            <RechartsTreeMapChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={height}
            />
          )
        case 'table':
          return (
            <DataTable
              data={data}
              queryObject={queryObject}
              height={height}
            />
          )
        default:
          return (
            <div className="flex items-center justify-center w-full" style={{ height }}>
              <div className="text-center text-gray-500">
                <div className="text-sm font-semibold mb-1">Unsupported chart type</div>
                <div className="text-xs">{chartType}</div>
              </div>
            </div>
          )
      }
    } catch (error) {
      console.error('Chart rendering error:', error)
      return (
        <div className="flex items-center justify-center w-full text-red-500 p-4" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">Error rendering chart</div>
            <div className="text-xs">{error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>
        </div>
      )
    }
  }

  return (
    <ChartErrorBoundary 
      portletTitle={_title}
      portletConfig={{
        chartType,
        chartConfig,
        displayConfig,
        height
      }}
      cubeQuery={query}
    >
      <div className="w-full" style={{ height }}>
        {renderChart()}
      </div>
    </ChartErrorBoundary>
  )
})

AnalyticsPortlet.displayName = 'AnalyticsPortlet'

export default AnalyticsPortlet
/**
 * Analytics Portlet Component
 * Simplified version with minimal dependencies
 */

import { useMemo, useState, forwardRef, useImperativeHandle } from 'react'
import { useCubeQuery } from '../hooks/useCubeQuery'
import { 
  BarChart, 
  LineChart, 
  AreaChart, 
  PieChart, 
  ScatterChart, 
  RadarChart, 
  RadialBarChart, 
  TreeMapChart, 
  DataTable 
} from './charts'
import type { AnalyticsPortletProps } from '../types'

interface AnalyticsPortletRef {
  refresh: () => void
}

const AnalyticsPortlet = forwardRef<AnalyticsPortletRef, AnalyticsPortletProps>(({ 
  query, 
  chartType, 
  labelField, 
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
      return {
        ...parsed,
        __refresh_counter: refreshCounter
      }
    } catch (e) {
      console.error('Invalid query JSON:', e)
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
      <div className="flex flex-col items-center justify-center w-full p-4 text-center" style={{ height }}>
        <div className="text-red-500 mb-2">⚠️</div>
        <div className="text-sm text-red-500 font-semibold mb-1">Failed to load data</div>
        <div className="text-xs text-gray-600">{error.toString()}</div>
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
      const commonProps = {
        data,
        chartConfig,
        displayConfig,
        queryObject,
        height,
        labelField
      }

      switch (chartType) {
        case 'bar':
          return <BarChart {...commonProps} />
        case 'line':
          return <LineChart {...commonProps} />
        case 'area':
          return <AreaChart {...commonProps} />
        case 'pie':
          return <PieChart {...commonProps} />
        case 'scatter':
          return <ScatterChart {...commonProps} />
        case 'radar':
          return <RadarChart {...commonProps} />
        case 'radialBar':
          return <RadialBarChart {...commonProps} />
        case 'treemap':
          return <TreeMapChart {...commonProps} />
        case 'table':
          return <DataTable {...commonProps} />
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
    <div className="w-full" style={{ height }}>
      {renderChart()}
    </div>
  )
})

AnalyticsPortlet.displayName = 'AnalyticsPortlet'

export default AnalyticsPortlet
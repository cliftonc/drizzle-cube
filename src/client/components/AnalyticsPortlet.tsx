/**
 * Analytics Portlet Component
 * Simplified version with minimal dependencies
 */

import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { useCubeQuery } from '../hooks/useCubeQuery'
import ChartErrorBoundary from './ChartErrorBoundary'
import { chartConfigRegistry } from '../charts/chartConfigRegistry'
import { getChartConfig } from '../charts/chartConfigs'
import { 
  RechartsBarChart, 
  RechartsLineChart, 
  RechartsAreaChart, 
  RechartsPieChart, 
  RechartsScatterChart, 
  RechartsRadarChart, 
  RechartsRadialBarChart, 
  RechartsTreeMapChart, 
  BubbleChart,
  DataTable,
  ActivityGridChart,
  KpiNumber,
  KpiDelta,
  KpiText,
  MarkdownChart
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
  title: _title,
  colorPalette,
  onDebugDataReady
}, ref) => {
  const [refreshCounter, setRefreshCounter] = useState(0)
  const onDebugDataReadyRef = useRef(onDebugDataReady)
  
  // Update ref when callback changes
  useEffect(() => {
    onDebugDataReadyRef.current = onDebugDataReady
  }, [onDebugDataReady])

  // Check if this chart type skips queries
  const chartTypeConfig = useMemo(() => 
    getChartConfig(chartType, chartConfigRegistry), 
    [chartType]
  )
  const shouldSkipQuery = chartTypeConfig.skipQuery === true

  // Parse query from JSON string and include refresh counter to force re-query
  const queryObject = useMemo(() => {
    // Skip query parsing for charts that don't need queries
    if (shouldSkipQuery) {
      return null
    }
    
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
  }, [query, refreshCounter, shouldSkipQuery])

  // Use the cube React hook (skip for charts that don't need queries)
  const { resultSet, isLoading, error } = useCubeQuery(queryObject, {
    skip: !queryObject || shouldSkipQuery,
    resetResultSetOnChange: true
  })

  // Expose refresh function through ref
  useImperativeHandle(ref, () => ({
    refresh: () => {
      setRefreshCounter(prev => prev + 1)
    }
  }), [])


  // Send debug data to parent when ready (must be before any returns)
  useEffect(() => {
    if (onDebugDataReadyRef.current && chartConfig && queryObject && resultSet && !error) {
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
      
      if (data) {
        onDebugDataReadyRef.current({
          chartConfig: chartConfig || {},
          displayConfig: displayConfig || {},
          queryObject,
          data,
          chartType
        })
      }
    }
  }, [chartConfig, displayConfig, queryObject, resultSet, chartType, error]) // Use ref for callback to prevent infinite loops

  // Validate that chartConfig is provided when required (not required for skipQuery charts)
  // Check if any dropZones are mandatory for this chart type
  const hasMandatoryFields = !shouldSkipQuery && chartTypeConfig.dropZones.some(zone => zone.mandatory === true)
  
  if (!chartConfig && hasMandatoryFields) {
    return (
      <div className="flex items-center justify-center w-full text-red-500" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Error</div>
          <div className="text-xs">chartConfig is required but not provided</div>
        </div>
      </div>
    )
  }

  // Skip loading and error handling for charts that don't need queries
  if (!shouldSkipQuery) {
    if (isLoading || (queryObject && !resultSet && !error)) {
      return (
        <div className="flex items-center justify-center w-full" style={{ height }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-4 border bg-red-50 rounded-sm" style={{ height, borderColor: '#fca5a5' }}>
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <span className="text-red-600 font-medium text-sm">⚠️ Query Error</span>
              <button
                onClick={() => setRefreshCounter(prev => prev + 1)}
                className="px-2 py-1 text-white rounded-sm text-xs"
                style={{ backgroundColor: 'var(--dc-primary)' }}
              >
                Retry
              </button>
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-red-700 bg-dc-surface p-2 rounded-sm border" style={{ borderColor: '#fca5a5' }}>
              {error.message || error.toString()}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <details>
              <summary className="cursor-pointer text-dc-text-secondary font-medium">Original Query</summary>
              <pre className="mt-1 p-2 rounded-sm text-xs overflow-auto max-h-20" style={{ backgroundColor: 'rgba(var(--dc-primary-rgb), 0.1)' }}>
                {query}
              </pre>
            </details>

            <details>
              <summary className="cursor-pointer text-dc-text-secondary font-medium">Chart Config</summary>
              <pre className="mt-1 p-2 rounded-sm text-xs overflow-auto max-h-20" style={{ backgroundColor: '#f3e8ff' }}>
                {JSON.stringify({
                  chartType,
                  chartConfig,
                  displayConfig: displayConfig
                }, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    if (!resultSet || !queryObject) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs">Invalid query or no results</div>
          </div>
        </div>
      )
    }
  }

  // Get data based on chart type needs
  const getData = () => {
    // Return empty array for charts that don't use query data
    if (shouldSkipQuery) {
      return []
    }
    
    // Return empty array if no resultSet
    if (!resultSet) {
      return []
    }
    
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
      // Pass height directly to charts - let ChartContainer handle it
      const chartHeight = height
      
      switch (chartType) {
        case 'bar':
          return (
            <RechartsBarChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'line':
          return (
            <RechartsLineChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'area':
          return (
            <RechartsAreaChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'pie':
          return (
            <RechartsPieChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'scatter':
          return (
            <RechartsScatterChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'radar':
          return (
            <RechartsRadarChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'radialBar':
          return (
            <RechartsRadialBarChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'treemap':
          return (
            <RechartsTreeMapChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'bubble':
          return (
            <BubbleChart
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'table':
          return (
            <DataTable
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'activityGrid':
          return (
            <ActivityGridChart
              key={`activityGrid-${colorPalette?.name || 'default'}`}
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'kpiNumber':
          return (
            <KpiNumber
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'kpiDelta':
          return (
            <KpiDelta
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'kpiText':
          return (
            <KpiText
              data={data}
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        case 'markdown':
          return (
            <MarkdownChart
              data={[]} // Markdown chart doesn't use query data
              chartConfig={chartConfig}
              displayConfig={displayConfig}
              queryObject={queryObject}
              height={chartHeight}
              colorPalette={colorPalette}
            />
          )
        default:
          return (
            <div className="flex items-center justify-center w-full" style={{ height }}>
              <div className="text-center text-dc-text-muted">
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
      <div className="w-full h-full flex flex-col flex-1" style={{ minHeight: '200px' }}>
        {renderChart()}
      </div>
    </ChartErrorBoundary>
  )
})

AnalyticsPortlet.displayName = 'AnalyticsPortlet'

export default AnalyticsPortlet
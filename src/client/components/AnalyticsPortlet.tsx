/**
 * Analytics Portlet Component
 * Simplified version with minimal dependencies
 */

import { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { useCubeQuery } from '../hooks/useCubeQuery'
import { useScrollContainer } from '../providers/ScrollContainerContext'
import ChartErrorBoundary from './ChartErrorBoundary'
import LoadingIndicator from './LoadingIndicator'
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
import { getApplicableDashboardFilters, mergeDashboardAndPortletFilters, applyUniversalTimeFilters } from '../utils/filterUtils'


interface AnalyticsPortletRef {
  refresh: () => void
}

const AnalyticsPortlet = forwardRef<AnalyticsPortletRef, AnalyticsPortletProps>(({
  query,
  chartType,
  chartConfig,
  displayConfig,
  dashboardFilters,
  dashboardFilterMapping,
  eagerLoad = false,
  isVisible: _isVisible, // Deprecated - visibility now handled internally via useInView
  height = 300,
  title: _title,
  colorPalette,
  loadingComponent,
  onDebugDataReady
}, ref) => {
  const [refreshCounter, setRefreshCounter] = useState(0)
  const onDebugDataReadyRef = useRef(onDebugDataReady)

  // Lazy loading: Use IntersectionObserver to detect when portlet is visible
  // Get scroll container from context (null = viewport, element = container scroll)
  const scrollContainer = useScrollContainer()
  const { ref: inViewRef, inView } = useInView({
    root: scrollContainer,
    rootMargin: '200px',      // Start loading 200px before entering viewport
    triggerOnce: true,        // Once visible, stay "visible" (don't unload data)
    initialInView: false,     // Start as not visible, let observer determine actual state
    skip: eagerLoad           // Skip observation entirely if eagerLoad is true
  })

  // Effective visibility: eagerLoad forces visible, otherwise use inView from IntersectionObserver
  // Note: Batching is handled by BatchCoordinator which collects queries for 100ms before flushing
  const isVisible = eagerLoad || inView

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

  // Parse query from JSON string, merge dashboard filters, and include refresh counter to force re-query
  const queryObject = useMemo(() => {
    // Skip query parsing for charts that don't need queries
    if (shouldSkipQuery) {
      return null
    }

    try {
      const parsed = JSON.parse(query)

      // Get applicable dashboard filters (excluding universal time filters - they apply to timeDimensions)
      const regularFilters = dashboardFilters?.filter(df => !df.isUniversalTime)
      const applicableFilters = getApplicableDashboardFilters(regularFilters, dashboardFilterMapping)

      // Merge dashboard filters with portlet filters
      const mergedFilters = mergeDashboardAndPortletFilters(applicableFilters, parsed.filters)

      // Apply universal time filters to timeDimensions (dashboard wins over portlet dateRange)
      const mergedTimeDimensions = applyUniversalTimeFilters(
        dashboardFilters,
        dashboardFilterMapping,
        parsed.timeDimensions
      )

      return {
        ...parsed,
        filters: mergedFilters,
        timeDimensions: mergedTimeDimensions,
        __refresh_counter: refreshCounter
      }
    } catch (e) {
      console.error('AnalyticsPortlet: Invalid query JSON:', e)
      return null
    }
  }, [query, refreshCounter, shouldSkipQuery, dashboardFilters, dashboardFilterMapping])

  // Use the cube React hook (skip for charts that don't need queries or not visible for lazy loading)
  // Priority: shouldSkipQuery (chart type) > eagerLoad override > isVisible (lazy loading)
  const shouldSkip = !queryObject || shouldSkipQuery || (!eagerLoad && !isVisible)

  const { resultSet, isLoading, error } = useCubeQuery(queryObject, {
    skip: shouldSkip,
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
      <div ref={inViewRef} className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Required</div>
          <div className="text-xs text-dc-text-secondary">Please configure this chart</div>
        </div>
      </div>
    )
  }

  // Show placeholder for lazy-loaded portlets that aren't visible yet
  if (!shouldSkipQuery && !eagerLoad && !isVisible) {
    return (
      <div ref={inViewRef} className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-dc-surface-secondary animate-pulse" />
          <div className="text-xs text-dc-text-secondary">Scroll to load</div>
        </div>
      </div>
    )
  }

  // Skip loading and error handling for charts that don't need queries
  if (!shouldSkipQuery) {
    if (isLoading || (queryObject && !resultSet && !error)) {
      return (
        <div ref={inViewRef} className="flex items-center justify-center w-full" style={{ height }}>
          {loadingComponent || <LoadingIndicator size="md" />}
        </div>
      )
    }

    if (error) {
      return (
        <div ref={inViewRef} className="p-4 border rounded-sm" style={{ height, borderColor: 'var(--dc-border)', backgroundColor: 'var(--dc-surface)' }}>
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm" style={{ color: 'var(--dc-text)' }}>⚠️ Query Error</span>
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
            <div className="text-xs p-2 rounded-sm border" style={{ color: 'var(--dc-text-secondary)', backgroundColor: 'var(--dc-surface)', borderColor: 'var(--dc-border)' }}>
              {error.message || error.toString()}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <details>
              <summary className="cursor-pointer font-medium" style={{ color: 'var(--dc-text-secondary)' }}>Query (with filters applied)</summary>
              <pre className="mt-1 p-2 rounded-sm text-xs overflow-auto max-h-20" style={{ backgroundColor: 'rgba(var(--dc-primary-rgb), 0.1)' }}>
                {queryObject ? JSON.stringify(queryObject, null, 2) : query}
              </pre>
            </details>

            <details>
              <summary className="cursor-pointer font-medium" style={{ color: 'var(--dc-text-secondary)' }}>Chart Config</summary>
              <pre className="mt-1 p-2 rounded-sm text-xs overflow-auto max-h-20" style={{ backgroundColor: 'rgba(var(--dc-primary-rgb), 0.05)' }}>
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
        <div ref={inViewRef} className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
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
  // Note: ChartContainer now handles dimension validation to prevent Recharts -1 errors
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
        <div className="flex items-center justify-center w-full text-dc-text-muted p-4" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">Unable to render chart</div>
            <div className="text-xs text-dc-text-secondary">{error instanceof Error ? error.message : 'Unknown error'}</div>
          </div>
        </div>
      )
    }
  }

  return (
    <div ref={inViewRef} className="w-full h-full">
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
    </div>
  )
})

AnalyticsPortlet.displayName = 'AnalyticsPortlet'

export default AnalyticsPortlet
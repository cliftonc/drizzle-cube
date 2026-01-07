/**
 * Analytics Portlet Component
 * Simplified version with minimal dependencies
 */

import React, { useMemo, useCallback, forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { useQueryClient } from '@tanstack/react-query'
import { useCubeLoadQuery, useMultiCubeLoadQuery, createQueryKey, createMultiQueryKey } from '../hooks/queries'
import { useScrollContainer } from '../providers/ScrollContainerContext'
import ChartErrorBoundary from './ChartErrorBoundary'
import LoadingIndicator from './LoadingIndicator'
import { LazyChart, isValidChartType } from '../charts/ChartLoader'
import { useChartConfig } from '../charts/lazyChartConfigRegistry'
import type { AnalyticsPortletProps, MultiQueryConfig } from '../types'
import { isMultiQueryConfig } from '../types'
import { getApplicableDashboardFilters, mergeDashboardAndPortletFilters, applyUniversalTimeFilters } from '../utils/filterUtils'
import { cleanQueryForServer } from '../shared/utils'


interface AnalyticsPortletRef {
  refresh: () => void
}

// Memoize component to prevent re-renders when props haven't changed
const AnalyticsPortlet = React.memo(forwardRef<AnalyticsPortletRef, AnalyticsPortletProps>(({
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
  const onDebugDataReadyRef = useRef(onDebugDataReady)

  // Lazy loading: Use IntersectionObserver to detect when portlet is visible
  // Get scroll container from context (null = viewport, element = container scroll)
  const scrollContainer = useScrollContainer()
  const { ref: inViewRef, inView } = useInView({
    root: scrollContainer,
    rootMargin: '500px',      // Start loading 500px before entering viewport (about half screen)
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

  // Check if this chart type skips queries (using lazy-loaded config)
  const { config: chartTypeConfig } = useChartConfig(chartType)
  const shouldSkipQuery = chartTypeConfig.skipQuery === true

  // Memoize regular filters to prevent array recreation on every render
  const regularFilters = useMemo(() => {
    return dashboardFilters?.filter(df => !df.isUniversalTime)
  }, [dashboardFilters])

  // Parse query from JSON string, merge dashboard filters, and include refresh counter to force re-query
  // Supports both single CubeQuery and MultiQueryConfig formats
  const { queryObject, multiQueryConfig } = useMemo(() => {
    // Skip query parsing for charts that don't need queries
    if (shouldSkipQuery) {
      return { queryObject: null, multiQueryConfig: null }
    }

    try {
      const parsed = JSON.parse(query)

      // Get applicable dashboard filters (excluding universal time filters - they apply to timeDimensions)
      const applicableFilters = getApplicableDashboardFilters(regularFilters, dashboardFilterMapping)

      // Check if this is a multi-query configuration
      if (isMultiQueryConfig(parsed)) {
        // Multi-query: apply filters to each query in the array
        const multiConfig: MultiQueryConfig = {
          ...parsed,
          queries: parsed.queries.map(q => ({
            ...q,
            filters: mergeDashboardAndPortletFilters(applicableFilters, q.filters),
            timeDimensions: applyUniversalTimeFilters(dashboardFilters, dashboardFilterMapping, q.timeDimensions)
          }))
        }
        return { queryObject: null, multiQueryConfig: multiConfig }
      }

      // Single query: existing behavior
      const mergedFilters = mergeDashboardAndPortletFilters(applicableFilters, parsed.filters)
      const mergedTimeDimensions = applyUniversalTimeFilters(
        dashboardFilters,
        dashboardFilterMapping,
        parsed.timeDimensions
      )

      return {
        queryObject: {
          ...parsed,
          filters: mergedFilters,
          timeDimensions: mergedTimeDimensions
        },
        multiQueryConfig: null
      }
    } catch (e) {
      console.error('AnalyticsPortlet: Invalid query JSON:', e)
      return { queryObject: null, multiQueryConfig: null }
    }
  }, [query, shouldSkipQuery, regularFilters, dashboardFilters, dashboardFilterMapping])

  // Determine whether to skip queries based on various conditions
  const isMultiQuery = multiQueryConfig !== null
  const shouldSkipSingle = !queryObject || shouldSkipQuery || (!eagerLoad && !isVisible) || isMultiQuery
  const shouldSkipMulti = !multiQueryConfig || shouldSkipQuery || (!eagerLoad && !isVisible)

  // Query client for cache invalidation
  const queryClient = useQueryClient()

  // Use single query hook with TanStack Query (skip if multi-query or other skip conditions)
  const singleQueryResult = useCubeLoadQuery(queryObject, {
    skip: shouldSkipSingle,
    resetResultSetOnChange: true,
    debounceMs: 100, // Lower debounce for portlets (faster response)
  })

  // Use multi-query hook with TanStack Query (skip if single query or other skip conditions)
  const multiQueryResult = useMultiCubeLoadQuery(multiQueryConfig, {
    skip: shouldSkipMulti,
    resetResultSetOnChange: true,
    debounceMs: 100, // Lower debounce for portlets (faster response)
  })

  // Combine results from both hooks
  const resultSet = isMultiQuery ? null : singleQueryResult.resultSet
  const isLoading = isMultiQuery ? multiQueryResult.isLoading : singleQueryResult.isLoading
  const isFetching = isMultiQuery ? multiQueryResult.isFetching : singleQueryResult.isFetching
  const error = isMultiQuery ? multiQueryResult.error : singleQueryResult.error
  const multiQueryData = isMultiQuery ? multiQueryResult.data : null

  // Expose refresh function through ref
  // Invalidates cache and forces a fresh fetch from the server
  useImperativeHandle(ref, () => ({
    refresh: () => {
      if (isMultiQuery && multiQueryConfig) {
        // Invalidate cache for this specific multi-query, then refetch
        // Clean each query to match the cache key format used by useMultiCubeLoadQuery
        const cleanedConfig = {
          ...multiQueryConfig,
          queries: multiQueryConfig.queries.map(q => cleanQueryForServer(q))
        }
        queryClient.invalidateQueries({ queryKey: createMultiQueryKey(cleanedConfig) })
      } else if (queryObject) {
        // Clean the query to match the cache key format used by useCubeLoadQuery
        // This is important because the cache uses cleanQueryForServer(query) which removes empty arrays
        const cleanedQuery = cleanQueryForServer(queryObject)
        queryClient.invalidateQueries({ queryKey: createQueryKey(cleanedQuery) })
      }
    }
  }), [isMultiQuery, multiQueryConfig, queryObject, queryClient])

  const handleRetry = useCallback(() => {
    if (isMultiQuery) {
      multiQueryResult.refetch()
    } else {
      singleQueryResult.refetch()
    }
  }, [isMultiQuery, multiQueryResult, singleQueryResult])


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
          chartType,
          cacheInfo: resultSet.cacheInfo?.()
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
      <div ref={inViewRef} className="w-full h-full" style={{ height }}>
        <div className="w-full h-full animate-pulse bg-dc-surface-secondary rounded" style={{ minHeight: '100px' }} />
      </div>
    )
  }

  // Skip loading and error handling for charts that don't need queries
  if (!shouldSkipQuery) {
    // Show loading indicator during initial load OR during refresh (isFetching)
    if (isLoading || isFetching || (queryObject && !resultSet && !error)) {
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
                onClick={handleRetry}
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

    // Check for valid data based on query type
    const hasValidData = isMultiQuery
      ? (multiQueryData !== null && multiQueryConfig !== null)
      : (resultSet !== null && queryObject !== null)

    if (!hasValidData) {
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

    // Multi-query: return merged data directly
    if (isMultiQuery) {
      return multiQueryData || []
    }

    // Single query: return empty array if no resultSet
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

  // Render appropriate chart component using lazy loading
  // Each chart type is dynamically imported for code splitting
  const renderChart = () => {
    try {
      const chartHeight = height

      // Handle unsupported chart types
      if (!isValidChartType(chartType)) {
        return (
          <div className="flex items-center justify-center w-full" style={{ height }}>
            <div className="text-center text-dc-text-muted">
              <div className="text-sm font-semibold mb-1">Unsupported chart type</div>
              <div className="text-xs">{chartType}</div>
            </div>
          </div>
        )
      }

      // For markdown chart, use empty data array
      const chartData = chartType === 'markdown' ? [] : data

      return (
        <LazyChart
          chartType={chartType}
          data={chartData}
          chartConfig={chartConfig}
          displayConfig={displayConfig}
          queryObject={queryObject ?? undefined}
          height={chartHeight}
          colorPalette={colorPalette}
          fallback={
            <div
              className="flex items-center justify-center w-full"
              style={{ height: typeof chartHeight === 'number' ? `${chartHeight}px` : chartHeight }}
            >
              <div className="animate-pulse bg-dc-surface-secondary rounded w-full h-full min-h-[100px]" />
            </div>
          }
        />
      )
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
}))

AnalyticsPortlet.displayName = 'AnalyticsPortlet'

export default AnalyticsPortlet

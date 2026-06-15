/**
 * Analytics Portlet Component
 * Simplified version with minimal dependencies
 */

import React, { useMemo, forwardRef, useImperativeHandle } from 'react'
import { useInView } from 'react-intersection-observer'
import { useScrollContainer } from '../providers/ScrollContainerContext'
import { useChartConfig } from '../charts/lazyChartConfigRegistry'
import type { AnalyticsPortletProps } from '../types'
import { parsePortletQuery } from './analyticsPortlet/parsePortletQuery'
import { usePortletDrillState } from './analyticsPortlet/usePortletDrillState'
import { usePortletQueryResults } from './analyticsPortlet/usePortletQueryResults'
import { usePortletDebugData } from './analyticsPortlet/usePortletDebugData'
import { resolvePortletRenderKind } from './analyticsPortlet/portletRenderState'
import { PortletChartView } from './analyticsPortlet/PortletChartView'
import { PortletStateView } from './analyticsPortlet/PortletStates'

interface RefreshOptions {
  bustCache?: boolean
}

interface AnalyticsPortletRef {
  refresh: (options?: RefreshOptions) => void
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

  // Check if this chart type skips queries (using lazy-loaded config)
  const { config: chartTypeConfig } = useChartConfig(chartType)
  const shouldSkipQuery = chartTypeConfig.skipQuery === true

  // Memoize regular filters to prevent array recreation on every render
  const regularFilters = useMemo(() => {
    return dashboardFilters?.filter(df => !df.isUniversalTime)
  }, [dashboardFilters])

  // Parse query from JSON string, merge dashboard filters, and detect query type
  // Supports: CubeQuery, MultiQueryConfig, ServerFunnelQuery, ServerFlowQuery, and ServerRetentionQuery formats
  const { queryObject, multiQueryConfig, serverFunnelQuery, serverFlowQuery, serverRetentionQuery } = useMemo(
    () => parsePortletQuery({ query, shouldSkipQuery, regularFilters, dashboardFilters, dashboardFilterMapping }),
    [query, shouldSkipQuery, regularFilters, dashboardFilters, dashboardFilterMapping]
  )

  // Determine whether to skip queries based on various conditions
  const isMultiQuery = multiQueryConfig !== null
  // Funnel mode: ServerFunnelQuery format (dedicated funnel mode)
  // Note: Legacy mergeStrategy === 'funnel' is no longer supported
  const isFunnelMode = serverFunnelQuery !== null
  // Flow mode: ServerFlowQuery format (dedicated flow mode for Sankey charts)
  const isFlowMode = serverFlowQuery !== null
  // Retention mode: ServerRetentionQuery format (cohort retention analysis)
  const isRetentionMode = serverRetentionQuery !== null

  // Drill-down state, active query, and navigation handlers
  const { drill, activeQuery, handleNavigateBack, handleNavigateToLevel } = usePortletDrillState({
    queryObject,
    chartConfig,
    dashboardFilters,
    dashboardFilterMapping,
    isMultiQuery,
    isFunnelMode,
    isFlowMode,
    isRetentionMode
  })

  // Run all query hooks and derive combined loading/error/data + refresh/retry
  const {
    resultSet,
    isLoading,
    isFetching,
    error,
    multiQueryData,
    flowChartData,
    retentionChartData,
    funnelCacheInfo,
    flowCacheInfo,
    retentionCacheInfo,
    refresh,
    retry
  } = usePortletQueryResults({
    activeQuery,
    multiQueryConfig,
    serverFunnelQuery,
    serverFlowQuery,
    serverRetentionQuery,
    isMultiQuery,
    isFunnelMode,
    isFlowMode,
    isRetentionMode,
    shouldSkipQuery,
    eagerLoad,
    isVisible
  })

  // Expose refresh function through ref
  useImperativeHandle(ref, () => ({ refresh }), [refresh])

  // Send debug data to parent when ready
  usePortletDebugData({
    onDebugDataReady,
    error,
    chartType,
    chartConfig,
    displayConfig,
    isFunnelMode,
    isFlowMode,
    isRetentionMode,
    queryObject,
    activeQuery,
    serverFunnelQuery,
    serverFlowQuery,
    serverRetentionQuery,
    resultSet,
    multiQueryData,
    flowChartData,
    retentionChartData,
    funnelCacheInfo,
    flowCacheInfo,
    retentionCacheInfo,
    drillPath: drill.drillPath,
    currentChartConfig: drill.currentChartConfig
  })

  // Validate that chartConfig is provided when required (not required for skipQuery charts)
  // Check if any dropZones are mandatory for this chart type
  const hasMandatoryFields = !shouldSkipQuery && chartTypeConfig.dropZones.some(zone => zone.mandatory === true)

  // Decide which view to render based on the resolved query state
  const renderKind = resolvePortletRenderKind({
    hasChartConfig: !!chartConfig,
    hasMandatoryFields,
    shouldSkipQuery,
    eagerLoad,
    isVisible,
    isLoading,
    isFetching,
    error,
    isMultiQuery,
    isFunnelMode,
    isFlowMode,
    isRetentionMode,
    queryObject,
    multiQueryConfig,
    serverFunnelQuery,
    serverFlowQuery,
    serverRetentionQuery,
    resultSet,
    multiQueryData,
    flowChartData,
    retentionChartData
  })

  // Non-chart states (config-required, placeholder, loading, error, no-data)
  if (renderKind !== 'chart') {
    return (
      <PortletStateView
        kind={renderKind}
        inViewRef={inViewRef}
        height={height}
        loadingComponent={loadingComponent}
        error={(error as { message?: string; toString: () => string }) ?? null}
        onRetry={retry}
        activeQuery={activeQuery}
        query={query}
        chartType={chartType}
        chartConfig={drill.currentChartConfig || chartConfig}
        displayConfig={displayConfig}
        drillPath={drill.drillPath}
        onNavigateBack={handleNavigateBack}
        onNavigateToLevel={handleNavigateToLevel}
      />
    )
  }

  // Check if drill is enabled for this portlet (only single query mode)
  const isDrillEnabled = !isMultiQuery && !isFunnelMode && !isFlowMode && !isRetentionMode && drill.drillEnabled

  return (
    <div ref={inViewRef} className="dc:w-full dc:h-full dc:relative">
      <PortletChartView
        title={_title}
        query={query}
        chartType={chartType}
        height={height}
        chartConfig={chartConfig}
        displayConfig={displayConfig}
        colorPalette={colorPalette}
        shouldSkipQuery={shouldSkipQuery}
        isMultiQuery={isMultiQuery}
        isFunnelMode={isFunnelMode}
        isFlowMode={isFlowMode}
        isRetentionMode={isRetentionMode}
        resultSet={resultSet}
        multiQueryData={multiQueryData}
        flowChartData={flowChartData}
        retentionChartData={retentionChartData}
        activeQuery={activeQuery}
        drill={drill}
        isDrillEnabled={isDrillEnabled}
        onNavigateBack={handleNavigateBack}
        onNavigateToLevel={handleNavigateToLevel}
      />
    </div>
  )
}))

AnalyticsPortlet.displayName = 'AnalyticsPortlet'

export default AnalyticsPortlet

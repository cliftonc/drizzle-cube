/**
 * Analytics Portlet Component
 * Simplified version with minimal dependencies
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useInView } from 'react-intersection-observer'
import { useScrollContainer } from '../providers/ScrollContainerContext.js'
import { useChartConfig } from '../charts/lazyChartConfigRegistry.js'
import type { AnalyticsPortletProps, AnalyticsPortletRef, PortletViewState } from '../types.js'
import { hasRunnableQuery, parsePortletQuery } from './analyticsPortlet/parsePortletQuery.js'
import { getRegularDashboardFilters } from '../utils/filterUtils.js'
import { usePortletDrillState } from './analyticsPortlet/usePortletDrillState.js'
import { usePortletPagination } from './analyticsPortlet/usePortletPagination.js'
import { usePortletDeadMembers } from './analyticsPortlet/usePortletDeadMembers.js'
import { usePortletQueryResults } from './analyticsPortlet/usePortletQueryResults.js'
import { usePortletDebugData } from './analyticsPortlet/usePortletDebugData.js'
import { resolvePortletRenderKind } from './analyticsPortlet/portletRenderState.js'
import { PortletChartView } from './analyticsPortlet/PortletChartView.js'
import { PortletStateView } from './analyticsPortlet/PortletStates.js'

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
  initialViewState,
  onDebugDataReady,
  onFreshnessChange
}, ref) => {
  // The start view state is read one time, on mount, like the chart components do
  const [startViewState] = useState(() => initialViewState)

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

  // `skipQuery` says the chart does not *require* a query, not that it can
  // never have one — a markdown portlet with a query renders its content as a
  // data template. So the query is only skipped when there is nothing to run,
  // which keeps every existing text portlet on exactly its old path.
  const { config: chartTypeConfig } = useChartConfig(chartType)
  const shouldSkipQuery = chartTypeConfig.skipQuery === true && !hasRunnableQuery(query)

  // Memoize regular filters to prevent array recreation on every render.
  // Universal time filters pinned to a field by the mapping count as regular.
  const regularFilters = useMemo(() => {
    return getRegularDashboardFilters(dashboardFilters, dashboardFilterMapping)
  }, [dashboardFilters, dashboardFilterMapping])

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

  // The failure that identifies dead members only exists after the query has
  // run, so it is fed back in a render later rather than threaded upward.
  const [deadMemberError, setDeadMemberError] = useState<unknown>(null)

  // Drop members the model no longer has (a deleted attribute, say) so one
  // deletion does not take out every dashboard that showed it. Filters are
  // never pruned — see the hook.
  const { query: liveQuery, droppedMembers } = usePortletDeadMembers({
    queryObject,
    error: deadMemberError
  })

  // Drill-down state, active query, and navigation handlers
  const { drill, activeQuery, drillViewState, handleNavigateBack, handleNavigateToLevel } = usePortletDrillState({
    queryObject: liveQuery,
    chartConfig,
    dashboardFilters,
    dashboardFilterMapping,
    isMultiQuery,
    isFunnelMode,
    isFlowMode,
    isRetentionMode,
    initialDrill: startViewState?.drill
  })

  // The chart component reports its own state (for example its page). A ref
  // keeps the latest report, so a report does not render the portlet again.
  const chartViewStateRef = useRef<unknown>(startViewState?.chart)
  const handleChartViewStateChange = useCallback((state: unknown) => {
    chartViewStateRef.current = state
  }, [])

  // Server-side paging + sorting, layered over whichever query is active. Only
  // engaged for chart types that page; every other type gets `activeQuery` back
  // unchanged.
  const { paginatedQuery, pagination, viewState: paginationViewState } = usePortletPagination({
    chartType,
    activeQuery,
    pageSize: displayConfig?.pageSize,
    initialState: startViewState?.pagination
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
    computedAt,
    refresh,
    retry
  } = usePortletQueryResults({
    activeQuery: paginatedQuery,
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
    isVisible,
    displayConfig
  })

  useEffect(() => {
    setDeadMemberError(error ?? null)
  }, [error])

  // Report freshness (computed-at, fetching) to the card header
  useEffect(() => {
    onFreshnessChange?.({ computedAt, isFetching })
  }, [onFreshnessChange, computedAt, isFetching])

  // Expose refresh and the view state through ref
  useImperativeHandle(ref, () => ({
    refresh,
    getViewState: () => {
      const viewState: PortletViewState = {}
      if (drillViewState) viewState.drill = drillViewState
      if (paginationViewState) viewState.pagination = paginationViewState
      if (chartViewStateRef.current !== undefined) viewState.chart = chartViewStateRef.current
      return viewState
    }
  }), [refresh, drillViewState, paginationViewState])

  // The total only exists once a response carrying it has arrived, so it is
  // merged in here rather than fed back into the pagination hook.
  const chartPagination = useMemo(
    () => (pagination ? { ...pagination, total: resultSet?.totalCount?.() } : undefined),
    [pagination, resultSet]
  )

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
    activeQuery: paginatedQuery,
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
    rendersWithoutData: chartTypeConfig.skipQuery === true,
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

  // A refetch, an error, or an empty result unmounts the chart component. It
  // mounts again with the start state, so the reported state goes back to it.
  useEffect(() => {
    if (renderKind !== 'chart') chartViewStateRef.current = startViewState?.chart
  }, [renderKind, startViewState])

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
        activeQuery={paginatedQuery}
        pagination={chartPagination}
        droppedMembers={droppedMembers}
        drill={drill}
        isDrillEnabled={isDrillEnabled}
        onNavigateBack={handleNavigateBack}
        onNavigateToLevel={handleNavigateToLevel}
        initialViewState={startViewState?.chart}
        onViewStateChange={handleChartViewStateChange}
      />
    </div>
  )
}))

AnalyticsPortlet.displayName = 'AnalyticsPortlet'

export default AnalyticsPortlet

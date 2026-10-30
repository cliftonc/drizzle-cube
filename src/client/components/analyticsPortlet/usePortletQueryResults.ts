/**
 * Runs the five query hooks (single, multi, funnel, flow, retention) for a
 * portlet and derives a single combined result set: loading/fetching/error
 * state, the active data for the current mode, and `refresh`/`retry` handlers.
 *
 * Extracted from AnalyticsPortlet to keep the component flat. Behaviour is
 * identical to the original inline logic.
 */

import { useCallback } from 'react'
import {
  useCubeLoadQuery,
  useMultiCubeLoadQuery,
  useFunnelQuery,
  useFlowQuery,
  useRetentionQuery
} from '../../hooks/queries/index.js'
import { resolveMaxAgeSeconds, type MaxAgeOptions } from '../../client/maxAge.js'
import { oldestComputedAt, resultSetComputedAt } from '../../utils/freshness.js'
import type { ChartDisplayConfig, CubeQuery, MultiQueryConfig, ServerFunnelQuery } from '../../types.js'
import type { FlowChartData, ServerFlowQuery } from '../../types/flow.js'
import type { RetentionChartData, ServerRetentionQuery } from '../../types/retention.js'

export interface UsePortletQueryResultsParams {
  activeQuery: CubeQuery | null
  multiQueryConfig: MultiQueryConfig | null
  serverFunnelQuery: ServerFunnelQuery | null
  serverFlowQuery: ServerFlowQuery | null
  serverRetentionQuery: ServerRetentionQuery | null
  isMultiQuery: boolean
  isFunnelMode: boolean
  isFlowMode: boolean
  isRetentionMode: boolean
  shouldSkipQuery: boolean
  eagerLoad: boolean
  /**
   * Near the viewport now or before. Until then the hooks are disabled, not
   * skipped: they keep their query key, so a refresh made before the first
   * view applies to the first fetch.
   */
  isVisible: boolean
  /**
   * Disable the hooks while the portlet is scrolled away (an interval-refreshed
   * portlet): they keep their data, a refresh only marks them stale, and they
   * fetch what is stale when the portlet is back.
   */
  isScrolledAway?: boolean
  /** Chart display config — its `fillMissingDates` drives client-side gap filling */
  displayConfig?: ChartDisplayConfig
}

export interface PortletQueryResults {
  resultSet: ReturnType<typeof useCubeLoadQuery>['resultSet']
  isLoading: boolean
  isFetching: boolean
  error: unknown
  multiQueryData: unknown[] | null
  flowChartData: FlowChartData | null
  retentionChartData: RetentionChartData | null
  funnelCacheInfo: ReturnType<typeof useFunnelQuery>['cacheInfo']
  flowCacheInfo: ReturnType<typeof useFlowQuery>['cacheInfo']
  retentionCacheInfo: ReturnType<typeof useRetentionQuery>['cacheInfo']
  /** When the active mode's rows were computed on the server (oldest result for multi-query) */
  computedAt: string | undefined
  refresh: (options?: MaxAgeOptions) => void
  retry: () => void
}

export function usePortletQueryResults(params: UsePortletQueryResultsParams): PortletQueryResults {
  const {
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
    isVisible,
    isScrolledAway = false,
    displayConfig
  } = params
  const gapFill = { fillMissingDates: displayConfig?.fillMissingDates }

  // Derive per-hook skip flags from mode. A hook runs only for its own mode,
  // and fetches only while enabled: the portlet is near the viewport (or
  // eager) and not disabled for being scrolled away.
  const shouldSkipSingle = !activeQuery || shouldSkipQuery || isMultiQuery || isFunnelMode || isFlowMode || isRetentionMode
  const shouldSkipMulti = !multiQueryConfig || shouldSkipQuery || isFunnelMode || isFlowMode || isRetentionMode
  const shouldSkipFunnel = !isFunnelMode || shouldSkipQuery
  const shouldSkipFlow = !isFlowMode || shouldSkipQuery
  const shouldSkipRetention = !isRetentionMode || shouldSkipQuery
  const enabled = (eagerLoad || isVisible) && !isScrolledAway

  // Note: Legacy funnel config via mergeStrategy === 'funnel' is no longer supported
  // Funnel mode now uses ServerFunnelQuery format exclusively
  const funnelConfig = null

  // Use activeQuery to support drill-down (which replaces the query temporarily)
  const singleQueryResult = useCubeLoadQuery(activeQuery, {
    skip: shouldSkipSingle,
    enabled,
    resetResultSetOnChange: true,
    debounceMs: 100, // Lower debounce for portlets (faster response)
    gapFill,
  })

  const multiQueryResult = useMultiCubeLoadQuery(multiQueryConfig, {
    skip: shouldSkipMulti,
    enabled,
    resetResultSetOnChange: true,
    debounceMs: 100,
    gapFill,
  })

  const funnelQueryResult = useFunnelQuery(funnelConfig, {
    skip: shouldSkipFunnel || (!funnelConfig && !serverFunnelQuery),
    enabled,
    debounceMs: 100,
    // Pass prebuilt ServerFunnelQuery directly (new dedicated funnel mode)
    prebuiltServerQuery: serverFunnelQuery,
  })

  const flowQueryResult = useFlowQuery(serverFlowQuery, {
    skip: shouldSkipFlow,
    enabled,
    debounceMs: 100,
  })

  const retentionQueryResult = useRetentionQuery(serverRetentionQuery, {
    skip: shouldSkipRetention,
    enabled,
    debounceMs: 100,
  })

  // Combine results from all hooks
  const resultSet = isMultiQuery ? null : singleQueryResult.resultSet

  // Pick a per-mode value following the mode priority order
  // (retention → flow → funnel → multi → single).
  function pickByMode<T>(vals: { retention: T; flow: T; funnel: T; multi: T; single: T }): T {
    if (isRetentionMode) return vals.retention
    if (isFlowMode) return vals.flow
    if (isFunnelMode) return vals.funnel
    if (isMultiQuery) return vals.multi
    return vals.single
  }

  const isLoading = pickByMode({
    retention: retentionQueryResult.isLoading || retentionQueryResult.isDebouncing,
    flow: flowQueryResult.isLoading || flowQueryResult.isDebouncing,
    funnel: funnelQueryResult.isExecuting || funnelQueryResult.isDebouncing,
    multi: multiQueryResult.isLoading || (multiQueryResult.isFetching && multiQueryResult.isPlaceholderData),
    single: singleQueryResult.isLoading || (singleQueryResult.isFetching && singleQueryResult.isPlaceholderData)
  })

  const isFetching = pickByMode({
    retention: retentionQueryResult.isFetching,
    flow: flowQueryResult.isFetching,
    funnel: funnelQueryResult.isExecuting,
    multi: multiQueryResult.isFetching,
    single: singleQueryResult.isFetching
  })

  const error = pickByMode({
    retention: retentionQueryResult.error,
    flow: flowQueryResult.error,
    funnel: funnelQueryResult.error,
    multi: multiQueryResult.error,
    single: singleQueryResult.error
  })

  // Retention returns data in retentionQueryResult.chartData; flow in
  // flowQueryResult.data — both have non-array structures and stay null here.
  const multiQueryData = pickByMode<unknown[] | null>({
    retention: null,
    flow: null,
    funnel: funnelQueryResult.chartData as unknown[] | null,
    multi: multiQueryResult.data,
    single: null
  })

  // Flow data is separate since it has a different structure (nodes/links vs array)
  const flowChartData = isFlowMode ? flowQueryResult.data : null
  // Retention data is separate since it has a different structure (rows/periods vs array)
  const retentionChartData = isRetentionMode ? retentionQueryResult.chartData : null

  const computedAt = pickByMode<string | undefined>({
    retention: retentionQueryResult.computedAt ?? undefined,
    flow: flowQueryResult.computedAt ?? undefined,
    funnel: funnelQueryResult.computedAt ?? undefined,
    multi: oldestComputedAt((multiQueryResult.resultSets ?? []).map(rs => resultSetComputedAt(rs))),
    single: resultSetComputedAt(singleQueryResult.resultSet)
  })

  // The one refresh path: the refresh button, shift+click and interval ticks
  // all land here. Each hook refetches through its own observer and its own
  // queryFn sends the max-age; old rows stay visible while it fetches. A hook
  // that is skipped (portlet off-screen) fetches when the portlet scrolls into
  // view.
  const refresh = useCallback((options?: MaxAgeOptions) => {
    const maxAgeSeconds = resolveMaxAgeSeconds(options)
    const refetchOptions = maxAgeSeconds === undefined ? undefined : { maxAgeSeconds }

    if (isRetentionMode && serverRetentionQuery) {
      retentionQueryResult.refetch(refetchOptions)
    } else if (isFlowMode && serverFlowQuery) {
      flowQueryResult.refetch(refetchOptions)
    } else if (isFunnelMode && serverFunnelQuery) {
      funnelQueryResult.execute(refetchOptions)
    } else if (isMultiQuery && multiQueryConfig) {
      multiQueryResult.refetch(refetchOptions)
    } else if (activeQuery) {
      singleQueryResult.refetch(refetchOptions)
    }
  }, [isRetentionMode, isFlowMode, isFunnelMode, isMultiQuery, multiQueryConfig, activeQuery, serverRetentionQuery, serverFlowQuery, serverFunnelQuery, retentionQueryResult, flowQueryResult, funnelQueryResult, multiQueryResult, singleQueryResult])

  const retry = useCallback(() => {
    if (isRetentionMode) {
      retentionQueryResult.refetch()
    } else if (isFlowMode) {
      flowQueryResult.refetch()
    } else if (isFunnelMode) {
      funnelQueryResult.execute()
    } else if (isMultiQuery) {
      multiQueryResult.refetch()
    } else {
      singleQueryResult.refetch()
    }
  }, [isRetentionMode, isFlowMode, isFunnelMode, isMultiQuery, retentionQueryResult, flowQueryResult, funnelQueryResult, multiQueryResult, singleQueryResult])

  return {
    resultSet,
    isLoading,
    isFetching,
    error,
    multiQueryData,
    flowChartData,
    retentionChartData,
    funnelCacheInfo: funnelQueryResult.cacheInfo,
    flowCacheInfo: flowQueryResult.cacheInfo,
    retentionCacheInfo: retentionQueryResult.cacheInfo,
    computedAt,
    refresh,
    retry
  }
}

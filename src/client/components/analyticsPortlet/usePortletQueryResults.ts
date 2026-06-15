/**
 * Runs the five query hooks (single, multi, funnel, flow, retention) for a
 * portlet and derives a single combined result set: loading/fetching/error
 * state, the active data for the current mode, and `refresh`/`retry` handlers.
 *
 * Extracted from AnalyticsPortlet to keep the component flat. Behaviour is
 * identical to the original inline logic.
 */

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCubeLoadQuery,
  useMultiCubeLoadQuery,
  useFunnelQuery,
  useFlowQuery,
  useRetentionQuery,
  createQueryKey,
  createMultiQueryKey
} from '../../hooks/queries'
import { cleanQueryForServer } from '../../shared/utils'
import type { CubeQuery, MultiQueryConfig, ServerFunnelQuery } from '../../types'
import type { FlowChartData, ServerFlowQuery } from '../../types/flow'
import type { RetentionChartData, ServerRetentionQuery } from '../../types/retention'

interface RefreshOptions {
  bustCache?: boolean
}

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
  isVisible: boolean
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
  refresh: (options?: RefreshOptions) => void
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
    isVisible
  } = params

  const queryClient = useQueryClient()

  // Derive per-hook skip flags from visibility + mode. A hook runs only for its
  // own mode, when the portlet is visible (or eager) and queries aren't skipped.
  const notReady = shouldSkipQuery || (!eagerLoad && !isVisible)
  const shouldSkipSingle = !activeQuery || notReady || isMultiQuery || isFunnelMode || isFlowMode || isRetentionMode
  const shouldSkipMulti = !multiQueryConfig || notReady || isFunnelMode || isFlowMode || isRetentionMode
  const shouldSkipFunnel = !isFunnelMode || notReady
  const shouldSkipFlow = !isFlowMode || notReady
  const shouldSkipRetention = !isRetentionMode || notReady

  // Note: Legacy funnel config via mergeStrategy === 'funnel' is no longer supported
  // Funnel mode now uses ServerFunnelQuery format exclusively
  const funnelConfig = null

  // Use activeQuery to support drill-down (which replaces the query temporarily)
  const singleQueryResult = useCubeLoadQuery(activeQuery, {
    skip: shouldSkipSingle,
    resetResultSetOnChange: true,
    debounceMs: 100, // Lower debounce for portlets (faster response)
  })

  const multiQueryResult = useMultiCubeLoadQuery(multiQueryConfig, {
    skip: shouldSkipMulti,
    resetResultSetOnChange: true,
    debounceMs: 100,
  })

  const funnelQueryResult = useFunnelQuery(funnelConfig, {
    skip: shouldSkipFunnel || (!funnelConfig && !serverFunnelQuery),
    debounceMs: 100,
    // Pass prebuilt ServerFunnelQuery directly (new dedicated funnel mode)
    prebuiltServerQuery: serverFunnelQuery,
  })

  const flowQueryResult = useFlowQuery(serverFlowQuery, {
    skip: shouldSkipFlow,
    debounceMs: 100,
  })

  const retentionQueryResult = useRetentionQuery(serverRetentionQuery, {
    skip: shouldSkipRetention,
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
    multi: multiQueryResult.isLoading,
    single: singleQueryResult.isLoading
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

  // Either remove (bustCache) or invalidate the given cache key.
  const bustOrInvalidate = useCallback((queryKey: readonly unknown[], bustCache: boolean) => {
    if (bustCache) {
      queryClient.removeQueries({ queryKey })
    } else {
      queryClient.invalidateQueries({ queryKey })
    }
  }, [queryClient])

  // Expose refresh function. Invalidates cache and forces a fresh fetch from the
  // server. Pass bustCache: true to bypass both client and server caches.
  const refresh = useCallback((options?: RefreshOptions) => {
    const bustCache = options?.bustCache ?? false

    if (isRetentionMode && serverRetentionQuery) {
      // Retention query key format: ['cube', 'retention', JSON.stringify(serverQuery)]
      bustOrInvalidate(['cube', 'retention', JSON.stringify(serverRetentionQuery)], bustCache)
      retentionQueryResult.refetch()
    } else if (isFlowMode && serverFlowQuery) {
      // Flow query key format: ['cube', 'flow', JSON.stringify(serverQuery)]
      bustOrInvalidate(['cube', 'flow', JSON.stringify(serverFlowQuery)], bustCache)
      flowQueryResult.refetch({ bustCache })
    } else if (isFunnelMode && serverFunnelQuery) {
      // Funnel query key format: ['cube', 'funnel', stepCount, JSON.stringify(serverQuery)]
      const stepCount = serverFunnelQuery.funnel?.steps?.length || 0
      bustOrInvalidate(['cube', 'funnel', stepCount, JSON.stringify(serverFunnelQuery)], bustCache)
      funnelQueryResult.execute({ bustCache })
    } else if (isMultiQuery && multiQueryConfig) {
      // Clean each query to match the cache key format used by useMultiCubeLoadQuery
      const cleanedConfig = {
        ...multiQueryConfig,
        queries: multiQueryConfig.queries.map((q: CubeQuery) => cleanQueryForServer(q))
      }
      bustOrInvalidate(createMultiQueryKey(cleanedConfig), bustCache)
      multiQueryResult.refetch({ bustCache })
    } else if (activeQuery) {
      // Clean the query to match the cache key format used by useCubeLoadQuery
      bustOrInvalidate(createQueryKey(cleanQueryForServer(activeQuery)), bustCache)
      singleQueryResult.refetch({ bustCache })
    }
  }, [isRetentionMode, isFlowMode, isFunnelMode, isMultiQuery, multiQueryConfig, activeQuery, bustOrInvalidate, serverRetentionQuery, serverFlowQuery, serverFunnelQuery, retentionQueryResult, flowQueryResult, funnelQueryResult, multiQueryResult, singleQueryResult])

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
    refresh,
    retry
  }
}

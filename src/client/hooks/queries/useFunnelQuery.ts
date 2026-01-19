/**
 * useFunnelQuery - Hook for server-side funnel query execution
 *
 * Executes funnel queries on the server using a single SQL query with
 * CTE-based generation. This provides:
 * - True temporal ordering (step N must occur AFTER step N-1)
 * - Time window enforcement (timeToConvert constraints)
 * - No binding key value limits
 * - Time-to-convert metrics (avg, median, P90)
 *
 * Previously this hook used client-side sequential execution. The server-side
 * approach is strictly better and the data shapes are compatible.
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCubeApi } from '../../providers/CubeApiProvider'
import { useCubeFeatures } from '../../providers/CubeFeaturesProvider'
import { useDebounceQuery } from '../useDebounceQuery'
import { stableStringify } from '../../shared/queryKey'
import type { CubeQuery } from '../../types'
import type {
  FunnelConfig,
  FunnelChartData,
  UseFunnelQueryOptions,
  UseFunnelQueryResult,
  FunnelStepResult,
  FunnelExecutionResult,
} from '../../types/funnel'
import {
  buildServerFunnelQuery,
  transformServerFunnelResult,
} from '../../utils/funnelExecution'

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 300

/**
 * Check if a FunnelConfig is valid for execution
 */
function isValidFunnelConfig(config: FunnelConfig | null): boolean {
  if (!config) return false
  if (!config.bindingKey) return false
  if (!config.steps || config.steps.length < 2) return false

  // Check that binding key dimension is defined
  if (typeof config.bindingKey.dimension === 'string') {
    if (!config.bindingKey.dimension) return false
  } else if (Array.isArray(config.bindingKey.dimension)) {
    if (config.bindingKey.dimension.length === 0) return false
  }

  // Check that each step has a valid query
  // For funnels, a step can have:
  // - measures/dimensions/timeDimensions (standard fields), OR
  // - filters only (the binding key dimension is auto-added by buildStepQuery)
  for (const step of config.steps) {
    const query = step.query
    const hasFields =
      (query.measures && query.measures.length > 0) ||
      (query.dimensions && query.dimensions.length > 0) ||
      (query.timeDimensions && query.timeDimensions.length > 0) ||
      (query.filters && query.filters.length > 0)
    if (!hasFields) return false
  }

  return true
}

/**
 * Hook for server-side funnel query execution
 *
 * Usage:
 * ```tsx
 * const { chartData, isExecuting, error } = useFunnelQuery(config, {
 *   debounceMs: 300,
 *   skip: !hasBindingKey
 * })
 *
 * // Results available after single server request
 * <FunnelChart data={chartData} />
 * ```
 */
export function useFunnelQuery(
  config: FunnelConfig | null,
  options: UseFunnelQueryOptions = {}
): UseFunnelQueryResult {
  const {
    skip = false,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onComplete,
    onError,
    prebuiltServerQuery,
  } = options

  const { cubeApi } = useCubeApi()
  const queryClient = useQueryClient()

  // Get manual refresh mode from features
  const { features } = useCubeFeatures()
  const manualRefresh = features.manualRefresh ?? false

  // Track the last executed query (for manual refresh mode)
  const [executedQueryKey, setExecutedQueryKey] = useState<string | null>(null)

  // Validate config
  const isValidConfig = isValidFunnelConfig(config)

  // Use shared debounce hook
  const { debouncedValue: debouncedConfig, isDebouncing } = useDebounceQuery(config, {
    isValid: isValidConfig,
    skip,
    debounceMs,
  })

  // Build server query from config (or use prebuilt if provided)
  const serverQuery = useMemo(() => {
    // If prebuiltServerQuery is provided, use it directly
    if (prebuiltServerQuery) {
      return prebuiltServerQuery
    }

    // Otherwise build from config (legacy mode)
    if (!debouncedConfig || !isValidConfig) {
      return null
    }

    try {
      const result = buildServerFunnelQuery(
        debouncedConfig.steps.map(s => s.query),
        debouncedConfig.bindingKey,
        debouncedConfig.steps.map(s => s.name),
        debouncedConfig.steps.map(s => s.timeToConvert || null),
        true // includeTimeMetrics
      )
      return result
    } catch (error) {
      console.error('Failed to build server funnel query:', error)
      return null
    }
  }, [prebuiltServerQuery, debouncedConfig, isValidConfig])

  // Create stable query key
  // Include step count explicitly to ensure cache invalidation when steps change
  const queryKey = useMemo(() => {
    if (!serverQuery) return ['cube', 'funnel', null] as const
    const stepCount = serverQuery.funnel?.steps?.length || 0
    return ['cube', 'funnel', stepCount, JSON.stringify(serverQuery)] as const
  }, [serverQuery])

  // Calculate current query key for manual refresh tracking
  const currentQueryKey = serverQuery ? stableStringify(serverQuery) : null

  // Calculate if the current query differs from the last executed query
  const needsRefresh = useMemo(() => {
    if (!manualRefresh) return false
    if (!currentQueryKey) return false
    // On first load (executedQueryKey is null), don't show "needs refresh" - we'll auto-execute
    if (executedQueryKey === null) return false
    // After initial execution, show "needs refresh" when query has changed
    return currentQueryKey !== executedQueryKey
  }, [manualRefresh, currentQueryKey, executedQueryKey])

  // In manual refresh mode, only execute when explicitly triggered
  // In auto mode, execute whenever serverQuery is valid and not skipped
  const shouldExecute = useMemo(() => {
    if (!serverQuery || skip) return false
    if (!manualRefresh) return true // Auto mode: always execute
    // Manual mode: auto-execute on first load (executedQueryKey is null),
    // then require explicit trigger for subsequent changes
    if (executedQueryKey === null) return true // First load: auto-execute
    return executedQueryKey === currentQueryKey
  }, [serverQuery, skip, manualRefresh, executedQueryKey, currentQueryKey])

  // In auto mode, track executed query for consistency
  // This ensures needsRefresh stays false when query auto-executes
  useEffect(() => {
    if (!manualRefresh && serverQuery && !skip) {
      setExecutedQueryKey(currentQueryKey)
    }
  }, [manualRefresh, serverQuery, skip, currentQueryKey])

  // Execute funnel query via TanStack Query
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      if (!serverQuery) {
        throw new Error('No server query available')
      }

      const startTime = performance.now()

      try {
        // Send funnel query to server (single request)
        const resultSet = await cubeApi.load(serverQuery as unknown as CubeQuery)
        const rawData = resultSet.rawData()
        const executionTime = performance.now() - startTime
        const cacheInfo = resultSet.cacheInfo?.()

        return {
          rawData,
          executionTime,
          cacheInfo,
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        onError?.(err, 0)
        throw err
      }
    },
    // Enable when we have a server query (either prebuilt or built from config)
    // In manual refresh mode, only execute when explicitly triggered
    enabled: shouldExecute,
    staleTime: 60000, // 1 minute cache
    gcTime: 5 * 60 * 1000, // 5 minute garbage collection
  })

  // Track when query successfully executes in manual refresh mode
  // This ensures executedQueryKey is set after the first auto-execution,
  // preventing subsequent auto-executions until user clicks refresh
  useEffect(() => {
    // Only relevant in manual refresh mode
    if (!manualRefresh) return

    // When query successfully completes (and we were executing)
    // update the executed query key
    if (shouldExecute && queryResult.isSuccess && !queryResult.isFetching && serverQuery) {
      setExecutedQueryKey(currentQueryKey)
    }
  }, [manualRefresh, shouldExecute, queryResult.isSuccess, queryResult.isFetching, serverQuery, currentQueryKey])

  // Get step names from either config or prebuilt server query
  const stepNames = useMemo(() => {
    if (prebuiltServerQuery?.funnel?.steps) {
      return prebuiltServerQuery.funnel.steps.map(s => s.name)
    }
    return debouncedConfig?.steps?.map(s => s.name)
  }, [prebuiltServerQuery, debouncedConfig])

  // Get expected step count from either config or prebuilt server query
  const expectedStepCount = useMemo(() => {
    if (prebuiltServerQuery?.funnel?.steps) {
      return prebuiltServerQuery.funnel.steps.length
    }
    return debouncedConfig?.steps?.length || 0
  }, [prebuiltServerQuery, debouncedConfig])

  // Transform server result to chart data
  // Validate step count matches to prevent showing stale data during transitions
  const chartData = useMemo<FunnelChartData[]>(() => {
    if (!queryResult.data?.rawData) return []

    // Check if data step count matches expected step count
    const dataStepCount = queryResult.data.rawData.length

    if (dataStepCount !== expectedStepCount) {
      // Data is stale (from a different query) - don't return it
      // This prevents showing mismatched step counts while a new query loads
      return []
    }

    return transformServerFunnelResult(
      queryResult.data.rawData,
      stepNames
    )
  }, [queryResult.data, expectedStepCount, stepNames])

  // Build step results from chart data (for backward compatibility)
  const stepResults = useMemo<FunnelStepResult[]>(() => {
    if (!chartData.length) return []

    const firstCount = chartData[0]?.value || 0

    return chartData.map((data, index) => ({
      stepIndex: index,
      stepName: data.name,
      // Get step ID from config, or generate one for prebuilt queries
      stepId: debouncedConfig?.steps?.[index]?.id || `step-${index}`,
      data: [], // Raw data not available from server funnel
      bindingKeyValues: [], // Not available from server funnel
      bindingKeyTotalCount: 0,
      count: data.value,
      conversionRate: data.conversionRate !== null ? data.conversionRate / 100 : null,
      cumulativeConversionRate: firstCount > 0 ? data.value / firstCount : 0,
      executionTime: queryResult.data?.executionTime || 0,
      error: null,
    }))
  }, [chartData, debouncedConfig, queryResult.data?.executionTime])

  // Build full result for compatibility
  const result = useMemo<FunnelExecutionResult | null>(() => {
    // Need either config or prebuilt query for results
    if (!chartData.length) return null
    if (!debouncedConfig && !prebuiltServerQuery) return null

    const firstCount = chartData[0]?.value || 0
    const lastCount = chartData[chartData.length - 1]?.value || 0

    // Create a config object (use debouncedConfig if available, else synthesize from prebuilt)
    const effectiveConfig: FunnelConfig = debouncedConfig || {
      id: 'prebuilt-funnel',
      name: 'Funnel Analysis',
      bindingKey: {
        dimension: typeof prebuiltServerQuery?.funnel?.bindingKey === 'string'
          ? prebuiltServerQuery.funnel.bindingKey
          : prebuiltServerQuery?.funnel?.bindingKey?.[0]?.dimension || ''
      },
      steps: (prebuiltServerQuery?.funnel?.steps || []).map((s, i) => ({
        id: `step-${i}`,
        name: s.name,
        query: { filters: s.filter ? [s.filter as unknown as import('../../types').Filter] : [] },
        timeToConvert: s.timeToConvert || undefined,
      })),
    }

    const fullResult: FunnelExecutionResult = {
      config: effectiveConfig,
      steps: stepResults,
      summary: {
        totalEntries: firstCount,
        totalCompletions: lastCount,
        overallConversionRate: firstCount > 0 ? lastCount / firstCount : 0,
        totalExecutionTime: queryResult.data?.executionTime || 0,
      },
      chartData,
      status: queryResult.isError
        ? 'error'
        : queryResult.isLoading
          ? 'executing'
          : queryResult.isSuccess
            ? 'success'
            : 'idle',
      error: queryResult.error as Error | null,
      currentStepIndex: null,
    }

    // Call completion callback
    if (queryResult.isSuccess && !queryResult.isFetching) {
      onComplete?.(fullResult)
    }

    return fullResult
  }, [debouncedConfig, prebuiltServerQuery, chartData, stepResults, queryResult, onComplete])

  // Determine current status
  const status: FunnelExecutionResult['status'] = queryResult.isError
    ? 'error'
    : queryResult.isLoading
      ? 'executing'
      : queryResult.isSuccess
        ? 'success'
        : 'idle'

  /**
   * Manually execute/refetch the funnel query
   * Pass { bustCache: true } to bypass both client and server caches
   */
  const execute = useCallback(async (options?: { bustCache?: boolean }): Promise<FunnelExecutionResult | null> => {
    // Allow execution if we have a serverQuery (either from prebuiltServerQuery or built from config)
    if (!serverQuery) return null

    // Mark this query as executed (for manual refresh mode)
    setExecutedQueryKey(currentQueryKey)

    try {
      if (options?.bustCache) {
        // Remove from TanStack Query cache first
        queryClient.removeQueries({ queryKey })
        // Fetch with cache bust header
        await queryClient.fetchQuery({
          queryKey,
          queryFn: async () => {
            const startTime = performance.now()
            const resultSet = await cubeApi.load(
              serverQuery as unknown as CubeQuery,
              { bustCache: true }
            )
            const rawData = resultSet.rawData()
            const executionTime = performance.now() - startTime
            const cacheInfo = resultSet.cacheInfo?.()
            return { rawData, executionTime, cacheInfo }
          },
        })
      } else {
        await queryResult.refetch()
      }
      return result
    } catch {
      return result
    }
  }, [serverQuery, queryResult, result, queryClient, queryKey, cubeApi, currentQueryKey])

  /**
   * Cancel is a no-op for TanStack Query (handled automatically)
   */
  const cancel = useCallback(() => {
    // TanStack Query handles cancellation automatically
  }, [])

  /**
   * Reset clears the query cache
   */
  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey })
  }, [queryClient, queryKey])

  return {
    result,
    status,
    isExecuting: queryResult.isLoading || queryResult.isFetching,
    isDebouncing,
    currentStepIndex: null, // Not applicable for server-side execution
    stepLoadingStates: [], // Not applicable for server-side execution
    stepResults,
    chartData,
    error: queryResult.error as Error | null,
    execute,
    cancel,
    reset,
    // Not exposing executedQueries - server builds the query internally
    executedQueries: [],
    // Expose the server query for debug panel display
    // This is the actual { funnel: {...} } query sent to the server
    serverQuery,
    cacheInfo: queryResult.data?.cacheInfo ?? null,
    // Manual refresh mode support
    needsRefresh,
  }
}

/**
 * Create a stable query key for funnel queries
 */
export function createFunnelQueryKey(
  config: FunnelConfig | null
): readonly unknown[] {
  if (!config) return ['cube', 'funnel', null] as const
  // Create a stable key based on config
  return ['cube', 'funnel', JSON.stringify(config)] as const
}

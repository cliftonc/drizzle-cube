/**
 * useFlowQuery - Hook for server-side flow query execution
 *
 * Executes flow queries on the server for bidirectional Sankey chart data.
 * Flow queries explore paths BEFORE and AFTER a defined starting step.
 *
 * The server returns { nodes: [], links: [] } structure ready for Sankey visualization.
 */

import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCubeApi } from '../../providers/CubeApiProvider'
import { useDebounceQuery } from '../useDebounceQuery'
import type { CubeQuery } from '../../types'
import type {
  ServerFlowQuery,
  FlowChartData,
} from '../../types/flow'
import { isSankeyData } from '../../types/flow'

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 300

/**
 * Options for useFlowQuery hook
 */
export interface UseFlowQueryOptions {
  /** Skip query execution */
  skip?: boolean
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Callback when query completes successfully */
  onComplete?: (data: FlowChartData) => void
  /** Callback when query fails */
  onError?: (error: Error) => void
}

/**
 * Result from useFlowQuery hook
 */
export interface UseFlowQueryResult {
  /** Transformed flow chart data (nodes and links) */
  data: FlowChartData | null
  /** Raw data from server */
  rawData: unknown[] | null
  /** Cache metadata when served from cache */
  cacheInfo?: { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | null
  /** Is initial load in progress */
  isLoading: boolean
  /** Is refetch in progress */
  isFetching: boolean
  /** Is waiting for debounce */
  isDebouncing: boolean
  /** Is executing (loading or fetching) */
  isExecuting: boolean
  /** Error if query failed */
  error: Error | null
  /** Refetch the query. Pass { bustCache: true } to bypass client and server caches. */
  refetch: (options?: { bustCache?: boolean }) => void
  /** Reset the query cache */
  reset: () => void
  /** The server query being executed */
  serverQuery: ServerFlowQuery | null
}

/**
 * Check if a ServerFlowQuery is valid for execution
 */
function isValidFlowQuery(query: ServerFlowQuery | null): boolean {
  if (!query?.flow) return false

  const { flow } = query

  // Must have binding key
  if (!flow.bindingKey) return false

  // Must have time dimension
  if (!flow.timeDimension) return false

  // Must have event dimension
  if (!flow.eventDimension) return false

  // Must have starting step with filter
  if (!flow.startingStep?.filter) return false

  // Must have valid depth
  if (flow.stepsBefore < 0 || flow.stepsBefore > 5) return false
  if (flow.stepsAfter < 0 || flow.stepsAfter > 5) return false

  return true
}

/**
 * Transform raw server result to FlowChartData
 */
function transformFlowResult(rawData: unknown[]): FlowChartData | null {
  // Server returns a single row with { nodes: [], links: [] } structure
  if (rawData.length === 1) {
    const row = rawData[0]
    if (row && typeof row === 'object' && 'nodes' in row && 'links' in row) {
      return row as FlowChartData
    }
  }

  // Alternative: Server might return nodes and links as separate items
  // or the entire array might be the flow result
  if (rawData.length > 0) {
    const firstItem = rawData[0]
    // Check if it looks like Sankey data using type guard
    if (firstItem && typeof firstItem === 'object' && isSankeyData(firstItem)) {
      return firstItem as FlowChartData
    }
  }

  return null
}

/**
 * Hook for server-side flow query execution
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useFlowQuery(serverFlowQuery, {
 *   debounceMs: 300,
 *   skip: !isConfigured
 * })
 *
 * // Results available after single server request
 * <SankeyChart data={data} />
 * ```
 */
export function useFlowQuery(
  query: ServerFlowQuery | null,
  options: UseFlowQueryOptions = {}
): UseFlowQueryResult {
  const {
    skip = false,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    onComplete,
    onError,
  } = options

  const { cubeApi } = useCubeApi()
  const queryClient = useQueryClient()

  // Validate query
  const isValid = isValidFlowQuery(query)

  // Use shared debounce hook
  const { debouncedValue: debouncedQuery, isDebouncing } = useDebounceQuery(
    query,
    {
      isValid,
      skip,
      debounceMs,
    }
  )

  // Create stable query key string for the debounced query (used for TanStack Query cache key)
  const queryKeyString = useMemo(() => {
    if (!debouncedQuery) return null
    return JSON.stringify(debouncedQuery)
  }, [debouncedQuery])

  // Create stable query key string for the RAW input query (used for staleness detection)
  // This detects when the input query has changed but debounce hasn't completed yet
  const rawQueryKeyString = useMemo(() => {
    if (!query) return null
    return JSON.stringify(query)
  }, [query])

  // Create stable query key
  const queryKey = useMemo(() => {
    if (!debouncedQuery) return ['cube', 'flow', null] as const
    return ['cube', 'flow', queryKeyString] as const
  }, [debouncedQuery, queryKeyString])

  // Execute flow query via TanStack Query
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      if (!debouncedQuery) {
        throw new Error('No flow query available')
      }

      const startTime = performance.now()

      try {
        // Send flow query to server (single request)
        const resultSet = await cubeApi.load(
          debouncedQuery as unknown as CubeQuery
        )
      const rawData = resultSet.rawData()
      const executionTime = performance.now() - startTime
      const cacheInfo = resultSet.cacheInfo?.()

      return {
        rawData,
        executionTime,
        cacheInfo,
        // Include query key in result so we can detect stale data
        // (data from a different query key, e.g., sankey vs sunburst mode)
          // We store the RAW query key so we can compare against the current raw query
          queryKeyString: rawQueryKeyString,
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        onError?.(err)
        throw err
      }
    },
    enabled: !skip && isValid && !!debouncedQuery,
    staleTime: 60000, // 1 minute cache
    gcTime: 5 * 60 * 1000, // 5 minute garbage collection
  })

  // Check if data is stale (from a different query key)
  // This happens when switching between sankey/sunburst modes
  // We compare the current RAW query key with the one stored in the data
  // This catches staleness even during debounce (when debouncedQuery hasn't updated yet)
  const isDataStale = rawQueryKeyString !== null &&
    queryResult.data?.queryKeyString !== undefined &&
    queryResult.data.queryKeyString !== rawQueryKeyString

  // Transform server result to chart data
  // Return null if data is stale (from a different query) to show loading instead
  const chartData = useMemo<FlowChartData | null>(() => {
    // If data is stale (from different query), return null to show loading
    if (isDataStale) return null

    if (!queryResult.data?.rawData) return null

    const transformed = transformFlowResult(queryResult.data.rawData)

    // Call completion callback
    if (transformed && queryResult.isSuccess && !queryResult.isFetching) {
      onComplete?.(transformed)
    }

    return transformed
  }, [queryResult.data, queryResult.isSuccess, queryResult.isFetching, onComplete, isDataStale])

  /**
   * Refetch the flow query
   * Pass { bustCache: true } to bypass both client and server caches
   */
  const refetch = useCallback((options?: { bustCache?: boolean }) => {
    if (debouncedQuery && isValid) {
      if (options?.bustCache) {
        // Remove from TanStack Query cache first
        queryClient.removeQueries({ queryKey })
        // Fetch with cache bust header
        queryClient.fetchQuery({
          queryKey,
          queryFn: async () => {
            const startTime = performance.now()
            const resultSet = await cubeApi.load(
              debouncedQuery as unknown as CubeQuery,
              { bustCache: true }
            )
            const rawData = resultSet.rawData()
            const executionTime = performance.now() - startTime
            const cacheInfo = resultSet.cacheInfo?.()
            return { rawData, executionTime, cacheInfo }
          },
        })
      } else {
        queryResult.refetch()
      }
    }
  }, [debouncedQuery, isValid, queryResult, queryClient, queryKey, cubeApi])

  /**
   * Reset clears the query cache
   */
  const reset = useCallback(() => {
    queryClient.removeQueries({ queryKey })
  }, [queryClient, queryKey])

  return {
    data: chartData,
    rawData: isDataStale ? null : (queryResult.data?.rawData ?? null),
    cacheInfo: queryResult.data?.cacheInfo ?? null,
    isLoading: queryResult.isLoading || isDataStale,
    isFetching: queryResult.isFetching,
    isDebouncing,
    isExecuting: queryResult.isLoading || queryResult.isFetching || isDataStale,
    error: queryResult.error as Error | null,
    refetch,
    reset,
    serverQuery: debouncedQuery,
  }
}

/**
 * Create a stable query key for flow queries
 */
export function createFlowQueryKey(
  query: ServerFlowQuery | null
): readonly unknown[] {
  if (!query) return ['cube', 'flow', null] as const
  return ['cube', 'flow', JSON.stringify(query)] as const
}

/**
 * useCubeLoadQuery - TanStack Query hook for cube data loading
 *
 * Features:
 * - Built-in debouncing to prevent excessive API calls
 * - Automatic query deduplication
 * - Background refetch support
 * - Proper loading/error states
 * - Query key based on query content for caching
 *
 * This hook replaces the manual debouncing and query execution
 * in useQueryExecution.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useCubeApi } from '../../providers/CubeApiProvider'
import { useCubeFeatures } from '../../providers/CubeFeaturesProvider'
import type { CubeQuery, CubeResultSet } from '../../types'
import type { QueryWarning } from '../../shared/types'
import { cleanQueryForServer } from '../../shared/utils'
import { stableStringify } from '../../shared/queryKey'
import { useDebounceQuery } from '../useDebounceQuery'

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 300

/**
 * Create a stable query key from a CubeQuery
 * The key includes all query parameters to ensure proper caching
 */
export function createQueryKey(query: CubeQuery | null): readonly unknown[] {
  if (!query) return ['cube', 'load', null] as const
  // Use JSON.stringify for deep equality comparison
  return ['cube', 'load', stableStringify(query)] as const
}

export interface UseCubeLoadQueryOptions {
  /**
   * Whether to skip the query
   * @default false
   */
  skip?: boolean
  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number
  /**
   * Whether to reset result set when query changes
   * @default true
   */
  resetResultSetOnChange?: boolean
  /**
   * Stale time in milliseconds
   * @default 60 * 1000 (1 minute)
   */
  staleTime?: number
  /**
   * Whether to keep previous data while loading new data
   * @default true
   */
  keepPreviousData?: boolean
}

/** Options for the refetch function */
export interface RefetchOptions {
  /** If true, bypasses both client and server caches */
  bustCache?: boolean
}

export interface UseCubeLoadQueryResult {
  /** The result set from the query */
  resultSet: CubeResultSet | null
  /** Raw data from the result set */
  rawData: unknown[] | null
  /** Whether the query is loading (initial load) */
  isLoading: boolean
  /** Whether the query is fetching (includes refetch) */
  isFetching: boolean
  /** Whether query is debouncing (waiting for user to stop typing) */
  isDebouncing: boolean
  /** Error if the query failed */
  error: Error | null
  /** The debounced query that was executed */
  debouncedQuery: CubeQuery | null
  /** Whether the current query is valid */
  isValidQuery: boolean
  /** Manually refetch the data. Pass { bustCache: true } to bypass caches. */
  refetch: (options?: RefetchOptions) => void
  /** Clear the query cache */
  clearCache: () => void
  /**
   * Whether the query needs to be refreshed (manual refresh mode only).
   * True when the current query config differs from the last executed query.
   */
  needsRefresh: boolean
  /**
   * Execute the current query (manual refresh mode only).
   * In auto-refresh mode, this is the same as refetch().
   */
  executeQuery: (options?: RefetchOptions) => void
  /** Warnings from query planning (e.g., fan-out without dimensions) */
  warnings: QueryWarning[] | undefined
}

/**
 * Check if a query is valid (has at least one measure or dimension)
 */
function isValidCubeQuery(query: CubeQuery | null): boolean {
  if (!query) return false
  const hasMeasures = Boolean(query.measures && query.measures.length > 0)
  const hasDimensions = Boolean(query.dimensions && query.dimensions.length > 0)
  const hasTimeDimensions = Boolean(query.timeDimensions && query.timeDimensions.length > 0)
  return hasMeasures || hasDimensions || hasTimeDimensions
}

/**
 * TanStack Query hook for loading cube data with debouncing
 *
 * Usage:
 * ```tsx
 * const { resultSet, rawData, isLoading, error } = useCubeLoadQuery(query, {
 *   debounceMs: 300,
 *   skip: !isReady
 * })
 * ```
 */
export function useCubeLoadQuery(
  query: CubeQuery | null,
  options: UseCubeLoadQueryOptions = {}
): UseCubeLoadQueryResult {
  const {
    skip = false,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    resetResultSetOnChange = true,
    staleTime = 60 * 1000,
    keepPreviousData = true,
  } = options

  const { cubeApi, batchCoordinator, enableBatching } = useCubeApi()
  const queryClient = useQueryClient()

  // Get manual refresh mode from features
  const { features } = useCubeFeatures()
  const manualRefresh = features.manualRefresh ?? false

  // Track the last executed query (for manual refresh mode)
  // This is the query that was last sent to the server
  const [executedQueryKey, setExecutedQueryKey] = useState<string | null>(null)

  // Validate query
  const isValidQuery = isValidCubeQuery(query)

  // Silence unused variable warning - used for future functionality
  void resetResultSetOnChange

  // Use shared debounce hook
  const { debouncedValue: debouncedQuery, isDebouncing } = useDebounceQuery(query, {
    isValid: isValidQuery,
    skip,
    debounceMs,
  })

  // Transform query for server (converts filter groups)
  const serverQuery = useMemo(() => {
    if (!debouncedQuery) return null
    return cleanQueryForServer(debouncedQuery)
  }, [debouncedQuery])

  // Calculate if the current query differs from the last executed query
  const currentQueryKey = serverQuery ? stableStringify(serverQuery) : null
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

  // Ref to track when the next fetch should bust the cache
  // This is used instead of replacing the queryFn to avoid the queryFn getting "stuck" with bustCache=true
  const bustCacheRef = useRef(false)

  // Execute query with TanStack Query
  const queryResult = useQuery({
    queryKey: createQueryKey(serverQuery),
    queryFn: async () => {
      if (!serverQuery) throw new Error('No query provided')

      // Check if this fetch should bust the cache
      const shouldBustCache = bustCacheRef.current
      // Reset the flag immediately so subsequent fetches don't bust cache
      bustCacheRef.current = false

      // When busting cache, bypass batch coordinator and make direct API call
      if (shouldBustCache) {
        return cubeApi.load(serverQuery, { bustCache: true })
      }

      // Use batch coordinator if enabled (collects queries for 100ms window)
      if (enableBatching && batchCoordinator) {
        return batchCoordinator.register(serverQuery)
      }

      // Fall back to direct load when batching disabled
      return cubeApi.load(serverQuery)
    },
    enabled: shouldExecute,
    staleTime,
    placeholderData: keepPreviousData ? (prevData) => prevData : undefined,
  })

  // In auto mode, track executed query for consistency
  // This ensures needsRefresh stays false when query auto-executes
  useEffect(() => {
    if (!manualRefresh && serverQuery && !skip) {
      setExecutedQueryKey(currentQueryKey)
    }
  }, [manualRefresh, serverQuery, skip, currentQueryKey])

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

  // Extract raw data from result set
  const rawData = useMemo(() => {
    if (!queryResult.data) return null
    try {
      return queryResult.data.rawData()
    } catch {
      return null
    }
  }, [queryResult.data])

  // Extract warnings from result set
  const warnings = useMemo((): QueryWarning[] | undefined => {
    if (!queryResult.data?.loadResponse) return undefined
    const lr = queryResult.data.loadResponse
    // Handle nested structure: loadResponse.results[0].warnings
    if (lr.results && lr.results[0]?.warnings) {
      return lr.results[0].warnings
    }
    // Handle flat structure: loadResponse.warnings
    return lr.warnings
  }, [queryResult.data])

  // Execute query function - for manual refresh mode, triggers execution
  // Also serves as refetch in auto mode
  const executeQuery = useCallback((options?: RefetchOptions) => {
    if (!serverQuery) return

    // Mark this query as executed (for manual refresh mode)
    setExecutedQueryKey(currentQueryKey)

    if (options?.bustCache) {
      // Set the ref flag so the queryFn knows to bypass cache
      // The flag is reset inside queryFn after reading it
      bustCacheRef.current = true
    }

    // Invalidate and refetch - invalidateQueries marks as stale AND triggers refetch
    // when the query is being observed (which it is, via useQuery)
    queryClient.invalidateQueries({ queryKey: createQueryKey(serverQuery) })
  }, [serverQuery, currentQueryKey, queryClient])

  // Refetch is an alias for executeQuery for backward compatibility
  const refetch = executeQuery

  // Clear cache function
  const clearCache = () => {
    queryClient.removeQueries({ queryKey: ['cube', 'load'] })
  }

  // Handle resetResultSetOnChange
  const resultSet = useMemo(() => {
    if (resetResultSetOnChange && isDebouncing) {
      // Keep showing old data while debouncing
      return queryResult.data ?? null
    }
    return queryResult.data ?? null
  }, [queryResult.data, isDebouncing, resetResultSetOnChange])

  return {
    resultSet,
    rawData,
    isLoading: queryResult.isLoading || isDebouncing,
    isFetching: queryResult.isFetching,
    isDebouncing,
    error: queryResult.error,
    debouncedQuery,
    isValidQuery,
    refetch,
    clearCache,
    needsRefresh,
    executeQuery,
    warnings,
  }
}

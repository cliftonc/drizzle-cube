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
import { useMemo } from 'react'
import { useCubeApi } from '../../providers/CubeApiProvider'
import type { CubeQuery, CubeResultSet } from '../../types'
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
  /** Manually refetch the data */
  refetch: () => void
  /** Clear the query cache */
  clearCache: () => void
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

  const { cubeApi } = useCubeApi()
  const queryClient = useQueryClient()

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

  // Execute query with TanStack Query
  const queryResult = useQuery({
    queryKey: createQueryKey(serverQuery),
    queryFn: async () => {
      if (!serverQuery) throw new Error('No query provided')
      return cubeApi.load(serverQuery)
    },
    enabled: !!serverQuery && !skip,
    staleTime,
    placeholderData: keepPreviousData ? (prevData) => prevData : undefined,
  })

  // Extract raw data from result set
  const rawData = useMemo(() => {
    if (!queryResult.data) return null
    try {
      return queryResult.data.rawData()
    } catch {
      return null
    }
  }, [queryResult.data])

  // Refetch function - forces immediate refetch
  const refetch = () => {
    if (serverQuery) {
      queryClient.refetchQueries({ queryKey: createQueryKey(serverQuery) })
    }
  }

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
  }
}

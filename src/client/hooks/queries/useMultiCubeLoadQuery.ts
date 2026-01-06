/**
 * useMultiCubeLoadQuery - TanStack Query hook for multi-cube data loading
 *
 * Features:
 * - Execute multiple cube queries in parallel
 * - Merge results using configurable strategies
 * - Built-in debouncing to prevent excessive API calls
 * - Per-query error tracking
 * - BatchCoordinator integration for dashboard-level batching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import type { MultiQueryConfig, CubeResultSet } from '../../types'
import { cleanQueryForServer } from '../../shared/utils'
import { mergeQueryResults } from '../../utils/multiQueryUtils'

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 300

/**
 * Create a stable query key for multi-query
 */
export function createMultiQueryKey(
  config: MultiQueryConfig | null
): readonly unknown[] {
  if (!config) return ['cube', 'multiLoad', null] as const
  return ['cube', 'multiLoad', JSON.stringify(config)] as const
}

export interface UseMultiCubeLoadQueryOptions {
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
}

export interface UseMultiCubeLoadQueryResult {
  /** Merged data from all queries */
  data: unknown[] | null
  /** Individual result sets from each query */
  resultSets: (CubeResultSet | null)[] | null
  /** Per-query raw data */
  perQueryData: (unknown[] | null)[] | null
  /** Whether any query is still loading (initial load) */
  isLoading: boolean
  /** Whether any query is fetching (includes refetch) */
  isFetching: boolean
  /** Whether query is debouncing (waiting for user to stop typing) */
  isDebouncing: boolean
  /** First error encountered */
  error: Error | null
  /** Per-query errors */
  errors: (Error | null)[]
  /** The debounced config that was executed */
  debouncedConfig: MultiQueryConfig | null
  /** Whether the current config is valid */
  isValidConfig: boolean
  /** Manually refetch the data */
  refetch: () => void
}

/**
 * Check if a MultiQueryConfig is valid (has at least 2 valid queries)
 */
function isValidMultiQueryConfig(config: MultiQueryConfig | null): boolean {
  if (!config || !config.queries || config.queries.length < 2) return false

  const validQueries = config.queries.filter(
    (q) =>
      (q.measures && q.measures.length > 0) ||
      (q.dimensions && q.dimensions.length > 0) ||
      (q.timeDimensions && q.timeDimensions.length > 0)
  )

  return validQueries.length >= 2
}

/**
 * TanStack Query hook for loading multi-cube data with debouncing
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useMultiCubeLoadQuery(config, {
 *   debounceMs: 300,
 *   skip: !isMultiQueryMode
 * })
 * ```
 */
export function useMultiCubeLoadQuery(
  config: MultiQueryConfig | null,
  options: UseMultiCubeLoadQueryOptions = {}
): UseMultiCubeLoadQueryResult {
  const {
    skip = false,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    resetResultSetOnChange: _resetResultSetOnChange = true,
    staleTime = 60 * 1000,
  } = options

  // Silence unused variable warning - used for future functionality
  void _resetResultSetOnChange

  const { cubeApi, batchCoordinator, enableBatching } = useCubeContext()
  const queryClient = useQueryClient()

  // Debounced config state
  const [debouncedConfig, setDebouncedConfig] =
    useState<MultiQueryConfig | null>(null)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastConfigStringRef = useRef<string>('')
  const wasSkippedRef = useRef<boolean>(skip)

  // Validate config
  const isValidConfig = isValidMultiQueryConfig(config)

  // Serialize config for comparison
  const configString = useMemo(() => {
    if (!config) return ''
    return JSON.stringify(config)
  }, [config])

  // Debounce the config changes
  useEffect(() => {
    // Detect skip-to-unskip transition (e.g., portlet becoming visible)
    const wasSkipped = wasSkippedRef.current
    const justBecameUnskipped = wasSkipped && !skip
    wasSkippedRef.current = skip

    // Skip if config hasn't actually changed AND we haven't just become unskipped
    // The justBecameUnskipped check ensures we re-trigger when visibility changes
    if (configString === lastConfigStringRef.current && !justBecameUnskipped) {
      return
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // If config is valid, set debouncing state and schedule update
    if (isValidConfig && !skip) {
      setIsDebouncing(true)
      debounceTimerRef.current = setTimeout(() => {
        lastConfigStringRef.current = configString
        setDebouncedConfig(config)
        setIsDebouncing(false)
      }, debounceMs)
    } else {
      // Clear debounced config if invalid or skipped
      lastConfigStringRef.current = configString
      setDebouncedConfig(null)
      setIsDebouncing(false)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [configString, isValidConfig, skip, debounceMs, config])

  // Transform queries for server
  const serverConfig = useMemo(() => {
    if (!debouncedConfig) return null
    return {
      ...debouncedConfig,
      queries: debouncedConfig.queries.map((q) => cleanQueryForServer(q)),
    }
  }, [debouncedConfig])

  // Execute multi-query with TanStack Query
  const queryResult = useQuery({
    queryKey: createMultiQueryKey(serverConfig),
    queryFn: async () => {
      if (!serverConfig) throw new Error('No config provided')

      let resultSets: CubeResultSet[]

      // Use BatchCoordinator if enabled
      if (enableBatching && batchCoordinator) {
        resultSets = await Promise.all(
          serverConfig.queries.map((query) => batchCoordinator.register(query))
        )
      } else {
        // Direct batch call
        resultSets = await cubeApi.batchLoad(serverConfig.queries)
      }

      // Track per-query errors
      const errors: (Error | null)[] = resultSets.map((rs) => {
        if (rs && 'error' in rs && (rs as { error?: string }).error) {
          return new Error((rs as { error: string }).error)
        }
        return null
      })

      // Get per-query raw data
      const perQueryData: (unknown[] | null)[] = resultSets.map((rs, i) => {
        if (errors[i]) return null
        try {
          return rs.rawData()
        } catch {
          return null
        }
      })

      // Filter successful results for merging
      const successfulResults = resultSets.filter((_, i) => !errors[i])
      const successfulQueries = serverConfig.queries.filter((_, i) => !errors[i])

      // Merge results using configured strategy
      const data =
        successfulResults.length > 0
          ? mergeQueryResults(
              successfulResults,
              successfulQueries,
              serverConfig.mergeStrategy,
              serverConfig.mergeKeys,
              serverConfig.queryLabels
            )
          : []

      return {
        data,
        resultSets,
        perQueryData,
        errors,
        firstError: errors.find((e) => e !== null) || null,
      }
    },
    enabled: !!serverConfig && !skip,
    staleTime,
    placeholderData: (prevData) => prevData,
  })

  // Refetch function - forces immediate refetch
  const refetch = () => {
    if (serverConfig) {
      queryClient.refetchQueries({
        queryKey: createMultiQueryKey(serverConfig),
      })
    }
  }

  // Extract data from query result
  const data = queryResult.data?.data ?? null
  const resultSets = queryResult.data?.resultSets ?? null
  const perQueryData = queryResult.data?.perQueryData ?? null
  const errors = queryResult.data?.errors ?? []
  const error = queryResult.data?.firstError ?? queryResult.error

  return {
    data,
    resultSets,
    perQueryData,
    isLoading: queryResult.isLoading || isDebouncing,
    isFetching: queryResult.isFetching,
    isDebouncing,
    error,
    errors,
    debouncedConfig,
    isValidConfig,
    refetch,
  }
}

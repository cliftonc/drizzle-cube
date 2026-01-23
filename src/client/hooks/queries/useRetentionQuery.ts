/**
 * useRetentionQuery - Hook for server-side retention query execution
 *
 * Executes retention queries on the server using SQL generation.
 * Returns cohort-based retention data for heatmap visualization.
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCubeApi } from '../../providers/CubeApiProvider'
import { useCubeFeatures } from '../../providers/CubeFeaturesProvider'
import { useDebounceQuery } from '../useDebounceQuery'
import { stableStringify } from '../../shared/queryKey'
import type { CubeQuery } from '../../types'
import type {
  ServerRetentionQuery,
  RetentionChartData,
  RetentionResultRow,
  RetentionSummary,
  RetentionGranularity,
} from '../../types/retention'

// Default debounce delay in milliseconds
const DEFAULT_DEBOUNCE_MS = 300

/**
 * Options for retention query hook
 */
export interface UseRetentionQueryOptions {
  /** Skip execution */
  skip?: boolean
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Callback when query completes */
  onComplete?: (result: RetentionChartData) => void
  /** Callback when query fails */
  onError?: (error: Error) => void
  /** Function to resolve field names to human-readable display labels */
  getFieldLabel?: (fieldName: string) => string
}

/**
 * Result from retention query hook
 */
export interface UseRetentionQueryResult {
  /** Retention chart data */
  chartData: RetentionChartData | null

  /** Raw data rows from server */
  rawData: RetentionResultRow[] | null

  /** Current execution status */
  status: 'idle' | 'loading' | 'success' | 'error'

  /** Whether currently loading */
  isLoading: boolean

  /** Whether fetching (includes refetch) */
  isFetching: boolean

  /** Whether waiting for debounce */
  isDebouncing: boolean

  /** Error if execution failed */
  error: Error | null

  /** Cache metadata when served from cache */
  cacheInfo?: { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | null

  /** Execute the query (for manual refresh mode) */
  execute: (options?: { bustCache?: boolean }) => Promise<RetentionChartData | null>

  /** Refetch the query */
  refetch: () => void

  /**
   * Whether the query needs to be refreshed (manual refresh mode only).
   * True when the current query config differs from the last executed query.
   */
  needsRefresh: boolean
}

/**
 * Check if a ServerRetentionQuery is valid for execution
 * Uses new simplified Mixpanel-style format with single timeDimension
 */
function isValidRetentionQuery(query: ServerRetentionQuery | null): boolean {
  if (!query) return false
  if (!query.retention) return false
  if (!query.retention.timeDimension) return false
  if (!query.retention.bindingKey) return false
  if (!query.retention.periods || query.retention.periods < 1) return false
  return true
}

/**
 * Extract the human-readable label from the binding key
 * e.g., "Users.userId" → "userId", "Events.customerId" → "customerId"
 */
function extractBindingKeyLabel(
  bindingKey: ServerRetentionQuery['retention']['bindingKey'] | undefined
): string | undefined {
  if (!bindingKey) return undefined

  // String format: "Cube.dimensionName" → "dimensionName"
  if (typeof bindingKey === 'string') {
    return bindingKey.split('.').pop()
  }

  // Array format: [{ cube, dimension }] → extract first dimension's name
  if (Array.isArray(bindingKey) && bindingKey.length > 0) {
    const firstMapping = bindingKey[0]
    if (firstMapping?.dimension) {
      return firstMapping.dimension.split('.').pop()
    }
  }

  return undefined
}

/**
 * Extract breakdown value from server response
 * Server returns breakdownValues as an object like {"PREvents.eventType": "approved"}
 * We extract the first (and typically only) value from this object
 */
function extractBreakdownValue(
  breakdownValues: unknown
): string | null {
  // If it's already a string, return it
  if (typeof breakdownValues === 'string') {
    return breakdownValues
  }

  // If it's an object, extract the first value
  if (breakdownValues && typeof breakdownValues === 'object' && !Array.isArray(breakdownValues)) {
    const values = Object.values(breakdownValues as Record<string, unknown>)
    if (values.length > 0 && values[0] != null) {
      return String(values[0])
    }
  }

  return null
}

/**
 * Transform raw server data to RetentionChartData format
 * New simplified format: rows with period, cohortSize, retainedUsers, retentionRate, breakdownValue
 */
function transformRetentionResult(
  rawData: unknown[],
  granularity?: RetentionGranularity,
  bindingKeyLabel?: string
): RetentionChartData {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    return { rows: [], periods: [], granularity, bindingKeyLabel }
  }

  const rows: RetentionResultRow[] = rawData.map((row: unknown) => {
    const r = row as Record<string, unknown>
    return {
      period: Number(r.period ?? r.period_number ?? 0),
      cohortSize: Number(r.cohortSize ?? r.cohort_size ?? 0),
      retainedUsers: Number(r.retainedUsers ?? r.retained_users ?? 0),
      retentionRate: Number(r.retentionRate ?? r.retention_rate ?? 0),
      // Server returns breakdownValues (object) or breakdownValue (string) or breakdown_value (snake_case)
      breakdownValue: extractBreakdownValue(r.breakdownValues) ?? r.breakdownValue ?? r.breakdown_value ?? null,
    } as RetentionResultRow
  })

  // Extract unique periods and breakdown values
  const periodsSet = new Set<number>()
  const breakdownSet = new Set<string>()

  rows.forEach((row) => {
    periodsSet.add(row.period)
    if (row.breakdownValue) {
      breakdownSet.add(row.breakdownValue)
    }
  })

  const periods = Array.from(periodsSet).sort((a, b) => a - b)
  const breakdownValues = breakdownSet.size > 0 ? Array.from(breakdownSet).sort() : undefined

  // Calculate summary statistics
  const summary = calculateSummary(rows, breakdownValues)

  return { rows, periods, breakdownValues, summary, granularity, bindingKeyLabel }
}

/**
 * Calculate summary statistics from retention data
 */
function calculateSummary(
  rows: RetentionResultRow[],
  breakdownValues?: string[]
): RetentionSummary {
  const period1Rows = rows.filter((r) => r.period === 1)
  const period1Rates = period1Rows.map((r) => r.retentionRate)

  const totalUsers = rows
    .filter((r) => r.period === 0)
    .reduce((sum, r) => sum + r.cohortSize, 0)

  return {
    totalUsers,
    avgPeriod1Retention:
      period1Rates.length > 0
        ? period1Rates.reduce((a, b) => a + b, 0) / period1Rates.length
        : 0,
    maxPeriod1Retention: period1Rates.length > 0 ? Math.max(...period1Rates) : 0,
    minPeriod1Retention: period1Rates.length > 0 ? Math.min(...period1Rates) : 0,
    segmentCount: breakdownValues?.length || 1,
  }
}

/**
 * Hook for server-side retention query execution
 *
 * Usage:
 * ```tsx
 * const { chartData, isLoading, error } = useRetentionQuery(serverQuery, {
 *   debounceMs: 300,
 *   skip: !hasRequiredFields
 * })
 *
 * <RetentionHeatmap data={chartData} />
 * ```
 */
export function useRetentionQuery(
  serverQuery: ServerRetentionQuery | null,
  options: UseRetentionQueryOptions = {}
): UseRetentionQueryResult {
  const { skip = false, debounceMs = DEFAULT_DEBOUNCE_MS, onComplete, onError, getFieldLabel } = options

  const { cubeApi } = useCubeApi()
  const queryClient = useQueryClient()

  // Get manual refresh mode from features
  const { features } = useCubeFeatures()
  const manualRefresh = features.manualRefresh ?? false

  // Track the last executed query (for manual refresh mode)
  const [executedQueryKey, setExecutedQueryKey] = useState<string | null>(null)

  // Validate query
  const isValidQuery = isValidRetentionQuery(serverQuery)

  // Use shared debounce hook
  const { debouncedValue: debouncedQuery, isDebouncing } = useDebounceQuery(serverQuery, {
    isValid: isValidQuery,
    skip,
    debounceMs,
  })

  // Create stable query key
  const queryKey = useMemo(() => {
    if (!debouncedQuery) return ['cube', 'retention', null] as const
    return ['cube', 'retention', JSON.stringify(debouncedQuery)] as const
  }, [debouncedQuery])

  // Calculate current query key for manual refresh tracking
  const currentQueryKey = debouncedQuery ? stableStringify(debouncedQuery) : null

  // Calculate if the current query differs from the last executed query
  const needsRefresh = useMemo(() => {
    if (!manualRefresh) return false
    if (!currentQueryKey) return false
    if (executedQueryKey === null) return false
    return currentQueryKey !== executedQueryKey
  }, [manualRefresh, currentQueryKey, executedQueryKey])

  // In manual refresh mode, only execute when explicitly triggered
  const shouldExecute = useMemo(() => {
    if (!debouncedQuery || skip) return false
    if (!manualRefresh) return true
    if (executedQueryKey === null) return true
    return executedQueryKey === currentQueryKey
  }, [debouncedQuery, skip, manualRefresh, executedQueryKey, currentQueryKey])

  // In auto mode, track executed query for consistency
  useEffect(() => {
    if (!manualRefresh && debouncedQuery && !skip) {
      setExecutedQueryKey(currentQueryKey)
    }
  }, [manualRefresh, debouncedQuery, skip, currentQueryKey])

  // Execute retention query via TanStack Query
  const queryResult = useQuery({
    queryKey,
    queryFn: async () => {
      if (!debouncedQuery) {
        throw new Error('No retention query available')
      }

      const startTime = performance.now()

      try {
        // Send retention query to server
        const resultSet = await cubeApi.load(debouncedQuery as unknown as CubeQuery)
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
        onError?.(err)
        throw err
      }
    },
    enabled: shouldExecute,
    staleTime: 60000, // 1 minute cache
    gcTime: 5 * 60 * 1000, // 5 minute garbage collection
  })

  // Track when query successfully executes in manual refresh mode
  useEffect(() => {
    if (!manualRefresh) return
    if (shouldExecute && queryResult.isSuccess && !queryResult.isFetching && debouncedQuery) {
      setExecutedQueryKey(currentQueryKey)
    }
  }, [manualRefresh, shouldExecute, queryResult.isSuccess, queryResult.isFetching, debouncedQuery, currentQueryKey])

  // Extract granularity and binding key label from server query
  const granularity = serverQuery?.retention?.granularity

  // Get the raw binding key field name for label lookup
  const rawBindingKeyField = useMemo(() => {
    const bindingKey = serverQuery?.retention?.bindingKey
    if (!bindingKey) return undefined
    if (typeof bindingKey === 'string') return bindingKey
    if (Array.isArray(bindingKey) && bindingKey.length > 0) {
      return bindingKey[0]?.dimension
    }
    return undefined
  }, [serverQuery?.retention?.bindingKey])

  // Use getFieldLabel if provided, fallback to extractBindingKeyLabel
  const bindingKeyLabel = useMemo(() => {
    if (rawBindingKeyField && getFieldLabel) {
      const label = getFieldLabel(rawBindingKeyField)
      // If getFieldLabel returns the same string, it didn't find a better label
      if (label && label !== rawBindingKeyField) {
        return label
      }
    }
    // Fallback to extracting from the field name
    return extractBindingKeyLabel(serverQuery?.retention?.bindingKey)
  }, [rawBindingKeyField, getFieldLabel, serverQuery?.retention?.bindingKey])

  // Transform server result to chart data
  const chartData = useMemo<RetentionChartData | null>(() => {
    if (!queryResult.data?.rawData) return null
    const result = transformRetentionResult(
      queryResult.data.rawData,
      granularity,
      bindingKeyLabel
    )

    // Call completion callback
    if (queryResult.isSuccess && !queryResult.isFetching) {
      onComplete?.(result)
    }

    return result
  }, [queryResult.data, queryResult.isSuccess, queryResult.isFetching, onComplete, granularity, bindingKeyLabel])

  // Execute function for manual refresh mode
  const execute = useCallback(
    async (executeOptions?: { bustCache?: boolean }) => {
      if (!debouncedQuery) return null

      if (executeOptions?.bustCache) {
        queryClient.removeQueries({ queryKey })
      }

      // Update executed query key to trigger execution
      setExecutedQueryKey(currentQueryKey)

      // Wait for the query to complete
      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: async () => {
          const resultSet = await cubeApi.load(debouncedQuery as unknown as CubeQuery)
          const rawData = resultSet.rawData()
          const cacheInfo = resultSet.cacheInfo?.()
          return { rawData, executionTime: 0, cacheInfo }
        },
      })

      return transformRetentionResult(result.rawData, granularity, bindingKeyLabel)
    },
    [debouncedQuery, queryClient, queryKey, cubeApi, currentQueryKey, granularity, bindingKeyLabel]
  )

  // Refetch function
  const refetch = useCallback(() => {
    queryResult.refetch()
  }, [queryResult])

  // Determine status
  const status = useMemo(() => {
    if (queryResult.isError) return 'error' as const
    if (queryResult.isLoading) return 'loading' as const
    if (queryResult.isSuccess) return 'success' as const
    return 'idle' as const
  }, [queryResult.isError, queryResult.isLoading, queryResult.isSuccess])

  return {
    chartData,
    rawData: queryResult.data?.rawData as RetentionResultRow[] | null ?? null,
    status,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isDebouncing,
    error: queryResult.error as Error | null,
    cacheInfo: queryResult.data?.cacheInfo ?? null,
    execute,
    refetch,
    needsRefresh,
  }
}

/**
 * useDryRunQuery - TanStack Query hook for dry-run (debug) data
 *
 * Features:
 * - Fetch SQL and analysis data for query debugging
 * - Support for single and multi-query modes
 * - Built-in caching with TanStack Query
 * - Parallel fetching for multiple queries
 *
 * This hook replaces the debug data useEffect in AnalysisBuilder.
 */

import { useQuery, useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCubeApi } from '../../providers/CubeApiProvider'
import type { CubeQuery } from '../../types'
import type { QueryAnalysis } from '../../components/AnalysisBuilder/types'
import { cleanQueryForServer } from '../../shared/utils'
import { stableStringify } from '../../shared/queryKey'

/**
 * Debug data entry for a single query
 */
export interface DebugDataEntry {
  /** Generated SQL and parameters */
  sql: { sql: string; params: unknown[] } | null
  /** Query analysis (dimensions, measures, complexity, etc.) */
  analysis: QueryAnalysis | null
  /** Whether this entry is loading */
  loading: boolean
  /** Error if fetch failed */
  error: Error | null
}

/**
 * Create a stable query key for dry-run
 */
export function createDryRunQueryKey(
  query: CubeQuery | null
): readonly unknown[] {
  if (!query) return ['cube', 'dryRun', null] as const
  return ['cube', 'dryRun', stableStringify(query)] as const
}

export interface UseDryRunQueryOptions {
  /**
   * Whether to skip the query
   * @default false
   */
  skip?: boolean
  /**
   * Stale time in milliseconds
   * @default 5 * 60 * 1000 (5 minutes)
   */
  staleTime?: number
}

export interface UseDryRunQueryResult {
  /** Debug data for the query */
  debugData: DebugDataEntry
  /** Manually refetch */
  refetch: () => void
}

/**
 * TanStack Query hook for single query dry-run (debug) data
 *
 * Usage:
 * ```tsx
 * const { debugData } = useDryRunQuery(query, { skip: !isValidQuery })
 * ```
 */
export function useDryRunQuery(
  query: CubeQuery | null,
  options: UseDryRunQueryOptions = {}
): UseDryRunQueryResult {
  const { skip = false, staleTime = 5 * 60 * 1000 } = options
  const { cubeApi } = useCubeApi()

  // Transform query for server
  const serverQuery = useMemo(() => {
    if (!query) return null
    return cleanQueryForServer(query)
  }, [query])

  const queryResult = useQuery({
    queryKey: createDryRunQueryKey(serverQuery),
    queryFn: async () => {
      if (!serverQuery) throw new Error('No query provided')
      const result = await cubeApi.dryRun(serverQuery)
      return {
        sql: result.sql,
        analysis: result.analysis,
      }
    },
    enabled: !!serverQuery && !skip,
    staleTime,
  })

  const debugData: DebugDataEntry = {
    sql: queryResult.data?.sql ?? null,
    analysis: queryResult.data?.analysis ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error ?? null,
  }

  return {
    debugData,
    refetch: () => queryResult.refetch(),
  }
}

export interface UseMultiDryRunQueriesOptions {
  /**
   * Whether to skip all queries
   * @default false
   */
  skip?: boolean
  /**
   * Stale time in milliseconds
   * @default 5 * 60 * 1000 (5 minutes)
   */
  staleTime?: number
}

export interface UseMultiDryRunQueriesResult {
  /** Debug data for each query */
  debugDataPerQuery: DebugDataEntry[]
  /** Whether any query is loading */
  isLoading: boolean
  /** Manually refetch all */
  refetchAll: () => void
}

/**
 * TanStack Query hook for multiple query dry-runs (debug) data
 *
 * Fetches debug data for multiple queries in parallel.
 *
 * Usage:
 * ```tsx
 * const { debugDataPerQuery, isLoading } = useMultiDryRunQueries(queries, {
 *   skip: !isMultiQueryMode
 * })
 * ```
 */
export function useMultiDryRunQueries(
  queries: CubeQuery[],
  options: UseMultiDryRunQueriesOptions = {}
): UseMultiDryRunQueriesResult {
  const { skip = false, staleTime = 5 * 60 * 1000 } = options
  const { cubeApi } = useCubeApi()

  // Transform queries for server
  const serverQueries = useMemo(() => {
    return queries.map((q) => cleanQueryForServer(q))
  }, [queries])

  // Use useQueries for parallel fetching
  const queryResults = useQueries({
    queries: serverQueries.map((query) => ({
      queryKey: createDryRunQueryKey(query),
      queryFn: async () => {
        const result = await cubeApi.dryRun(query)
        return {
          sql: result.sql,
          analysis: result.analysis,
        }
      },
      enabled: !skip,
      staleTime,
    })),
  })

  // Transform results to DebugDataEntry array
  const debugDataPerQuery: DebugDataEntry[] = queryResults.map((result) => ({
    sql: result.data?.sql ?? null,
    analysis: result.data?.analysis ?? null,
    loading: result.isLoading,
    error: result.error ?? null,
  }))

  // Check if any query is loading
  const isLoading = queryResults.some((r) => r.isLoading)

  // Refetch all queries
  const refetchAll = () => {
    queryResults.forEach((r) => r.refetch())
  }

  return {
    debugDataPerQuery,
    isLoading,
    refetchAll,
  }
}

/**
 * Combined hook for single or multi-query dry-run based on mode
 *
 * This is a convenience wrapper that automatically chooses between
 * single and multi-query dry-run based on the number of queries.
 *
 * Usage:
 * ```tsx
 * const { debugDataPerQuery } = useDryRunQueries({
 *   queries: isMultiQueryMode ? allQueries : [currentQuery],
 *   isMultiQueryMode,
 *   skip: !isValidQuery
 * })
 * ```
 */
export function useDryRunQueries(options: {
  queries: CubeQuery[]
  isMultiQueryMode: boolean
  skip?: boolean
  staleTime?: number
}): UseMultiDryRunQueriesResult {
  const { queries, isMultiQueryMode, skip = false, staleTime } = options

  // For single query mode, wrap in array for consistent interface
  const queriesToFetch = isMultiQueryMode ? queries : queries.slice(0, 1)

  return useMultiDryRunQueries(queriesToFetch, { skip, staleTime })
}

/**
 * Debug data entry for funnel queries
 */
export interface FunnelDebugDataEntry extends DebugDataEntry {
  /** Funnel-specific metadata from server */
  funnelMetadata?: {
    stepCount: number
    steps: Array<{
      index: number
      name: string
      timeToConvert?: string
      cube?: string
    }>
    bindingKey: unknown
    timeDimension: unknown
  }
}

/**
 * TanStack Query hook for funnel query dry-run (debug) data
 *
 * Usage:
 * ```tsx
 * const { debugData } = useFunnelDryRunQuery(serverQuery, { skip: !isFunnelMode })
 * ```
 */
export function useFunnelDryRunQuery(
  serverQuery: unknown | null,
  options: UseDryRunQueryOptions = {}
): { debugData: FunnelDebugDataEntry; refetch: () => void } {
  const { skip = false, staleTime = 5 * 60 * 1000 } = options
  const { cubeApi } = useCubeApi()

  const queryResult = useQuery({
    queryKey: ['cube', 'dryRun', 'funnel', serverQuery ? stableStringify(serverQuery) : null] as const,
    queryFn: async () => {
      if (!serverQuery) throw new Error('No funnel query provided')
      // Send the funnel query to dry-run endpoint
      // The server will detect it's a funnel query and use dryRunFunnel
      const result = await cubeApi.dryRun(serverQuery as CubeQuery)
      return {
        sql: result.sql,
        analysis: result.analysis,
        funnelMetadata: (result as unknown as { funnel?: unknown }).funnel,
      }
    },
    enabled: !!serverQuery && !skip,
    staleTime,
  })

  const debugData: FunnelDebugDataEntry = {
    sql: queryResult.data?.sql ?? null,
    analysis: queryResult.data?.analysis ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error ?? null,
    funnelMetadata: queryResult.data?.funnelMetadata as FunnelDebugDataEntry['funnelMetadata'],
  }

  return {
    debugData,
    refetch: () => queryResult.refetch(),
  }
}

/**
 * Debug data entry for flow queries
 */
export interface FlowDebugDataEntry extends DebugDataEntry {
  /** Flow-specific metadata from server */
  flowMetadata?: {
    stepsBefore: number
    stepsAfter: number
    bindingKey: unknown
    timeDimension: unknown
    eventDimension: string
    startingStep: {
      name: string
      filter: unknown
    }
  }
}

/**
 * TanStack Query hook for flow query dry-run (debug) data
 *
 * Usage:
 * ```tsx
 * const { debugData } = useFlowDryRunQuery(serverQuery, { skip: !isFlowMode })
 * ```
 */
export function useFlowDryRunQuery(
  serverQuery: unknown | null,
  options: UseDryRunQueryOptions = {}
): { debugData: FlowDebugDataEntry; refetch: () => void } {
  const { skip = false, staleTime = 5 * 60 * 1000 } = options
  const { cubeApi } = useCubeApi()

  const queryResult = useQuery({
    queryKey: ['cube', 'dryRun', 'flow', serverQuery ? stableStringify(serverQuery) : null] as const,
    queryFn: async () => {
      if (!serverQuery) throw new Error('No flow query provided')
      // Send the flow query to dry-run endpoint
      // The server will detect it's a flow query and use dryRunFlow
      const result = await cubeApi.dryRun(serverQuery as CubeQuery)
      return {
        sql: result.sql,
        analysis: result.analysis,
        flowMetadata: (result as unknown as { flow?: unknown }).flow,
      }
    },
    enabled: !!serverQuery && !skip,
    staleTime,
  })

  const debugData: FlowDebugDataEntry = {
    sql: queryResult.data?.sql ?? null,
    analysis: queryResult.data?.analysis ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error ?? null,
    flowMetadata: queryResult.data?.flowMetadata as FlowDebugDataEntry['flowMetadata'],
  }

  return {
    debugData,
    refetch: () => queryResult.refetch(),
  }
}

/**
 * Debug data entry for retention queries
 */
export interface RetentionDebugDataEntry extends DebugDataEntry {
  /** Retention-specific metadata from server */
  retentionMetadata?: {
    totalCohorts: number
    totalUsers: number
    periods: number
    cohortGranularity: string
    periodGranularity: string
    retentionType: string
  }
}

/**
 * TanStack Query hook for retention query dry-run (debug) data
 *
 * Usage:
 * ```tsx
 * const { debugData } = useRetentionDryRunQuery(serverQuery, { skip: !isRetentionMode })
 * ```
 */
export function useRetentionDryRunQuery(
  serverQuery: unknown | null,
  options: UseDryRunQueryOptions = {}
): { debugData: RetentionDebugDataEntry; refetch: () => void } {
  const { skip = false, staleTime = 5 * 60 * 1000 } = options
  const { cubeApi } = useCubeApi()

  const queryResult = useQuery({
    queryKey: ['cube', 'dryRun', 'retention', serverQuery ? stableStringify(serverQuery) : null] as const,
    queryFn: async () => {
      if (!serverQuery) throw new Error('No retention query provided')
      // Send the retention query to dry-run endpoint
      // The server will detect it's a retention query and use dryRunRetention
      const result = await cubeApi.dryRun(serverQuery as CubeQuery)
      return {
        sql: result.sql,
        analysis: result.analysis,
        retentionMetadata: (result as unknown as { retention?: unknown }).retention,
      }
    },
    enabled: !!serverQuery && !skip,
    staleTime,
  })

  const debugData: RetentionDebugDataEntry = {
    sql: queryResult.data?.sql ?? null,
    analysis: queryResult.data?.analysis ?? null,
    loading: queryResult.isLoading,
    error: queryResult.error ?? null,
    retentionMetadata: queryResult.data?.retentionMetadata as RetentionDebugDataEntry['retentionMetadata'],
  }

  return {
    debugData,
    refetch: () => queryResult.refetch(),
  }
}

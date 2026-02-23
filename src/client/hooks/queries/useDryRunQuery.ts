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

export type DryRunMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention'

interface DryRunResponsePayload {
  sql?: { sql: string; params?: unknown[] }
  analysis?: QueryAnalysis | null
  mode?: DryRunMode
  queryType?: string
  joinType?: string
  cubesUsed?: string[]
  modeMetadata?: unknown
}

/**
 * Debug data entry for a single query
 */
export interface DebugDataEntry {
  /** Generated SQL and parameters */
  sql: { sql: string; params: unknown[] } | null
  /** Query analysis (dimensions, measures, complexity, etc.) */
  analysis: QueryAnalysis | null
  /** Server-reported dry-run mode */
  mode?: DryRunMode | null
  /** Query type label from server */
  queryType?: string | null
  /** Join strategy label from server */
  joinType?: string | null
  /** Referenced cubes from server */
  cubesUsed?: string[]
  /** Mode-specific metadata (replaces funnel/flow/retention split) */
  modeMetadata?: unknown
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

function inferModeFromPayload(payload: DryRunResponsePayload): DryRunMode | null {
  if (payload.mode) return payload.mode
  if (payload.queryType === 'comparisonQuery') return 'comparison'
  if (payload.queryType === 'funnelQuery') return 'funnel'
  if (payload.queryType === 'flowQuery') return 'flow'
  if (payload.queryType === 'retentionQuery') return 'retention'
  if (payload.queryType === 'regularQuery') return 'regular'
  return null
}

function normalizeDryRunResult(payload: DryRunResponsePayload): Omit<DebugDataEntry, 'loading' | 'error'> {
  const mode = inferModeFromPayload(payload)
  return {
    sql: payload.sql ? { sql: payload.sql.sql, params: payload.sql.params || [] } : null,
    analysis: (payload.analysis || null) as QueryAnalysis | null,
    mode,
    queryType: payload.queryType || null,
    joinType: payload.joinType || null,
    cubesUsed: payload.cubesUsed || [],
    modeMetadata: payload.modeMetadata
  }
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
    const modeQuery = query as CubeQuery & { funnel?: unknown; flow?: unknown; retention?: unknown }
    // Preserve specialized mode payloads as-is; cleanQueryForServer strips non-Cube.js keys.
    if (modeQuery.funnel || modeQuery.flow || modeQuery.retention) {
      return query
    }
    return cleanQueryForServer(query)
  }, [query])

  const queryResult = useQuery({
    queryKey: createDryRunQueryKey(serverQuery),
    queryFn: async () => {
      if (!serverQuery) throw new Error('No query provided')
      const result = await cubeApi.dryRun(serverQuery)
      return normalizeDryRunResult(result as DryRunResponsePayload)
    },
    enabled: !!serverQuery && !skip,
    staleTime,
  })

  const debugData: DebugDataEntry = {
    ...(queryResult.data || {
      sql: null,
      analysis: null,
      mode: null,
      queryType: null,
      joinType: null,
      cubesUsed: [],
      modeMetadata: undefined
    }),
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
        return normalizeDryRunResult(result as DryRunResponsePayload)
      },
      enabled: !skip,
      staleTime,
    })),
  })

  // Transform results to DebugDataEntry array
  const debugDataPerQuery: DebugDataEntry[] = queryResults.map((result) => ({
    ...(result.data || {
      sql: null,
      analysis: null,
      mode: null,
      queryType: null,
      joinType: null,
      cubesUsed: [],
      modeMetadata: undefined
    }),
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

export type FunnelDebugDataEntry = DebugDataEntry

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
  return useDryRunQuery(serverQuery as CubeQuery | null, options)
}

export type FlowDebugDataEntry = DebugDataEntry

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
  return useDryRunQuery(serverQuery as CubeQuery | null, options)
}

export type RetentionDebugDataEntry = DebugDataEntry

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
  return useDryRunQuery(serverQuery as CubeQuery | null, options)
}

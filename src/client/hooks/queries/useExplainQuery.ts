/**
 * useExplainQuery - TanStack Query hook for EXPLAIN PLAN execution
 *
 * Features:
 * - Manually triggered (not automatic like useCubeLoadQuery)
 * - Returns normalized execution plan across PostgreSQL, MySQL, and SQLite
 * - Supports EXPLAIN ANALYZE for actual timing data
 * - No caching - always fetches fresh data to reflect schema/index changes
 *
 * Usage:
 * ```tsx
 * const { explainResult, isLoading, error, runExplain } = useExplainQuery(query)
 *
 * // Trigger explain manually
 * <button onClick={() => runExplain({ analyze: true })}>Explain with Timing</button>
 * ```
 */

import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useCubeApi } from '../../providers/CubeApiProvider'
import type { CubeQuery, ExplainResult, ExplainOptions } from '../../types'
import { cleanQueryForServer } from '../../shared/utils'
import { stableStringify } from '../../shared/queryKey'

/**
 * Query type that can be explained - includes standard queries, funnel queries, flow queries, and retention queries
 */
export type ExplainableQuery = CubeQuery | { funnel: unknown } | { flow: unknown } | { retention: unknown } | unknown

/**
 * Create a stable query key for explain
 */
export function createExplainQueryKey(
  query: ExplainableQuery | null,
  options?: ExplainOptions
): readonly unknown[] {
  if (!query) return ['cube', 'explain', null, null] as const
  return ['cube', 'explain', stableStringify(query), options?.analyze ?? false] as const
}

export interface UseExplainQueryOptions {
  /**
   * Whether to skip the query (prevent execution even when triggered)
   * @default false
   */
  skip?: boolean
}

export interface UseExplainQueryResult {
  /** The explain result from the server */
  explainResult: ExplainResult | null
  /** Whether the explain query is loading */
  isLoading: boolean
  /** Whether an explain has been triggered */
  hasRun: boolean
  /** Error if explain failed */
  error: Error | null
  /**
   * Manually trigger the explain query
   * @param options - Optional explain options (e.g., { analyze: true } for actual timing)
   */
  runExplain: (options?: ExplainOptions) => void
  /** Clear the explain result */
  clearExplain: () => void
}

/**
 * Check if query is a funnel query
 */
function isFunnelQuery(query: unknown): query is { funnel: unknown } {
  return typeof query === 'object' && query !== null && 'funnel' in query
}

/**
 * Check if query is a flow query
 */
function isFlowQuery(query: unknown): query is { flow: unknown } {
  return typeof query === 'object' && query !== null && 'flow' in query
}

/**
 * Check if query is a retention query
 */
function isRetentionQuery(query: unknown): query is { retention: unknown } {
  return typeof query === 'object' && query !== null && 'retention' in query
}

/**
 * TanStack Query hook for EXPLAIN PLAN execution
 *
 * Unlike useDryRunQuery, this hook is manually triggered via `runExplain()`.
 * This is intentional because:
 * 1. EXPLAIN queries have performance overhead
 * 2. EXPLAIN ANALYZE actually executes the query
 * 3. Users should explicitly choose when to run explain
 *
 * Supports standard queries, funnel queries, and flow queries.
 *
 * Usage:
 * ```tsx
 * const { explainResult, isLoading, runExplain } = useExplainQuery(query, { skip: !isValidQuery })
 *
 * // Trigger explain
 * <button onClick={() => runExplain()}>Explain Plan</button>
 *
 * // Trigger explain with timing
 * <button onClick={() => runExplain({ analyze: true })}>Explain with Timing</button>
 * ```
 */
export function useExplainQuery(
  query: ExplainableQuery | null,
  options: UseExplainQueryOptions = {}
): UseExplainQueryResult {
  const { skip = false } = options
  const { cubeApi } = useCubeApi()

  // Track whether explain has been triggered and with what options
  const [explainOptions, setExplainOptions] = useState<ExplainOptions | null>(null)
  const [hasTriggered, setHasTriggered] = useState(false)

  // Transform query for server
  // For funnel/flow/retention queries, pass them directly without cleaning
  const serverQuery = useMemo(() => {
    if (!query) return null
    // Funnel, flow, and retention queries have their own format, don't clean them
    if (isFunnelQuery(query) || isFlowQuery(query) || isRetentionQuery(query)) {
      return query
    }
    // Standard queries get cleaned
    return cleanQueryForServer(query as CubeQuery)
  }, [query])

  // Query is enabled only when:
  // 1. We have a query
  // 2. Skip is false
  // 3. User has triggered the explain
  const queryEnabled = !!serverQuery && !skip && hasTriggered

  const queryResult = useQuery({
    queryKey: createExplainQueryKey(serverQuery, explainOptions ?? undefined),
    queryFn: async () => {
      if (!serverQuery) throw new Error('No query provided')
      const result = await cubeApi.explain(serverQuery, explainOptions ?? undefined)
      return result
    },
    enabled: queryEnabled,
    // EXPLAIN queries should never be cached - always fetch fresh data
    // This ensures users see the latest execution plan after schema/index changes
    staleTime: 0,
    gcTime: 0,
    // Don't refetch automatically - this is manually triggered
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  // Manual trigger function
  const runExplain = useCallback((opts?: ExplainOptions) => {
    if (skip || !serverQuery) return
    setExplainOptions(opts ?? null)
    setHasTriggered(true)
    // If already triggered with same options, refetch
    if (hasTriggered) {
      queryResult.refetch()
    }
  }, [skip, serverQuery, hasTriggered, queryResult])

  // Clear function
  const clearExplain = useCallback(() => {
    setHasTriggered(false)
    setExplainOptions(null)
  }, [])

  return {
    explainResult: queryResult.data ?? null,
    isLoading: queryResult.isLoading || queryResult.isFetching,
    hasRun: hasTriggered,
    error: queryResult.error ?? null,
    runExplain,
    clearExplain,
  }
}

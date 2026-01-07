/**
 * useAnalysisQueryExecution
 *
 * Coordinates TanStack Query execution for single, multi-query, and funnel modes.
 * Provides unified loading states, results, and refetch functionality.
 */

import { useMemo, useCallback } from 'react'
import {
  useCubeLoadQuery,
  useMultiCubeLoadQuery,
  useFunnelQuery,
  useDryRunQueries,
  type DebugDataEntry,
} from './queries'
import type { CubeQuery, MultiQueryConfig, FunnelBindingKey, QueryMergeStrategy } from '../types'
import type { ExecutionStatus } from '../components/AnalysisBuilder/types'
import { buildFunnelConfigFromQueries } from '../utils/funnelExecution'

export interface UseAnalysisQueryExecutionOptions {
  /** Current query (for single-query mode) */
  currentQuery: CubeQuery
  /** All queries (for dry-run and multi-query) */
  allQueries: CubeQuery[]
  /** Multi-query config (null if single-query mode) */
  multiQueryConfig: MultiQueryConfig | null
  /** Whether in multi-query mode */
  isMultiQueryMode: boolean
  /** Whether current query is valid */
  isValidQuery: boolean
  /** Initial data (skip first fetch) */
  initialData?: unknown[]
  /** Merge strategy (for detecting funnel mode) */
  mergeStrategy?: QueryMergeStrategy
  /** Funnel binding key (required for funnel mode) */
  funnelBindingKey?: FunnelBindingKey | null
}

export interface UseAnalysisQueryExecutionResult {
  /** Query execution status */
  executionStatus: ExecutionStatus
  /** Query results (merged for multi-query) */
  executionResults: unknown[] | null
  /** Per-query results (for table view in multi-query mode) */
  perQueryResults: (unknown[] | null)[] | null
  /** Whether query is loading */
  isLoading: boolean
  /** Whether query is fetching (includes refetch) */
  isFetching: boolean
  /** Query error */
  error: Error | null
  /** Debug data per query */
  debugDataPerQuery: DebugDataEntry[]
  /** Whether query has been debounced (for smart defaults trigger) */
  hasDebounced: boolean
  /** Refetch function */
  refetch: () => void
  /**
   * In funnel mode, these are the actually executed queries with:
   * - Binding key dimension auto-added
   * - IN filter applied for steps 2+
   * Use these for debug display instead of the original queries.
   */
  funnelExecutedQueries: CubeQuery[] | null
}

export function useAnalysisQueryExecution(
  options: UseAnalysisQueryExecutionOptions
): UseAnalysisQueryExecutionResult {
  const {
    currentQuery,
    allQueries,
    multiQueryConfig,
    isMultiQueryMode,
    isValidQuery,
    initialData,
    mergeStrategy,
    funnelBindingKey,
  } = options

  // Determine if we're in funnel mode
  const isFunnelMode = mergeStrategy === 'funnel' && isMultiQueryMode

  // Build funnel config when in funnel mode
  const funnelConfig = useMemo(() => {
    if (!isFunnelMode || !funnelBindingKey || allQueries.length < 2) return null
    return buildFunnelConfigFromQueries(allQueries, funnelBindingKey)
  }, [isFunnelMode, funnelBindingKey, allQueries])

  // Single query execution
  const singleQueryResult = useCubeLoadQuery(currentQuery, {
    skip: !isValidQuery || isMultiQueryMode,
    debounceMs: 300,
  })

  // Multi-query execution (skip in funnel mode)
  const multiQueryResult = useMultiCubeLoadQuery(multiQueryConfig, {
    skip: !multiQueryConfig || !isMultiQueryMode || isFunnelMode,
    debounceMs: 300,
  })

  // Funnel query execution
  const funnelQueryResult = useFunnelQuery(funnelConfig, {
    skip: !isFunnelMode || !funnelConfig,
    debounceMs: 300,
  })

  // Dry-run queries for debug data
  const dryRunResult = useDryRunQueries({
    queries: isMultiQueryMode ? allQueries : [currentQuery],
    isMultiQueryMode,
    skip: !isValidQuery,
  })

  // Unify results based on mode
  const isLoading = isFunnelMode
    ? funnelQueryResult.isExecuting || funnelQueryResult.isDebouncing
    : isMultiQueryMode
      ? multiQueryResult.isLoading
      : singleQueryResult.isLoading
  const isFetching = isFunnelMode
    ? funnelQueryResult.isExecuting
    : isMultiQueryMode
      ? multiQueryResult.isFetching
      : singleQueryResult.isFetching
  const error = isFunnelMode
    ? funnelQueryResult.error
    : isMultiQueryMode
      ? multiQueryResult.error
      : singleQueryResult.error

  // Has debounced (for smart defaults trigger)
  const hasDebounced = Boolean(
    singleQueryResult.debouncedQuery ||
    multiQueryResult.debouncedConfig ||
    !funnelQueryResult.isDebouncing // Funnel has debounced when not debouncing
  )

  // Unified refetch function
  const refetch = useCallback(() => {
    if (isFunnelMode) {
      funnelQueryResult.execute()
    } else if (isMultiQueryMode) {
      multiQueryResult.refetch()
    } else {
      singleQueryResult.refetch()
    }
  }, [isFunnelMode, isMultiQueryMode, funnelQueryResult, multiQueryResult, singleQueryResult])

  // Execution status
  const executionStatus: ExecutionStatus = useMemo(() => {
    const hasResults = isFunnelMode
      ? funnelQueryResult.chartData
      : isMultiQueryMode
        ? multiQueryResult.data
        : singleQueryResult.rawData
    if (initialData && initialData.length > 0 && !hasResults) return 'success'
    if (!isValidQuery) return 'idle'
    if (isLoading && !hasResults) return 'loading'
    if (isFetching && hasResults) return 'refreshing'
    if (error) return 'error'
    if (hasResults) return 'success'
    return 'idle'
  }, [isValidQuery, isLoading, isFetching, error, singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, initialData, isMultiQueryMode, isFunnelMode])

  // Execution results
  const executionResults = useMemo(() => {
    // Funnel mode returns chart data directly
    if (isFunnelMode && funnelQueryResult.chartData) {
      return funnelQueryResult.chartData as unknown[]
    }
    if (isMultiQueryMode && multiQueryResult.data) {
      return multiQueryResult.data as unknown[]
    }
    if (singleQueryResult.rawData) {
      return singleQueryResult.rawData
    }
    if (initialData && initialData.length > 0) {
      return initialData
    }
    return null
  }, [singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, initialData, isMultiQueryMode, isFunnelMode])

  // Per-query results for table view (or per-step for funnel)
  const perQueryResults = useMemo(() => {
    // In funnel mode, return step results as per-query data
    if (isFunnelMode && funnelQueryResult.stepResults) {
      return funnelQueryResult.stepResults.map((step) => step.data)
    }
    if (!isMultiQueryMode || !multiQueryResult.perQueryData) return null
    return multiQueryResult.perQueryData
  }, [isMultiQueryMode, isFunnelMode, multiQueryResult.perQueryData, funnelQueryResult.stepResults])

  // In funnel mode, provide the executed queries for debug display
  const funnelExecutedQueries = isFunnelMode && funnelQueryResult.executedQueries?.length > 0
    ? funnelQueryResult.executedQueries
    : null

  return {
    executionStatus,
    executionResults,
    perQueryResults,
    isLoading,
    isFetching,
    error,
    debugDataPerQuery: dryRunResult.debugDataPerQuery,
    hasDebounced,
    refetch,
    funnelExecutedQueries,
  }
}

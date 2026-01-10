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
  useFunnelDryRunQuery,
  type DebugDataEntry,
  type FunnelDebugDataEntry,
} from './queries'
import type { CubeQuery, MultiQueryConfig, FunnelBindingKey, QueryMergeStrategy, AnalysisType } from '../types'
import type { ExecutionStatus } from '../components/AnalysisBuilder/types'
import type { ServerFunnelQuery } from '../types/funnel'
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
  /** Merge strategy (for detecting funnel mode - legacy) */
  mergeStrategy?: QueryMergeStrategy
  /** Funnel binding key (required for funnel mode) */
  funnelBindingKey?: FunnelBindingKey | null
  /**
   * Whether funnel mode is properly configured (from store).
   * This includes filter-only step validation that isMultiQueryMode doesn't provide.
   * @deprecated Use analysisType === 'funnel' instead
   */
  isFunnelModeEnabled?: boolean
  /**
   * Analysis type for explicit mode routing.
   * When provided, takes precedence over legacy mode detection.
   */
  analysisType?: AnalysisType
  /**
   * Pre-built server funnel query from store's buildFunnelQueryFromSteps().
   * Used when analysisType === 'funnel' with the new dedicated funnel state.
   */
  serverFunnelQuery?: ServerFunnelQuery | null
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
  /** Debug data per query (for non-funnel modes) */
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
   * @deprecated Server-side funnel uses a unified query. Use funnelServerQuery instead.
   */
  funnelExecutedQueries: CubeQuery[] | null
  /**
   * The actual server funnel query { funnel: {...} }
   * This is the unified query sent to the server (not per-step queries).
   */
  funnelServerQuery: ServerFunnelQuery | null
  /**
   * Debug data specifically for funnel mode
   * Contains the funnel SQL and funnel-specific metadata
   */
  funnelDebugData: FunnelDebugDataEntry | null
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
    mergeStrategy: _mergeStrategy, // Unused - legacy mergeStrategy === 'funnel' is no longer supported
    funnelBindingKey,
    isFunnelModeEnabled,
    analysisType,
    serverFunnelQuery,
  } = options

  // Determine execution mode based on analysisType
  // Note: Legacy mergeStrategy === 'funnel' is no longer supported
  // Funnel mode is now exclusively determined by analysisType === 'funnel'
  const isFunnelMode = analysisType === 'funnel' || isFunnelModeEnabled

  // Multi mode is 'query' analysis type with multiple queries
  const isMultiMode = analysisType === 'query' && isMultiQueryMode

  // Single mode is 'query' analysis type without multiple queries
  const isSingleMode = analysisType === 'query' && !isMultiQueryMode

  // Check if we're using the new dedicated funnel mode (with serverFunnelQuery)
  const isNewFunnelMode = analysisType === 'funnel' && !!serverFunnelQuery

  // Build funnel config when in funnel mode (legacy - from queryStates)
  // Skip when using new dedicated funnel mode with serverFunnelQuery
  const funnelConfig = useMemo(() => {
    // If using new funnel mode with prebuilt query, skip legacy config building
    if (isNewFunnelMode) return null
    if (!isFunnelMode || !funnelBindingKey || allQueries.length < 2) return null
    return buildFunnelConfigFromQueries(allQueries, funnelBindingKey)
  }, [isNewFunnelMode, isFunnelMode, funnelBindingKey, allQueries])

  // Single query execution (only when analysisType is 'query' or legacy single mode)
  const singleQueryResult = useCubeLoadQuery(currentQuery, {
    skip: !isValidQuery || !isSingleMode,
    debounceMs: 300,
  })

  // Multi-query execution (only when analysisType is 'multi' or legacy multi mode)
  const multiQueryResult = useMultiCubeLoadQuery(multiQueryConfig, {
    skip: !multiQueryConfig || !isMultiMode,
    debounceMs: 300,
  })

  // Funnel query execution
  // Use prebuiltServerQuery when in new funnel mode, otherwise use funnelConfig
  const funnelQueryResult = useFunnelQuery(funnelConfig, {
    skip: !isFunnelMode || (!funnelConfig && !serverFunnelQuery),
    debounceMs: 300,
    prebuiltServerQuery: isNewFunnelMode ? serverFunnelQuery : undefined,
  })

  // Dry-run queries for debug data (skip in funnel mode)
  const dryRunResult = useDryRunQueries({
    queries: isMultiQueryMode ? allQueries : [currentQuery],
    isMultiQueryMode,
    skip: !isValidQuery || isFunnelMode,
  })

  // Funnel dry-run query (only in funnel mode)
  // Use the serverQuery from useFunnelQuery to get the unified funnel SQL
  const funnelDryRunResult = useFunnelDryRunQuery(
    funnelQueryResult.serverQuery,
    { skip: !isFunnelMode || !funnelQueryResult.serverQuery }
  )

  // Unify results based on mode
  const isLoading = isFunnelMode
    ? funnelQueryResult.isExecuting || funnelQueryResult.isDebouncing
    : isMultiMode
      ? multiQueryResult.isLoading
      : singleQueryResult.isLoading
  const isFetching = isFunnelMode
    ? funnelQueryResult.isExecuting
    : isMultiMode
      ? multiQueryResult.isFetching
      : singleQueryResult.isFetching
  const error = isFunnelMode
    ? funnelQueryResult.error
    : isMultiMode
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
    } else if (isMultiMode) {
      multiQueryResult.refetch()
    } else {
      singleQueryResult.refetch()
    }
  }, [isFunnelMode, isMultiMode, funnelQueryResult, multiQueryResult, singleQueryResult])

  // Execution status
  const executionStatus: ExecutionStatus = useMemo(() => {
    const hasResults = isFunnelMode
      ? funnelQueryResult.chartData
      : isMultiMode
        ? multiQueryResult.data
        : singleQueryResult.rawData
    if (initialData && initialData.length > 0 && !hasResults) return 'success'
    if (!isValidQuery) return 'idle'
    if (isLoading && !hasResults) return 'loading'
    if (isFetching && hasResults) return 'refreshing'
    if (error) return 'error'
    if (hasResults) return 'success'
    return 'idle'
  }, [isValidQuery, isLoading, isFetching, error, singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, initialData, isMultiMode, isFunnelMode])

  // Execution results
  const executionResults = useMemo(() => {
    // Funnel mode returns chart data directly
    if (isFunnelMode && funnelQueryResult.chartData) {
      return funnelQueryResult.chartData as unknown[]
    }
    if (isMultiMode && multiQueryResult.data) {
      return multiQueryResult.data as unknown[]
    }
    if (singleQueryResult.rawData) {
      return singleQueryResult.rawData
    }
    if (initialData && initialData.length > 0) {
      return initialData
    }
    return null
  }, [singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, initialData, isMultiMode, isFunnelMode])

  // Per-query results for table view (or per-step for funnel)
  const perQueryResults = useMemo(() => {
    // In funnel mode, return step results as per-query data
    if (isFunnelMode && funnelQueryResult.stepResults) {
      return funnelQueryResult.stepResults.map((step) => step.data)
    }
    if (!isMultiMode || !multiQueryResult.perQueryData) return null
    return multiQueryResult.perQueryData
  }, [isMultiMode, isFunnelMode, multiQueryResult.perQueryData, funnelQueryResult.stepResults])

  // In funnel mode, provide the executed queries for debug display (legacy)
  const funnelExecutedQueries = isFunnelMode && funnelQueryResult.executedQueries?.length > 0
    ? funnelQueryResult.executedQueries
    : null

  // The actual server funnel query (new, preferred)
  const funnelServerQuery = isFunnelMode ? funnelQueryResult.serverQuery : null

  // Funnel debug data (unified SQL for funnel mode)
  const funnelDebugData = isFunnelMode ? funnelDryRunResult.debugData : null

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
    funnelServerQuery,
    funnelDebugData,
  }
}

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
  useFlowQuery,
  useDryRunQueries,
  useFunnelDryRunQuery,
  useFlowDryRunQuery,
  type DebugDataEntry,
  type FunnelDebugDataEntry,
  type FlowDebugDataEntry,
} from './queries'
import type { CubeQuery, MultiQueryConfig, FunnelBindingKey, QueryMergeStrategy, AnalysisType } from '../types'
import type { ExecutionStatus } from '../components/AnalysisBuilder/types'
import type { ServerFunnelQuery } from '../types/funnel'
import type { ServerFlowQuery, FlowChartData } from '../types/flow'
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
  /**
   * Pre-built server flow query from store's buildFlowQuery().
   * Used when analysisType === 'flow' with the new dedicated flow state.
   */
  serverFlowQuery?: ServerFlowQuery | null
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
  /** Refetch function. Pass { bustCache: true } to bypass client and server caches. */
  refetch: (options?: { bustCache?: boolean }) => void
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
  /**
   * The server flow query being executed (when analysisType === 'flow')
   */
  flowServerQuery: ServerFlowQuery | null
  /**
   * Flow chart data (nodes and links for Sankey visualization)
   */
  flowChartData: FlowChartData | null
  /**
   * Debug data specifically for flow mode
   * Contains the flow SQL and flow-specific metadata
   */
  flowDebugData: FlowDebugDataEntry | null
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
    serverFlowQuery,
  } = options

  // Determine execution mode based on analysisType
  // Note: Legacy mergeStrategy === 'funnel' is no longer supported
  // Funnel mode is now exclusively determined by analysisType === 'funnel'
  const isFunnelMode = analysisType === 'funnel' || isFunnelModeEnabled

  // Flow mode is exclusively determined by analysisType === 'flow'
  const isFlowMode = analysisType === 'flow'

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

  // Flow query execution
  const flowQueryResult = useFlowQuery(serverFlowQuery ?? null, {
    skip: !isFlowMode || !serverFlowQuery,
    debounceMs: 300,
  })

  // Dry-run queries for debug data (skip in funnel and flow mode)
  const dryRunResult = useDryRunQueries({
    queries: isMultiQueryMode ? allQueries : [currentQuery],
    isMultiQueryMode,
    skip: !isValidQuery || isFunnelMode || isFlowMode,
  })

  // Funnel dry-run query (only in funnel mode)
  // Use the serverQuery from useFunnelQuery to get the unified funnel SQL
  const funnelDryRunResult = useFunnelDryRunQuery(
    funnelQueryResult.serverQuery,
    { skip: !isFunnelMode || !funnelQueryResult.serverQuery }
  )

  // Flow dry-run query (only in flow mode)
  // Use the serverQuery from useFlowQuery to get the unified flow SQL
  const flowDryRunResult = useFlowDryRunQuery(
    flowQueryResult.serverQuery,
    { skip: !isFlowMode || !flowQueryResult.serverQuery }
  )

  // Unify results based on mode
  const isLoading = isFlowMode
    ? flowQueryResult.isLoading || flowQueryResult.isDebouncing
    : isFunnelMode
      ? funnelQueryResult.isExecuting || funnelQueryResult.isDebouncing
      : isMultiMode
        ? multiQueryResult.isLoading
        : singleQueryResult.isLoading
  const isFetching = isFlowMode
    ? flowQueryResult.isFetching
    : isFunnelMode
      ? funnelQueryResult.isExecuting
      : isMultiMode
        ? multiQueryResult.isFetching
        : singleQueryResult.isFetching
  const error = isFlowMode
    ? flowQueryResult.error
    : isFunnelMode
      ? funnelQueryResult.error
      : isMultiMode
        ? multiQueryResult.error
        : singleQueryResult.error

  // Has debounced (for smart defaults trigger)
  const hasDebounced = Boolean(
    singleQueryResult.debouncedQuery ||
    multiQueryResult.debouncedConfig ||
    !funnelQueryResult.isDebouncing || // Funnel has debounced when not debouncing
    !flowQueryResult.isDebouncing // Flow has debounced when not debouncing
  )

  // Unified refetch function
  // Pass options (including bustCache) through to underlying hooks
  const refetch = useCallback((options?: { bustCache?: boolean }) => {
    if (isFlowMode) {
      flowQueryResult.refetch(options)
    } else if (isFunnelMode) {
      funnelQueryResult.execute(options)
    } else if (isMultiMode) {
      multiQueryResult.refetch(options)
    } else {
      singleQueryResult.refetch(options)
    }
  }, [isFlowMode, isFunnelMode, isMultiMode, flowQueryResult, funnelQueryResult, multiQueryResult, singleQueryResult])

  // Execution status
  const executionStatus: ExecutionStatus = useMemo(() => {
    const hasResults = isFlowMode
      ? flowQueryResult.data
      : isFunnelMode
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
  }, [isValidQuery, isLoading, isFetching, error, singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, flowQueryResult.data, initialData, isMultiMode, isFunnelMode, isFlowMode])

  // Execution results
  const executionResults = useMemo(() => {
    // Flow mode returns Sankey chart data directly
    if (isFlowMode && flowQueryResult.data) {
      // Wrap in array for consistency with other modes
      return [flowQueryResult.data] as unknown[]
    }
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
  }, [singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, flowQueryResult.data, initialData, isMultiMode, isFunnelMode, isFlowMode])

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

  // Flow-related values
  const flowServerQuery = isFlowMode ? flowQueryResult.serverQuery : null
  const flowChartData = isFlowMode ? flowQueryResult.data : null

  // Flow debug data (unified SQL for flow mode)
  const flowDebugData = isFlowMode ? flowDryRunResult.debugData : null

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
    flowServerQuery,
    flowChartData,
    flowDebugData,
  }
}

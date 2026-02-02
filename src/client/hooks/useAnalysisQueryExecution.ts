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
  useRetentionQuery,
  useDryRunQueries,
  useFunnelDryRunQuery,
  useFlowDryRunQuery,
  useRetentionDryRunQuery,
  type DebugDataEntry,
  type FunnelDebugDataEntry,
  type FlowDebugDataEntry,
  type RetentionDebugDataEntry,
} from './queries'
import { useCubeMeta } from '../providers/CubeProvider'
import type { CubeQuery, MultiQueryConfig, FunnelBindingKey, QueryMergeStrategy, AnalysisType } from '../types'
import type { ExecutionStatus } from '../components/AnalysisBuilder/types'
import type { ServerFunnelQuery } from '../types/funnel'
import type { ServerFlowQuery, FlowChartData } from '../types/flow'
import type { ServerRetentionQuery, RetentionChartData } from '../types/retention'
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
  /**
   * Pre-built server retention query from store's buildRetentionQuery().
   * Used when analysisType === 'retention' with the new dedicated retention state.
   */
  serverRetentionQuery?: ServerRetentionQuery | null
  /**
   * Validation result for retention mode from store's getRetentionValidation().
   * Used to display specific errors in the debug panel.
   */
  retentionValidation?: { isValid: boolean; errors: string[]; warnings: string[] } | null
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
  /**
   * The server retention query being executed (when analysisType === 'retention')
   */
  retentionServerQuery: ServerRetentionQuery | null
  /**
   * Retention chart data (cohort × period matrix)
   */
  retentionChartData: RetentionChartData | null
  /**
   * Debug data specifically for retention mode
   * Contains the retention SQL and retention-specific metadata
   */
  retentionDebugData: RetentionDebugDataEntry | null
  /**
   * Retention validation result (errors explaining why query cannot be built)
   */
  retentionValidation: { isValid: boolean; errors: string[]; warnings: string[] } | null
  /**
   * Whether the current query config differs from the last executed query.
   * Used for manual refresh mode to show "needs refresh" indicator.
   */
  needsRefresh: boolean
  /**
   * Query warnings from the server (e.g., fan-out without dimensions).
   * Displayed as a banner above results.
   */
  warnings: import('../shared/types').QueryWarning[] | undefined
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
    serverRetentionQuery,
    retentionValidation,
  } = options

  // Get field label resolver from cube context (for human-readable labels)
  const { getFieldLabel } = useCubeMeta()

  // Determine execution mode based on analysisType
  // Note: Legacy mergeStrategy === 'funnel' is no longer supported
  // Funnel mode is now exclusively determined by analysisType === 'funnel'
  const isFunnelMode = analysisType === 'funnel' || isFunnelModeEnabled

  // Flow mode is exclusively determined by analysisType === 'flow'
  const isFlowMode = analysisType === 'flow'

  // Retention mode is exclusively determined by analysisType === 'retention'
  const isRetentionMode = analysisType === 'retention'

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

  // Retention query execution
  const retentionQueryResult = useRetentionQuery(serverRetentionQuery ?? null, {
    skip: !isRetentionMode || !serverRetentionQuery,
    debounceMs: 300,
    getFieldLabel, // Pass label resolver for human-readable binding key display
  })

  // Dry-run queries for debug data (skip in funnel, flow, and retention mode)
  const dryRunResult = useDryRunQueries({
    queries: isMultiQueryMode ? allQueries : [currentQuery],
    isMultiQueryMode,
    skip: !isValidQuery || isFunnelMode || isFlowMode || isRetentionMode,
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

  // Retention dry-run query (only in retention mode)
  // Use the serverRetentionQuery input to get the unified retention SQL
  const retentionDryRunResult = useRetentionDryRunQuery(
    serverRetentionQuery,
    { skip: !isRetentionMode || !serverRetentionQuery }
  )

  // Unify results based on mode
  const isLoading = isRetentionMode
    ? retentionQueryResult.isLoading || retentionQueryResult.isDebouncing
    : isFlowMode
      ? flowQueryResult.isLoading || flowQueryResult.isDebouncing
      : isFunnelMode
        ? funnelQueryResult.isExecuting || funnelQueryResult.isDebouncing
        : isMultiMode
          ? multiQueryResult.isLoading
          : singleQueryResult.isLoading
  const isFetching = isRetentionMode
    ? retentionQueryResult.isFetching
    : isFlowMode
      ? flowQueryResult.isFetching
      : isFunnelMode
        ? funnelQueryResult.isExecuting
        : isMultiMode
          ? multiQueryResult.isFetching
          : singleQueryResult.isFetching
  const error = isRetentionMode
    ? retentionQueryResult.error
    : isFlowMode
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
    !flowQueryResult.isDebouncing || // Flow has debounced when not debouncing
    !retentionQueryResult.isDebouncing // Retention has debounced when not debouncing
  )

  // Unified refetch function
  // Pass options (including bustCache) through to underlying hooks
  const refetch = useCallback((options?: { bustCache?: boolean }) => {
    if (isRetentionMode) {
      // Retention uses execute for bustCache support
      retentionQueryResult.execute(options)
    } else if (isFlowMode) {
      flowQueryResult.refetch(options)
    } else if (isFunnelMode) {
      funnelQueryResult.execute(options)
    } else if (isMultiMode) {
      multiQueryResult.refetch(options)
    } else {
      singleQueryResult.refetch(options)
    }
  }, [isRetentionMode, isFlowMode, isFunnelMode, isMultiMode, retentionQueryResult, flowQueryResult, funnelQueryResult, multiQueryResult, singleQueryResult])

  // Execution status
  const executionStatus: ExecutionStatus = useMemo(() => {
    const hasResults = isRetentionMode
      ? retentionQueryResult.chartData
      : isFlowMode
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
  }, [isValidQuery, isLoading, isFetching, error, singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, flowQueryResult.data, retentionQueryResult.chartData, initialData, isMultiMode, isFunnelMode, isFlowMode, isRetentionMode])

  // Execution results
  const executionResults = useMemo(() => {
    // Retention mode returns transformed flat data for chart compatibility
    if (isRetentionMode && retentionQueryResult.chartData) {
      // Transform RetentionChartData to flat rows
      // Format: [{ "Retention.period": "P0", "Retention.rate": 0.45, "Retention.segment": "US", ... }]
      return retentionQueryResult.chartData.rows.map(row => ({
        'Retention.period': `P${row.period}`,
        'Retention.rate': row.retentionRate,
        'Retention.retained': row.retainedUsers,
        'Retention.cohortSize': row.cohortSize,
        'Retention.segment': row.breakdownValue || 'All Users',
      })) as unknown[]
    }
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
  }, [singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, flowQueryResult.data, retentionQueryResult.chartData, initialData, isMultiMode, isFunnelMode, isFlowMode, isRetentionMode])

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

  // Retention-related values
  const retentionServerQuery = isRetentionMode ? (serverRetentionQuery ?? null) : null
  const retentionChartData = isRetentionMode ? retentionQueryResult.chartData : null

  // Retention debug data (unified SQL for retention mode)
  const retentionDebugData = isRetentionMode ? retentionDryRunResult.debugData : null

  // Aggregate needsRefresh from the appropriate mode hook
  // This determines if the "needs refresh" banner should be shown
  // Note: Multi-query mode doesn't have needsRefresh yet (falls back to false)
  const needsRefresh = useMemo(() => {
    if (isRetentionMode) return retentionQueryResult.needsRefresh
    if (isFlowMode) return flowQueryResult.needsRefresh
    if (isFunnelMode) return funnelQueryResult.needsRefresh
    if (isMultiMode) return false // Multi-query mode doesn't support manual refresh yet
    return singleQueryResult.needsRefresh
  }, [isRetentionMode, isFlowMode, isFunnelMode, isMultiMode, retentionQueryResult.needsRefresh, flowQueryResult.needsRefresh, funnelQueryResult.needsRefresh, singleQueryResult.needsRefresh])

  // Aggregate warnings from the appropriate mode hook
  // Currently only supported for single-query mode (where useCubeLoadQuery exposes warnings)
  const warnings = useMemo(() => {
    // Single query mode has warnings from useCubeLoadQuery
    if (isSingleMode && singleQueryResult.warnings) {
      return singleQueryResult.warnings
    }
    // TODO: Add warnings support for multi-query, funnel, flow, and retention modes
    return undefined
  }, [isSingleMode, singleQueryResult.warnings])

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
    retentionServerQuery,
    retentionChartData,
    retentionDebugData,
    retentionValidation: retentionValidation ?? null,
    needsRefresh,
    warnings,
  }
}

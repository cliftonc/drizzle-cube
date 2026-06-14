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
  useDryRunQuery,
  useDryRunQueries,
  type DebugDataEntry,
} from './queries'
import { useCubeMeta } from '../providers/CubeProvider'
import type { CubeQuery, MultiQueryConfig, FunnelBindingKey, QueryMergeStrategy, AnalysisType } from '../types'
import type { ExecutionStatus } from '../components/AnalysisBuilder/types'
import type { ServerFunnelQuery } from '../types/funnel'
import type { ServerFlowQuery, FlowChartData } from '../types/flow'
import type { ServerRetentionQuery, RetentionChartData } from '../types/retention'
import { buildFunnelConfigFromQueries } from '../utils/funnelExecution'
import { resolveActiveMode, pickByMode, computeExecutionResults, deriveModeOutputs, computeSkipFlags, computeExecutionStatus } from './analysisQueryExecutionModes'

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
   * Contains unified dry-run SQL and mode metadata.
   */
  funnelDebugData: DebugDataEntry | null
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
   * Contains unified dry-run SQL and mode metadata.
   */
  flowDebugData: DebugDataEntry | null
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
   * Contains unified dry-run SQL and mode metadata.
   */
  retentionDebugData: DebugDataEntry | null
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

  // Resolve the single active mode once (precedence: retention > flow > funnel > multi > single).
  // Used to collapse the repeated per-mode ternary chains below.
  const activeMode = resolveActiveMode({ isRetentionMode, isFlowMode, isFunnelMode, isMultiMode })

  // Build funnel config when in funnel mode (legacy - from queryStates)
  // Skip when using new dedicated funnel mode with serverFunnelQuery
  const funnelConfig = useMemo(() => {
    // If using new funnel mode with prebuilt query, skip legacy config building
    if (isNewFunnelMode) return null
    if (!isFunnelMode || !funnelBindingKey || allQueries.length < 2) return null
    return buildFunnelConfigFromQueries(allQueries, funnelBindingKey)
  }, [isNewFunnelMode, isFunnelMode, funnelBindingKey, allQueries])

  // Precompute the `skip` flag for each query hook (keeps the calls below flat).
  const skipFlags = computeSkipFlags({
    isValidQuery,
    isSingleMode,
    isMultiMode,
    isFunnelMode,
    isFlowMode,
    isRetentionMode,
    hasMultiQueryConfig: !!multiQueryConfig,
    hasFunnelConfig: !!funnelConfig,
    hasServerFunnelQuery: !!serverFunnelQuery,
    hasServerFlowQuery: !!serverFlowQuery,
    hasServerRetentionQuery: !!serverRetentionQuery,
  })

  // Single query execution (only when analysisType is 'query' or legacy single mode)
  const singleQueryResult = useCubeLoadQuery(currentQuery, {
    skip: skipFlags.single,
    debounceMs: 300,
  })

  // Multi-query execution (only when analysisType is 'multi' or legacy multi mode)
  const multiQueryResult = useMultiCubeLoadQuery(multiQueryConfig, {
    skip: skipFlags.multi,
    debounceMs: 300,
  })

  // Funnel query execution
  // Use prebuiltServerQuery when in new funnel mode, otherwise use funnelConfig
  const funnelQueryResult = useFunnelQuery(funnelConfig, {
    skip: skipFlags.funnel,
    debounceMs: 300,
    prebuiltServerQuery: isNewFunnelMode ? serverFunnelQuery : undefined,
  })

  // Flow query execution
  const flowQueryResult = useFlowQuery(serverFlowQuery ?? null, {
    skip: skipFlags.flow,
    debounceMs: 300,
  })

  // Retention query execution
  const retentionQueryResult = useRetentionQuery(serverRetentionQuery ?? null, {
    skip: skipFlags.retention,
    debounceMs: 300,
    getFieldLabel, // Pass label resolver for human-readable binding key display
  })

  // Dry-run queries for debug data (skip in funnel, flow, and retention mode)
  const dryRunResult = useDryRunQueries({
    queries: isMultiQueryMode ? allQueries : [currentQuery],
    isMultiQueryMode,
    skip: skipFlags.dryRun,
  })

  // Funnel dry-run query (only in funnel mode)
  // Use the serverQuery from useFunnelQuery to get the unified funnel SQL
  const funnelDryRunResult = useDryRunQuery(
    funnelQueryResult.serverQuery as CubeQuery | null,
    { skip: !isFunnelMode || !funnelQueryResult.serverQuery }
  )

  // Flow dry-run query (only in flow mode)
  // Use the serverQuery from useFlowQuery to get the unified flow SQL
  const flowDryRunResult = useDryRunQuery(
    flowQueryResult.serverQuery as CubeQuery | null,
    { skip: !isFlowMode || !flowQueryResult.serverQuery }
  )

  // Retention dry-run query (only in retention mode)
  // Use the serverRetentionQuery input to get the unified retention SQL
  const retentionDryRunResult = useDryRunQuery(
    serverRetentionQuery as CubeQuery | null,
    { skip: !isRetentionMode || !serverRetentionQuery }
  )

  // Unify results based on mode
  const isLoading = pickByMode(activeMode, {
    retention: retentionQueryResult.isLoading || retentionQueryResult.isDebouncing,
    flow: flowQueryResult.isLoading || flowQueryResult.isDebouncing,
    funnel: funnelQueryResult.isExecuting || funnelQueryResult.isDebouncing,
    multi: multiQueryResult.isLoading,
    single: singleQueryResult.isLoading,
  })
  const isFetching = pickByMode(activeMode, {
    retention: retentionQueryResult.isFetching,
    flow: flowQueryResult.isFetching,
    funnel: funnelQueryResult.isExecuting,
    multi: multiQueryResult.isFetching,
    single: singleQueryResult.isFetching,
  })
  const error = pickByMode(activeMode, {
    retention: retentionQueryResult.error,
    flow: flowQueryResult.error,
    funnel: funnelQueryResult.error,
    multi: multiQueryResult.error,
    single: singleQueryResult.error,
  })

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
    switch (activeMode) {
      case 'retention':
        // Retention uses execute for bustCache support
        retentionQueryResult.execute(options)
        break
      case 'flow':
        flowQueryResult.refetch(options)
        break
      case 'funnel':
        funnelQueryResult.execute(options)
        break
      case 'multi':
        multiQueryResult.refetch(options)
        break
      default:
        singleQueryResult.refetch(options)
    }
  }, [activeMode, retentionQueryResult, flowQueryResult, funnelQueryResult, multiQueryResult, singleQueryResult])

  // Execution status
  const executionStatus: ExecutionStatus = useMemo(() => {
    const hasResults = pickByMode(activeMode, {
      retention: retentionQueryResult.chartData,
      flow: flowQueryResult.data,
      funnel: funnelQueryResult.chartData,
      multi: multiQueryResult.data,
      single: singleQueryResult.rawData,
    })
    return computeExecutionStatus({ hasResults, initialData, isValidQuery, isLoading, isFetching, error })
  }, [isValidQuery, isLoading, isFetching, error, singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, flowQueryResult.data, retentionQueryResult.chartData, initialData, activeMode])

  // Execution results
  const executionResults = useMemo(() => computeExecutionResults({
    isRetentionMode,
    isFlowMode,
    isFunnelMode,
    isMultiMode,
    retentionChartData: retentionQueryResult.chartData,
    flowData: flowQueryResult.data,
    funnelChartData: funnelQueryResult.chartData,
    multiData: multiQueryResult.data,
    singleRawData: singleQueryResult.rawData,
    initialData,
  }), [singleQueryResult.rawData, multiQueryResult.data, funnelQueryResult.chartData, flowQueryResult.data, retentionQueryResult.chartData, initialData, isMultiMode, isFunnelMode, isFlowMode, isRetentionMode])

  // Per-query results for table view (or per-step for funnel)
  const perQueryResults = useMemo(() => {
    // In funnel mode, return step results as per-query data
    if (isFunnelMode && funnelQueryResult.stepResults) {
      return funnelQueryResult.stepResults.map((step) => step.data)
    }
    if (!isMultiMode || !multiQueryResult.perQueryData) return null
    return multiQueryResult.perQueryData
  }, [isMultiMode, isFunnelMode, multiQueryResult.perQueryData, funnelQueryResult.stepResults])

  // Derive all per-mode debug / server-query / chart-data outputs in one pass.
  // Each value is gated on its mode flag (null otherwise), matching the original
  // inline `isXMode ? value : null` expressions exactly.
  const {
    funnelExecutedQueries,
    funnelServerQuery,
    funnelDebugData,
    flowServerQuery,
    flowChartData,
    flowDebugData,
    retentionServerQuery,
    retentionChartData,
    retentionDebugData,
  } = deriveModeOutputs({
    isFunnelMode,
    isFlowMode,
    isRetentionMode,
    funnelExecutedQueries: funnelQueryResult.executedQueries,
    funnelServerQuery: funnelQueryResult.serverQuery,
    funnelDebugData: funnelDryRunResult.debugData,
    flowServerQuery: flowQueryResult.serverQuery,
    flowData: flowQueryResult.data,
    flowDebugData: flowDryRunResult.debugData,
    retentionServerQuery: serverRetentionQuery ?? null,
    retentionChartData: retentionQueryResult.chartData,
    retentionDebugData: retentionDryRunResult.debugData,
  })

  // Aggregate needsRefresh from the appropriate mode hook
  // This determines if the "needs refresh" banner should be shown
  // Note: Multi-query mode doesn't have needsRefresh yet (falls back to false)
  const needsRefresh = useMemo(() => pickByMode(activeMode, {
    retention: retentionQueryResult.needsRefresh,
    flow: flowQueryResult.needsRefresh,
    funnel: funnelQueryResult.needsRefresh,
    multi: false, // Multi-query mode doesn't support manual refresh yet
    single: singleQueryResult.needsRefresh,
  }), [activeMode, retentionQueryResult.needsRefresh, flowQueryResult.needsRefresh, funnelQueryResult.needsRefresh, singleQueryResult.needsRefresh])

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

/**
 * Pure mode-selection helpers for useAnalysisQueryExecution.
 *
 * The hook coordinates five execution modes (retention, flow, funnel, multi,
 * single). Almost every derived value is "pick the field from whichever mode is
 * active". These helpers collapse the repeated 5-way ternary chains into a
 * single normalized per-mode descriptor plus a selector, without changing any
 * behaviour: the selected values are byte-for-byte equivalent to the original
 * nested ternaries.
 */

/** The active execution mode, in priority order (retention > flow > funnel > multi > single). */
export type ActiveMode = 'retention' | 'flow' | 'funnel' | 'multi' | 'single'

export interface ModeFlags {
  isRetentionMode: boolean | undefined
  isFlowMode: boolean | undefined
  isFunnelMode: boolean | undefined
  isMultiMode: boolean | undefined
}

/**
 * Resolve the single active mode from the boolean flags, using the same
 * precedence as the original nested ternaries (retention first, single last).
 */
export function resolveActiveMode(flags: ModeFlags): ActiveMode {
  if (flags.isRetentionMode) return 'retention'
  if (flags.isFlowMode) return 'flow'
  if (flags.isFunnelMode) return 'funnel'
  if (flags.isMultiMode) return 'multi'
  return 'single'
}

/**
 * A value resolved per-mode. Pass the value each mode contributes; `pickByMode`
 * returns the one for the active mode. This mirrors the original
 * `isRetentionMode ? a : isFlowMode ? b : ...` chains exactly. Each field may
 * have its own type — the return type is the union across all modes.
 */
export type PerMode<R extends Record<ActiveMode, unknown>> = R

export function pickByMode<R extends Record<ActiveMode, unknown>>(
  mode: ActiveMode,
  values: R
): R[ActiveMode] {
  return values[mode]
}

/**
 * Inputs for deriving the per-mode "debug / server query / chart data" outputs.
 * Each field is the raw value the corresponding mode hook exposes; the helper
 * gates it on the matching mode flag (returning null otherwise), exactly as the
 * original inline `isXMode ? value : null` expressions did.
 */
export interface ModeOutputsInput<
  FunnelExecuted,
  FunnelServer,
  FlowServer,
  FlowChart,
  RetentionServer,
  RetentionChart,
  Debug,
> {
  isFunnelMode: boolean | undefined
  isFlowMode: boolean
  isRetentionMode: boolean
  funnelExecutedQueries: FunnelExecuted[] | undefined
  funnelServerQuery: FunnelServer
  funnelDebugData: Debug
  flowServerQuery: FlowServer
  flowData: FlowChart
  flowDebugData: Debug
  retentionServerQuery: RetentionServer
  retentionChartData: RetentionChart
  retentionDebugData: Debug
}

export interface ModeOutputs<
  FunnelExecuted,
  FunnelServer,
  FlowServer,
  FlowChart,
  RetentionServer,
  RetentionChart,
  Debug,
> {
  funnelExecutedQueries: FunnelExecuted[] | null
  funnelServerQuery: FunnelServer | null
  funnelDebugData: Debug | null
  flowServerQuery: FlowServer | null
  flowChartData: FlowChart | null
  flowDebugData: Debug | null
  retentionServerQuery: RetentionServer | null
  retentionChartData: RetentionChart | null
  retentionDebugData: Debug | null
}

export function deriveModeOutputs<
  FunnelExecuted,
  FunnelServer,
  FlowServer,
  FlowChart,
  RetentionServer,
  RetentionChart,
  Debug,
>(
  input: ModeOutputsInput<FunnelExecuted, FunnelServer, FlowServer, FlowChart, RetentionServer, RetentionChart, Debug>
): ModeOutputs<FunnelExecuted, FunnelServer, FlowServer, FlowChart, RetentionServer, RetentionChart, Debug> {
  return {
    // In funnel mode, provide the executed queries for debug display (legacy)
    funnelExecutedQueries:
      input.isFunnelMode && input.funnelExecutedQueries && input.funnelExecutedQueries.length > 0
        ? input.funnelExecutedQueries
        : null,
    // The actual server funnel query (new, preferred)
    funnelServerQuery: input.isFunnelMode ? input.funnelServerQuery : null,
    // Funnel debug data (unified SQL for funnel mode)
    funnelDebugData: input.isFunnelMode ? input.funnelDebugData : null,
    // Flow-related values
    flowServerQuery: input.isFlowMode ? input.flowServerQuery : null,
    flowChartData: input.isFlowMode ? input.flowData : null,
    // Flow debug data (unified SQL for flow mode)
    flowDebugData: input.isFlowMode ? input.flowDebugData : null,
    // Retention-related values
    retentionServerQuery: input.isRetentionMode ? input.retentionServerQuery : null,
    retentionChartData: input.isRetentionMode ? input.retentionChartData : null,
    // Retention debug data (unified SQL for retention mode)
    retentionDebugData: input.isRetentionMode ? input.retentionDebugData : null,
  }
}

/** Inputs for computing the per-query-hook `skip` flags. */
export interface SkipFlagsInput {
  isValidQuery: boolean
  isSingleMode: boolean
  isMultiMode: boolean
  isFunnelMode: boolean | undefined
  isFlowMode: boolean
  isRetentionMode: boolean
  hasMultiQueryConfig: boolean
  hasFunnelConfig: boolean
  hasServerFunnelQuery: boolean
  hasServerFlowQuery: boolean
  hasServerRetentionQuery: boolean
}

export interface SkipFlags {
  single: boolean
  multi: boolean
  funnel: boolean
  flow: boolean
  retention: boolean
  dryRun: boolean
}

/**
 * Compute the `skip` flag for each query hook. Extracted from the inline
 * boolean expressions so the hook body stays flat. Logic is unchanged.
 */
export function computeSkipFlags(input: SkipFlagsInput): SkipFlags {
  return {
    single: !input.isValidQuery || !input.isSingleMode,
    multi: !input.hasMultiQueryConfig || !input.isMultiMode,
    funnel: !input.isFunnelMode || (!input.hasFunnelConfig && !input.hasServerFunnelQuery),
    flow: !input.isFlowMode || !input.hasServerFlowQuery,
    retention: !input.isRetentionMode || !input.hasServerRetentionQuery,
    dryRun: Boolean(!input.isValidQuery || input.isFunnelMode || input.isFlowMode || input.isRetentionMode),
  }
}

/** Inputs for the unified execution-status computation. */
export interface ExecutionStatusInput {
  hasResults: unknown
  initialData: unknown[] | undefined
  isValidQuery: boolean
  isLoading: boolean
  isFetching: boolean
  error: unknown
}

/**
 * Compute the unified execution status. Extracted verbatim from the original
 * useMemo body to keep the hook flat; the `hasResults` per-mode pick is done by
 * the caller and passed in.
 */
export function computeExecutionStatus(
  input: ExecutionStatusInput
): 'idle' | 'loading' | 'refreshing' | 'error' | 'success' {
  const { hasResults, initialData, isValidQuery, isLoading, isFetching, error } = input
  if (initialData && initialData.length > 0 && !hasResults) return 'success'
  if (!isValidQuery) return 'idle'
  if (isLoading && !hasResults) return 'loading'
  if (isFetching && hasResults) return 'refreshing'
  if (error) return 'error'
  if (hasResults) return 'success'
  return 'idle'
}

/** Inputs for computing the unified execution results array. */
export interface ExecutionResultsInput {
  isRetentionMode: boolean
  isFlowMode: boolean
  isFunnelMode: boolean | undefined
  isMultiMode: boolean
  retentionChartData: { rows: Array<{
    period: number
    retentionRate: number
    retainedUsers: number
    cohortSize: number
    breakdownValue?: string | null
  }> } | null | undefined
  flowData: unknown
  funnelChartData: unknown[] | null | undefined
  multiData: unknown[] | null | undefined
  singleRawData: unknown[] | null | undefined
  initialData: unknown[] | undefined
}

/**
 * Compute the unified execution results array. This is a priority cascade
 * (not a strict per-mode pick): when the active mode has no data yet, it falls
 * through to lower-priority sources, ending at initialData. Extracted verbatim
 * from the original useMemo body to preserve behaviour.
 */
export function computeExecutionResults(input: ExecutionResultsInput): unknown[] | null {
  // Retention mode returns transformed flat data for chart compatibility
  if (input.isRetentionMode && input.retentionChartData) {
    // Transform RetentionChartData to flat rows
    // Format: [{ "Retention.period": "P0", "Retention.rate": 0.45, "Retention.segment": "US", ... }]
    return input.retentionChartData.rows.map(row => ({
      'Retention.period': `P${row.period}`,
      'Retention.rate': row.retentionRate,
      'Retention.retained': row.retainedUsers,
      'Retention.cohortSize': row.cohortSize,
      'Retention.segment': row.breakdownValue || 'All Users',
    })) as unknown[]
  }
  // Flow mode returns Sankey chart data directly
  if (input.isFlowMode && input.flowData) {
    // Wrap in array for consistency with other modes
    return [input.flowData] as unknown[]
  }
  // Funnel mode returns chart data directly
  if (input.isFunnelMode && input.funnelChartData) {
    return input.funnelChartData as unknown[]
  }
  if (input.isMultiMode && input.multiData) {
    return input.multiData as unknown[]
  }
  if (input.singleRawData) {
    return input.singleRawData
  }
  if (input.initialData && input.initialData.length > 0) {
    return input.initialData
  }
  return null
}

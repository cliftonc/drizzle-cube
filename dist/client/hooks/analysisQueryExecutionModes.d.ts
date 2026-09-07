/**
 * Pure mode-selection helpers for useAnalysisQuery.
 *
 * The hook coordinates five execution modes (retention, flow, funnel, multi,
 * single). Almost every derived value is "pick the field from whichever mode is
 * active". These helpers collapse the repeated 5-way ternary chains into a
 * single normalized per-mode descriptor plus a selector, without changing any
 * behaviour: the selected values are byte-for-byte equivalent to the original
 * nested ternaries.
 */
/** The active execution mode, in priority order (retention > flow > funnel > multi > single). */
export type ActiveMode = 'retention' | 'flow' | 'funnel' | 'multi' | 'single';
export interface ModeFlags {
    isRetentionMode: boolean | undefined;
    isFlowMode: boolean | undefined;
    isFunnelMode: boolean | undefined;
    isMultiMode: boolean | undefined;
}
/**
 * Resolve the single active mode from the boolean flags, using the same
 * precedence as the original nested ternaries (retention first, single last).
 */
export declare function resolveActiveMode(flags: ModeFlags): ActiveMode;
/**
 * A value resolved per-mode. Pass the value each mode contributes; `pickByMode`
 * returns the one for the active mode. This mirrors the original
 * `isRetentionMode ? a : isFlowMode ? b : ...` chains exactly. Each field may
 * have its own type — the return type is the union across all modes.
 */
export type PerMode<R extends Record<ActiveMode, unknown>> = R;
export declare function pickByMode<R extends Record<ActiveMode, unknown>>(mode: ActiveMode, values: R): R[ActiveMode];
/**
 * Inputs for deriving the per-mode "debug / server query / chart data" outputs.
 * Each field is the raw value the corresponding mode hook exposes; the helper
 * gates it on the matching mode flag (returning null otherwise), exactly as the
 * original inline `isXMode ? value : null` expressions did.
 */
export interface ModeOutputsInput<FunnelExecuted, FunnelServer, FlowServer, FlowChart, RetentionServer, RetentionChart, Debug> {
    isFunnelMode: boolean | undefined;
    isFlowMode: boolean;
    isRetentionMode: boolean;
    funnelExecutedQueries: FunnelExecuted[] | undefined;
    funnelServerQuery: FunnelServer;
    funnelDebugData: Debug;
    flowServerQuery: FlowServer;
    flowData: FlowChart;
    flowDebugData: Debug;
    retentionServerQuery: RetentionServer;
    retentionChartData: RetentionChart;
    retentionDebugData: Debug;
}
export interface ModeOutputs<FunnelExecuted, FunnelServer, FlowServer, FlowChart, RetentionServer, RetentionChart, Debug> {
    funnelExecutedQueries: FunnelExecuted[] | null;
    funnelServerQuery: FunnelServer | null;
    funnelDebugData: Debug | null;
    flowServerQuery: FlowServer | null;
    flowChartData: FlowChart | null;
    flowDebugData: Debug | null;
    retentionServerQuery: RetentionServer | null;
    retentionChartData: RetentionChart | null;
    retentionDebugData: Debug | null;
}
export declare function deriveModeOutputs<FunnelExecuted, FunnelServer, FlowServer, FlowChart, RetentionServer, RetentionChart, Debug>(input: ModeOutputsInput<FunnelExecuted, FunnelServer, FlowServer, FlowChart, RetentionServer, RetentionChart, Debug>): ModeOutputs<FunnelExecuted, FunnelServer, FlowServer, FlowChart, RetentionServer, RetentionChart, Debug>;
/** Inputs for computing the per-query-hook `skip` flags. */
export interface SkipFlagsInput {
    isValidQuery: boolean;
    isSingleMode: boolean;
    isMultiMode: boolean;
    isFunnelMode: boolean | undefined;
    isFlowMode: boolean;
    isRetentionMode: boolean;
    hasMultiQueryConfig: boolean;
    hasFunnelConfig: boolean;
    hasServerFunnelQuery: boolean;
    hasServerFlowQuery: boolean;
    hasServerRetentionQuery: boolean;
}
export interface SkipFlags {
    single: boolean;
    multi: boolean;
    funnel: boolean;
    flow: boolean;
    retention: boolean;
    dryRun: boolean;
}
/**
 * Compute the `skip` flag for each query hook. Extracted from the inline
 * boolean expressions so the hook body stays flat. Logic is unchanged.
 */
export declare function computeSkipFlags(input: SkipFlagsInput): SkipFlags;
/** Inputs for the unified execution-status computation. */
export interface ExecutionStatusInput {
    hasResults: unknown;
    initialData: unknown[] | undefined;
    isValidQuery: boolean;
    isLoading: boolean;
    isFetching: boolean;
    error: unknown;
}
/**
 * Compute the unified execution status. Extracted verbatim from the original
 * useMemo body to keep the hook flat; the `hasResults` per-mode pick is done by
 * the caller and passed in.
 */
export declare function computeExecutionStatus(input: ExecutionStatusInput): 'idle' | 'loading' | 'refreshing' | 'error' | 'success';
/** Inputs for computing the unified execution results array. */
export interface ExecutionResultsInput {
    isRetentionMode: boolean;
    isFlowMode: boolean;
    isFunnelMode: boolean | undefined;
    isMultiMode: boolean;
    retentionChartData: {
        rows: Array<{
            period: number;
            retentionRate: number;
            retainedUsers: number;
            cohortSize: number;
            breakdownValue?: string | null;
        }>;
    } | null | undefined;
    flowData: unknown;
    funnelChartData: unknown[] | null | undefined;
    multiData: unknown[] | null | undefined;
    singleRawData: unknown[] | null | undefined;
    initialData: unknown[] | undefined;
}
/**
 * Compute the unified execution results array. This is a priority cascade
 * (not a strict per-mode pick): when the active mode has no data yet, it falls
 * through to lower-priority sources, ending at initialData. Extracted verbatim
 * from the original useMemo body to preserve behaviour.
 */
export declare function computeExecutionResults(input: ExecutionResultsInput): unknown[] | null;

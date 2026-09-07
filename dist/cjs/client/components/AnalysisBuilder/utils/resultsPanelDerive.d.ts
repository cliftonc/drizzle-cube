/**
 * resultsPanelDerive
 *
 * Small pure helpers for AnalysisResultsPanel derived values, extracted to keep
 * the component body flat. Behaviour is identical to the previous inline logic.
 */
export interface DebugDataEntry {
    sql: unknown;
    analysis: unknown;
    mode: unknown;
    queryType: unknown;
    joinType: unknown;
    cubesUsed: unknown[];
    modeMetadata: unknown;
    loading: boolean;
    error: unknown;
}
/**
 * Resolve the active debug entry, falling back to an empty placeholder.
 * The fallback is cast to the element type so callers keep their precise typing.
 */
export declare function resolveDebugData<T>(debugDataPerQuery: T[], activeDebugIndex: number): T;
interface ChartViewParams {
    isCurrentChartRenderable: boolean;
    isFlowMode: boolean;
    isFunnelMode: boolean;
    isRetentionMode: boolean;
}
/** Whether the chart view toggle should be enabled. */
export declare function isChartViewEnabled({ isCurrentChartRenderable, isFlowMode, isFunnelMode, isRetentionMode }: ChartViewParams): boolean;
/**
 * Whether the panel has meaningful results to display, accounting for the
 * different data shapes per analysis mode.
 */
export declare function computeHasResults(executionResults: unknown[] | null | undefined, isFlowMode: boolean, isRetentionMode: boolean, retentionChartData: {
    rows: unknown[];
} | null | undefined): boolean;
interface TableSelectionParams<Q, R> {
    tableIndex: number | undefined;
    isMultiQuery: unknown;
    allQueries: Q[] | null | undefined;
    perQueryResults: R[] | null | undefined;
    executionResults: R | null | undefined;
    combinedQueryForChart: Q | undefined;
}
/**
 * Resolve the data + query object for a table view given the requested index.
 * tableIndex: undefined = single query, -1 = merged view, 0+ = per-query view.
 */
export declare function selectTableData<Q, R>({ tableIndex, isMultiQuery, allQueries, perQueryResults, executionResults, combinedQueryForChart }: TableSelectionParams<Q, R>): {
    tableData: R | null;
    tableQuery: Q | undefined;
};
/**
 * Resolve the display source/target event names for a flow Sankey link, handling
 * both transformed (`source`/`target`) and raw (`source_id`/`target_id`) shapes.
 */
export declare function flowLinkNames(link: Record<string, unknown>): {
    sourceName: string;
    targetName: string;
};
/**
 * Multi-query mode (but NOT funnel mode — funnels always show unified results).
 */
export declare function computeIsMultiQuery(isFunnelMode: boolean, queryCount: number, perQueryResults: unknown[] | null | undefined): boolean;
/** Title/tooltip for the chart view toggle button. */
export declare function chartViewButtonTitle(chartViewEnabled: boolean, chartViewUnavailableReason: string | undefined, t: (key: string) => string): string;
export {};

import { DebugDataEntry } from './queries/index.js';
import { CubeQuery, MultiQueryConfig, FunnelBindingKey, QueryMergeStrategy, AnalysisType } from '../types.js';
import { ExecutionStatus } from '../components/AnalysisBuilder/types.js';
import { ServerFunnelQuery } from '../types/funnel.js';
import { ServerFlowQuery, FlowChartData } from '../types/flow.js';
import { ServerRetentionQuery, RetentionChartData } from '../types/retention.js';
export interface UseAnalysisQueryOptions {
    /** Current query (for single-query mode) */
    currentQuery: CubeQuery;
    /** All queries (for dry-run and multi-query) */
    allQueries: CubeQuery[];
    /** Multi-query config (null if single-query mode) */
    multiQueryConfig: MultiQueryConfig | null;
    /** Whether in multi-query mode */
    isMultiQueryMode: boolean;
    /** Whether current query is valid */
    isValidQuery: boolean;
    /** Initial data (skip first fetch) */
    initialData?: unknown[];
    /** Merge strategy (for detecting funnel mode - legacy) */
    mergeStrategy?: QueryMergeStrategy;
    /** Funnel binding key (required for funnel mode) */
    funnelBindingKey?: FunnelBindingKey | null;
    /**
     * Whether funnel mode is properly configured (from store).
     * This includes filter-only step validation that isMultiQueryMode doesn't provide.
     * @deprecated Use analysisType === 'funnel' instead
     */
    isFunnelModeEnabled?: boolean;
    /**
     * Analysis type for explicit mode routing.
     * When provided, takes precedence over legacy mode detection.
     */
    analysisType?: AnalysisType;
    /**
     * Pre-built server funnel query from store's buildFunnelQueryFromSteps().
     * Used when analysisType === 'funnel' with the new dedicated funnel state.
     */
    serverFunnelQuery?: ServerFunnelQuery | null;
    /**
     * Pre-built server flow query from store's buildFlowQuery().
     * Used when analysisType === 'flow' with the new dedicated flow state.
     */
    serverFlowQuery?: ServerFlowQuery | null;
    /**
     * Pre-built server retention query from store's buildRetentionQuery().
     * Used when analysisType === 'retention' with the new dedicated retention state.
     */
    serverRetentionQuery?: ServerRetentionQuery | null;
    /**
     * Validation result for retention mode from store's getRetentionValidation().
     * Used to display specific errors in the debug panel.
     */
    retentionValidation?: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } | null;
}
export interface UseAnalysisQueryResult {
    /** Query execution status */
    executionStatus: ExecutionStatus;
    /** Query results (merged for multi-query) */
    executionResults: unknown[] | null;
    /** Per-query results (for table view in multi-query mode) */
    perQueryResults: (unknown[] | null)[] | null;
    /** Whether query is loading */
    isLoading: boolean;
    /** Whether query is fetching (includes refetch) */
    isFetching: boolean;
    /** Query error */
    error: Error | null;
    /** Debug data per query (for non-funnel modes) */
    debugDataPerQuery: DebugDataEntry[];
    /** Whether query has been debounced (for smart defaults trigger) */
    hasDebounced: boolean;
    /** Refetch function. Pass { bustCache: true } to bypass client and server caches. */
    refetch: (options?: {
        bustCache?: boolean;
    }) => void;
    /**
     * In funnel mode, these are the actually executed queries with:
     * - Binding key dimension auto-added
     * - IN filter applied for steps 2+
     * Use these for debug display instead of the original queries.
     * @deprecated Server-side funnel uses a unified query. Use funnelServerQuery instead.
     */
    funnelExecutedQueries: CubeQuery[] | null;
    /**
     * The actual server funnel query { funnel: {...} }
     * This is the unified query sent to the server (not per-step queries).
     */
    funnelServerQuery: ServerFunnelQuery | null;
    /**
     * Debug data specifically for funnel mode
     * Contains unified dry-run SQL and mode metadata.
     */
    funnelDebugData: DebugDataEntry | null;
    /**
     * The server flow query being executed (when analysisType === 'flow')
     */
    flowServerQuery: ServerFlowQuery | null;
    /**
     * Flow chart data (nodes and links for Sankey visualization)
     */
    flowChartData: FlowChartData | null;
    /**
     * Debug data specifically for flow mode
     * Contains unified dry-run SQL and mode metadata.
     */
    flowDebugData: DebugDataEntry | null;
    /**
     * The server retention query being executed (when analysisType === 'retention')
     */
    retentionServerQuery: ServerRetentionQuery | null;
    /**
     * Retention chart data (cohort × period matrix)
     */
    retentionChartData: RetentionChartData | null;
    /**
     * Debug data specifically for retention mode
     * Contains unified dry-run SQL and mode metadata.
     */
    retentionDebugData: DebugDataEntry | null;
    /**
     * Retention validation result (errors explaining why query cannot be built)
     */
    retentionValidation: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } | null;
    /**
     * Whether the current query config differs from the last executed query.
     * Used for manual refresh mode to show "needs refresh" indicator.
     */
    needsRefresh: boolean;
    /**
     * Query warnings from the server (e.g., fan-out without dimensions).
     * Displayed as a banner above results.
     */
    warnings: import('../shared/types.js').QueryWarning[] | undefined;
}
export declare function useAnalysisQuery(options: UseAnalysisQueryOptions): UseAnalysisQueryResult;

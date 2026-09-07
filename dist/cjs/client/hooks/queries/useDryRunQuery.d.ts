import { CubeQuery } from '../../types.js';
import { QueryAnalysis } from '../../components/AnalysisBuilder/types.js';
export type DryRunMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention';
/**
 * Debug data entry for a single query
 */
export interface DebugDataEntry {
    /** Generated SQL and parameters */
    sql: {
        sql: string;
        params: unknown[];
    } | null;
    /** Query analysis (dimensions, measures, complexity, etc.) */
    analysis: QueryAnalysis | null;
    /** Server-reported dry-run mode */
    mode?: DryRunMode | null;
    /** Query type label from server */
    queryType?: string | null;
    /** Join strategy label from server */
    joinType?: string | null;
    /** Referenced cubes from server */
    cubesUsed?: string[];
    /** Mode-specific metadata (replaces funnel/flow/retention split) */
    modeMetadata?: unknown;
    /** Whether this entry is loading */
    loading: boolean;
    /** Error if fetch failed */
    error: Error | null;
}
/**
 * Create a stable query key for dry-run
 */
export declare function createDryRunQueryKey(query: CubeQuery | null): readonly unknown[];
export interface UseDryRunQueryOptions {
    /**
     * Whether to skip the query
     * @default false
     */
    skip?: boolean;
    /**
     * Stale time in milliseconds
     * @default 5 * 60 * 1000 (5 minutes)
     */
    staleTime?: number;
}
export interface UseDryRunQueryResult {
    /** Debug data for the query */
    debugData: DebugDataEntry;
    /** Manually refetch */
    refetch: () => void;
}
/**
 * TanStack Query hook for single query dry-run (debug) data
 *
 * Usage:
 * ```tsx
 * const { debugData } = useDryRunQuery(query, { skip: !isValidQuery })
 * ```
 */
export declare function useDryRunQuery(query: CubeQuery | null, options?: UseDryRunQueryOptions): UseDryRunQueryResult;
export interface UseMultiDryRunQueriesOptions {
    /**
     * Whether to skip all queries
     * @default false
     */
    skip?: boolean;
    /**
     * Stale time in milliseconds
     * @default 5 * 60 * 1000 (5 minutes)
     */
    staleTime?: number;
}
export interface UseMultiDryRunQueriesResult {
    /** Debug data for each query */
    debugDataPerQuery: DebugDataEntry[];
    /** Whether any query is loading */
    isLoading: boolean;
    /** Manually refetch all */
    refetchAll: () => void;
}
/**
 * TanStack Query hook for multiple query dry-runs (debug) data
 *
 * Fetches debug data for multiple queries in parallel.
 *
 * Usage:
 * ```tsx
 * const { debugDataPerQuery, isLoading } = useMultiDryRunQueries(queries, {
 *   skip: !isMultiQueryMode
 * })
 * ```
 */
export declare function useMultiDryRunQueries(queries: CubeQuery[], options?: UseMultiDryRunQueriesOptions): UseMultiDryRunQueriesResult;
/**
 * Combined hook for single or multi-query dry-run based on mode
 *
 * This is a convenience wrapper that automatically chooses between
 * single and multi-query dry-run based on the number of queries.
 *
 * Usage:
 * ```tsx
 * const { debugDataPerQuery } = useDryRunQueries({
 *   queries: isMultiQueryMode ? allQueries : [currentQuery],
 *   isMultiQueryMode,
 *   skip: !isValidQuery
 * })
 * ```
 */
export declare function useDryRunQueries(options: {
    queries: CubeQuery[];
    isMultiQueryMode: boolean;
    skip?: boolean;
    staleTime?: number;
}): UseMultiDryRunQueriesResult;
export type FunnelDebugDataEntry = DebugDataEntry;
/**
 * TanStack Query hook for funnel query dry-run (debug) data
 *
 * Usage:
 * ```tsx
 * const { debugData } = useFunnelDryRunQuery(serverQuery, { skip: !isFunnelMode })
 * ```
 */
export declare function useFunnelDryRunQuery(serverQuery: unknown | null, options?: UseDryRunQueryOptions): {
    debugData: FunnelDebugDataEntry;
    refetch: () => void;
};
export type FlowDebugDataEntry = DebugDataEntry;
/**
 * TanStack Query hook for flow query dry-run (debug) data
 *
 * Usage:
 * ```tsx
 * const { debugData } = useFlowDryRunQuery(serverQuery, { skip: !isFlowMode })
 * ```
 */
export declare function useFlowDryRunQuery(serverQuery: unknown | null, options?: UseDryRunQueryOptions): {
    debugData: FlowDebugDataEntry;
    refetch: () => void;
};
export type RetentionDebugDataEntry = DebugDataEntry;
/**
 * TanStack Query hook for retention query dry-run (debug) data
 *
 * Usage:
 * ```tsx
 * const { debugData } = useRetentionDryRunQuery(serverQuery, { skip: !isRetentionMode })
 * ```
 */
export declare function useRetentionDryRunQuery(serverQuery: unknown | null, options?: UseDryRunQueryOptions): {
    debugData: RetentionDebugDataEntry;
    refetch: () => void;
};

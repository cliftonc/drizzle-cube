import { ServerFlowQuery, FlowChartData } from '../../types/flow.js';
/**
 * Options for useFlowQuery hook
 */
export interface UseFlowQueryOptions {
    /** Skip query execution */
    skip?: boolean;
    /** Debounce delay in milliseconds */
    debounceMs?: number;
    /** Callback when query completes successfully */
    onComplete?: (data: FlowChartData) => void;
    /** Callback when query fails */
    onError?: (error: Error) => void;
}
/**
 * Result from useFlowQuery hook
 */
export interface UseFlowQueryResult {
    /** Transformed flow chart data (nodes and links) */
    data: FlowChartData | null;
    /** Raw data from server */
    rawData: unknown[] | null;
    /** Cache metadata when served from cache */
    cacheInfo?: {
        hit: true;
        cachedAt: string;
        ttlMs: number;
        ttlRemainingMs: number;
    } | null;
    /** Is initial load in progress */
    isLoading: boolean;
    /** Is refetch in progress */
    isFetching: boolean;
    /** Is waiting for debounce */
    isDebouncing: boolean;
    /** Is executing (loading or fetching) */
    isExecuting: boolean;
    /** Error if query failed */
    error: Error | null;
    /** Refetch the query. Pass { bustCache: true } to bypass client and server caches. */
    refetch: (options?: {
        bustCache?: boolean;
    }) => void;
    /** Reset the query cache */
    reset: () => void;
    /** The server query being executed */
    serverQuery: ServerFlowQuery | null;
    /**
     * Whether the query needs to be refreshed (manual refresh mode only).
     * True when the current flow config differs from the last executed query.
     */
    needsRefresh: boolean;
}
/**
 * Hook for server-side flow query execution
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useFlowQuery(serverFlowQuery, {
 *   debounceMs: 300,
 *   skip: !isConfigured
 * })
 *
 * // Results available after single server request
 * <SankeyChart data={data} />
 * ```
 */
export declare function useFlowQuery(query: ServerFlowQuery | null, options?: UseFlowQueryOptions): UseFlowQueryResult;
/**
 * Create a stable query key for flow queries
 */
export declare function createFlowQueryKey(query: ServerFlowQuery | null): readonly unknown[];

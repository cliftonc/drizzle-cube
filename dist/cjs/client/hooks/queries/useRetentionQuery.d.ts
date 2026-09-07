import { ServerRetentionQuery, RetentionChartData, RetentionResultRow } from '../../types/retention.js';
/**
 * Options for retention query hook
 */
export interface UseRetentionQueryOptions {
    /** Skip execution */
    skip?: boolean;
    /** Debounce delay in milliseconds */
    debounceMs?: number;
    /** Callback when query completes */
    onComplete?: (result: RetentionChartData) => void;
    /** Callback when query fails */
    onError?: (error: Error) => void;
    /** Function to resolve field names to human-readable display labels */
    getFieldLabel?: (fieldName: string) => string;
}
/**
 * Result from retention query hook
 */
export interface UseRetentionQueryResult {
    /** Retention chart data */
    chartData: RetentionChartData | null;
    /** Raw data rows from server */
    rawData: RetentionResultRow[] | null;
    /** Current execution status */
    status: 'idle' | 'loading' | 'success' | 'error';
    /** Whether currently loading */
    isLoading: boolean;
    /** Whether fetching (includes refetch) */
    isFetching: boolean;
    /** Whether waiting for debounce */
    isDebouncing: boolean;
    /** Error if execution failed */
    error: Error | null;
    /** Cache metadata when served from cache */
    cacheInfo?: {
        hit: true;
        cachedAt: string;
        ttlMs: number;
        ttlRemainingMs: number;
    } | null;
    /** Execute the query (for manual refresh mode) */
    execute: (options?: {
        bustCache?: boolean;
    }) => Promise<RetentionChartData | null>;
    /** Refetch the query */
    refetch: () => void;
    /**
     * Whether the query needs to be refreshed (manual refresh mode only).
     * True when the current query config differs from the last executed query.
     */
    needsRefresh: boolean;
}
/**
 * Hook for server-side retention query execution
 *
 * Usage:
 * ```tsx
 * const { chartData, isLoading, error } = useRetentionQuery(serverQuery, {
 *   debounceMs: 300,
 *   skip: !hasRequiredFields
 * })
 *
 * <RetentionHeatmap data={chartData} />
 * ```
 */
export declare function useRetentionQuery(serverQuery: ServerRetentionQuery | null, options?: UseRetentionQueryOptions): UseRetentionQueryResult;

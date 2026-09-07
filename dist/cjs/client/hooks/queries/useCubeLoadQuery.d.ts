import { CubeQuery, CubeResultSet } from '../../types.js';
import { QueryWarning } from '../../shared/types.js';
/**
 * Create a stable query key from a CubeQuery
 * The key includes all query parameters to ensure proper caching
 */
export declare function createQueryKey(query: CubeQuery | null): readonly unknown[];
export interface UseCubeLoadQueryOptions {
    /**
     * Whether to skip the query
     * @default false
     */
    skip?: boolean;
    /**
     * Debounce delay in milliseconds
     * @default 300
     */
    debounceMs?: number;
    /**
     * Whether to reset result set when query changes
     * @default true
     */
    resetResultSetOnChange?: boolean;
    /**
     * Stale time in milliseconds
     * @default 60 * 1000 (1 minute)
     */
    staleTime?: number;
    /**
     * Whether to keep previous data while loading new data
     * @default true
     */
    keepPreviousData?: boolean;
}
/** Options for the refetch function */
export interface RefetchOptions {
    /** If true, bypasses both client and server caches */
    bustCache?: boolean;
}
export interface UseCubeLoadQueryResult {
    /** The result set from the query */
    resultSet: CubeResultSet | null;
    /** Raw data from the result set */
    rawData: unknown[] | null;
    /** Whether the query is loading (initial load) */
    isLoading: boolean;
    /** Whether the query is fetching (includes refetch) */
    isFetching: boolean;
    /** Whether query is debouncing (waiting for user to stop typing) */
    isDebouncing: boolean;
    /** Error if the query failed */
    error: Error | null;
    /** The debounced query that was executed */
    debouncedQuery: CubeQuery | null;
    /** Whether the current query is valid */
    isValidQuery: boolean;
    /** Manually refetch the data. Pass { bustCache: true } to bypass caches. */
    refetch: (options?: RefetchOptions) => void;
    /** Clear the query cache */
    clearCache: () => void;
    /**
     * Whether the query needs to be refreshed (manual refresh mode only).
     * True when the current query config differs from the last executed query.
     */
    needsRefresh: boolean;
    /**
     * Execute the current query (manual refresh mode only).
     * In auto-refresh mode, this is the same as refetch().
     */
    executeQuery: (options?: RefetchOptions) => void;
    /** Warnings from query planning (e.g., fan-out without dimensions) */
    warnings: QueryWarning[] | undefined;
}
/**
 * TanStack Query hook for loading cube data with debouncing
 *
 * Usage:
 * ```tsx
 * const { resultSet, rawData, isLoading, error } = useCubeLoadQuery(query, {
 *   debounceMs: 300,
 *   skip: !isReady
 * })
 * ```
 */
export declare function useCubeLoadQuery(query: CubeQuery | null, options?: UseCubeLoadQueryOptions): UseCubeLoadQueryResult;

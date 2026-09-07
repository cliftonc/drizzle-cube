import { MultiQueryConfig, CubeResultSet } from '../../types.js';
/**
 * Create a stable query key for multi-query
 */
export declare function createMultiQueryKey(config: MultiQueryConfig | null): readonly unknown[];
export interface UseMultiCubeLoadQueryOptions {
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
export interface UseMultiCubeLoadQueryResult {
    /** Merged data from all queries */
    data: unknown[] | null;
    /** Individual result sets from each query */
    resultSets: (CubeResultSet | null)[] | null;
    /** Per-query raw data */
    perQueryData: (unknown[] | null)[] | null;
    /** Whether any query is still loading (initial load) */
    isLoading: boolean;
    /** Whether any query is fetching (includes refetch) */
    isFetching: boolean;
    /** Whether query is debouncing (waiting for user to stop typing) */
    isDebouncing: boolean;
    /** First error encountered */
    error: Error | null;
    /** Per-query errors */
    errors: (Error | null)[];
    /** The debounced config that was executed */
    debouncedConfig: MultiQueryConfig | null;
    /** Whether the current config is valid */
    isValidConfig: boolean;
    /** Manually refetch the data. Pass { bustCache: true } to bypass client and server caches. */
    refetch: (options?: {
        bustCache?: boolean;
    }) => void;
}
/**
 * TanStack Query hook for loading multi-cube data with debouncing
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useMultiCubeLoadQuery(config, {
 *   debounceMs: 300,
 *   skip: !isMultiQueryMode
 * })
 * ```
 */
export declare function useMultiCubeLoadQuery(config: MultiQueryConfig | null, options?: UseMultiCubeLoadQueryOptions): UseMultiCubeLoadQueryResult;

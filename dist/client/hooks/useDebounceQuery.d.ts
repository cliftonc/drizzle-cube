/**
 * useDebounceQuery - Shared debounce logic for query hooks
 *
 * This hook encapsulates the common debouncing pattern used by
 * useCubeLoadQuery and useMultiCubeLoadQuery to prevent excessive API calls
 * when users are actively editing queries.
 *
 * Features:
 * - Debounces value changes with configurable delay
 * - Handles skip-to-unskip transitions (e.g., portlet becoming visible)
 * - Clears debounced value when invalid or skipped
 * - Provides isDebouncing state for UI feedback
 */
export interface UseDebounceQueryOptions {
    /**
     * Whether the value is valid (has required fields)
     */
    isValid: boolean;
    /**
     * Whether to skip the debounced value
     * @default false
     */
    skip?: boolean;
    /**
     * Debounce delay in milliseconds
     * @default 300
     */
    debounceMs?: number;
}
export interface UseDebounceQueryResult<T> {
    /** The debounced value (null if skipped or invalid) */
    debouncedValue: T | null;
    /** Whether the hook is currently debouncing (waiting for timer) */
    isDebouncing: boolean;
}
/**
 * Hook for debouncing query values with skip and validity support
 *
 * Usage:
 * ```tsx
 * const { debouncedValue, isDebouncing } = useDebounceQuery(query, {
 *   isValid: isValidCubeQuery(query),
 *   skip: !isReady,
 *   debounceMs: 300
 * })
 * ```
 */
export declare function useDebounceQuery<T>(value: T | null, options: UseDebounceQueryOptions): UseDebounceQueryResult<T>;

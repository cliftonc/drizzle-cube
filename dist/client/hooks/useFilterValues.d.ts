/**
 * Hook for fetching distinct field values for filter dropdowns
 * Uses TanStack Query via useCubeLoadQuery for data fetching
 */
interface UseFilterValuesResult {
    values: any[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    searchValues: (searchTerm: string, force?: boolean) => void;
}
/**
 * Custom hook to fetch distinct values for a field
 *
 * Uses TanStack Query for server state (data fetching, caching, loading).
 * Values are derived via useMemo from query results - NOT stored in useState.
 */
export declare function useFilterValues(fieldName: string | null, enabled?: boolean): UseFilterValuesResult;
export {};

import { useQueryClient } from '@tanstack/react-query';
import { useCubeApi } from '../../providers/CubeApiProvider.js';
import { CubeMeta, FieldLabelMap } from '../../types.js';
export declare const CUBE_META_QUERY_KEY: readonly ["cube", "meta"];
export interface UseCubeMetaQueryOptions {
    /**
     * Whether to skip the query (useful for conditional fetching)
     * @default false
     */
    enabled?: boolean;
    /**
     * Stale time in milliseconds (how long before data is considered stale)
     * @default 5 * 60 * 1000 (5 minutes)
     */
    staleTime?: number;
}
export interface UseCubeMetaQueryResult {
    /** Cube metadata */
    meta: CubeMeta | null;
    /** Field label map for quick lookups */
    labelMap: FieldLabelMap;
    /** Whether the query is loading */
    isLoading: boolean;
    /** Whether the query is fetching (includes background refetch) */
    isFetching: boolean;
    /** Error if the query failed */
    error: Error | null;
    /** Manually refetch the metadata */
    refetch: () => void;
    /** Get a field's display label */
    getFieldLabel: (fieldName: string) => string;
}
/**
 * TanStack Query hook for fetching cube metadata
 *
 * Usage:
 * ```tsx
 * const { meta, labelMap, isLoading, error, refetch } = useCubeMetaQuery()
 * ```
 */
export declare function useCubeMetaQuery(options?: UseCubeMetaQueryOptions): UseCubeMetaQueryResult;
/**
 * Prefetch cube metadata - useful for eager loading
 *
 * Usage:
 * ```tsx
 * const queryClient = useQueryClient()
 * await prefetchCubeMeta(queryClient, cubeApi)
 * ```
 */
export declare function prefetchCubeMeta(queryClient: ReturnType<typeof useQueryClient>, cubeApi: ReturnType<typeof useCubeApi>['cubeApi']): Promise<void>;

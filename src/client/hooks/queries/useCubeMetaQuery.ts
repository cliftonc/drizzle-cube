/**
 * useCubeMetaQuery - TanStack Query hook for cube metadata
 *
 * Replaces manual caching in useCubeMeta with TanStack Query's built-in
 * cache management. Provides:
 * - Automatic caching with configurable stale time
 * - Built-in loading and error states
 * - Automatic refetch on mount (if stale)
 * - Manual refetch capability
 *
 * This hook wraps the existing CubeClient.meta() method.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCubeApi } from '../../providers/CubeApiProvider'
import type { CubeMeta, FieldLabelMap } from '../useCubeMeta'

// Query key for cube metadata
export const CUBE_META_QUERY_KEY = ['cube', 'meta'] as const

/**
 * Build a field label map from cube metadata
 * Maps field names to their display titles
 */
function buildLabelMap(meta: CubeMeta): FieldLabelMap {
  const labelMap: FieldLabelMap = {}

  meta.cubes.forEach((cube) => {
    // Add measures
    cube.measures.forEach((measure) => {
      labelMap[measure.name] = measure.title || measure.shortTitle || measure.name
    })

    // Add dimensions
    cube.dimensions.forEach((dimension) => {
      labelMap[dimension.name] = dimension.title || dimension.shortTitle || dimension.name
    })

    // Add segments
    cube.segments.forEach((segment) => {
      labelMap[segment.name] = segment.title || segment.shortTitle || segment.name
    })
  })

  return labelMap
}

export interface UseCubeMetaQueryOptions {
  /**
   * Whether to skip the query (useful for conditional fetching)
   * @default false
   */
  enabled?: boolean
  /**
   * Stale time in milliseconds (how long before data is considered stale)
   * @default 5 * 60 * 1000 (5 minutes)
   */
  staleTime?: number
}

export interface UseCubeMetaQueryResult {
  /** Cube metadata */
  meta: CubeMeta | null
  /** Field label map for quick lookups */
  labelMap: FieldLabelMap
  /** Whether the query is loading */
  isLoading: boolean
  /** Whether the query is fetching (includes background refetch) */
  isFetching: boolean
  /** Error if the query failed */
  error: Error | null
  /** Manually refetch the metadata */
  refetch: () => void
  /** Get a field's display label */
  getFieldLabel: (fieldName: string) => string
}

/**
 * TanStack Query hook for fetching cube metadata
 *
 * Usage:
 * ```tsx
 * const { meta, labelMap, isLoading, error, refetch } = useCubeMetaQuery()
 * ```
 */
export function useCubeMetaQuery(
  options: UseCubeMetaQueryOptions = {}
): UseCubeMetaQueryResult {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options
  const { cubeApi } = useCubeApi()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: CUBE_META_QUERY_KEY,
    queryFn: async () => {
      const metaData = await cubeApi.meta()
      const labelMap = buildLabelMap(metaData)
      return { meta: metaData, labelMap }
    },
    enabled,
    staleTime,
    // Keep data in cache for 15 minutes after it becomes unused
    gcTime: 15 * 60 * 1000,
  })

  // Extract data from query result
  const meta = query.data?.meta ?? null
  const labelMap = query.data?.labelMap ?? {}

  // Stable refetch function
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: CUBE_META_QUERY_KEY })
  }

  // Stable getFieldLabel function
  const getFieldLabel = (fieldName: string): string => {
    return labelMap[fieldName] || fieldName
  }

  return {
    meta,
    labelMap,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch,
    getFieldLabel,
  }
}

/**
 * Prefetch cube metadata - useful for eager loading
 *
 * Usage:
 * ```tsx
 * const queryClient = useQueryClient()
 * await prefetchCubeMeta(queryClient, cubeApi)
 * ```
 */
export async function prefetchCubeMeta(
  queryClient: ReturnType<typeof useQueryClient>,
  cubeApi: ReturnType<typeof useCubeApi>['cubeApi']
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: CUBE_META_QUERY_KEY,
    queryFn: async () => {
      const metaData = await cubeApi.meta()
      const labelMap = buildLabelMap(metaData)
      return { meta: metaData, labelMap }
    },
  })
}

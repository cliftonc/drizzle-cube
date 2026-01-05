/**
 * TanStack Query Hooks - Barrel Export
 *
 * These hooks provide TanStack Query-based data fetching for:
 * - Cube metadata (useCubeMetaQuery)
 * - Single cube data loading (useCubeLoadQuery)
 * - Multi-cube data loading (useMultiCubeLoadQuery)
 * - Dry-run/debug data (useDryRunQuery, useMultiDryRunQueries)
 *
 * All hooks include built-in debouncing, caching, and error handling.
 */

// Metadata query
export {
  useCubeMetaQuery,
  prefetchCubeMeta,
  CUBE_META_QUERY_KEY,
  type UseCubeMetaQueryOptions,
  type UseCubeMetaQueryResult,
} from './useCubeMetaQuery'

// Single query data loading
export {
  useCubeLoadQuery,
  createQueryKey,
  type UseCubeLoadQueryOptions,
  type UseCubeLoadQueryResult,
} from './useCubeLoadQuery'

// Multi-query data loading
export {
  useMultiCubeLoadQuery,
  createMultiQueryKey,
  type UseMultiCubeLoadQueryOptions,
  type UseMultiCubeLoadQueryResult,
} from './useMultiCubeLoadQuery'

// Dry-run/debug data
export {
  useDryRunQuery,
  useMultiDryRunQueries,
  useDryRunQueries,
  createDryRunQueryKey,
  type DebugDataEntry,
  type UseDryRunQueryOptions,
  type UseDryRunQueryResult,
  type UseMultiDryRunQueriesOptions,
  type UseMultiDryRunQueriesResult,
} from './useDryRunQuery'

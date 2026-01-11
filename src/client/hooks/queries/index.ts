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
  useCubeLoadQuery as useCubeQuery,
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
  useFunnelDryRunQuery,
  useFlowDryRunQuery,
  createDryRunQueryKey,
  type DebugDataEntry,
  type FunnelDebugDataEntry,
  type FlowDebugDataEntry,
  type UseDryRunQueryOptions,
  type UseDryRunQueryResult,
  type UseMultiDryRunQueriesOptions,
  type UseMultiDryRunQueriesResult,
} from './useDryRunQuery'

// Funnel query data loading (sequential execution)
export {
  useFunnelQuery,
  createFunnelQueryKey,
} from './useFunnelQuery'

// Flow query data loading (bidirectional Sankey)
export {
  useFlowQuery,
  createFlowQueryKey,
  type UseFlowQueryOptions,
  type UseFlowQueryResult,
} from './useFlowQuery'

// Explain query (execution plan)
export {
  useExplainQuery,
  createExplainQueryKey,
  type UseExplainQueryOptions,
  type UseExplainQueryResult,
} from './useExplainQuery'

// Explain AI analysis (recommendations)
export {
  useExplainAI,
  type UseExplainAIOptions,
  type UseExplainAIResult,
} from './useExplainAI'

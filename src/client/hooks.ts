/**
 * Drizzle Cube React Hooks
 *
 * React hooks only - for applications that need data fetching hooks
 * without UI components.
 */

// TanStack Query hooks for data fetching
export {
  useCubeMetaQuery,
  useCubeLoadQuery,
  useCubeQuery,
  useMultiCubeLoadQuery,
  useDryRunQuery,
  useMultiDryRunQueries,
  useDryRunQueries,
  useFunnelQuery,
  createFunnelQueryKey,
  useFlowQuery,
  createFlowQueryKey,
  useRetentionQuery,
  useExplainQuery,
  createExplainQueryKey,
  useExplainAI,
} from './hooks/queries/index.js'
export type {
  UseCubeMetaQueryOptions,
  UseCubeMetaQueryResult,
  UseCubeLoadQueryOptions,
  UseCubeLoadQueryResult,
  UseMultiCubeLoadQueryOptions,
  UseMultiCubeLoadQueryResult,
  DebugDataEntry,
  UseDryRunQueryOptions,
  UseDryRunQueryResult,
  UseMultiDryRunQueriesOptions,
  UseMultiDryRunQueriesResult,
  UseFlowQueryOptions,
  UseFlowQueryResult,
  UseRetentionQueryOptions,
  UseRetentionQueryResult,
  UseExplainQueryOptions,
  UseExplainQueryResult,
  UseExplainAIOptions,
  UseExplainAIResult,
} from './hooks/queries/index.js'

// Other hooks
export { useDebounce } from './hooks/useDebounce.js'
export { useDirtyStateTracking } from './hooks/useDirtyStateTracking.js'
export type { UseDirtyStateTrackingOptions, UseDirtyStateTrackingResult } from './hooks/useDirtyStateTracking.js'
export { useFilterValues } from './hooks/useFilterValues.js'
export { useResponsiveDashboard } from './hooks/useResponsiveDashboard.js'
export type { DashboardDisplayMode, UseResponsiveDashboardResult } from './hooks/useResponsiveDashboard.js'
export { useNotebookLayout } from './hooks/useNotebookLayout.js'
export type { NotebookLayoutMode, UseNotebookLayoutResult } from './hooks/useNotebookLayout.js'

// Hook-related types
export type {
  CubeQuery,
  CubeQueryOptions,
  CubeResultSet,
  CubeApiOptions
} from './types.js'

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
  useMultiCubeLoadQuery,
  useDryRunQuery,
  useMultiDryRunQueries,
  useDryRunQueries,
} from './hooks/queries'
export type {
  UseCubeMetaQueryOptions,
  UseCubeMetaQueryResult,
  UseCubeLoadQueryOptions,
  UseCubeLoadQueryResult,
  UseMultiCubeLoadQueryOptions,
  UseMultiCubeLoadQueryResult,
  DebugDataEntry,
} from './hooks/queries'

// Other hooks
export { useDebounce } from './hooks/useDebounce'
export { useDirtyStateTracking } from './hooks/useDirtyStateTracking'
export type { UseDirtyStateTrackingOptions, UseDirtyStateTrackingResult } from './hooks/useDirtyStateTracking'
export { useFilterValues } from './hooks/useFilterValues'
export { useResponsiveDashboard } from './hooks/useResponsiveDashboard'
export type { DashboardDisplayMode, UseResponsiveDashboardResult } from './hooks/useResponsiveDashboard'

// Hook-related types
export type {
  CubeQuery,
  CubeQueryOptions,
  CubeResultSet,
  CubeApiOptions
} from './types'

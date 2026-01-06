/**
 * Drizzle Cube Client Components
 *
 * React components for building analytics dashboards with minimal dependencies.
 * Designed to be embedded in existing applications with their own auth/navigation.
 *
 * For modular imports, consider using:
 * - 'drizzle-cube/client/charts' - Chart components only
 * - 'drizzle-cube/client/hooks' - React hooks only
 * - 'drizzle-cube/client/providers' - Context providers only
 * - 'drizzle-cube/client/components' - UI components (no charts)
 * - 'drizzle-cube/client/utils' - Utility functions only
 *
 * IMPORTANT: CSS is NOT auto-imported. Add to your app entry:
 *   import 'drizzle-cube/client/styles.css'
 */

// Import styles to ensure they are processed and bundled
import './styles.css'

// Core analytics components
export { default as AnalyticsPortlet } from './components/AnalyticsPortlet'
export { default as AnalyticsDashboard } from './components/AnalyticsDashboard'
export { default as LoadingIndicator } from './components/LoadingIndicator'
export type { LoadingIndicatorProps } from './components/LoadingIndicator'

// Lazy chart loading (for code splitting)
// For static chart imports, use 'drizzle-cube/client/charts' instead
export {
  LazyChart,
  preloadChart,
  preloadCharts,
  isValidChartType,
  getAvailableChartTypes
} from './charts/ChartLoader'
export type { LazyChartProps } from './charts/ChartLoader'

// Layout components
export { default as DashboardGrid } from './components/DashboardGrid'
export { default as PortletContainer } from './components/PortletContainer'

// Modals and configuration
export { default as PortletAnalysisModal } from './components/PortletAnalysisModal'
export { default as DashboardEditModal } from './components/DashboardEditModal'
export { default as Modal } from './components/Modal'
export { default as ConfirmModal } from './components/ConfirmModal'

// Query Builder - Seamless shim that uses AnalysisBuilder internally
export { default as QueryBuilder } from './components/QueryBuilderShim'

// Analysis Builder (search-based query builder)
export { default as AnalysisBuilder } from './components/AnalysisBuilder'

// Data provider and hooks
export {
  CubeProvider,
  useCubeContext,
  // Specialized context hooks for performance (only re-render on specific changes)
  useCubeApi,      // Only re-renders on API/auth changes
  useCubeMeta,     // Only re-renders on metadata changes
  useCubeFeatures  // Only re-renders on feature flag changes
} from './providers/CubeProvider'
export { ScrollContainerProvider, useScrollContainer } from './providers/ScrollContainerContext'
export { useCubeFieldLabel } from './hooks/useCubeFieldLabel'
export { createCubeClient } from './client/CubeClient'

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

// Master coordination hook for AnalysisBuilder
export { useAnalysisBuilder } from './hooks/useAnalysisBuilderHook'
export type {
  UseAnalysisBuilderOptions,
  UseAnalysisBuilderResult,
} from './hooks/useAnalysisBuilderHook'

// Master coordination hook for Dashboard
export { useDashboard } from './hooks/useDashboardHook'
export type {
  UseDashboardOptions,
  UseDashboardResult,
  UseDashboardActions,
} from './hooks/useDashboardHook'

// Zustand stores - AnalysisBuilder
export {
  useAnalysisBuilderStore,
  selectCurrentState,
  selectMetrics,
  selectBreakdowns,
  selectFilters,
  selectChartConfig,
  selectUIState,
  selectMultiQueryState,
} from './stores/analysisBuilderStore'
export type {
  AnalysisBuilderStore,
  AnalysisBuilderStoreState,
  AnalysisBuilderStoreActions,
  FieldModalMode,
  SharedState,
} from './stores/analysisBuilderStore'

// Zustand stores - Dashboard
export {
  DashboardStoreProvider,
  useDashboardStore,
  useDashboardStoreApi,
  useDashboardStoreOptional,
  createDashboardStore,
  selectEditModeState,
  selectModalState,
  selectLayoutState,
  selectDebugData,
  selectPortletDebugData,
  selectEditModeActions,
  selectModalActions,
  selectLayoutActions,
  selectDebugDataActions,
  selectAllActions,
} from './stores/dashboardStore'
export type {
  DashboardStore,
  DashboardStoreState,
  DashboardStoreActions,
  PortletDebugDataEntry,
  DragState,
  CreateDashboardStoreOptions,
  DashboardStoreProviderProps,
} from './stores/dashboardStore'

// Multi-query validation utilities
export {
  validateMultiQueryConfig,
  validateTimeDimensionAlignment,
  validateMergeKeys,
  detectMeasureCollisions,
  detectAsymmetricDateRanges,
  isMultiQueryValid,
  getValidationSummary
} from './utils/multiQueryValidation'
export type {
  MultiQueryValidationError,
  MultiQueryValidationWarning,
  MultiQueryValidationResult
} from './utils/multiQueryValidation'

// Performance hooks
export { useTheme } from './hooks/useTheme'
export { useScrollDetection } from './hooks/useScrollDetection'
export { useElementVisibility } from './hooks/useElementVisibility'

// Types
export type {
  PortletConfig,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  CubeQuery,
  CubeQueryOptions,
  CubeApiOptions,
  DashboardConfig,
  // Multi-query types
  MultiQueryConfig,
  QueryMergeStrategy
} from './types'

// Multi-query type guard
export { isMultiQueryConfig } from './types'

// Chart configuration types
export type {
  ChartTypeConfig,
  DisplayOptionConfig,
  AxisDropZoneConfig
} from './charts/chartConfigs'

// Utilities
export { createDashboardLayout, formatChartData, highlightCodeBlocks } from './utils/index'

// Multi-query utilities
export {
  isMultiQueryData,
  mergeQueryResults,
  mergeResultsConcat,
  mergeResultsByKey,
  getCombinedFields,
  getQueryLabels,
  getQueryIndices,
  generateQueryLabel,
  validateMergeKey
} from './utils/multiQueryUtils'

// Theme utilities
export {
  getThemeVariable,
  setThemeVariable,
  applyTheme,
  resetTheme,
  getTheme,
  setTheme,
  isDarkMode,
  watchThemeChanges,
  THEME_PRESETS
} from './theme'
export type { ThemeColorTokens, ThemeConfig, Theme } from './theme'

// Icon system
export {
  getIcon,
  getIconData,
  setIcon,
  registerIcons,
  resetIcons,
  getIconRegistry,
  getIconsByCategory,
  getMeasureTypeIcon,
  getChartTypeIcon,
  getFieldTypeIcon,
  DEFAULT_ICONS
} from './icons'
export type {
  IconCategory,
  IconProps,
  IconComponent,
  IconDefinition,
  IconRegistry,
  IconName,
  PartialIconRegistry
} from './icons'
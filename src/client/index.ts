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
export { default as PortletEditModal } from './components/PortletEditModal'
export { default as PortletAnalysisModal } from './components/PortletAnalysisModal'
export { default as DashboardEditModal } from './components/DashboardEditModal'
export { default as Modal } from './components/Modal'

// Query Builder
export { default as QueryBuilder } from './components/QueryBuilder'

// Analysis Builder (search-based query builder)
export { default as AnalysisBuilder } from './components/AnalysisBuilder'

// Data provider and hooks
export { CubeProvider, useCubeContext } from './providers/CubeProvider'
export { ScrollContainerProvider, useScrollContainer } from './providers/ScrollContainerContext'
export { useCubeQuery } from './hooks/useCubeQuery'
export { createCubeClient } from './client/CubeClient'

// Types
export type {
  PortletConfig,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  CubeQuery,
  CubeQueryOptions,
  CubeApiOptions,
  DashboardConfig
} from './types'

// Chart configuration types
export type {
  ChartTypeConfig,
  DisplayOptionConfig,
  AxisDropZoneConfig
} from './charts/chartConfigs'

// Utilities
export { createDashboardLayout, formatChartData } from './utils/index'

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
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
 */

// Import styles to include in build
import './styles.css'

// Core analytics components
export { default as AnalyticsPortlet } from './components/AnalyticsPortlet'
export { default as AnalyticsDashboard } from './components/AnalyticsDashboard'

// Chart components
export {
  RechartsBarChart,
  RechartsLineChart,
  RechartsAreaChart,
  RechartsPieChart,
  RechartsScatterChart,
  RechartsRadarChart,
  RechartsRadialBarChart,
  RechartsTreeMapChart,
  DataTable
} from './components/charts'

// Layout components
export { default as DashboardGrid } from './components/DashboardGrid'
export { default as PortletContainer } from './components/PortletContainer'

// Modals and configuration
export { default as PortletEditModal } from './components/PortletEditModal'
export { default as DashboardEditModal } from './components/DashboardEditModal'
export { default as Modal } from './components/Modal'

// Query Builder
export { default as QueryBuilder } from './components/QueryBuilder'

// Data provider and hooks
export { CubeProvider, useCubeContext } from './providers/CubeProvider'
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
/**
 * Drizzle Cube Client Components
 * 
 * React components for building analytics dashboards with minimal dependencies.
 * Designed to be embedded in existing applications with their own auth/navigation.
 */

// Core analytics components
export { default as AnalyticsPortlet } from './components/AnalyticsPortlet'
export { default as AnalyticsDashboard } from './components/AnalyticsDashboard'

// Chart components
export {
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  ScatterChart,
  RadarChart,
  RadialBarChart,
  TreeMapChart,
  DataTable
} from './components/charts'

// Layout components
export { default as DashboardGrid } from './components/DashboardGrid'
export { default as PortletContainer } from './components/PortletContainer'

// Modals and configuration
export { default as PortletModal } from './components/PortletModal'
export { default as ChartConfigEditor } from './components/ChartConfigEditor'

// Data provider and hooks
export { CubeProvider } from './providers/CubeProvider'
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
  DashboardConfig
} from './types'

// Utilities
export { createDashboardLayout, formatChartData } from './utils'
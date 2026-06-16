/**
 * Drizzle Cube UI Components
 * 
 * UI components without charts - for applications that need dashboards,
 * query builders, and layout components but provide their own charts.
 */

// Core analytics components (without charts)
export { default as AnalyticsPortlet } from './components/AnalyticsPortlet.js'
export { default as AnalyticsDashboard } from './components/AnalyticsDashboard.js'

// Layout components
export { default as DashboardGrid } from './components/DashboardGrid.js'
// Composable dashboard pieces (DashboardGrid is a back-compat composition of these)
export {
  DashboardProvider,
  DashboardToolbar,
  DashboardFilterBar,
  DashboardGridSurface,
  DashboardModals,
  useDashboardContext,
} from './components/dashboard/index.js'
export type { DashboardContextValue, DashboardProviderProps } from './components/dashboard/index.js'
export { default as PortletContainer } from './components/PortletContainer.js'

// Modals and configuration
export { default as DashboardEditModal } from './components/DashboardEditModal.js'
export { default as Modal } from './components/Modal.js'
export { default as AnalysisDisplayConfigPanel } from './components/AnalysisBuilder/AnalysisDisplayConfigPanel.js'

// Component utilities
export { 
  createDashboardLayout, 
  generateResponsiveLayouts,
  generatePortletId,
  findNextPosition,
  validateCubeQuery,
  createSamplePortlet
} from './utils/index.js'

// Component-related types
export type {
  PortletConfig,
  DashboardConfig
} from './types.js'
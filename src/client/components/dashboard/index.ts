/**
 * Composable dashboard pieces.
 *
 * Compose these under a DashboardProvider, or use the back-compat DashboardGrid
 * which wires them together for you.
 */

export { default as DashboardProvider } from './DashboardProvider.js'
export { default as DashboardToolbar } from './DashboardToolbar.js'
export { default as DashboardFilterBar } from './DashboardFilterBar.js'
export { default as DashboardGridSurface } from './DashboardGridSurface.js'
export { default as DashboardModals } from './DashboardModals.js'
export { useDashboardContext } from './DashboardContext.js'
export type { DashboardContextValue, DashboardProviderProps } from './DashboardContext.js'

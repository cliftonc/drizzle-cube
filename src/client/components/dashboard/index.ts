/**
 * Composable dashboard pieces.
 *
 * Compose these under a DashboardProvider, or use the back-compat DashboardGrid
 * which wires them together for you.
 */

export { default as DashboardProvider } from './DashboardProvider'
export { default as DashboardToolbar } from './DashboardToolbar'
export { default as DashboardFilterBar } from './DashboardFilterBar'
export { default as DashboardGridSurface } from './DashboardGridSurface'
export { default as DashboardModals } from './DashboardModals'
export { useDashboardContext } from './DashboardContext'
export type { DashboardContextValue, DashboardProviderProps } from './DashboardContext'

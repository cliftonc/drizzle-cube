/**
 * DashboardProvider
 *
 * Public composable entry point. Owns the per-instance Zustand store and runs the
 * coordinator that publishes DashboardContext. Compose the dashboard pieces (or your
 * own toolbar via useDashboardContext) as children:
 *
 *   <DashboardProvider config={config} editable onSave={onSave}>
 *     <DashboardToolbar />
 *     <DashboardFilterBar />
 *     <DashboardGridSurface />
 *     <DashboardModals />
 *   </DashboardProvider>
 */

import { DashboardStoreProvider } from '../../stores/dashboardStore'
import DashboardCoordinator from './DashboardCoordinator'
import type { DashboardProviderProps } from './DashboardContext'

export default function DashboardProvider({ children, ...props }: DashboardProviderProps) {
  return (
    <DashboardStoreProvider>
      <DashboardCoordinator {...props}>{children}</DashboardCoordinator>
    </DashboardStoreProvider>
  )
}

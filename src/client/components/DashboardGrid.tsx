/**
 * Dashboard Grid Component
 *
 * Back-compat composition of the composable dashboard pieces. The state machine and
 * all layout/scroll/drag machinery live in DashboardProvider/DashboardCoordinator;
 * this component simply wires the four pieces together to preserve the original
 * `<DashboardGrid config={...} />` API.
 *
 * For full control over the toolbar/layout, compose the pieces yourself:
 *   <DashboardProvider config={config} editable onSave={onSave}>
 *     <DashboardToolbar />        // or your own toolbar via useDashboardContext()
 *     <DashboardFilterBar />
 *     <DashboardGridSurface />
 *     <DashboardModals />
 *   </DashboardProvider>
 */

import type { ReactNode } from 'react'
import DashboardProvider from './dashboard/DashboardProvider'
import DashboardToolbar from './dashboard/DashboardToolbar'
import DashboardFilterBar from './dashboard/DashboardFilterBar'
import DashboardGridSurface from './dashboard/DashboardGridSurface'
import DashboardModals from './dashboard/DashboardModals'
import type { ColorPalette } from '../utils/colorPalettes'
import type {
  DashboardConfig,
  DashboardFilter,
  CubeMeta,
  DashboardLayoutMode
} from '../types'

interface DashboardGridProps {
  config: DashboardConfig
  editable?: boolean
  dashboardFilters?: DashboardFilter[] // Dashboard-level filters to apply to portlets
  loadingComponent?: ReactNode // Custom loading indicator for all portlets
  onConfigChange?: (config: DashboardConfig) => void
  onPortletRefresh?: (portletId: string) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  /** Callback to save thumbnail separately - called on edit mode exit when thumbnail feature is enabled */
  onSaveThumbnail?: (thumbnailData: string) => Promise<string | void>
  colorPalette?: ColorPalette  // Complete palette with both colors and gradient
  schema?: CubeMeta | null  // Cube metadata for filter panel
  onDashboardFiltersChange?: (filters: DashboardFilter[]) => void  // Handler for filter changes
  dashboardModes?: DashboardLayoutMode[]
  /** When true, no toolbar is rendered (neither the top edit bar nor the floating toolbar) */
  hideToolbar?: boolean
}

export default function DashboardGrid(props: DashboardGridProps) {
  const isEmpty = !props.config.portlets || props.config.portlets.length === 0

  return (
    <DashboardProvider {...props}>
      {/* Match the original: when empty, only the placeholder + modals render */}
      {!isEmpty && !props.hideToolbar && <DashboardToolbar />}
      {!isEmpty && <DashboardFilterBar />}
      <DashboardGridSurface />
      <DashboardModals />
    </DashboardProvider>
  )
}

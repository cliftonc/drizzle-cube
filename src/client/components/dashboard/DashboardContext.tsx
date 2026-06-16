/**
 * DashboardContext
 *
 * Published once by DashboardCoordinator and consumed by the composable dashboard
 * pieces (DashboardToolbar, DashboardFilterBar, DashboardGridSurface, DashboardModals)
 * as well as any host-supplied custom toolbar via useDashboardContext().
 *
 * The coordinator runs useDashboard() plus the responsive/scroll/drag hooks exactly
 * once; everything those produce is threaded through this context so the sibling
 * pieces never re-run the state machine.
 */

import {
  createContext,
  useContext,
  type ReactNode,
  type HTMLAttributes,
  type DragEvent,
  type MouseEvent,
  type MutableRefObject
} from 'react'
import type { LayoutItem, Layout } from 'react-grid-layout'
import type { UseDashboardActions } from '../../hooks/useDashboardHook.js'
import type { DashboardDisplayMode } from '../../hooks/useResponsiveDashboard.js'
import type { ColorPalette } from '../../utils/colorPalettes.js'
import type {
  DashboardConfig,
  PortletConfig,
  DashboardFilter,
  DashboardFilterMapping,
  CubeMeta,
  DashboardLayoutMode,
  DashboardGridSettings,
  RowLayout,
  FeaturesConfig
} from '../../types.js'

/**
 * Props accepted by DashboardProvider (the public composable entry point).
 * Mirrors the former DashboardGridProps plus `hideToolbar` and `children`.
 */
export interface DashboardProviderProps {
  config: DashboardConfig
  editable?: boolean
  /** Dashboard-level filters to apply to portlets */
  dashboardFilters?: DashboardFilter[]
  /** Custom loading indicator for all portlets */
  loadingComponent?: ReactNode
  onConfigChange?: (config: DashboardConfig) => void
  onPortletRefresh?: (portletId: string) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  /** Callback to save thumbnail separately - called on edit mode exit when thumbnail feature is enabled */
  onSaveThumbnail?: (thumbnailData: string) => Promise<string | void>
  /** Complete palette with both colors and gradient */
  colorPalette?: ColorPalette
  /** Cube metadata for filter panel */
  schema?: CubeMeta | null
  /** Handler for dashboard filter changes */
  onDashboardFiltersChange?: (filters: DashboardFilter[]) => void
  dashboardModes?: DashboardLayoutMode[]
  /** When true, DashboardToolbar renders nothing (both the top bar and floating toolbar) */
  hideToolbar?: boolean
  children: ReactNode
}

/**
 * Everything the composable pieces need. Built fresh each render by the coordinator,
 * matching the re-render cadence of the former monolithic DashboardGrid.
 */
export interface DashboardContextValue {
  // ---- Props threaded through ----
  config: DashboardConfig
  editable: boolean
  dashboardFilters?: DashboardFilter[]
  loadingComponent?: ReactNode
  colorPalette?: ColorPalette
  schema?: CubeMeta | null
  onSave?: (config: DashboardConfig) => Promise<void> | void
  onConfigChange?: (config: DashboardConfig) => void
  onDashboardFiltersChange?: (filters: DashboardFilter[]) => void
  hideToolbar?: boolean

  // ---- Store state (from useDashboard) ----
  isEditMode: boolean
  selectedFilterId: string | null
  isPortletModalOpen: boolean
  editingPortlet: PortletConfig | null
  isTextModalOpen: boolean
  editingTextPortlet: PortletConfig | null
  isFilterConfigModalOpen: boolean
  filterConfigPortlet: PortletConfig | null
  deleteConfirmPortletId: string | null
  draftRows: RowLayout[] | null
  isDraggingPortlet: boolean
  isInitialized: boolean

  // ---- Computed (from useDashboard) ----
  canEdit: boolean
  canChangeLayoutMode: boolean
  selectedFilter: DashboardFilter | null
  resolvedRows: RowLayout[]
  layoutMode: DashboardLayoutMode
  allowedModes: DashboardLayoutMode[]

  // ---- Actions ----
  actions: UseDashboardActions

  // ---- Responsive ----
  displayMode: DashboardDisplayMode
  scaleFactor: number
  designWidth: number
  gridWidth: number
  isResponsiveEditable: boolean

  // ---- Scroll / visibility ----
  isScrolled: boolean
  isEditBarVisible: boolean
  scrollContainer: HTMLElement | null

  // ---- Features ----
  features: FeaturesConfig

  // ---- Refs (attached by the consuming pieces) ----
  editBarRef: MutableRefObject<HTMLDivElement | null>
  gridContentRef: MutableRefObject<HTMLDivElement | null>

  // ---- Layout data ----
  gridSettings: DashboardGridSettings
  baseLayout: LayoutItem[]

  // ---- Render helpers ----
  renderPortletCard: (
    portlet: PortletConfig,
    containerProps?: HTMLAttributes<HTMLDivElement>,
    headerProps?: HTMLAttributes<HTMLDivElement>
  ) => ReactNode
  /** Renders the active (grid or row) layout. A function so it's not evaluated in mobile/empty cases. */
  renderActiveLayout: () => ReactNode

  // ---- Handlers ----
  handleAddPortlet: () => void
  handleAddText: () => void
  handlePaletteChange: (paletteName: string) => Promise<void>
  handleFilterSelect: (filterId: string) => void
  handleSelectAllForFilter: (filterId: string) => Promise<void>
  handleSaveFilterConfig: (mapping: DashboardFilterMapping) => Promise<void>
  handlePortletSave: (portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => Promise<void>
  handlePortletRefresh: (portletId: string, options?: { bustCache?: boolean }) => void
  handleLayoutChange: (layout: Layout) => void
  handleDragStop: (layout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null, placeholder: LayoutItem | null, e: Event, element: HTMLElement | null) => void
  handleResizeStop: (layout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null, placeholder: LayoutItem | null, e: Event, element: HTMLElement | null) => void
  startRowResize: (rowIndex: number, event: MouseEvent<HTMLDivElement>) => void
  startColumnResize: (rowIndex: number, columnIndex: number, event: MouseEvent<HTMLDivElement>) => void
  handlePortletDragStart: (rowIndex: number, colIndex: number, portletId: string, event: DragEvent<HTMLDivElement>) => void
  handlePortletDragEnd: () => void
  handleRowDrop: (rowIndex: number, insertIndex: number | null) => void
  handleNewRowDrop: (insertIndex: number) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

/**
 * Access the dashboard context published by DashboardProvider.
 * Lets a host render its own toolbar/controls while drizzle-cube owns the
 * edit/save state machine.
 *
 * @throws if used outside a DashboardProvider (or DashboardGrid).
 */
export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }
  return ctx
}

export default DashboardContext

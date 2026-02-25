/**
 * useDashboard - Master Coordination Hook
 *
 * The single hook that provides everything DashboardGrid needs:
 * - Zustand store state and actions (from Context)
 * - Computed values (canEdit, resolvedRows, etc.)
 * - Config-modifying actions (that call onConfigChange/onSave)
 *
 * This hook replaces 14+ useState calls and 25+ useCallback handlers,
 * providing a clean interface for the DashboardGrid component.
 *
 * IMPORTANT: This hook must be used within DashboardStoreProvider
 *
 * Usage:
 * ```tsx
 * const dashboard = useDashboard({
 *   config,
 *   editable,
 *   gridSettings,
 *   onConfigChange,
 *   onSave,
 * })
 *
 * // Access state
 * const { isEditMode, selectedFilterId } = dashboard
 *
 * // Access computed values
 * const { canEdit, resolvedRows } = dashboard
 *
 * // Access actions
 * dashboard.actions.openAddPortlet()
 * ```
 */

import React, { useMemo, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  useDashboardStore,
  useDashboardStoreApi,
  type DashboardStore,
  type PortletDebugDataEntry,
} from '../stores/dashboardStore'
import { useCubeFeatures } from '../providers/CubeProvider'
import type { LayoutItem } from 'react-grid-layout'
import type {
  DashboardConfig,
  PortletConfig,
  RowLayout,
  DashboardFilter,
  DashboardGridSettings,
  DashboardLayoutMode,
} from '../types'
import { useGridLayoutEngine } from './dashboard/useGridLayoutEngine'
import { useRowLayoutEngine } from './dashboard/useRowLayoutEngine'
import { useDashboardController } from './dashboard/useDashboardController'

// ============================================================================
// Types
// ============================================================================

export interface UseDashboardOptions {
  /** Dashboard configuration */
  config: DashboardConfig
  /** Whether dashboard is editable */
  editable?: boolean
  /** Dashboard filters */
  dashboardFilters?: DashboardFilter[]
  /** Grid settings */
  gridSettings: DashboardGridSettings
  /** Allowed layout modes */
  allowedModes?: DashboardLayoutMode[]
  /** Whether responsive mode allows editing (desktop only) */
  isResponsiveEditable?: boolean
  /** Config change handler */
  onConfigChange?: (config: DashboardConfig) => void
  /** Save handler */
  onSave?: (config: DashboardConfig) => Promise<void> | void
  /** Callback to save thumbnail separately - called on edit mode exit when thumbnail feature is enabled */
  onSaveThumbnail?: (thumbnailData: string) => Promise<string | void>
  /** Grid width for row calculations */
  gridWidth?: number
  /** Portlet component refs for refresh functionality */
  portletComponentRefs?: React.MutableRefObject<Record<string, { refresh: (options?: { bustCache?: boolean }) => void } | null>>
  /** Portlet refresh handler (external) */
  onPortletRefresh?: (portletId: string, options?: { bustCache?: boolean }) => void
  /** Ref to the dashboard container element for thumbnail capture */
  dashboardRef?: React.RefObject<HTMLElement | null>
}

export interface UseDashboardResult {
  // =========================================================================
  // Store State
  // =========================================================================
  /** Whether dashboard is in edit mode */
  isEditMode: boolean
  /** Selected filter ID for filter assignment mode */
  selectedFilterId: string | null
  /** Whether portlet modal is open */
  isPortletModalOpen: boolean
  /** Portlet being edited */
  editingPortlet: PortletConfig | null
  /** Whether text portlet modal is open */
  isTextModalOpen: boolean
  /** Portlet being edited in text modal */
  editingTextPortlet: PortletConfig | null
  /** Whether filter config modal is open */
  isFilterConfigModalOpen: boolean
  /** Portlet for filter configuration */
  filterConfigPortlet: PortletConfig | null
  /** Portlet ID pending delete confirmation */
  deleteConfirmPortletId: string | null
  /** Draft rows during drag operations */
  draftRows: RowLayout[] | null
  /** Whether a portlet is being dragged */
  isDraggingPortlet: boolean
  /** Last known layout for change detection */
  lastKnownLayout: LayoutItem[]
  /** Whether component is initialized */
  isInitialized: boolean

  // =========================================================================
  // Computed Values
  // =========================================================================
  /** Whether editing is allowed (editable && isEditMode && desktop && !filterMode) */
  canEdit: boolean
  /** Whether layout mode can be changed */
  canChangeLayoutMode: boolean
  /** Currently selected filter object */
  selectedFilter: DashboardFilter | null
  /** Resolved rows for row-based layout */
  resolvedRows: RowLayout[]
  /** Current layout mode */
  layoutMode: DashboardLayoutMode
  /** Allowed layout modes */
  allowedModes: DashboardLayoutMode[]

  // =========================================================================
  // Actions
  // =========================================================================
  actions: UseDashboardActions
}

export interface UseDashboardActions {
  // Edit Mode
  enterEditMode: () => void
  exitEditMode: () => void
  toggleEditMode: () => void
  selectFilter: (filterId: string | null) => void
  exitFilterSelectionMode: () => void

  // Modals
  openAddPortlet: () => void
  openEditPortlet: (portlet: PortletConfig) => void
  closePortletModal: () => void
  openAddText: () => void
  openEditText: (portlet: PortletConfig) => void
  closeTextModal: () => void
  openFilterConfig: (portlet: PortletConfig) => void
  closeFilterConfig: () => void

  // Layout State (store-only)
  setDraftRows: (rows: RowLayout[] | null) => void
  setIsDraggingPortlet: (isDragging: boolean) => void
  setLastKnownLayout: (layout: LayoutItem[]) => void
  setIsInitialized: (initialized: boolean) => void
  setDragState: (state: { rowIndex: number; colIndex: number; portletId: string } | null) => void
  clearDragState: () => void

  // Layout Operations (config-modifying)
  hasLayoutActuallyChanged: (newLayout: LayoutItem[]) => boolean
  updateRowLayout: (rows: RowLayout[], save?: boolean, portletsOverride?: PortletConfig[]) => Promise<void>
  handleLayoutModeChange: (mode: DashboardLayoutMode) => Promise<void>

  // Portlet Operations
  savePortlet: (portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => Promise<string | null>
  deletePortlet: (portletId: string) => Promise<void>
  duplicatePortlet: (portletId: string) => Promise<string | undefined>
  refreshPortlet: (portletId: string, options?: { bustCache?: boolean }) => void

  // Filter Operations
  toggleFilterForPortlet: (portletId: string, filterId: string) => Promise<void>
  selectAllForFilter: (filterId: string) => Promise<void>
  saveFilterConfig: (mapping: string[]) => Promise<void>

  // Config Operations
  handlePaletteChange: (paletteName: string) => Promise<void>

  // Delete Confirmation
  openDeleteConfirm: (portletId: string) => void
  closeDeleteConfirm: () => void
  confirmDelete: () => Promise<void>

  // Debug
  setDebugData: (portletId: string, data: PortletDebugDataEntry) => void
  clearDebugData: (portletId?: string) => void
}

// ============================================================================
// Selectors
// ============================================================================

const selectStoreState = (state: DashboardStore) => ({
  isEditMode: state.isEditMode,
  selectedFilterId: state.selectedFilterId,
  isPortletModalOpen: state.isPortletModalOpen,
  editingPortlet: state.editingPortlet,
  isTextModalOpen: state.isTextModalOpen,
  editingTextPortlet: state.editingTextPortlet,
  isFilterConfigModalOpen: state.isFilterConfigModalOpen,
  filterConfigPortlet: state.filterConfigPortlet,
  deleteConfirmPortletId: state.deleteConfirmPortletId,
  draftRows: state.draftRows,
  isDraggingPortlet: state.isDraggingPortlet,
  lastKnownLayout: state.lastKnownLayout,
  isInitialized: state.isInitialized,
  // NOTE: debugData intentionally excluded — DashboardPortletCard reads it directly from store.
  // Including it here would cause the entire hook to re-run on every portlet data load.
})

const selectStoreActions = (state: DashboardStore) => ({
  setEditMode: state.setEditMode,
  toggleEditMode: state.toggleEditMode,
  setSelectedFilterId: state.setSelectedFilterId,
  exitFilterSelectionMode: state.exitFilterSelectionMode,
  openPortletModal: state.openPortletModal,
  closePortletModal: state.closePortletModal,
  openTextModal: state.openTextModal,
  closeTextModal: state.closeTextModal,
  openFilterConfigModal: state.openFilterConfigModal,
  closeFilterConfigModal: state.closeFilterConfigModal,
  openDeleteConfirm: state.openDeleteConfirm,
  closeDeleteConfirm: state.closeDeleteConfirm,
  setDraftRows: state.setDraftRows,
  setIsDraggingPortlet: state.setIsDraggingPortlet,
  setLastKnownLayout: state.setLastKnownLayout,
  setIsInitialized: state.setIsInitialized,
  setDragState: state.setDragState,
  clearDragState: state.clearDragState,
  setDebugData: state.setDebugData,
  clearDebugData: state.clearDebugData,
  setThumbnailDirty: state.setThumbnailDirty,
})

// ============================================================================
// Hook
// ============================================================================

export function useDashboard(options: UseDashboardOptions): UseDashboardResult {
  const {
    config,
    editable = false,
    dashboardFilters,
    gridSettings,
    allowedModes: propAllowedModes,
    isResponsiveEditable = true,
    onConfigChange,
    onSave,
    onSaveThumbnail,
    portletComponentRefs,
    onPortletRefresh,
    dashboardRef,
  } = options

  // =========================================================================
  // Store Access
  // =========================================================================

  const storeState = useDashboardStore(useShallow(selectStoreState))
  const storeActions = useDashboardStore(useShallow(selectStoreActions))
  const storeApi = useDashboardStoreApi()

  // Get thumbnail feature config from context
  const { features } = useCubeFeatures()
  const thumbnailConfig = features.thumbnail

  // Refs for values used in stable callbacks (avoids recreating callbacks on every state change)
  const configRef = useRef(config)
  configRef.current = config
  const onConfigChangeRef = useRef(onConfigChange)
  onConfigChangeRef.current = onConfigChange
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const onSaveThumbnailRef = useRef(onSaveThumbnail)
  onSaveThumbnailRef.current = onSaveThumbnail

  // =========================================================================
  // Computed Values
  // =========================================================================

  const allowedModes: DashboardLayoutMode[] = useMemo(() => {
    return propAllowedModes && propAllowedModes.length > 0
      ? propAllowedModes
      : ['rows', 'grid']
  }, [propAllowedModes])

  const layoutMode: DashboardLayoutMode = useMemo(() => {
    const fallbackMode: DashboardLayoutMode = allowedModes.includes('rows')
      ? 'rows'
      : allowedModes[0] ?? 'grid'
    const configMode = config.layoutMode ?? 'grid'
    return allowedModes.includes(configMode) ? configMode : fallbackMode
  }, [config.layoutMode, allowedModes])

  const canEdit = useMemo(() => {
    return (
      editable &&
      storeState.isEditMode &&
      isResponsiveEditable &&
      !storeState.selectedFilterId
    )
  }, [editable, storeState.isEditMode, isResponsiveEditable, storeState.selectedFilterId])

  const canChangeLayoutMode = useMemo(() => {
    return (
      editable &&
      storeState.isEditMode &&
      isResponsiveEditable &&
      !storeState.selectedFilterId &&
      allowedModes.length > 1
    )
  }, [
    editable,
    storeState.isEditMode,
    isResponsiveEditable,
    storeState.selectedFilterId,
    allowedModes.length,
  ])

  const selectedFilter = useMemo(() => {
    if (!storeState.selectedFilterId || !dashboardFilters) return null
    return dashboardFilters.find((f) => f.id === storeState.selectedFilterId) ?? null
  }, [storeState.selectedFilterId, dashboardFilters])

  const { resolvedRows, updateRowLayout } = useRowLayoutEngine({
    layoutMode,
    draftRows: storeState.draftRows,
    config,
    gridSettings,
    configRef,
    onConfigChangeRef,
    onSaveRef,
    setDraftRows: storeActions.setDraftRows,
    setThumbnailDirty: storeActions.setThumbnailDirty,
  })

  const { hasLayoutActuallyChanged } = useGridLayoutEngine({
    storeApi,
  })

  const {
    enterEditMode,
    exitEditMode,
    toggleEditMode,
    selectFilter,
    openAddPortlet,
    openEditPortlet,
    openAddText,
    openEditText,
    openFilterConfig,
    handleLayoutModeChange,
    savePortlet,
    deletePortlet,
    confirmDelete,
    duplicatePortlet,
    refreshPortlet,
    toggleFilterForPortlet,
    selectAllForFilter,
    saveFilterConfig,
    handlePaletteChange,
  } = useDashboardController({
    allowedModes,
    canChangeLayoutMode,
    isResponsiveEditable,
    layoutMode,
    resolvedRows,
    gridSettings,
    thumbnailConfig,
    dashboardRef,
    storeApi,
    storeActions,
    configRef,
    onConfigChangeRef,
    onSaveRef,
    onSaveThumbnailRef,
    updateRowLayout,
    portletComponentRefs,
    onPortletRefresh,
  })

  // =========================================================================
  // Assemble Result
  // =========================================================================

  const actions: UseDashboardActions = useMemo(
    () => ({
      // Edit mode
      enterEditMode,
      exitEditMode,
      toggleEditMode,
      selectFilter,
      exitFilterSelectionMode: storeActions.exitFilterSelectionMode,

      // Modals
      openAddPortlet,
      openEditPortlet,
      closePortletModal: storeActions.closePortletModal,
      openAddText,
      openEditText,
      closeTextModal: storeActions.closeTextModal,
      openFilterConfig,
      closeFilterConfig: storeActions.closeFilterConfigModal,

      // Layout state
      setDraftRows: storeActions.setDraftRows,
      setIsDraggingPortlet: storeActions.setIsDraggingPortlet,
      setLastKnownLayout: storeActions.setLastKnownLayout,
      setIsInitialized: storeActions.setIsInitialized,
      setDragState: storeActions.setDragState,
      clearDragState: storeActions.clearDragState,

      // Layout operations
      hasLayoutActuallyChanged,
      updateRowLayout,
      handleLayoutModeChange,

      // Portlet operations
      savePortlet,
      deletePortlet,
      duplicatePortlet,
      refreshPortlet,

      // Filter operations
      toggleFilterForPortlet,
      selectAllForFilter,
      saveFilterConfig,

      // Config operations
      handlePaletteChange,

      // Delete confirmation
      openDeleteConfirm: storeActions.openDeleteConfirm,
      closeDeleteConfirm: storeActions.closeDeleteConfirm,
      confirmDelete,

      // Debug
      setDebugData: storeActions.setDebugData,
      clearDebugData: storeActions.clearDebugData,
    }),
    [
      enterEditMode,
      exitEditMode,
      toggleEditMode,
      selectFilter,
      storeActions,
      openAddPortlet,
      openEditPortlet,
      openAddText,
      openEditText,
      openFilterConfig,
      hasLayoutActuallyChanged,
      updateRowLayout,
      handleLayoutModeChange,
      savePortlet,
      deletePortlet,
      duplicatePortlet,
      refreshPortlet,
      toggleFilterForPortlet,
      selectAllForFilter,
      saveFilterConfig,
      handlePaletteChange,
      confirmDelete,
    ]
  )

  return {
    // Store state
    ...storeState,

    // Computed values
    canEdit,
    canChangeLayoutMode,
    selectedFilter,
    resolvedRows,
    layoutMode,
    allowedModes,

    // Actions
    actions,
  }
}

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

import React, { useMemo, useCallback, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  useDashboardStore,
  useDashboardStoreApi,
  type DashboardStore,
  type PortletDebugDataEntry,
} from '../stores/dashboardStore'
import { useCubeFeatures } from '../providers/CubeProvider'
import { captureThumbnail } from '../utils/thumbnail'
import type { LayoutItem } from 'react-grid-layout'
import type {
  DashboardConfig,
  PortletConfig,
  RowLayout,
  RowLayoutColumn,
  DashboardFilter,
  DashboardGridSettings,
  DashboardLayoutMode,
} from '../types'

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
// Helper Functions
// ============================================================================

const createRowId = () => `row-${Date.now()}`

const equalizeRowColumns = (
  portletIds: string[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  const count = portletIds.length
  if (count === 0) return []

  const { cols, minW } = gridSettings
  const minTotal = minW * count

  if (minTotal > cols) {
    const base = Math.floor(cols / count)
    const remainder = cols % count
    return portletIds.map((id, index) => ({
      portletId: id,
      w: base + (index < remainder ? 1 : 0),
    }))
  }

  const remaining = cols - minTotal
  const extra = Math.floor(remaining / count)
  const remainder = remaining % count

  return portletIds.map((id, index) => ({
    portletId: id,
    w: minW + extra + (index < remainder ? 1 : 0),
  }))
}

const adjustRowWidths = (
  columns: RowLayoutColumn[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  if (columns.length === 0) return []

  const { cols, minW } = gridSettings
  const adjusted = columns.map((column) => ({
    ...column,
    w: Math.max(minW, column.w),
  }))

  let total = adjusted.reduce((sum, column) => sum + column.w, 0)
  if (total === cols) return adjusted

  if (total < cols) {
    let remaining = cols - total
    let index = 0
    while (remaining > 0) {
      adjusted[index % adjusted.length].w += 1
      remaining -= 1
      index += 1
    }
    return adjusted
  }

  let overflow = total - cols
  for (let index = adjusted.length - 1; index >= 0 && overflow > 0; index -= 1) {
    const column = adjusted[index]
    const reducible = Math.max(0, column.w - minW)
    if (reducible === 0) continue
    const delta = Math.min(reducible, overflow)
    column.w -= delta
    overflow -= delta
  }

  return adjusted
}

const convertPortletsToRows = (
  portlets: PortletConfig[],
  gridSettings: DashboardGridSettings
): RowLayout[] => {
  if (portlets.length === 0) return []

  const sorted = [...portlets].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })

  const rowsByY = new Map<number, PortletConfig[]>()
  sorted.forEach((portlet) => {
    const row = rowsByY.get(portlet.y) ?? []
    row.push(portlet)
    rowsByY.set(portlet.y, row)
  })

  return Array.from(rowsByY.entries())
    .sort(([a], [b]) => a - b)
    .map(([rowY, rowPortlets]) => {
      const rowHeight = Math.max(gridSettings.minH, ...rowPortlets.map((p) => p.h))
      const portletIds = rowPortlets.map((p) => p.id)
      return {
        id: `row-${rowY}`,
        h: rowHeight,
        columns: equalizeRowColumns(portletIds, gridSettings),
      }
    })
}

const normalizeRows = (
  rows: RowLayout[],
  portlets: PortletConfig[],
  gridSettings: DashboardGridSettings
): RowLayout[] => {
  const portletIds = new Set(portlets.map((p) => p.id))
  return rows
    .map((row) => ({
      ...row,
      h: Math.max(gridSettings.minH, row.h),
      columns: adjustRowWidths(
        row.columns.filter((col) => portletIds.has(col.portletId)),
        gridSettings
      ),
    }))
    .filter((row) => row.columns.length > 0)
}

const convertRowsToPortlets = (
  rows: RowLayout[],
  portlets: PortletConfig[]
): PortletConfig[] => {
  const portletMap = new Map(portlets.map((p) => [p.id, p]))
  let currentY = 0

  const updated: PortletConfig[] = []
  rows.forEach((row) => {
    let currentX = 0
    row.columns.forEach((column) => {
      const portlet = portletMap.get(column.portletId)
      if (!portlet) return
      updated.push({
        ...portlet,
        x: currentX,
        y: currentY,
        w: column.w,
        h: row.h,
      })
      currentX += column.w
    })
    currentY += row.h
  })

  const updatedIds = new Set(updated.map((p) => p.id))
  portlets.forEach((portlet) => {
    if (!updatedIds.has(portlet.id)) {
      updated.push(portlet)
    }
  })

  return updated
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
  thumbnailDirty: state.thumbnailDirty,
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

  // Keep refs for draft rows (needed for mouse event handlers)
  const draftRowsRef = useRef<RowLayout[] | null>(null)
  draftRowsRef.current = storeState.draftRows

  // Refs for values used in stable callbacks (avoids recreating callbacks on every state change)
  const configRef = useRef(config)
  configRef.current = config
  const onConfigChangeRef = useRef(onConfigChange)
  onConfigChangeRef.current = onConfigChange
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const thumbnailDirtyRef = useRef(storeState.thumbnailDirty)
  thumbnailDirtyRef.current = storeState.thumbnailDirty
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

  const resolvedRows = useMemo(() => {
    if (layoutMode !== 'rows') return []
    const baseRows =
      storeState.draftRows ??
      config.rows ??
      convertPortletsToRows(config.portlets, gridSettings)
    return normalizeRows(baseRows, config.portlets, gridSettings)
  }, [layoutMode, storeState.draftRows, config.rows, config.portlets, gridSettings])

  // =========================================================================
  // Actions
  // =========================================================================

  // Edit mode actions
  const enterEditMode = useCallback(() => {
    storeActions.setEditMode(true)
  }, [storeActions])

  const exitEditMode = useCallback(() => {
    storeActions.setEditMode(false)

    // Capture thumbnail in background after UI has fully re-rendered
    // Use longer delay to ensure edit mode UI elements are removed and charts settle
    // Read from refs to avoid recreating this callback on config/state changes
    if (thumbnailDirtyRef.current && thumbnailConfig?.enabled && dashboardRef) {
      setTimeout(async () => {
        const thumbnailData = await captureThumbnail(dashboardRef, thumbnailConfig)
        if (thumbnailData && onSaveThumbnailRef.current) {
          try {
            const thumbnailUrl = await onSaveThumbnailRef.current(thumbnailData)
            // Optionally update config with URL
            if (thumbnailUrl && onConfigChangeRef.current) {
              onConfigChangeRef.current({ ...configRef.current, thumbnailUrl, thumbnailData: undefined })
            }
          } catch (error) {
            console.error('Failed to save thumbnail:', error)
          }
        }
        storeActions.setThumbnailDirty(false)
      }, 500) // 500ms delay for re-render (edit mode UI removal + chart settling)
    }
  }, [storeActions, thumbnailConfig, dashboardRef])

  const toggleEditMode = useCallback(() => {
    if (!isResponsiveEditable) return
    // Read current state from store directly to avoid dependency on storeState.isEditMode
    const store = storeApi.getState()
    if (store.isEditMode) {
      exitEditMode()
    } else {
      storeActions.setEditMode(true)
    }
  }, [isResponsiveEditable, storeActions, storeApi, exitEditMode])

  const selectFilter = useCallback(
    (filterId: string | null) => {
      // Toggle selection: if already selected, deselect
      // Read current state from store directly to avoid dependency on storeState.selectedFilterId
      const currentSelectedId = storeApi.getState().selectedFilterId
      storeActions.setSelectedFilterId(
        filterId === currentSelectedId ? null : filterId
      )
    },
    [storeActions, storeApi]
  )

  // Modal actions
  const openAddPortlet = useCallback(() => {
    storeActions.openPortletModal(null)
  }, [storeActions])

  const openEditPortlet = useCallback(
    (portlet: PortletConfig) => {
      storeActions.openPortletModal(portlet)
    },
    [storeActions]
  )

  // Text modal actions
  const openAddText = useCallback(() => {
    storeActions.openTextModal(null)
  }, [storeActions])

  const openEditText = useCallback(
    (portlet: PortletConfig) => {
      storeActions.openTextModal(portlet)
    },
    [storeActions]
  )

  const openFilterConfig = useCallback(
    (portlet: PortletConfig) => {
      storeActions.openFilterConfigModal(portlet)
    },
    [storeActions]
  )

  // Layout change detection — reads from store directly for stability
  const hasLayoutActuallyChanged = useCallback(
    (newLayout: LayoutItem[]) => {
      const { isInitialized, lastKnownLayout } = storeApi.getState()
      if (!isInitialized || lastKnownLayout.length === 0) {
        return false
      }

      for (const newItem of newLayout) {
        const oldItem = lastKnownLayout.find((item) => item.i === newItem.i)
        if (!oldItem) continue

        if (
          oldItem.x !== newItem.x ||
          oldItem.y !== newItem.y ||
          oldItem.w !== newItem.w ||
          oldItem.h !== newItem.h
        ) {
          return true
        }
      }
      return false
    },
    [storeApi]
  )

  // Row layout update — uses refs for config/callbacks to stay stable
  const updateRowLayout = useCallback(
    async (
      rows: RowLayout[],
      save = true,
      portletsOverride?: PortletConfig[]
    ) => {
      if (!onConfigChangeRef.current) return

      const portlets = portletsOverride ?? configRef.current.portlets
      const normalizedRows = normalizeRows(rows, portlets, gridSettings)
      const updatedPortlets = convertRowsToPortlets(normalizedRows, portlets)
      const updatedConfig: DashboardConfig = {
        ...configRef.current,
        layoutMode: 'rows',
        rows: normalizedRows,
        portlets: updatedPortlets,
      }

      storeActions.setDraftRows(null)
      onConfigChangeRef.current(updatedConfig)

      if (save && onSaveRef.current) {
        try {
          await onSaveRef.current(updatedConfig)
          storeActions.setThumbnailDirty(true)
        } catch (error) {
          console.error('Auto-save failed after row layout change:', error)
        }
      }
    },
    [gridSettings, storeActions]
  )

  // Layout mode change — uses refs for stability
  const layoutModeRef = useRef(layoutMode)
  layoutModeRef.current = layoutMode
  const canChangeLayoutModeRef = useRef(canChangeLayoutMode)
  canChangeLayoutModeRef.current = canChangeLayoutMode

  const handleLayoutModeChange = useCallback(
    async (mode: DashboardLayoutMode) => {
      if (
        !onConfigChangeRef.current ||
        mode === layoutModeRef.current ||
        !canChangeLayoutModeRef.current ||
        !allowedModes.includes(mode)
      ) {
        return
      }

      const cfg = configRef.current
      const baseRows = normalizeRows(
        cfg.rows && cfg.rows.length > 0
          ? cfg.rows
          : convertPortletsToRows(cfg.portlets, gridSettings),
        cfg.portlets,
        gridSettings
      )

      const updatedPortlets = convertRowsToPortlets(baseRows, cfg.portlets)
      const updatedConfig: DashboardConfig = {
        ...cfg,
        layoutMode: mode,
        rows: baseRows,
        portlets: updatedPortlets,
      }

      storeActions.setDraftRows(null)
      onConfigChangeRef.current(updatedConfig)

      if (onSaveRef.current) {
        try {
          await onSaveRef.current(updatedConfig)
          storeActions.setThumbnailDirty(true)
        } catch (error) {
          console.error('Auto-save failed after layout mode switch:', error)
        }
      }
    },
    [allowedModes, gridSettings, storeActions]
  )

  // Portlet operations — uses refs and store.getState() for stability
  const resolvedRowsRef = useRef(resolvedRows)
  resolvedRowsRef.current = resolvedRows

  const savePortlet = useCallback(
    async (
      portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>
    ): Promise<string | null> => {
      if (!onConfigChangeRef.current) return null

      const cfg = configRef.current
      let updatedPortlets = [...cfg.portlets]
      let isNewPortlet = false
      let newPortletId: string | null = null

      const store = storeApi.getState()
      const editingExisting = store.editingPortlet || store.editingTextPortlet
      if (editingExisting) {
        // Editing existing portlet
        const index = updatedPortlets.findIndex(
          (p) => p.id === editingExisting.id
        )
        if (index !== -1) {
          updatedPortlets[index] = portletData as PortletConfig
        }
      } else {
        // Adding new portlet
        isNewPortlet = true
        const newPortlet: PortletConfig = {
          ...portletData,
          id: `portlet-${Date.now()}`,
          x: 0,
          y: 0,
        } as PortletConfig

        newPortletId = newPortlet.id

        // Find best position for new portlet
        let maxY = 0
        cfg.portlets.forEach((p) => {
          if (p.y + p.h > maxY) {
            maxY = p.y + p.h
          }
        })
        newPortlet.y = maxY

        updatedPortlets.push(newPortlet)
      }

      if (layoutModeRef.current === 'rows') {
        const currentRows = resolvedRowsRef.current
        const baseRows =
          currentRows.length > 0
            ? currentRows.map((row) => ({
                ...row,
                columns: row.columns.map((col) => ({ ...col })),
              }))
            : normalizeRows(
                cfg.rows ?? convertPortletsToRows(cfg.portlets, gridSettings),
                updatedPortlets,
                gridSettings
              )

        const nextRows =
          isNewPortlet && newPortletId
            ? [
                ...baseRows,
                {
                  id: createRowId(),
                  h: Math.max(gridSettings.minH, 3),
                  columns: equalizeRowColumns([newPortletId], gridSettings),
                },
              ]
            : baseRows

        await updateRowLayout(nextRows, true, updatedPortlets)
      } else {
        const updatedConfig: DashboardConfig = {
          ...cfg,
          portlets: updatedPortlets,
        }

        onConfigChangeRef.current(updatedConfig)

        if (onSaveRef.current) {
          try {
            await onSaveRef.current(updatedConfig)
            storeActions.setThumbnailDirty(true)
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }

      storeActions.closePortletModal()
      storeActions.closeTextModal()
      return newPortletId
    },
    [gridSettings, storeActions, storeApi, updateRowLayout]
  )

  // Internal delete logic (called after confirmation) — uses refs for stability
  const executeDeletePortlet = useCallback(
    async (portletId: string) => {
      if (!onConfigChangeRef.current) return

      const cfg = configRef.current
      const updatedPortlets = cfg.portlets.filter((p) => p.id !== portletId)

      if (layoutModeRef.current === 'rows') {
        const nextRows = resolvedRowsRef.current
          .map((row) => ({
            ...row,
            columns: row.columns.filter((col) => col.portletId !== portletId),
          }))
          .filter((row) => row.columns.length > 0)
          .map((row) => ({
            ...row,
            columns: equalizeRowColumns(
              row.columns.map((col) => col.portletId),
              gridSettings
            ),
          }))

        await updateRowLayout(nextRows, true, updatedPortlets)
      } else {
        const updatedConfig: DashboardConfig = {
          ...cfg,
          portlets: updatedPortlets,
        }

        onConfigChangeRef.current(updatedConfig)

        if (onSaveRef.current) {
          try {
            await onSaveRef.current(updatedConfig)
            storeActions.setThumbnailDirty(true)
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }
    },
    [gridSettings, storeActions, updateRowLayout]
  )

  // Public delete action - opens confirmation modal
  const deletePortlet = useCallback(
    async (portletId: string) => {
      storeActions.openDeleteConfirm(portletId)
    },
    [storeActions]
  )

  // Confirm delete action - reads from store directly for stability
  const confirmDelete = useCallback(async () => {
    const portletId = storeApi.getState().deleteConfirmPortletId
    if (!portletId) return

    await executeDeletePortlet(portletId)
    storeActions.closeDeleteConfirm()
  }, [executeDeletePortlet, storeActions, storeApi])

  const duplicatePortlet = useCallback(
    async (portletId: string): Promise<string | undefined> => {
      if (!onConfigChangeRef.current) return undefined

      const cfg = configRef.current
      const originalPortlet = cfg.portlets.find((p) => p.id === portletId)
      if (!originalPortlet) return undefined

      const duplicatedPortlet: PortletConfig = {
        ...originalPortlet,
        id: `portlet-${Date.now()}`,
        title: `${originalPortlet.title} Duplicated`,
        x: 0,
        y: 0,
      }

      let maxY = 0
      cfg.portlets.forEach((p) => {
        if (p.y + p.h > maxY) {
          maxY = p.y + p.h
        }
      })
      duplicatedPortlet.y = maxY

      const updatedPortlets = [...cfg.portlets, duplicatedPortlet]

      if (layoutModeRef.current === 'rows') {
        const baseRows = resolvedRowsRef.current.map((row) => ({
          ...row,
          columns: row.columns.map((col) => ({ ...col })),
        }))
        const nextRows = [
          ...baseRows,
          {
            id: createRowId(),
            h: Math.max(gridSettings.minH, 3),
            columns: equalizeRowColumns([duplicatedPortlet.id], gridSettings),
          },
        ]
        await updateRowLayout(nextRows, true, updatedPortlets)
      } else {
        const updatedConfig: DashboardConfig = {
          ...cfg,
          portlets: updatedPortlets,
        }

        onConfigChangeRef.current(updatedConfig)

        if (onSaveRef.current) {
          try {
            await onSaveRef.current(updatedConfig)
            storeActions.setThumbnailDirty(true)
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }

      return duplicatedPortlet.id
    },
    [gridSettings, storeActions, updateRowLayout]
  )

  const refreshPortlet = useCallback(
    (portletId: string, options?: { bustCache?: boolean }) => {
      const portletComponent = portletComponentRefs?.current?.[portletId]
      if (portletComponent?.refresh) {
        portletComponent.refresh(options)
      }
      onPortletRefresh?.(portletId, options)
    },
    [portletComponentRefs, onPortletRefresh]
  )

  // Filter operations — uses refs for stability
  const toggleFilterForPortlet = useCallback(
    async (portletId: string, filterId: string) => {
      if (!onConfigChangeRef.current) return

      const cfg = configRef.current
      const updatedPortlets = cfg.portlets.map((p) => {
        if (p.id === portletId) {
          const currentMapping = p.dashboardFilterMapping || []
          const hasFilter = currentMapping.includes(filterId)

          return {
            ...p,
            dashboardFilterMapping: hasFilter
              ? currentMapping.filter((id) => id !== filterId)
              : [...currentMapping, filterId],
          }
        }
        return p
      })

      const updatedConfig: DashboardConfig = {
        ...cfg,
        portlets: updatedPortlets,
      }

      onConfigChangeRef.current(updatedConfig)

      if (onSaveRef.current) {
        try {
          await onSaveRef.current(updatedConfig)
          storeActions.setThumbnailDirty(true)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    [storeActions]
  )

  const selectAllForFilter = useCallback(
    async (filterId: string) => {
      if (!onConfigChangeRef.current) return

      const cfg = configRef.current
      const updatedPortlets = cfg.portlets.map((p) => {
        const currentMapping = p.dashboardFilterMapping || []
        if (!currentMapping.includes(filterId)) {
          return {
            ...p,
            dashboardFilterMapping: [...currentMapping, filterId],
          }
        }
        return p
      })

      const updatedConfig: DashboardConfig = {
        ...cfg,
        portlets: updatedPortlets,
      }

      onConfigChangeRef.current(updatedConfig)

      if (onSaveRef.current) {
        try {
          await onSaveRef.current(updatedConfig)
          storeActions.setThumbnailDirty(true)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    [storeActions]
  )

  const saveFilterConfig = useCallback(
    async (mapping: string[]) => {
      const filterConfigPortlet = storeApi.getState().filterConfigPortlet
      if (!onConfigChangeRef.current || !filterConfigPortlet) return

      const cfg = configRef.current
      const updatedPortlets = cfg.portlets.map((p) => {
        if (p.id === filterConfigPortlet.id) {
          return {
            ...p,
            dashboardFilterMapping: mapping,
          }
        }
        return p
      })

      const updatedConfig: DashboardConfig = {
        ...cfg,
        portlets: updatedPortlets,
      }

      onConfigChangeRef.current(updatedConfig)

      if (onSaveRef.current) {
        try {
          await onSaveRef.current(updatedConfig)
          storeActions.setThumbnailDirty(true)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    [storeActions, storeApi]
  )

  // Config operations — uses refs for stability
  const handlePaletteChange = useCallback(
    async (paletteName: string) => {
      if (!onConfigChangeRef.current) return

      const updatedConfig: DashboardConfig = {
        ...configRef.current,
        colorPalette: paletteName,
      }

      onConfigChangeRef.current(updatedConfig)

      if (onSaveRef.current) {
        try {
          await onSaveRef.current(updatedConfig)
          storeActions.setThumbnailDirty(true)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    [storeActions]
  )

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

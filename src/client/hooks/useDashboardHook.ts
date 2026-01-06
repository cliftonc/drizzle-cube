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
  type DashboardStore,
  type PortletDebugDataEntry,
} from '../stores/dashboardStore'
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
  /** Grid width for row calculations */
  gridWidth?: number
  /** Portlet component refs for refresh functionality */
  portletComponentRefs?: React.MutableRefObject<Record<string, { refresh: () => void } | null>>
  /** Portlet refresh handler (external) */
  onPortletRefresh?: (portletId: string) => void
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
  /** Debug data per portlet */
  debugData: Record<string, PortletDebugDataEntry>

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
  refreshPortlet: (portletId: string) => void

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
  isFilterConfigModalOpen: state.isFilterConfigModalOpen,
  filterConfigPortlet: state.filterConfigPortlet,
  deleteConfirmPortletId: state.deleteConfirmPortletId,
  draftRows: state.draftRows,
  isDraggingPortlet: state.isDraggingPortlet,
  lastKnownLayout: state.lastKnownLayout,
  isInitialized: state.isInitialized,
  debugData: state.debugData,
})

const selectStoreActions = (state: DashboardStore) => ({
  setEditMode: state.setEditMode,
  toggleEditMode: state.toggleEditMode,
  setSelectedFilterId: state.setSelectedFilterId,
  exitFilterSelectionMode: state.exitFilterSelectionMode,
  openPortletModal: state.openPortletModal,
  closePortletModal: state.closePortletModal,
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
    portletComponentRefs,
    onPortletRefresh,
  } = options

  // =========================================================================
  // Store Access
  // =========================================================================

  const storeState = useDashboardStore(useShallow(selectStoreState))
  const storeActions = useDashboardStore(useShallow(selectStoreActions))

  // Keep refs for draft rows (needed for mouse event handlers)
  const draftRowsRef = useRef<RowLayout[] | null>(null)
  draftRowsRef.current = storeState.draftRows

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
  }, [storeActions])

  const toggleEditMode = useCallback(() => {
    if (isResponsiveEditable) {
      storeActions.toggleEditMode()
    }
  }, [isResponsiveEditable, storeActions])

  const selectFilter = useCallback(
    (filterId: string | null) => {
      // Toggle selection: if already selected, deselect
      storeActions.setSelectedFilterId(
        filterId === storeState.selectedFilterId ? null : filterId
      )
    },
    [storeActions, storeState.selectedFilterId]
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

  const openFilterConfig = useCallback(
    (portlet: PortletConfig) => {
      storeActions.openFilterConfigModal(portlet)
    },
    [storeActions]
  )

  // Layout change detection
  const hasLayoutActuallyChanged = useCallback(
    (newLayout: LayoutItem[]) => {
      if (!storeState.isInitialized || storeState.lastKnownLayout.length === 0) {
        return false
      }

      for (const newItem of newLayout) {
        const oldItem = storeState.lastKnownLayout.find((item) => item.i === newItem.i)
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
    [storeState.isInitialized, storeState.lastKnownLayout]
  )

  // Row layout update
  const updateRowLayout = useCallback(
    async (
      rows: RowLayout[],
      save = true,
      portletsOverride?: PortletConfig[]
    ) => {
      if (!onConfigChange) return

      const portlets = portletsOverride ?? config.portlets
      const normalizedRows = normalizeRows(rows, portlets, gridSettings)
      const updatedPortlets = convertRowsToPortlets(normalizedRows, portlets)
      const updatedConfig: DashboardConfig = {
        ...config,
        layoutMode: 'rows',
        rows: normalizedRows,
        portlets: updatedPortlets,
      }

      storeActions.setDraftRows(null)
      onConfigChange(updatedConfig)

      if (save && onSave) {
        try {
          await onSave(updatedConfig)
        } catch (error) {
          console.error('Auto-save failed after row layout change:', error)
        }
      }
    },
    [config, gridSettings, onConfigChange, onSave, storeActions]
  )

  // Layout mode change
  const handleLayoutModeChange = useCallback(
    async (mode: DashboardLayoutMode) => {
      if (
        !onConfigChange ||
        mode === layoutMode ||
        !canChangeLayoutMode ||
        !allowedModes.includes(mode)
      ) {
        return
      }

      const baseRows = normalizeRows(
        config.rows && config.rows.length > 0
          ? config.rows
          : convertPortletsToRows(config.portlets, gridSettings),
        config.portlets,
        gridSettings
      )

      const updatedPortlets = convertRowsToPortlets(baseRows, config.portlets)
      const updatedConfig: DashboardConfig = {
        ...config,
        layoutMode: mode,
        rows: baseRows,
        portlets: updatedPortlets,
      }

      storeActions.setDraftRows(null)
      onConfigChange(updatedConfig)

      if (onSave) {
        try {
          await onSave(updatedConfig)
        } catch (error) {
          console.error('Auto-save failed after layout mode switch:', error)
        }
      }
    },
    [
      allowedModes,
      canChangeLayoutMode,
      config,
      gridSettings,
      layoutMode,
      onConfigChange,
      onSave,
      storeActions,
    ]
  )

  // Portlet operations
  const savePortlet = useCallback(
    async (
      portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>
    ): Promise<string | null> => {
      if (!onConfigChange) return null

      let updatedPortlets = [...config.portlets]
      let isNewPortlet = false
      let newPortletId: string | null = null

      if (storeState.editingPortlet) {
        // Editing existing portlet
        const index = updatedPortlets.findIndex(
          (p) => p.id === storeState.editingPortlet!.id
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
        config.portlets.forEach((p) => {
          if (p.y + p.h > maxY) {
            maxY = p.y + p.h
          }
        })
        newPortlet.y = maxY

        updatedPortlets.push(newPortlet)
      }

      if (layoutMode === 'rows') {
        const baseRows =
          resolvedRows.length > 0
            ? resolvedRows.map((row) => ({
                ...row,
                columns: row.columns.map((col) => ({ ...col })),
              }))
            : normalizeRows(
                config.rows ?? convertPortletsToRows(config.portlets, gridSettings),
                updatedPortlets,
                gridSettings
              )

        const nextRows =
          isNewPortlet && newPortletId
            ? [
                ...baseRows,
                {
                  id: createRowId(),
                  h: Math.max(gridSettings.minH, 5),
                  columns: equalizeRowColumns([newPortletId], gridSettings),
                },
              ]
            : baseRows

        await updateRowLayout(nextRows, true, updatedPortlets)
      } else {
        const updatedConfig: DashboardConfig = {
          ...config,
          portlets: updatedPortlets,
        }

        onConfigChange(updatedConfig)

        if (onSave) {
          try {
            await onSave(updatedConfig)
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }

      storeActions.closePortletModal()
      return newPortletId
    },
    [
      config,
      gridSettings,
      layoutMode,
      onConfigChange,
      onSave,
      resolvedRows,
      storeActions,
      storeState.editingPortlet,
      updateRowLayout,
    ]
  )

  // Internal delete logic (called after confirmation)
  const executeDeletePortlet = useCallback(
    async (portletId: string) => {
      if (!onConfigChange) return

      const updatedPortlets = config.portlets.filter((p) => p.id !== portletId)

      if (layoutMode === 'rows') {
        const nextRows = resolvedRows
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
          ...config,
          portlets: updatedPortlets,
        }

        onConfigChange(updatedConfig)

        if (onSave) {
          try {
            await onSave(updatedConfig)
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }
    },
    [config, gridSettings, layoutMode, onConfigChange, onSave, resolvedRows, updateRowLayout]
  )

  // Public delete action - opens confirmation modal
  const deletePortlet = useCallback(
    async (portletId: string) => {
      storeActions.openDeleteConfirm(portletId)
    },
    [storeActions]
  )

  // Confirm delete action - called when user confirms in modal
  const confirmDelete = useCallback(async () => {
    const portletId = storeState.deleteConfirmPortletId
    if (!portletId) return

    await executeDeletePortlet(portletId)
    storeActions.closeDeleteConfirm()
  }, [executeDeletePortlet, storeState.deleteConfirmPortletId, storeActions])

  const duplicatePortlet = useCallback(
    async (portletId: string): Promise<string | undefined> => {
      if (!onConfigChange) return undefined

      const originalPortlet = config.portlets.find((p) => p.id === portletId)
      if (!originalPortlet) return undefined

      const duplicatedPortlet: PortletConfig = {
        ...originalPortlet,
        id: `portlet-${Date.now()}`,
        title: `${originalPortlet.title} Duplicated`,
        x: 0,
        y: 0,
      }

      let maxY = 0
      config.portlets.forEach((p) => {
        if (p.y + p.h > maxY) {
          maxY = p.y + p.h
        }
      })
      duplicatedPortlet.y = maxY

      const updatedPortlets = [...config.portlets, duplicatedPortlet]

      if (layoutMode === 'rows') {
        const baseRows = resolvedRows.map((row) => ({
          ...row,
          columns: row.columns.map((col) => ({ ...col })),
        }))
        const nextRows = [
          ...baseRows,
          {
            id: createRowId(),
            h: Math.max(gridSettings.minH, 5),
            columns: equalizeRowColumns([duplicatedPortlet.id], gridSettings),
          },
        ]
        await updateRowLayout(nextRows, true, updatedPortlets)
      } else {
        const updatedConfig: DashboardConfig = {
          ...config,
          portlets: updatedPortlets,
        }

        onConfigChange(updatedConfig)

        if (onSave) {
          try {
            await onSave(updatedConfig)
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }

      return duplicatedPortlet.id
    },
    [config, gridSettings, layoutMode, onConfigChange, onSave, resolvedRows, updateRowLayout]
  )

  const refreshPortlet = useCallback(
    (portletId: string) => {
      const portletComponent = portletComponentRefs?.current?.[portletId]
      if (portletComponent?.refresh) {
        portletComponent.refresh()
      }
      onPortletRefresh?.(portletId)
    },
    [portletComponentRefs, onPortletRefresh]
  )

  // Filter operations
  const toggleFilterForPortlet = useCallback(
    async (portletId: string, filterId: string) => {
      if (!onConfigChange) return

      const updatedPortlets = config.portlets.map((p) => {
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
        ...config,
        portlets: updatedPortlets,
      }

      onConfigChange(updatedConfig)

      if (onSave) {
        try {
          await onSave(updatedConfig)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    [config, onConfigChange, onSave]
  )

  const selectAllForFilter = useCallback(
    async (filterId: string) => {
      if (!onConfigChange) return

      const updatedPortlets = config.portlets.map((p) => {
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
        ...config,
        portlets: updatedPortlets,
      }

      onConfigChange(updatedConfig)

      if (onSave) {
        try {
          await onSave(updatedConfig)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    [config, onConfigChange, onSave]
  )

  const saveFilterConfig = useCallback(
    async (mapping: string[]) => {
      if (!onConfigChange || !storeState.filterConfigPortlet) return

      const updatedPortlets = config.portlets.map((p) => {
        if (p.id === storeState.filterConfigPortlet!.id) {
          return {
            ...p,
            dashboardFilterMapping: mapping,
          }
        }
        return p
      })

      const updatedConfig: DashboardConfig = {
        ...config,
        portlets: updatedPortlets,
      }

      onConfigChange(updatedConfig)

      if (onSave) {
        try {
          await onSave(updatedConfig)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    [config, onConfigChange, onSave, storeState.filterConfigPortlet]
  )

  // Config operations
  const handlePaletteChange = useCallback(
    async (paletteName: string) => {
      if (!onConfigChange) return

      const updatedConfig: DashboardConfig = {
        ...config,
        colorPalette: paletteName,
      }

      onConfigChange(updatedConfig)

      if (onSave) {
        try {
          await onSave(updatedConfig)
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    },
    [config, onConfigChange, onSave]
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

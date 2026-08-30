import { startTransition, useCallback, useRef, type MutableRefObject, type RefObject } from 'react'
import type { StoreApi } from 'zustand'
import { captureThumbnail } from '../../utils/thumbnail.js'
import type {
  DashboardConfig,
  DashboardFilterMapping,
  DashboardGridSettings,
  DashboardLayoutMode,
  PortletConfig,
  PortletGroup,
  RowLayout,
  ThumbnailFeatureConfig
} from '../../types.js'
import type { DashboardStore, DashboardStoreActions } from '../../stores/dashboardStore.js'
import { mappingIncludesFilter } from '../../utils/filterUtils.js'
import {
  convertPortletsToRows,
  convertRowsToPortlets,
  createRowId,
  equalizeColumns,
  normalizeRows
} from './layoutUtils.js'
import type { LayoutUpdate } from './useRowLayoutEngine.js'
import {
  deleteGroup as deleteGroupFromLayout,
  findPortletLocation,
  normalizeGroups,
  removeFromGroup,
  snapIntoGroup,
  ungroup,
  type SnapEdge,
} from './groupUtils.js'

interface UseDashboardControllerOptions {
  allowedModes: DashboardLayoutMode[]
  canChangeLayoutMode: boolean
  isResponsiveEditable: boolean
  layoutMode: DashboardLayoutMode
  resolvedRows: RowLayout[]
  resolvedGroups: PortletGroup[]
  gridSettings: DashboardGridSettings
  thumbnailConfig?: ThumbnailFeatureConfig
  dashboardRef?: RefObject<HTMLElement | null>
  storeApi: StoreApi<DashboardStore>
  storeActions: Pick<
    DashboardStoreActions,
    | 'setEditMode'
    | 'exitFilterSelectionMode'
    | 'openPortletModal'
    | 'closePortletModal'
    | 'openTextModal'
    | 'closeTextModal'
    | 'openFilterConfigModal'
    | 'closeFilterConfigModal'
    | 'openDeleteConfirm'
    | 'openDeleteGroupConfirm'
    | 'setDraftGroups'
    | 'closeDeleteConfirm'
    | 'setThumbnailDirty'
  >
  configRef: MutableRefObject<DashboardConfig>
  onConfigChangeRef: MutableRefObject<((config: DashboardConfig) => void) | undefined>
  onSaveRef: MutableRefObject<((config: DashboardConfig) => Promise<void> | void) | undefined>
  onSaveThumbnailRef: MutableRefObject<((thumbnailData: string) => Promise<string | void>) | undefined>
  updateLayout: (next: LayoutUpdate, save?: boolean) => Promise<void>
  updateRowLayout: (
    rows: RowLayout[],
    save?: boolean,
    portletsOverride?: PortletConfig[]
  ) => Promise<void>
  portletComponentRefs?: MutableRefObject<Record<string, { refresh: (options?: { bustCache?: boolean }) => void } | null>>
  onPortletRefresh?: (portletId: string, options?: { bustCache?: boolean }) => void
}

export function useDashboardController({
  allowedModes,
  canChangeLayoutMode,
  isResponsiveEditable,
  layoutMode,
  resolvedRows,
  resolvedGroups,
  gridSettings,
  thumbnailConfig,
  dashboardRef,
  storeApi,
  storeActions,
  configRef,
  onConfigChangeRef,
  onSaveRef,
  onSaveThumbnailRef,
  updateLayout,
  updateRowLayout,
  portletComponentRefs,
  onPortletRefresh,
}: UseDashboardControllerOptions) {
  const layoutModeRef = useRef(layoutMode)
  layoutModeRef.current = layoutMode
  const canChangeLayoutModeRef = useRef(canChangeLayoutMode)
  canChangeLayoutModeRef.current = canChangeLayoutMode
  const resolvedRowsRef = useRef(resolvedRows)
  resolvedRowsRef.current = resolvedRows
  const resolvedGroupsRef = useRef(resolvedGroups)
  resolvedGroupsRef.current = resolvedGroups

  const saveConfig = useCallback(
    async (
      updatedConfig: DashboardConfig,
      errorMessage: string
    ) => {
      if (!onConfigChangeRef.current) return

      onConfigChangeRef.current(updatedConfig)
      storeActions.setThumbnailDirty(true)

      if (onSaveRef.current) {
        try {
          await onSaveRef.current(updatedConfig)
        } catch (error) {
          console.error(errorMessage, error)
        }
      }
    },
    [onConfigChangeRef, onSaveRef, storeActions]
  )

  const enterEditMode = useCallback(() => {
    startTransition(() => {
      storeActions.setEditMode(true)
    })
  }, [storeActions])

  const exitEditMode = useCallback(() => {
    startTransition(() => {
      storeActions.setEditMode(false)
    })

    const isThumbnailDirty = storeApi.getState().thumbnailDirty
    if (isThumbnailDirty && thumbnailConfig?.enabled && dashboardRef) {
      setTimeout(async () => {
        const thumbnailData = await captureThumbnail(dashboardRef, thumbnailConfig)
        if (thumbnailData && onSaveThumbnailRef.current) {
          try {
            const thumbnailUrl = await onSaveThumbnailRef.current(thumbnailData)
            if (thumbnailUrl && onConfigChangeRef.current) {
              onConfigChangeRef.current({
                ...configRef.current,
                thumbnailUrl,
                thumbnailData: undefined
              })
            }
          } catch (error) {
            console.error('Failed to save thumbnail:', error)
          }
        }
        storeActions.setThumbnailDirty(false)
      }, 500)
    }
  }, [
    configRef,
    dashboardRef,
    onConfigChangeRef,
    onSaveThumbnailRef,
    storeApi,
    storeActions,
    thumbnailConfig
  ])

  const toggleEditMode = useCallback(() => {
    if (!isResponsiveEditable) return
    const store = storeApi.getState()
    if (store.isEditMode) {
      exitEditMode()
    } else {
      startTransition(() => {
        storeActions.setEditMode(true)
      })
    }
  }, [exitEditMode, isResponsiveEditable, storeActions, storeApi])

  const selectFilter = useCallback(
    (filterId: string | null) => {
      const currentSelectedId = storeApi.getState().selectedFilterId
      storeApi.getState().setSelectedFilterId(
        filterId === currentSelectedId ? null : filterId
      )
    },
    [storeApi]
  )

  const openAddPortlet = useCallback(() => {
    storeActions.openPortletModal(null)
  }, [storeActions])

  const openEditPortlet = useCallback(
    (portlet: PortletConfig) => {
      storeActions.openPortletModal(portlet)
    },
    [storeActions]
  )

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

      // Normalize groups first and thread them through, exactly as
      // useRowLayoutEngine does. Without this every group column is treated as
      // dangling and dropped - taking its row, and any row that held only a
      // group, with it.
      const hasExplicitRows = Boolean(cfg.rows && cfg.rows.length > 0)
      const inputRows = hasExplicitRows
        ? cfg.rows!
        : convertPortletsToRows(cfg.portlets, gridSettings)
      const normalized = normalizeGroups(
        hasExplicitRows ? cfg.groups : undefined,
        cfg.portlets,
        inputRows,
        gridSettings
      )
      const baseRows = normalizeRows(
        normalized.rows,
        cfg.portlets,
        gridSettings,
        normalized.groups
      )

      const updatedPortlets = convertRowsToPortlets(baseRows, cfg.portlets, normalized.groups)
      const updatedConfig: DashboardConfig = {
        ...cfg,
        layoutMode: mode,
        rows: baseRows,
        groups: normalized.groups,
        portlets: updatedPortlets,
      }

      await saveConfig(updatedConfig, 'Auto-save failed after layout mode switch:')
    },
    [allowedModes, configRef, gridSettings, onConfigChangeRef, saveConfig]
  )

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
        const index = updatedPortlets.findIndex((p) => p.id === editingExisting.id)
        if (index !== -1) {
          updatedPortlets[index] = portletData as PortletConfig
        }
      } else {
        isNewPortlet = true
        const newPortlet: PortletConfig = {
          ...portletData,
          id: `portlet-${Date.now()}`,
          x: 0,
          y: 0,
        } as PortletConfig

        newPortletId = newPortlet.id

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
                  columns: equalizeColumns([{ portletId: newPortletId, w: 0 }], gridSettings),
                },
              ]
            : baseRows

        await updateRowLayout(nextRows, true, updatedPortlets)
      } else {
        const updatedConfig: DashboardConfig = {
          ...cfg,
          portlets: updatedPortlets,
        }
        await saveConfig(updatedConfig, 'Auto-save failed:')
      }

      storeActions.closePortletModal()
      storeActions.closeTextModal()
      return newPortletId
    },
    [configRef, gridSettings, onConfigChangeRef, resolvedRowsRef, saveConfig, storeActions, storeApi, updateRowLayout]
  )

  const executeDeletePortlet = useCallback(
    async (portletId: string) => {
      if (!onConfigChangeRef.current) return

      const cfg = configRef.current
      const updatedPortlets = cfg.portlets.filter((p) => p.id !== portletId)

      if (layoutModeRef.current === 'rows') {
        // A grouped child owns no column of its own, so the column filter below
        // would never match it - strip it from its group first.
        const nextGroups = removeFromGroup(resolvedGroupsRef.current, portletId).groups

        const nextRows = resolvedRowsRef.current
          .map((row) => ({
            ...row,
            columns: row.columns.filter((col) => col.portletId !== portletId),
          }))
          .filter((row) => row.columns.length > 0)
          .map((row) => ({
            ...row,
            columns: equalizeColumns(row.columns, gridSettings),
          }))

        await updateLayout({ rows: nextRows, groups: nextGroups, portlets: updatedPortlets })
      } else {
        const updatedConfig: DashboardConfig = {
          ...cfg,
          portlets: updatedPortlets,
        }
        await saveConfig(updatedConfig, 'Auto-save failed:')
      }
    },
    [configRef, gridSettings, onConfigChangeRef, resolvedGroupsRef, resolvedRowsRef, saveConfig, updateLayout]
  )

  const deletePortlet = useCallback(
    async (portletId: string) => {
      storeActions.openDeleteConfirm(portletId)
    },
    [storeActions]
  )

  // =========================================================================
  // Group actions (rows layout mode only)
  // =========================================================================

  /** Snap `movedPortletId` against an edge of `targetPortletId`. */
  const snapPortletIntoGroup = useCallback(
    async (movedPortletId: string, targetPortletId: string, edge: SnapEdge) => {
      if (layoutModeRef.current !== 'rows') return

      const next = snapIntoGroup(
        { rows: resolvedRowsRef.current, groups: resolvedGroupsRef.current },
        movedPortletId,
        targetPortletId,
        edge,
        gridSettings
      )
      if (!next) return

      await updateLayout({ rows: next.rows, groups: next.groups })
    },
    [gridSettings, resolvedGroupsRef, resolvedRowsRef, updateLayout]
  )

  /** Dissolve a group, leaving its members as ordinary columns in the same row. */
  const ungroupGroup = useCallback(
    async (groupId: string) => {
      if (layoutModeRef.current !== 'rows') return
      const next = ungroup(
        { rows: resolvedRowsRef.current, groups: resolvedGroupsRef.current },
        groupId,
        gridSettings
      )
      await updateLayout({ rows: next.rows, groups: next.groups })
    },
    [gridSettings, resolvedGroupsRef, resolvedRowsRef, updateLayout]
  )

  const deleteGroup = useCallback(
    (groupId: string) => {
      storeActions.openDeleteGroupConfirm(groupId)
    },
    [storeActions]
  )

  /** Delete a group *and* every portlet inside it. */
  const executeDeleteGroup = useCallback(
    async (groupId: string) => {
      if (layoutModeRef.current !== 'rows') return

      const { state, removedPortletIds } = deleteGroupFromLayout(
        { rows: resolvedRowsRef.current, groups: resolvedGroupsRef.current },
        groupId,
        gridSettings
      )
      const removed = new Set(removedPortletIds)
      const updatedPortlets = configRef.current.portlets.filter((p) => !removed.has(p.id))

      await updateLayout({ rows: state.rows, groups: state.groups, portlets: updatedPortlets })
    },
    [configRef, gridSettings, resolvedGroupsRef, resolvedRowsRef, updateLayout]
  )

  const renameGroup = useCallback(
    async (groupId: string, title: string) => {
      if (layoutModeRef.current !== 'rows') return
      const trimmed = title.trim()
      const groups = resolvedGroupsRef.current.map((group) =>
        group.id === groupId ? { ...group, title: trimmed || undefined } : group
      )
      await updateLayout({ rows: resolvedRowsRef.current, groups })
    },
    [resolvedGroupsRef, resolvedRowsRef, updateLayout]
  )

  /**
   * Live-resize two adjacent cells. `commit: false` writes a draft so the drag
   * stays cheap; the final call persists.
   */

  const confirmDelete = useCallback(async () => {
    const { deleteConfirmPortletId, deleteConfirmGroupId } = storeApi.getState()

    if (deleteConfirmGroupId) {
      await executeDeleteGroup(deleteConfirmGroupId)
    } else if (deleteConfirmPortletId) {
      await executeDeletePortlet(deleteConfirmPortletId)
    } else {
      return
    }

    storeActions.closeDeleteConfirm()
  }, [executeDeleteGroup, executeDeletePortlet, storeActions, storeApi])

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

        const location = findPortletLocation(baseRows, resolvedGroupsRef.current, portletId)

        if (location?.groupId) {
          // Duplicating a KPI inside a group should extend that group, not push
          // a lone copy onto the bottom of the dashboard.
          const nextGroups = resolvedGroupsRef.current.map((group) => {
            if (group.id !== location.groupId) return group
            const cells = group.cells.map((cell, cellIndex) =>
              cellIndex === location.cellIndex
                ? {
                    ...cell,
                    portletIds: [
                      ...cell.portletIds.slice(0, location.stackIndex! + 1),
                      duplicatedPortlet.id,
                      ...cell.portletIds.slice(location.stackIndex! + 1),
                    ],
                  }
                : cell
            )
            return { ...group, cells }
          })
          await updateLayout({ rows: baseRows, groups: nextGroups, portlets: updatedPortlets })
          return duplicatedPortlet.id
        }

        const nextRows = [
          ...baseRows,
          {
            id: createRowId(),
            h: Math.max(gridSettings.minH, 3),
            columns: equalizeColumns([{ portletId: duplicatedPortlet.id, w: 0 }], gridSettings),
          },
        ]
        await updateRowLayout(nextRows, true, updatedPortlets)
      } else {
        const updatedConfig: DashboardConfig = {
          ...cfg,
          portlets: updatedPortlets,
        }
        await saveConfig(updatedConfig, 'Auto-save failed:')
      }

      return duplicatedPortlet.id
    },
    [
      configRef,
      gridSettings,
      onConfigChangeRef,
      resolvedGroupsRef,
      resolvedRowsRef,
      saveConfig,
      updateLayout,
      updateRowLayout,
    ]
  )

  const refreshPortlet = useCallback(
    (portletId: string, options?: { bustCache?: boolean }) => {
      const portletComponent = portletComponentRefs?.current?.[portletId]
      if (portletComponent?.refresh) {
        portletComponent.refresh(options)
      }
      onPortletRefresh?.(portletId, options)
    },
    [onPortletRefresh, portletComponentRefs]
  )

  const toggleFilterForPortlet = useCallback(
    async (portletId: string, filterId: string) => {
      if (!onConfigChangeRef.current) return

      const cfg = configRef.current
      const updatedPortlets = cfg.portlets.map((p) => {
        if (p.id === portletId) {
          const currentMapping = p.dashboardFilterMapping || []
          const hasFilter = mappingIncludesFilter(currentMapping, filterId)

          return {
            ...p,
            dashboardFilterMapping: hasFilter
              ? currentMapping.filter((entry) =>
                  typeof entry === 'string' ? entry !== filterId : entry.filterId !== filterId
                )
              : [...currentMapping, filterId],
          }
        }
        return p
      })

      const updatedConfig: DashboardConfig = {
        ...cfg,
        portlets: updatedPortlets,
      }
      await saveConfig(updatedConfig, 'Auto-save failed:')
    },
    [configRef, onConfigChangeRef, saveConfig]
  )

  const selectAllForFilter = useCallback(
    async (filterId: string) => {
      if (!onConfigChangeRef.current) return

      const cfg = configRef.current
      const updatedPortlets = cfg.portlets.map((p) => {
        const currentMapping = p.dashboardFilterMapping || []
        if (!mappingIncludesFilter(currentMapping, filterId)) {
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
      await saveConfig(updatedConfig, 'Auto-save failed:')
    },
    [configRef, onConfigChangeRef, saveConfig]
  )

  const saveFilterConfig = useCallback(
    async (mapping: DashboardFilterMapping) => {
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
      await saveConfig(updatedConfig, 'Auto-save failed:')
    },
    [configRef, onConfigChangeRef, saveConfig, storeApi]
  )

  const handlePaletteChange = useCallback(
    async (paletteName: string) => {
      if (!onConfigChangeRef.current) return

      const updatedConfig: DashboardConfig = {
        ...configRef.current,
        colorPalette: paletteName,
      }

      await saveConfig(updatedConfig, 'Auto-save failed:')
    },
    [configRef, onConfigChangeRef, saveConfig]
  )

  return {
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
    snapPortletIntoGroup,
    ungroupGroup,
    deleteGroup,
    renameGroup,
  }
}

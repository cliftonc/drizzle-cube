import { startTransition, useCallback, useRef, type MutableRefObject, type RefObject } from 'react'
import type { StoreApi } from 'zustand'
import { captureThumbnail } from '../../utils/thumbnail'
import type {
  DashboardConfig,
  DashboardGridSettings,
  DashboardLayoutMode,
  PortletConfig,
  RowLayout,
  ThumbnailFeatureConfig
} from '../../types'
import type { DashboardStore, DashboardStoreActions } from '../../stores/dashboardStore'
import {
  convertPortletsToRows,
  convertRowsToPortlets,
  createRowId,
  equalizeRowColumns,
  normalizeRows
} from './layoutUtils'

interface UseDashboardControllerOptions {
  allowedModes: DashboardLayoutMode[]
  canChangeLayoutMode: boolean
  isResponsiveEditable: boolean
  layoutMode: DashboardLayoutMode
  resolvedRows: RowLayout[]
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
    | 'closeDeleteConfirm'
    | 'setThumbnailDirty'
  >
  configRef: MutableRefObject<DashboardConfig>
  onConfigChangeRef: MutableRefObject<((config: DashboardConfig) => void) | undefined>
  onSaveRef: MutableRefObject<((config: DashboardConfig) => Promise<void> | void) | undefined>
  onSaveThumbnailRef: MutableRefObject<((thumbnailData: string) => Promise<string | void>) | undefined>
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
}: UseDashboardControllerOptions) {
  const layoutModeRef = useRef(layoutMode)
  layoutModeRef.current = layoutMode
  const canChangeLayoutModeRef = useRef(canChangeLayoutMode)
  canChangeLayoutModeRef.current = canChangeLayoutMode
  const resolvedRowsRef = useRef(resolvedRows)
  resolvedRowsRef.current = resolvedRows

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
        await saveConfig(updatedConfig, 'Auto-save failed:')
      }
    },
    [configRef, gridSettings, onConfigChangeRef, resolvedRowsRef, saveConfig, updateRowLayout]
  )

  const deletePortlet = useCallback(
    async (portletId: string) => {
      storeActions.openDeleteConfirm(portletId)
    },
    [storeActions]
  )

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
        await saveConfig(updatedConfig, 'Auto-save failed:')
      }

      return duplicatedPortlet.id
    },
    [configRef, gridSettings, onConfigChangeRef, resolvedRowsRef, saveConfig, updateRowLayout]
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
      await saveConfig(updatedConfig, 'Auto-save failed:')
    },
    [configRef, onConfigChangeRef, saveConfig]
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
  }
}

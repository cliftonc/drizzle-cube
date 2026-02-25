import { useCallback, useMemo, type MutableRefObject } from 'react'
import type {
  DashboardConfig,
  DashboardGridSettings,
  DashboardLayoutMode,
  PortletConfig,
  RowLayout
} from '../../types'
import {
  convertPortletsToRows,
  convertRowsToPortlets,
  normalizeRows
} from './layoutUtils'

interface UseRowLayoutEngineOptions {
  layoutMode: DashboardLayoutMode
  draftRows: RowLayout[] | null
  config: DashboardConfig
  gridSettings: DashboardGridSettings
  configRef: MutableRefObject<DashboardConfig>
  onConfigChangeRef: MutableRefObject<((config: DashboardConfig) => void) | undefined>
  onSaveRef: MutableRefObject<((config: DashboardConfig) => Promise<void> | void) | undefined>
  setDraftRows: (rows: RowLayout[] | null) => void
  setThumbnailDirty: (dirty: boolean) => void
}

export function useRowLayoutEngine({
  layoutMode,
  draftRows,
  config,
  gridSettings,
  configRef,
  onConfigChangeRef,
  onSaveRef,
  setDraftRows,
  setThumbnailDirty,
}: UseRowLayoutEngineOptions) {
  const resolvedRows = useMemo(() => {
    if (layoutMode !== 'rows') return []
    const baseRows =
      draftRows ??
      config.rows ??
      convertPortletsToRows(config.portlets, gridSettings)
    return normalizeRows(baseRows, config.portlets, gridSettings)
  }, [layoutMode, draftRows, config.rows, config.portlets, gridSettings])

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

      setDraftRows(null)
      onConfigChangeRef.current(updatedConfig)

      if (save) {
        setThumbnailDirty(true)
      }

      if (save && onSaveRef.current) {
        try {
          await onSaveRef.current(updatedConfig)
        } catch (error) {
          console.error('Auto-save failed after row layout change:', error)
        }
      }
    },
    [configRef, gridSettings, onConfigChangeRef, onSaveRef, setDraftRows, setThumbnailDirty]
  )

  return {
    resolvedRows,
    updateRowLayout,
  }
}

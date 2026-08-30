import { useCallback, useMemo, type MutableRefObject } from 'react'
import type {
  DashboardConfig,
  DashboardGridSettings,
  DashboardLayoutMode,
  PortletConfig,
  PortletGroup,
  RowLayout
} from '../../types.js'
import {
  convertPortletsToRows,
  convertRowsToPortlets,
  normalizeRows
} from './layoutUtils.js'
import { normalizeGroups } from './groupUtils.js'

/** A single layout commit. Rows and groups are coupled, so they travel together. */
export interface LayoutUpdate {
  rows: RowLayout[]
  groups?: PortletGroup[]
  portlets?: PortletConfig[]
}

interface UseRowLayoutEngineOptions {
  layoutMode: DashboardLayoutMode
  draftRows: RowLayout[] | null
  draftGroups: PortletGroup[] | null
  config: DashboardConfig
  gridSettings: DashboardGridSettings
  configRef: MutableRefObject<DashboardConfig>
  onConfigChangeRef: MutableRefObject<((config: DashboardConfig) => void) | undefined>
  onSaveRef: MutableRefObject<((config: DashboardConfig) => Promise<void> | void) | undefined>
  setDraftRows: (rows: RowLayout[] | null) => void
  setDraftGroups: (groups: PortletGroup[] | null) => void
  setThumbnailDirty: (dirty: boolean) => void
}

export function useRowLayoutEngine({
  layoutMode,
  draftRows,
  draftGroups,
  config,
  gridSettings,
  configRef,
  onConfigChangeRef,
  onSaveRef,
  setDraftRows,
  setDraftGroups,
  setThumbnailDirty,
}: UseRowLayoutEngineOptions) {
  // Groups are normalized first: collapsing or pruning a group rewrites the row
  // column that hosts it, and normalizeRows would otherwise drop that column.
  const resolved = useMemo(() => {
    if (layoutMode !== 'rows') return { rows: [] as RowLayout[], groups: [] as PortletGroup[] }

    // Rows derived from portlet x/y can't host a group, so groups are dropped
    // along with them rather than left orphaned.
    const hasExplicitRows = Boolean(draftRows ?? config.rows)
    const baseRows =
      draftRows ?? config.rows ?? convertPortletsToRows(config.portlets, gridSettings)
    const baseGroups = hasExplicitRows ? (draftGroups ?? config.groups) : undefined

    const normalized = normalizeGroups(baseGroups, config.portlets, baseRows, gridSettings)
    return {
      groups: normalized.groups,
      rows: normalizeRows(normalized.rows, config.portlets, gridSettings, normalized.groups)
    }
  }, [layoutMode, draftRows, draftGroups, config.rows, config.groups, config.portlets, gridSettings])

  const resolvedRows = resolved.rows
  const resolvedGroups = resolved.groups

  /**
   * Commit a layout change. Rows and groups must be written in one call: the
   * config only reaches `configRef` on the next render, so two commits in the
   * same tick would both read the stale config and the second would win.
   */
  const updateLayout = useCallback(
    async (next: LayoutUpdate, save = true) => {
      if (!onConfigChangeRef.current) return

      const portlets = next.portlets ?? configRef.current.portlets
      const baseGroups = next.groups ?? configRef.current.groups
      const normalized = normalizeGroups(baseGroups, portlets, next.rows, gridSettings)
      const normalizedRows = normalizeRows(
        normalized.rows,
        portlets,
        gridSettings,
        normalized.groups
      )
      const updatedPortlets = convertRowsToPortlets(normalizedRows, portlets, normalized.groups)

      const updatedConfig: DashboardConfig = {
        ...configRef.current,
        layoutMode: 'rows',
        rows: normalizedRows,
        groups: normalized.groups,
        portlets: updatedPortlets,
      }

      setDraftRows(null)
      setDraftGroups(null)
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
    [
      configRef,
      gridSettings,
      onConfigChangeRef,
      onSaveRef,
      setDraftGroups,
      setDraftRows,
      setThumbnailDirty,
    ]
  )

  /** Back-compat wrapper for callers that only touch rows. */
  const updateRowLayout = useCallback(
    async (rows: RowLayout[], save = true, portletsOverride?: PortletConfig[]) =>
      updateLayout({ rows, portlets: portletsOverride }, save),
    [updateLayout]
  )

  return {
    resolvedRows,
    resolvedGroups,
    updateLayout,
    updateRowLayout,
  }
}

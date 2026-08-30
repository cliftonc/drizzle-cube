import type {
  DashboardGridSettings,
  PortletConfig,
  PortletGroup,
  RowLayout,
  RowLayoutColumn
} from '../../types.js'
import { deriveGroupGeometry } from './groupGeometry.js'

export const createRowId = () => `row-${Date.now()}`

/**
 * Correct a row insertion index for a source row that the move emptied.
 *
 * Splicing the source row out shifts every later index up by one, so an
 * unadjusted index lands the row one position too low. `handleRowDrop` has
 * always done this for column moves; new-row drops need it too, and hit it more
 * often, because a group is usually the only column in its row.
 */
export const adjustInsertIndexForRemovedRow = (
  insertIndex: number,
  sourceRowIndex: number,
  sourceRowRemoved: boolean
): number =>
  sourceRowRemoved && sourceRowIndex < insertIndex ? insertIndex - 1 : insertIndex

/**
 * Distribute `cols` evenly across the given columns, preserving each column's
 * identity (`portletId` **or** `groupId`) so re-equalisation never drops a group
 * reference. This is the function to use; `equalizeRowColumns` below is the
 * legacy id-only wrapper.
 */
export const equalizeColumns = (
  columns: RowLayoutColumn[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  const count = columns.length
  if (count === 0) return []

  const { cols, minW } = gridSettings
  const minTotal = minW * count

  if (minTotal > cols) {
    const base = Math.floor(cols / count)
    const remainder = cols % count
    // More columns than grid units: overflow the row rather than emit a
    // zero-width, invisible column.
    return columns.map((column, index) => ({
      ...column,
      w: Math.max(1, base + (index < remainder ? 1 : 0)),
    }))
  }

  const remaining = cols - minTotal
  const extra = Math.floor(remaining / count)
  const remainder = remaining % count

  return columns.map((column, index) => ({
    ...column,
    w: minW + extra + (index < remainder ? 1 : 0),
  }))
}

/**
 * @deprecated Loses `groupId`. Use {@link equalizeColumns} with the real columns.
 */
export const equalizeRowColumns = (
  portletIds: string[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] =>
  equalizeColumns(
    portletIds.map((portletId) => ({ portletId, w: 0 })),
    gridSettings
  )

export const adjustRowWidths = (
  columns: RowLayoutColumn[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  if (columns.length === 0) return []

  const { cols, minW } = gridSettings
  const adjusted = columns.map((column) => ({
    ...column,
    w: Math.max(minW, column.w),
  }))

  const total = adjusted.reduce((sum, column) => sum + column.w, 0)
  if (Math.abs(total - cols) < 1e-6) {
    // Absorb float drift into the last column so the row stays exactly `cols`.
    adjusted[adjusted.length - 1].w += cols - total
    return adjusted
  }

  if (total < cols) {
    let remaining = Math.round(cols - total)
    let index = 0
    while (remaining > 0) {
      adjusted[index % adjusted.length].w += 1
      remaining -= 1
      index += 1
    }
    return adjusted
  }

  let overflow = Math.round(total - cols)
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

export const convertPortletsToRows = (
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
      return {
        id: `row-${rowY}`,
        h: rowHeight,
        columns: equalizeColumns(
          rowPortlets.map((p) => ({ portletId: p.id, w: 0 })),
          gridSettings
        ),
      }
    })
}

/**
 * Drop columns whose target no longer exists, clamp row height, re-balance
 * widths. `groups` must be the already-normalized group list - a column
 * referencing a group is kept only when that group survives, so run
 * `normalizeGroups` first.
 */
export const normalizeRows = (
  rows: RowLayout[],
  portlets: PortletConfig[],
  gridSettings: DashboardGridSettings,
  groups: PortletGroup[] = []
): RowLayout[] => {
  const portletIds = new Set(portlets.map((p) => p.id))
  const groupIds = new Set(groups.map((group) => group.id))
  const keepColumn = (column: RowLayoutColumn) =>
    column.groupId ? groupIds.has(column.groupId) : !!column.portletId && portletIds.has(column.portletId)

  return rows
    .map((row) => ({
      ...row,
      h: Math.max(gridSettings.minH, row.h),
      columns: adjustRowWidths(row.columns.filter(keepColumn), gridSettings),
    }))
    .filter((row) => row.columns.length > 0)
}

/**
 * Re-derive every portlet's x/y/w/h from the row layout. Group columns are
 * subdivided via `deriveGroupGeometry`, so grouped children get real grid
 * coordinates too - that is what keeps grid mode, the mobile stack and
 * thumbnails working without any knowledge of groups.
 */
export const convertRowsToPortlets = (
  rows: RowLayout[],
  portlets: PortletConfig[],
  groups: PortletGroup[] = []
): PortletConfig[] => {
  const portletMap = new Map(portlets.map((p) => [p.id, p]))
  const groupMap = new Map(groups.map((group) => [group.id, group]))
  let currentY = 0

  const updated: PortletConfig[] = []
  rows.forEach((row) => {
    const rowH = Math.max(1, Math.round(row.h))
    let currentX = 0
    row.columns.forEach((column) => {
      // Round the column's span at both edges so fractional widths still tile
      // the row exactly, with no gaps or overlaps.
      const x = Math.round(currentX)
      const w = Math.max(1, Math.round(currentX + column.w) - x)

      if (column.groupId) {
        const group = groupMap.get(column.groupId)
        // Advance x even when the group is missing, or every later column in
        // this row lands at the wrong offset.
        if (group) {
          deriveGroupGeometry(group, x, currentY, w, rowH).forEach((rect) => {
            const portlet = portletMap.get(rect.portletId)
            if (!portlet) return
            updated.push({ ...portlet, x: rect.x, y: rect.y, w: rect.w, h: rect.h })
          })
        }
        currentX += column.w
        return
      }

      const portlet = column.portletId ? portletMap.get(column.portletId) : undefined
      if (!portlet) return
      updated.push({
        ...portlet,
        x,
        y: currentY,
        w,
        h: rowH,
      })
      currentX += column.w
    })
    currentY += rowH
  })

  const updatedIds = new Set(updated.map((p) => p.id))
  portlets.forEach((portlet) => {
    if (!updatedIds.has(portlet.id)) {
      updated.push(portlet)
    }
  })

  return updated
}

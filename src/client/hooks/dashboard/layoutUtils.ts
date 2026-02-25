import type { DashboardGridSettings, PortletConfig, RowLayout, RowLayoutColumn } from '../../types'

export const createRowId = () => `row-${Date.now()}`

export const equalizeRowColumns = (
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
      const portletIds = rowPortlets.map((p) => p.id)
      return {
        id: `row-${rowY}`,
        h: rowHeight,
        columns: equalizeRowColumns(portletIds, gridSettings),
      }
    })
}

export const normalizeRows = (
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

export const convertRowsToPortlets = (
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

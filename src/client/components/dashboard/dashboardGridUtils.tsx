/**
 * Shared helpers for the composable dashboard pieces.
 * Extracted verbatim from the former monolithic DashboardGrid so the coordinator,
 * toolbar, and grid surface can all reuse them.
 */

import type { CSSProperties } from 'react'
import type {
  DashboardConfig,
  DashboardGridSettings,
  RowLayoutColumn
} from '../../types.js'

export const DEFAULT_GRID_SETTINGS: DashboardGridSettings = {
  cols: 12,
  rowHeight: 80,
  minW: 2,
  minH: 1
}

export const createRowId = () => `row-${Date.now()}`

export const getGridSettings = (config: DashboardConfig): DashboardGridSettings => ({
  cols: config.grid?.cols ?? DEFAULT_GRID_SETTINGS.cols,
  rowHeight: config.grid?.rowHeight ?? DEFAULT_GRID_SETTINGS.rowHeight,
  minW: config.grid?.minW ?? DEFAULT_GRID_SETTINGS.minW,
  minH: config.grid?.minH ?? DEFAULT_GRID_SETTINGS.minH
})

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
      w: base + (index < remainder ? 1 : 0)
    }))
  }

  const remaining = cols - minTotal
  const extra = Math.floor(remaining / count)
  const remainder = remaining % count

  return portletIds.map((id, index) => ({
    portletId: id,
    w: minW + extra + (index < remainder ? 1 : 0)
  }))
}

export const adjustRowWidths = (
  columns: RowLayoutColumn[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  if (columns.length === 0) return []

  const { cols, minW } = gridSettings
  const adjusted = columns.map(column => ({
    ...column,
    w: Math.max(minW, column.w)
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

/**
 * Finds the nearest scrollable ancestor of an element.
 * Used to detect scroll container for lazy loading IntersectionObserver.
 */
export function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null

  let current = element.parentElement

  while (current) {
    const style = window.getComputedStyle(current)
    const overflowY = style.overflowY
    const overflowX = style.overflowX

    const hasScrollableOverflow =
      overflowY === 'auto' || overflowY === 'scroll' ||
      overflowX === 'auto' || overflowX === 'scroll'

    const hasScrollContent =
      current.scrollHeight > current.clientHeight ||
      current.scrollWidth > current.clientWidth

    if (hasScrollableOverflow && hasScrollContent) {
      return current
    }

    if (current === document.body) break
    current = current.parentElement
  }

  return null // Use viewport
}

/** Inline "Tt" typography icon for Add Text buttons */
export function TextIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <text x="1" y="20" fontSize="20" fontWeight="700" fontFamily="serif">T</text>
      <text x="14" y="20" fontSize="13" fontWeight="600" fontFamily="serif">t</text>
    </svg>
  )
}

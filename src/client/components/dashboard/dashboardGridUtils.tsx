/**
 * Shared helpers for the composable dashboard pieces.
 * Extracted verbatim from the former monolithic DashboardGrid so the coordinator,
 * toolbar, and grid surface can all reuse them.
 */

import type { CSSProperties } from 'react'
import type {
  DashboardConfig,
  DashboardGridSettings
} from '../../types.js'

export const DEFAULT_GRID_SETTINGS: DashboardGridSettings = {
  cols: 12,
  rowHeight: 80,
  minW: 2,
  minH: 1
}

// Row maths lives in hooks/dashboard/layoutUtils.ts; re-exported here so the
// coordinator and the controller/engine share one implementation.
export {
  createRowId,
  equalizeRowColumns,
  equalizeColumns,
  adjustRowWidths,
  adjustInsertIndexForRemovedRow
} from '../../hooks/dashboard/layoutUtils.js'

export const getGridSettings = (config: DashboardConfig): DashboardGridSettings => ({
  cols: config.grid?.cols ?? DEFAULT_GRID_SETTINGS.cols,
  rowHeight: config.grid?.rowHeight ?? DEFAULT_GRID_SETTINGS.rowHeight,
  minW: config.grid?.minW ?? DEFAULT_GRID_SETTINGS.minW,
  minH: config.grid?.minH ?? DEFAULT_GRID_SETTINGS.minH
})

/**
 * Finds the nearest scrollable ancestor of an element.
 * Used to detect scroll container for lazy loading IntersectionObserver.
 */
export function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null

  // Two passes, because content height is not a reliable signal at mount time:
  // this runs from a ref callback, when the dashboard may not have rendered
  // enough content for the scroller to overflow yet. Requiring `scrollHeight >
  // clientHeight` therefore returned null ("use viewport") for hosts that scroll
  // in a div, which silently disabled drag auto-scroll and left the floating
  // toolbar's visibility listener bound to a window that never scrolls.
  //
  // Pass 1 keeps the original, stricter rule so an ancestor that is *actually*
  // scrolling still wins. Pass 2 falls back to the nearest ancestor that merely
  // declares vertical scrolling — the host's stated intent, independent of how
  // much content happens to exist right now.
  let declaredScroller: HTMLElement | null = null
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

    // Remember the nearest vertically-scrollable ancestor as a fallback. Only
    // the vertical axis: a horizontally scrolling wrapper is not the scroller
    // these consumers care about.
    if (!declaredScroller && (overflowY === 'auto' || overflowY === 'scroll')) {
      declaredScroller = current
    }

    if (current === document.body) break
    current = current.parentElement
  }

  return declaredScroller // null = use viewport
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

/**
 * Dashboard grid layout types: structural copies of react-grid-layout's
 * `LayoutItem` and `Layout`. react-grid-layout is an optional peer, so the
 * public types must not import it: with `skipLibCheck: false` an app without it
 * would fail to typecheck. These stay assignable to and from its types (its
 * `constraints` field is optional, and the dashboard does not use it).
 */

/** Resize handle positions (react-grid-layout `ResizeHandleAxis`). */
export type GridResizeHandle = 's' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'

/** One portlet's position in the dashboard grid (react-grid-layout `LayoutItem`). */
export interface GridLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
  resizeHandles?: GridResizeHandle[]
  isBounded?: boolean
  moved?: boolean
}

/** A dashboard grid layout (react-grid-layout `Layout`). */
export type GridLayout = readonly GridLayoutItem[]

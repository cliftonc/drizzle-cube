/**
 * Memoization comparison helpers for DashboardPortletCard. Extracted so the
 * card module focuses on rendering.
 */

import type { HTMLAttributes, ReactNode, ComponentType, CSSProperties } from 'react'
import type { ChartType, DashboardFilter, DashboardLayoutMode, PortletConfig } from '../../types'
import type { ColorPalette } from '../../utils/colorPalettes'

// Shape mirrors DashboardPortletCardProps; kept here to type the comparators.
export interface DashboardPortletCardProps {
  portlet: PortletConfig
  editable: boolean
  layoutMode?: DashboardLayoutMode
  dashboardFilters?: DashboardFilter[]
  configEagerLoad?: boolean
  loadingComponent?: ReactNode
  colorPalette?: ColorPalette
  containerProps?: HTMLAttributes<HTMLDivElement>
  headerProps?: HTMLAttributes<HTMLDivElement>
  setPortletRef: (portletId: string, element: HTMLDivElement | null) => void
  setPortletComponentRef: (portletId: string, element: { refresh: (options?: { bustCache?: boolean }) => void } | null) => void
  callbacks: {
    onToggleFilter: (portletId: string, filterId: string) => void
    onRefresh: (portletId: string, options?: { bustCache?: boolean }) => void
    onDuplicate: (portletId: string) => void
    onEdit: (portlet: PortletConfig) => void
    onDelete: (portletId: string) => void
    onOpenFilterConfig: (portlet: PortletConfig) => void
  }
  icons: {
    RefreshIcon: ComponentType<{ className?: string; style?: CSSProperties }>
    EditIcon: ComponentType<{ className?: string; style?: CSSProperties }>
    DeleteIcon: ComponentType<{ className?: string; style?: CSSProperties }>
    CopyIcon: ComponentType<{ className?: string; style?: CSSProperties }>
    FilterIcon: ComponentType<{ className?: string; style?: CSSProperties }>
  }
}

export type { ChartType }

// Shallow comparison for objects
export function shallowEqualObjects<T extends object>(
  a: T | undefined,
  b: T | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return a === b

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) return false
  }

  return true
}

const SCALAR_KEYS = ['editable', 'layoutMode', 'configEagerLoad'] as const
const REF_KEYS = [
  'portlet', 'dashboardFilters', 'colorPalette', 'loadingComponent', 'callbacks', 'icons',
  'setPortletRef', 'setPortletComponentRef'
] as const

// Custom comparison function to handle containerProps/headerProps object recreation
export function arePropsEqual(
  prevProps: DashboardPortletCardProps,
  nextProps: DashboardPortletCardProps
): boolean {
  // Fast path: if object references are the same, props are equal
  if (prevProps === nextProps) return true

  const prev = prevProps as unknown as Record<string, unknown>
  const next = nextProps as unknown as Record<string, unknown>

  // Check scalar + reference props (all by ===)
  for (const key of [...SCALAR_KEYS, ...REF_KEYS]) {
    if (prev[key] !== next[key]) return false
  }

  // Special handling for containerProps and headerProps - compare properties shallowly
  return (
    shallowEqualObjects(prevProps.containerProps, nextProps.containerProps) &&
    shallowEqualObjects(prevProps.headerProps, nextProps.headerProps)
  )
}

/**
 * Class-name and inline-style builders for DashboardPortletCard's container and
 * header. Extracted to keep the card component flat.
 */

import type { CSSProperties } from 'react'
import type { ChartType, ChartDisplayConfig } from '../../types'

export interface PortletDisplayModes {
  isMarkdownAutoHeight: boolean
  isTransparentContent: boolean
  isTransparent: boolean
  shouldHideHeader: boolean
}

/**
 * Resolve the markdown / transparency / header-visibility display modes for a
 * portlet from its chart type and display config. Extracted to keep the card
 * component flat.
 */
export function resolveDisplayModes(params: {
  renderChartType: ChartType
  renderDisplayConfig?: ChartDisplayConfig
  layoutMode: string
  isEditMode: boolean
  portletTitle?: string
}): PortletDisplayModes {
  const { renderChartType, renderDisplayConfig, layoutMode, isEditMode, portletTitle } = params

  const isMarkdown = renderChartType === 'markdown'
  // isTransparent gated on !isEditMode so chrome is visible for editing
  const markdownAutoHeightRequested = isMarkdown && (renderDisplayConfig?.autoHeight ?? true)
  const isMarkdownAutoHeight = layoutMode !== 'grid' && markdownAutoHeightRequested
  const isTransparentContent = isMarkdown && !!renderDisplayConfig?.transparentBackground
  const isTransparent = isTransparentContent && !isEditMode
  // Hide header when: explicitly set to hide, OR markdown with no title
  const shouldHideHeader = isMarkdown
    ? (renderDisplayConfig?.hideHeader ?? true) || !!renderDisplayConfig?.transparentBackground || !portletTitle
    : (renderDisplayConfig?.hideHeader ?? false)

  return { isMarkdownAutoHeight, isTransparentContent, isTransparent, shouldHideHeader }
}

export function buildContainerClassName(params: {
  isTransparent: boolean
  isMarkdownAutoHeight: boolean
  isInSelectionMode: boolean
  extraClassName?: string
}): string {
  const { isTransparent, isMarkdownAutoHeight, isInSelectionMode, extraClassName } = params
  return [
    isTransparent
      ? 'dc:flex dc:flex-col dc:transition-all'
      : 'bg-dc-surface dc:border dc:rounded-lg dc:flex dc:flex-col dc:transition-all',
    isMarkdownAutoHeight ? '' : 'dc:h-full',
    isInSelectionMode ? 'dc:cursor-pointer dc:relative' : '',
    extraClassName
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildHeaderClassName(isEditMode: boolean, extraClassName?: string): string {
  return [
    'flex items-center justify-between px-3 py-1.5 md:px-4 md:py-1 border-b border-dc-border shrink-0 bg-dc-surface-secondary rounded-t-lg portlet-drag-handle',
    isEditMode ? 'cursor-move' : 'cursor-default',
    extraClassName
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildContainerStyle(params: {
  isTransparent: boolean
  isInSelectionMode: boolean
  hasSelectedFilter: boolean
  containerStyle?: CSSProperties
}): CSSProperties {
  const { isTransparent, isInSelectionMode, hasSelectedFilter, containerStyle } = params
  const selected = isInSelectionMode && hasSelectedFilter

  return {
    boxShadow: isTransparent ? 'none' : 'var(--dc-shadow-sm)',
    borderColor: isTransparent ? 'transparent' : selected ? 'var(--dc-primary)' : 'var(--dc-border)',
    borderWidth: isTransparent ? '0' : selected ? '2px' : '1px',
    backgroundColor: isTransparent
      ? 'transparent'
      : selected
        ? 'rgba(var(--dc-primary-rgb), 0.05)'
        : 'var(--dc-surface)',
    opacity: isInSelectionMode && !hasSelectedFilter ? '0.5' : '1',
    ...containerStyle
  }
}

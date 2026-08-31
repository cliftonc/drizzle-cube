/**
 * Class-name and inline-style builders for DashboardPortletCard's container and
 * header. Extracted to keep the card component flat.
 */

import type { CSSProperties } from 'react'
import type { ChartType, ChartDisplayConfig } from '../../types.js'

/**
 * How much chrome a card draws. Group children are frameless and headerless;
 * section children are frameless but otherwise behave like standalone cards,
 * because the section card around them supplies the only frame.
 */
export type PortletCardVariant = 'standalone' | 'groupChild' | 'sectionChild'

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
  variant?: PortletCardVariant
}): PortletDisplayModes {
  const { renderChartType, renderDisplayConfig, layoutMode, isEditMode, portletTitle, variant } = params

  // A group child fills a flex cell with no intrinsic height, so markdown
  // auto-height (which drops `h-full`) would collapse it to nothing.
  if (variant === 'groupChild') {
    const isMarkdownChild = renderChartType === 'markdown'
    return {
      isMarkdownAutoHeight: false,
      isTransparentContent: isMarkdownChild && !!renderDisplayConfig?.transparentBackground,
      isTransparent: true,
      shouldHideHeader: true
    }
  }

  const isMarkdown = renderChartType === 'markdown'
  // isTransparent gated on !isEditMode so chrome is visible for editing
  const markdownAutoHeightRequested = isMarkdown && (renderDisplayConfig?.autoHeight ?? true)
  const isMarkdownAutoHeight = layoutMode !== 'grid' && markdownAutoHeightRequested
  // Hide header when: explicitly set to hide, OR markdown with no title
  const shouldHideHeader = isMarkdown
    ? (renderDisplayConfig?.hideHeader ?? true) || !!renderDisplayConfig?.transparentBackground || !portletTitle
    : (renderDisplayConfig?.hideHeader ?? false)

  // Inside a section the two transparency flags come apart. The frame always
  // goes - the section card draws it once for the whole band - but the content
  // padding stays, or a `transparentBackground` header (which drops both its
  // own padding and the card's) would sit flush against the section's edge.
  if (variant === 'sectionChild') {
    return {
      isMarkdownAutoHeight,
      isTransparentContent: false,
      isTransparent: true,
      shouldHideHeader
    }
  }

  const isTransparentContent = isMarkdown && !!renderDisplayConfig?.transparentBackground
  const isTransparent = isTransparentContent && !isEditMode

  return { isMarkdownAutoHeight, isTransparentContent, isTransparent, shouldHideHeader }
}

export function buildContainerClassName(params: {
  isTransparent: boolean
  isMarkdownAutoHeight: boolean
  isInSelectionMode: boolean
  extraClassName?: string
  variant?: PortletCardVariant
}): string {
  const { isTransparent, isMarkdownAutoHeight, isInSelectionMode, extraClassName, variant } = params

  if (variant === 'groupChild') {
    return [
      // `group` arms the hover reveal of PortletFloatingActions; `relative`
      // anchors it. No border or background - the group card supplies those.
      'dc-portlet-group-child dc:group dc:relative dc:flex dc:flex-col dc:h-full dc:min-h-0 dc:overflow-hidden',
      isInSelectionMode ? 'dc:cursor-pointer' : '',
      extraClassName
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    // A section child is frameless for the same reason a group child is: the
    // card around it owns the border, background and shadow.
    variant === 'sectionChild' ? 'dc-portlet-section-child' : '',
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

export function buildHeaderClassName(
  isEditMode: boolean,
  extraClassName?: string,
  variant?: PortletCardVariant
): string {
  // Inside a section the header sits mid-card, so a standalone card's grey fill,
  // rounded top corners and underline all read as clutter. The section draws one
  // set of rules *between* portlets instead, so the title needs none of its own.
  const inSection = variant === 'sectionChild'

  return [
    'dc:flex dc:items-center dc:justify-between dc:px-3 dc:md:px-4 dc:shrink-0 portlet-drag-handle',
    // A standalone card's header is a tight bar against its own top edge. In a
    // section the title sits just under a divider with nothing else marking the
    // boundary, so it needs room to breathe.
    inSection
      ? 'dc:py-3 dc:md:py-3'
      : 'dc:py-1.5 dc:md:py-1 dc:border-b border-dc-border bg-dc-surface-secondary dc:rounded-t-lg',
    isEditMode ? 'dc:cursor-move' : 'dc:cursor-default',
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
  variant?: PortletCardVariant
}): CSSProperties {
  const { isTransparent, isInSelectionMode, hasSelectedFilter, containerStyle, variant } = params
  const selected = isInSelectionMode && hasSelectedFilter

  if (variant === 'groupChild') {
    // Borderless, so filter selection is signalled with an inset ring instead.
    return {
      boxShadow: selected ? 'inset 0 0 0 2px var(--dc-primary)' : 'none',
      borderWidth: 0,
      backgroundColor: selected ? 'color-mix(in srgb, var(--dc-primary) 5%, transparent)' : 'transparent',
      opacity: isInSelectionMode && !hasSelectedFilter ? '0.5' : '1',
      ...containerStyle
    }
  }

  if (variant === 'sectionChild') {
    // Borderless like a group child, so filter selection is signalled with an
    // inset ring rather than by recolouring a border that isn't drawn.
    return {
      boxShadow: selected ? 'inset 0 0 0 2px var(--dc-primary)' : 'none',
      borderWidth: 0,
      backgroundColor: selected ? 'color-mix(in srgb, var(--dc-primary) 5%, transparent)' : 'transparent',
      opacity: isInSelectionMode && !hasSelectedFilter ? '0.5' : '1',
      ...containerStyle
    }
  }

  return {
    boxShadow: isTransparent ? 'none' : 'var(--dc-shadow-sm)',
    borderColor: isTransparent ? 'transparent' : selected ? 'var(--dc-primary)' : 'var(--dc-border)',
    borderWidth: isTransparent ? '0' : selected ? '2px' : '1px',
    backgroundColor: isTransparent
      ? 'transparent'
      : selected
        ? 'color-mix(in srgb, var(--dc-primary) 5%, transparent)'
        : 'var(--dc-surface)',
    opacity: isInSelectionMode && !hasSelectedFilter ? '0.5' : '1',
    ...containerStyle
  }
}

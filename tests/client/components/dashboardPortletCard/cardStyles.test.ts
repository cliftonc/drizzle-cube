/**
 * Tests for the DashboardPortletCard class-name / style builders, focused on
 * the `groupChild` variant: a portlet rendered inside a PortletGroupCard is
 * frameless, headerless, and signals filter selection with an inset ring
 * because it has no border to thicken.
 */

import { describe, it, expect } from 'vitest'
import {
  resolveDisplayModes,
  buildContainerClassName,
  buildContainerStyle,
  buildHeaderClassName
} from '../../../../src/client/components/dashboardPortletCard/cardStyles'

describe('resolveDisplayModes', () => {
  describe('groupChild variant', () => {
    it('should always hide the header', () => {
      const modes = resolveDisplayModes({
        renderChartType: 'bar',
        renderDisplayConfig: { hideHeader: false },
        layoutMode: 'rows',
        isEditMode: false,
        portletTitle: 'A titled portlet',
        variant: 'groupChild'
      })

      expect(modes.shouldHideHeader).toBe(true)
    })

    it('should hide the header even for a titled markdown child that asks to show one', () => {
      const modes = resolveDisplayModes({
        renderChartType: 'markdown',
        renderDisplayConfig: { hideHeader: false },
        layoutMode: 'rows',
        isEditMode: true,
        portletTitle: 'Notes',
        variant: 'groupChild'
      })

      expect(modes.shouldHideHeader).toBe(true)
    })

    it('should never use markdown auto-height, even when autoHeight is requested', () => {
      // A group child fills a flex cell with no intrinsic height, so dropping
      // `h-full` for auto-height would collapse it to zero.
      const modes = resolveDisplayModes({
        renderChartType: 'markdown',
        renderDisplayConfig: { autoHeight: true },
        layoutMode: 'rows',
        isEditMode: false,
        portletTitle: 'Notes',
        variant: 'groupChild'
      })

      expect(modes.isMarkdownAutoHeight).toBe(false)
    })

    it('should not auto-height a markdown child that omits autoHeight (default true)', () => {
      const modes = resolveDisplayModes({
        renderChartType: 'markdown',
        layoutMode: 'rows',
        isEditMode: false,
        variant: 'groupChild'
      })

      expect(modes.isMarkdownAutoHeight).toBe(false)
      expect(modes.shouldHideHeader).toBe(true)
    })

    it('should be transparent so the group card supplies the surface', () => {
      const modes = resolveDisplayModes({
        renderChartType: 'bar',
        layoutMode: 'rows',
        isEditMode: false,
        variant: 'groupChild'
      })

      expect(modes.isTransparent).toBe(true)
      expect(modes.isTransparentContent).toBe(false)
    })

    it('should mark transparent content only for markdown children asking for it', () => {
      const markdown = resolveDisplayModes({
        renderChartType: 'markdown',
        renderDisplayConfig: { transparentBackground: true },
        layoutMode: 'rows',
        isEditMode: false,
        variant: 'groupChild'
      })
      const bar = resolveDisplayModes({
        renderChartType: 'bar',
        renderDisplayConfig: { transparentBackground: true },
        layoutMode: 'rows',
        isEditMode: false,
        variant: 'groupChild'
      })

      expect(markdown.isTransparentContent).toBe(true)
      expect(bar.isTransparentContent).toBe(false)
    })
  })

  describe('standalone variant (existing behaviour)', () => {
    it('should auto-height markdown outside grid layout', () => {
      const modes = resolveDisplayModes({
        renderChartType: 'markdown',
        renderDisplayConfig: { autoHeight: true },
        layoutMode: 'rows',
        isEditMode: false,
        portletTitle: 'Notes',
        variant: 'standalone'
      })

      expect(modes.isMarkdownAutoHeight).toBe(true)
    })

    it('should not auto-height markdown in grid layout', () => {
      const modes = resolveDisplayModes({
        renderChartType: 'markdown',
        renderDisplayConfig: { autoHeight: true },
        layoutMode: 'grid',
        isEditMode: false,
        portletTitle: 'Notes'
      })

      expect(modes.isMarkdownAutoHeight).toBe(false)
    })

    it('should show the header for a non-markdown chart by default', () => {
      const modes = resolveDisplayModes({
        renderChartType: 'bar',
        layoutMode: 'rows',
        isEditMode: false,
        portletTitle: 'Sales'
      })

      expect(modes.shouldHideHeader).toBe(false)
      expect(modes.isTransparent).toBe(false)
    })

    it('should keep chrome visible in edit mode even for transparent markdown', () => {
      const modes = resolveDisplayModes({
        renderChartType: 'markdown',
        renderDisplayConfig: { transparentBackground: true },
        layoutMode: 'rows',
        isEditMode: true,
        portletTitle: 'Notes'
      })

      expect(modes.isTransparentContent).toBe(true)
      expect(modes.isTransparent).toBe(false)
    })
  })
})

describe('buildContainerClassName', () => {
  it('should mark a group child and arm the hover group, without a frame', () => {
    const className = buildContainerClassName({
      isTransparent: false,
      isMarkdownAutoHeight: false,
      isInSelectionMode: false,
      variant: 'groupChild'
    })

    expect(className).toContain('dc-portlet-group-child')
    expect(className).toContain('dc:group')
    expect(className).toContain('dc:relative')
    expect(className).not.toContain('dc:border')
    expect(className).not.toContain('dc:rounded-lg')
  })

  it('should stay frameless for a group child even when the flags ask for a frame', () => {
    const className = buildContainerClassName({
      isTransparent: false,
      isMarkdownAutoHeight: true,
      isInSelectionMode: true,
      extraClassName: 'custom-class',
      variant: 'groupChild'
    })

    expect(className).not.toContain('dc:border')
    expect(className).not.toContain('dc:rounded-lg')
    expect(className).toContain('dc:cursor-pointer')
    expect(className).toContain('custom-class')
  })

  it('should keep the standalone frame by default', () => {
    const className = buildContainerClassName({
      isTransparent: false,
      isMarkdownAutoHeight: false,
      isInSelectionMode: false
    })

    expect(className).toContain('bg-dc-surface')
    expect(className).toContain('dc:border')
    expect(className).toContain('dc:rounded-lg')
    expect(className).toContain('dc:h-full')
    expect(className).not.toContain('dc-portlet-group-child')
  })

  it('should drop the standalone frame when transparent and drop h-full when auto-height', () => {
    const className = buildContainerClassName({
      isTransparent: true,
      isMarkdownAutoHeight: true,
      isInSelectionMode: false,
      variant: 'standalone'
    })

    expect(className).not.toContain('dc:border')
    expect(className).not.toContain('bg-dc-surface')
    expect(className).not.toContain('dc:h-full')
  })
})

describe('buildContainerStyle', () => {
  it('should use an inset ring and no border for a selected group child', () => {
    const style = buildContainerStyle({
      isTransparent: false,
      isInSelectionMode: true,
      hasSelectedFilter: true,
      variant: 'groupChild'
    })

    // Borderless by design, so selection has to be drawn inside the box.
    expect(style.boxShadow).toBe('inset 0 0 0 2px var(--dc-primary)')
    expect(style.borderWidth).toBe(0)
    expect(style.backgroundColor).toBe('color-mix(in srgb, var(--dc-primary) 5%, transparent)')
    expect(style.opacity).toBe('1')
  })

  it('should dim an unselected group child in selection mode without any ring', () => {
    const style = buildContainerStyle({
      isTransparent: false,
      isInSelectionMode: true,
      hasSelectedFilter: false,
      variant: 'groupChild'
    })

    expect(style.boxShadow).toBe('none')
    expect(style.borderWidth).toBe(0)
    expect(style.backgroundColor).toBe('transparent')
    expect(style.opacity).toBe('0.5')
  })

  it('should let containerStyle override the group child defaults', () => {
    const style = buildContainerStyle({
      isTransparent: false,
      isInSelectionMode: false,
      hasSelectedFilter: false,
      containerStyle: { backgroundColor: 'red' },
      variant: 'groupChild'
    })

    expect(style.backgroundColor).toBe('red')
    expect(style.borderWidth).toBe(0)
  })

  it('should keep the standalone border and shadow', () => {
    const style = buildContainerStyle({
      isTransparent: false,
      isInSelectionMode: false,
      hasSelectedFilter: false
    })

    expect(style.boxShadow).toBe('var(--dc-shadow-sm)')
    expect(style.borderColor).toBe('var(--dc-border)')
    expect(style.borderWidth).toBe('1px')
    expect(style.backgroundColor).toBe('var(--dc-surface)')
  })

  it('should thicken the standalone border when selected', () => {
    const style = buildContainerStyle({
      isTransparent: false,
      isInSelectionMode: true,
      hasSelectedFilter: true,
      variant: 'standalone'
    })

    expect(style.borderColor).toBe('var(--dc-primary)')
    expect(style.borderWidth).toBe('2px')
    expect(style.boxShadow).toBe('var(--dc-shadow-sm)')
  })
})

describe('buildHeaderClassName', () => {
  it('should show a move cursor in edit mode and a default cursor otherwise', () => {
    expect(buildHeaderClassName(true)).toContain('dc:cursor-move')
    expect(buildHeaderClassName(false)).toContain('dc:cursor-default')
    expect(buildHeaderClassName(false, 'extra')).toContain('extra')
  })
})

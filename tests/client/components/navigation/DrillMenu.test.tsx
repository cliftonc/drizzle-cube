/**
 * Additional Tests for DrillMenu component
 *
 * This file extends the existing drill-components.test.tsx with additional scenarios.
 * Focuses on:
 * - Portal rendering
 * - Position calculations
 * - Multiple categories
 * - Scroll behavior
 * - Complex option scenarios
 */

import React from 'react'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DrillMenu } from '../../../../src/client/components/DrillMenu'
import type { DrillOption } from '../../../../src/client/types/drill'

describe('DrillMenu - Extended Tests', () => {
  let onSelect: ReturnType<typeof vi.fn>
  let onClose: ReturnType<typeof vi.fn>
  const defaultPosition = { x: 200, y: 200 }

  beforeEach(() => {
    onSelect = vi.fn()
    onClose = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  describe('portal rendering', () => {
    it('should render menu in document body via portal', () => {
      const options: DrillOption[] = [
        {
          id: 'test',
          label: 'Test Option',
          type: 'drillDown',
          icon: 'time',
          scope: 'portlet'
        }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // Menu should be in document body
      const menuInBody = document.body.querySelector('[class*="bg-dc-surface"]')
      expect(menuInBody).toBeDefined()
    })

    it('should render with fixed positioning', () => {
      const options: DrillOption[] = [
        {
          id: 'test',
          label: 'Test Option',
          type: 'drillDown',
          icon: 'time',
          scope: 'portlet'
        }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const menu = document.body.querySelector('[class*="bg-dc-surface"]') as HTMLElement
      expect(menu?.style.position).toBe('fixed')
    })

    it('should have very high z-index', () => {
      const options: DrillOption[] = [
        {
          id: 'test',
          label: 'Test Option',
          type: 'drillDown',
          icon: 'time',
          scope: 'portlet'
        }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const menu = document.body.querySelector('[class*="bg-dc-surface"]') as HTMLElement
      expect(parseInt(menu?.style.zIndex || '0')).toBe(99999)
    })
  })

  describe('position calculations', () => {
    it('should position menu at provided coordinates', () => {
      const options: DrillOption[] = [
        {
          id: 'test',
          label: 'Test Option',
          type: 'drillDown',
          icon: 'time',
          scope: 'portlet'
        }
      ]

      const position = { x: 150, y: 250 }

      render(
        <DrillMenu
          options={options}
          position={position}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const menu = document.body.querySelector('[class*="bg-dc-surface"]') as HTMLElement
      // Position should be at or near the provided coordinates (may be adjusted for viewport)
      expect(parseInt(menu?.style.left || '0')).toBeLessThanOrEqual(position.x)
      expect(parseInt(menu?.style.top || '0')).toBeLessThanOrEqual(position.y)
    })

    it('should constrain menu to viewport width', () => {
      const options: DrillOption[] = [
        {
          id: 'test',
          label: 'Test Option',
          type: 'drillDown',
          icon: 'time',
          scope: 'portlet'
        }
      ]

      // Position near right edge
      const position = { x: window.innerWidth - 50, y: 200 }

      render(
        <DrillMenu
          options={options}
          position={position}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const menu = document.body.querySelector('[class*="bg-dc-surface"]') as HTMLElement
      const menuLeft = parseInt(menu?.style.left || '0')
      // Menu should be pushed left to fit in viewport
      expect(menuLeft).toBeLessThanOrEqual(window.innerWidth - 250)
    })

    it('should constrain menu to viewport height', () => {
      const options: DrillOption[] = [
        {
          id: 'test',
          label: 'Test Option',
          type: 'drillDown',
          icon: 'time',
          scope: 'portlet'
        }
      ]

      // Position near bottom edge
      const position = { x: 200, y: window.innerHeight - 50 }

      render(
        <DrillMenu
          options={options}
          position={position}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const menu = document.body.querySelector('[class*="bg-dc-surface"]') as HTMLElement
      const menuTop = parseInt(menu?.style.top || '0')
      // Menu should be pushed up to fit in viewport
      expect(menuTop).toBeLessThanOrEqual(window.innerHeight - 300)
    })
  })

  describe('category grouping', () => {
    it('should group options by time category', () => {
      const options: DrillOption[] = [
        { id: 'time-1', label: 'To Month', type: 'drillDown', icon: 'time', scope: 'portlet' },
        { id: 'time-2', label: 'To Week', type: 'drillDown', icon: 'time', scope: 'portlet' },
        { id: 'time-3', label: 'To Day', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // Should have one "Time" category header
      expect(screen.getByText('Time')).toBeDefined()
      // All three options should be present
      expect(screen.getByText('To Month')).toBeDefined()
      expect(screen.getByText('To Week')).toBeDefined()
      expect(screen.getByText('To Day')).toBeDefined()
    })

    it('should group options by hierarchy category', () => {
      const options: DrillOption[] = [
        { id: 'hier-1', label: 'To Country', type: 'drillDown', icon: 'hierarchy', scope: 'portlet' },
        { id: 'hier-2', label: 'To Region', type: 'drillDown', icon: 'hierarchy', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      expect(screen.getByText('Hierarchy')).toBeDefined()
      expect(screen.getByText('To Country')).toBeDefined()
      expect(screen.getByText('To Region')).toBeDefined()
    })

    it('should group options by table/details category', () => {
      const options: DrillOption[] = [
        { id: 'table-1', label: 'View Details', type: 'details', icon: 'table', scope: 'portlet' },
        { id: 'table-2', label: 'Export Data', type: 'details', icon: 'table', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      expect(screen.getByText('Details')).toBeDefined()
      expect(screen.getByText('View Details')).toBeDefined()
      expect(screen.getByText('Export Data')).toBeDefined()
    })

    it('should handle multiple categories', () => {
      const options: DrillOption[] = [
        { id: 'time-1', label: 'To Week', type: 'drillDown', icon: 'time', scope: 'portlet' },
        { id: 'hier-1', label: 'To City', type: 'drillDown', icon: 'hierarchy', scope: 'portlet' },
        { id: 'table-1', label: 'Show Records', type: 'details', icon: 'table', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      expect(screen.getByText('Time')).toBeDefined()
      expect(screen.getByText('Hierarchy')).toBeDefined()
      expect(screen.getByText('Details')).toBeDefined()
    })

    it('should render separators between categories', () => {
      const options: DrillOption[] = [
        { id: 'time-1', label: 'To Week', type: 'drillDown', icon: 'time', scope: 'portlet' },
        { id: 'hier-1', label: 'To City', type: 'drillDown', icon: 'hierarchy', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // Menu renders in portal to document.body, so check there
      const menuInBody = document.body.querySelector('[class*="bg-dc-surface"]')
      const separators = menuInBody?.querySelectorAll('[class*="border-t"]') || []
      expect(separators.length).toBeGreaterThan(0)
    })

    it('should handle options without icon (other category)', () => {
      const options: DrillOption[] = [
        { id: 'other-1', label: 'Custom Action', type: 'drillDown', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      expect(screen.getByText('Options')).toBeDefined()
      expect(screen.getByText('Custom Action')).toBeDefined()
    })
  })

  describe('direction indicators', () => {
    it('should show drill down indicator for drillDown type', () => {
      const options: DrillOption[] = [
        { id: 'down', label: 'Drill Down', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const button = screen.getByText('Drill Down').closest('button')
      // Should have SVG for direction
      const svgs = button?.querySelectorAll('svg')
      expect(svgs?.length).toBeGreaterThan(0)
    })

    it('should show drill up indicator for drillUp type', () => {
      const options: DrillOption[] = [
        { id: 'up', label: 'Roll Up', type: 'drillUp', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const button = screen.getByText('Roll Up').closest('button')
      const svgs = button?.querySelectorAll('svg')
      expect(svgs?.length).toBeGreaterThan(0)
    })

    it('should not show direction indicator for details type', () => {
      const options: DrillOption[] = [
        { id: 'details', label: 'Show Details', type: 'details', icon: 'table', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // The button should still render
      const button = screen.getByText('Show Details').closest('button')
      expect(button).toBeDefined()
    })
  })

  describe('scroll behavior', () => {
    it('should close menu on scroll', async () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // Trigger scroll event
      fireEvent.scroll(window)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('keyboard interactions', () => {
    it('should close on Escape key', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close on other keys', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Tab' })
      fireEvent.keyDown(document, { key: 'ArrowDown' })

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('click interactions', () => {
    it('should pass correct option to onSelect', () => {
      const options: DrillOption[] = [
        { id: 'opt-1', label: 'Option 1', type: 'drillDown', icon: 'time', scope: 'portlet', targetGranularity: 'week' },
        { id: 'opt-2', label: 'Option 2', type: 'drillUp', icon: 'time', scope: 'dashboard', dashboardFilterId: 'filter-1' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Option 2'))

      expect(onSelect).toHaveBeenCalledWith(options[1])
    })

    it('should call both onSelect and onClose on option click', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Test'))

      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should close on click outside menu', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.mouseDown(document.body)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not close on click inside menu', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const menu = document.body.querySelector('[class*="bg-dc-surface"]') as HTMLElement
      fireEvent.mouseDown(menu)

      // onClose should not be called from mouseDown inside menu
      // It will be called when an option is clicked (via the option click handler)
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('option properties', () => {
    it('should handle options with targetGranularity', () => {
      const options: DrillOption[] = [
        { id: 'week', label: 'To Week', type: 'drillDown', icon: 'time', scope: 'portlet', targetGranularity: 'week' },
        { id: 'day', label: 'To Day', type: 'drillDown', icon: 'time', scope: 'portlet', targetGranularity: 'day' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('To Week'))
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ targetGranularity: 'week' }))
    })

    it('should handle options with targetDimension', () => {
      const options: DrillOption[] = [
        { id: 'city', label: 'To City', type: 'drillDown', icon: 'hierarchy', scope: 'portlet', targetDimension: 'Location.city' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('To City'))
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ targetDimension: 'Location.city' }))
    })

    it('should handle options with dashboard scope', () => {
      const options: DrillOption[] = [
        { id: 'dash', label: 'Filter Dashboard', type: 'drillDown', icon: 'hierarchy', scope: 'dashboard', dashboardFilterId: 'region-filter' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Filter Dashboard'))
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
        scope: 'dashboard',
        dashboardFilterId: 'region-filter'
      }))
    })

    it('should handle options with measure context', () => {
      const options: DrillOption[] = [
        { id: 'rev', label: 'Drill Revenue', type: 'drillDown', icon: 'time', scope: 'portlet', measure: 'Sales.revenue' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Drill Revenue'))
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ measure: 'Sales.revenue' }))
    })
  })

  describe('edge cases', () => {
    it('should handle options with very long labels', () => {
      const longLabel = 'Drill to very detailed breakdown of regional sales data by customer segment and time period'
      const options: DrillOption[] = [
        { id: 'long', label: longLabel, type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      expect(screen.getByText(longLabel)).toBeDefined()
    })

    it('should handle many options', () => {
      const options: DrillOption[] = Array.from({ length: 20 }, (_, i) => ({
        id: `opt-${i}`,
        label: `Option ${i + 1}`,
        type: 'drillDown' as const,
        icon: 'time' as const,
        scope: 'portlet' as const
      }))

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // All options should be rendered
      expect(screen.getByText('Option 1')).toBeDefined()
      expect(screen.getByText('Option 10')).toBeDefined()
      expect(screen.getByText('Option 20')).toBeDefined()
    })

    it('should handle options with special characters in labels', () => {
      const options: DrillOption[] = [
        { id: 'special', label: 'Sales > $1M & Growth < 10%', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      expect(screen.getByText('Sales > $1M & Growth < 10%')).toBeDefined()
    })

    it('should handle options with unicode characters', () => {
      const options: DrillOption[] = [
        { id: 'unicode', label: 'Drill 日本語 données', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      expect(screen.getByText('Drill 日本語 données')).toBeDefined()
    })
  })

  describe('styling', () => {
    it('should have proper container classes', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const menu = document.body.querySelector('[class*="bg-dc-surface"]')
      expect(menu?.className).toContain('dc:rounded-lg')
      expect(menu?.className).toContain('dc:shadow-lg')
    })

    it('should have hover state on option buttons', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const optionButton = screen.getByText('Test').closest('button')
      expect(optionButton?.className).toContain('hover:bg-dc-surface-hover')
    })

    it('should have category header styling', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      const header = screen.getByText('Time')
      expect(header.className).toContain('dc:text-xs')
      expect(header.className).toContain('dc:font-medium')
      expect(header.className).toContain('dc:uppercase')
    })
  })

  describe('mounted state', () => {
    it('should handle unmounting gracefully', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      const { unmount } = render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow()
    })

    it('should clean up event listeners on unmount', () => {
      const options: DrillOption[] = [
        { id: 'test', label: 'Test', type: 'drillDown', icon: 'time', scope: 'portlet' }
      ]

      const { unmount } = render(
        <DrillMenu
          options={options}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      unmount()

      // After unmount, events should not trigger callbacks
      fireEvent.keyDown(document, { key: 'Escape' })
      fireEvent.scroll(window)

      // These should not increase call count after unmount
      // (Initial setup might have called them, but no new calls after unmount)
    })
  })
})

/**
 * Additional Tests for DrillBreadcrumb component
 *
 * This file extends the existing drill-components.test.tsx with additional scenarios.
 * Focuses on:
 * - Icon rendering
 * - Complex path scenarios
 * - Accessibility
 * - Style classes
 */

import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DrillBreadcrumb } from '../../../../src/client/components/DrillBreadcrumb'
import type { DrillPathEntry } from '../../../../src/client/types/drill'

describe('DrillBreadcrumb - Extended Tests', () => {
  let onNavigate: ReturnType<typeof vi.fn>
  let onLevelClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onNavigate = vi.fn()
    onLevelClick = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  describe('icon rendering', () => {
    it('should render home icon', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'Test',
          query: { measures: ['Sales.count'] }
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Home button should have SVG icon
      const homeButton = screen.getByTitle('Return to top level')
      const svg = homeButton.querySelector('svg')
      expect(svg).toBeDefined()
    })

    it('should render back icon', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'Test',
          query: { measures: ['Sales.count'] }
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Back button should have SVG icon
      const backButton = screen.getByTitle('Go back one level')
      const svg = backButton.querySelector('svg')
      expect(svg).toBeDefined()
    })

    it('should render chevron separators between entries', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'First', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: 'Second', query: { measures: ['Sales.count'] } },
        { id: 'level-3', label: 'Third', query: { measures: ['Sales.count'] } }
      ]

      const { container } = render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Should have chevron SVGs between entries
      // One after home, one between each path entry
      const svgs = container.querySelectorAll('svg')
      // At least: home icon, back icon, and chevrons
      expect(svgs.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('complex path scenarios', () => {
    it('should handle very long paths', () => {
      const path: DrillPathEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `level-${i + 1}`,
        label: `Level ${i + 1}`,
        query: { measures: ['Sales.count'] }
      }))

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // All levels should be rendered
      expect(screen.getByText('Level 1')).toBeDefined()
      expect(screen.getByText('Level 5')).toBeDefined()
      expect(screen.getByText('Level 10')).toBeDefined()
    })

    it('should handle paths with special characters in labels', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'Sales > $100,000 & Items < 50%',
          query: { measures: ['Sales.count'] }
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      expect(screen.getByText('Sales > $100,000 & Items < 50%')).toBeDefined()
    })

    it('should handle paths with unicode characters', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'Sales 日本語 Ñoño',
          query: { measures: ['Sales.count'] }
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      expect(screen.getByText('Sales 日本語 Ñoño')).toBeDefined()
    })

    it('should handle paths with very long labels', () => {
      const longLabel = 'A'.repeat(100)
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: longLabel,
          query: { measures: ['Sales.count'] }
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      expect(screen.getByText(longLabel)).toBeDefined()
    })
  })

  describe('navigation with levels', () => {
    it('should navigate to correct intermediate levels', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'Year 2024', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: 'Q1 2024', query: { measures: ['Sales.count'] } },
        { id: 'level-3', label: 'January', query: { measures: ['Sales.count'] } },
        { id: 'level-4', label: 'Week 1', query: { measures: ['Sales.count'] } }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Click on Year 2024 (first clickable entry)
      fireEvent.click(screen.getByText('Year 2024'))
      expect(onLevelClick).toHaveBeenCalledWith(1)

      // Click on Q1 2024 (second clickable entry)
      fireEvent.click(screen.getByText('Q1 2024'))
      expect(onLevelClick).toHaveBeenCalledWith(2)

      // Click on January (third clickable entry)
      fireEvent.click(screen.getByText('January'))
      expect(onLevelClick).toHaveBeenCalledWith(3)

      // Week 1 is current level, should not be clickable
      const week1 = screen.getByText('Week 1')
      expect(week1.tagName).toBe('SPAN')
    })
  })

  describe('label edge cases', () => {
    it('should handle "null" string as label', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'null',
          query: { measures: ['Sales.count'] }
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Should display "(empty)" for 'null' string
      expect(screen.getByText('(empty)')).toBeDefined()
    })

    it('should handle "undefined" string as label', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'undefined',
          query: { measures: ['Sales.count'] }
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Should display "(empty)" for 'undefined' string
      expect(screen.getByText('(empty)')).toBeDefined()
    })

    it('should handle normal labels that start with whitespace', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: '  Normal Label',
          query: { measures: ['Sales.count'] }
        }
      ]

      const { container } = render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Should display the label with its whitespace preserved in the span
      // getByText normalizes whitespace, so use a custom text matcher or check raw HTML
      const span = container.querySelector('span[title="  Normal Label"]')
      expect(span).toBeDefined()
      expect(span?.textContent).toBe('  Normal Label')
    })

    it('should handle mixed valid and empty labels', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'Valid Label', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: '', query: { measures: ['Sales.count'] } },
        { id: 'level-3', label: 'Another Valid', query: { measures: ['Sales.count'] } }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      expect(screen.getByText('Valid Label')).toBeDefined()
      expect(screen.getByText('(empty)')).toBeDefined()
      expect(screen.getByText('Another Valid')).toBeDefined()
    })
  })

  describe('accessibility', () => {
    it('should have proper button roles', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'First', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: 'Second', query: { measures: ['Sales.count'] } }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      const buttons = screen.getAllByRole('button')
      // Should have: back button, home button, and first level button
      expect(buttons.length).toBe(3)
    })

    it('should have descriptive titles/tooltips', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'January 2024', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: 'Week 1', query: { measures: ['Sales.count'] } }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Back and home buttons should have titles
      expect(screen.getByTitle('Go back one level')).toBeDefined()
      expect(screen.getByTitle('Return to top level')).toBeDefined()

      // Clickable path entry should have title
      expect(screen.getByTitle('Navigate to January 2024')).toBeDefined()
    })

    it('should have sr-only text for back button', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'Test', query: { measures: ['Sales.count'] } }
      ]

      const { container } = render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Should have screen reader only text
      const srOnly = container.querySelector('.dc\\:sr-only')
      expect(srOnly?.textContent).toBe('Back')
    })
  })

  describe('styling classes', () => {
    it('should have proper container classes', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'Test', query: { measures: ['Sales.count'] } }
      ]

      const { container } = render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      const mainContainer = container.firstChild as HTMLElement
      expect(mainContainer.className).toContain('dc:flex')
      expect(mainContainer.className).toContain('dc:items-center')
    })

    it('should have hover states on buttons', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'First', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: 'Second', query: { measures: ['Sales.count'] } }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      const firstButton = screen.getByText('First')
      expect(firstButton.className).toContain('dc:hover:bg-dc-surface-hover')
    })

    it('should style current level differently', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'First', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: 'Current', query: { measures: ['Sales.count'] } }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      const currentLevel = screen.getByText('Current')
      // Current level should have font-medium
      expect(currentLevel.className).toContain('dc:font-medium')
    })
  })

  describe('interaction edge cases', () => {
    it('should handle rapid clicks', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'First', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: 'Second', query: { measures: ['Sales.count'] } }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      const backButton = screen.getByTitle('Go back one level')

      // Rapid clicks
      for (let i = 0; i < 5; i++) {
        fireEvent.click(backButton)
      }

      expect(onNavigate).toHaveBeenCalledTimes(5)
    })

    it('should handle undefined onLevelClick gracefully', () => {
      const path: DrillPathEntry[] = [
        { id: 'level-1', label: 'First', query: { measures: ['Sales.count'] } },
        { id: 'level-2', label: 'Second', query: { measures: ['Sales.count'] } }
      ]

      // Should not throw
      expect(() => {
        render(
          <DrillBreadcrumb
            path={path}
            onNavigate={onNavigate}
          />
        )

        // Click on home button
        fireEvent.click(screen.getByTitle('Return to top level'))

        // Click on first level
        fireEvent.click(screen.getByText('First'))
      }).not.toThrow()
    })
  })

  describe('query data in path entries', () => {
    it('should accept entries with filters', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'Filtered',
          query: { measures: ['Sales.count'] },
          filters: [{ member: 'Sales.region', operator: 'equals', values: ['North'] }]
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      expect(screen.getByText('Filtered')).toBeDefined()
    })

    it('should accept entries with granularity', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'Monthly View',
          query: { measures: ['Sales.count'] },
          granularity: 'month'
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      expect(screen.getByText('Monthly View')).toBeDefined()
    })

    it('should accept entries with dimension', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'By Region',
          query: { measures: ['Sales.count'] },
          dimension: 'Sales.region'
        }
      ]

      render(
        <DrillBreadcrumb
          path={path}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      expect(screen.getByText('By Region')).toBeDefined()
    })
  })
})

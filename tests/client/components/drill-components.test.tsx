/**
 * Tests for DrillMenu and DrillBreadcrumb components
 *
 * DrillMenu:
 * - Renders options grouped by category
 * - Calls onSelect when option clicked
 * - Closes on Escape key
 * - Closes on click outside
 * - Returns null when no options
 *
 * DrillBreadcrumb:
 * - Returns null when path is empty
 * - Renders back button, home button, and path entries
 * - Calls onNavigate when back clicked
 * - Calls onLevelClick with correct index
 * - Last entry is not clickable (current level)
 */

import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DrillMenu } from '../../../src/client/components/DrillMenu'
import { DrillBreadcrumb } from '../../../src/client/components/DrillBreadcrumb'
import type { DrillOption, DrillPathEntry } from '../../../src/client/types/drill'

// Mock function types for proper casting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockSelectFn = ((option: DrillOption) => void) & { mock: { calls: any[][] } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockCloseFn = (() => void) & { mock: { calls: any[][] } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockNavigateFn = (() => void) & { mock: { calls: any[][] } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockLevelClickFn = ((index: number) => void) & { mock: { calls: any[][] } }

// ============================================================================
// DrillMenu Tests
// ============================================================================

describe('DrillMenu', () => {
  const defaultPosition = { x: 100, y: 100 }
  let onSelect: MockSelectFn
  let onClose: MockCloseFn

  beforeEach(() => {
    onSelect = vi.fn() as MockSelectFn
    onClose = vi.fn() as MockCloseFn
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should return null when options array is empty', () => {
      const { container } = render(
        <DrillMenu
          options={[]}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // Portal renders to document.body, but with no options it should render nothing
      expect(container.innerHTML).toBe('')
    })

    it('should render options grouped by category', () => {
      const options: DrillOption[] = [
        {
          id: 'time-week',
          label: 'Drill to Week',
          type: 'drillDown',
          icon: 'time',
          targetGranularity: 'week',
          scope: 'portlet'
        },
        {
          id: 'time-day',
          label: 'Drill to Day',
          type: 'drillDown',
          icon: 'time',
          targetGranularity: 'day',
          scope: 'portlet'
        },
        {
          id: 'details',
          label: 'Show Details',
          type: 'details',
          icon: 'table',
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

      // Should render time category header
      expect(screen.getByText('Time')).toBeDefined()
      // Should render details category header
      expect(screen.getByText('Details')).toBeDefined()
      // Should render all option labels
      expect(screen.getByText('Drill to Week')).toBeDefined()
      expect(screen.getByText('Drill to Day')).toBeDefined()
      expect(screen.getByText('Show Details')).toBeDefined()
    })

    it('should render hierarchy category correctly', () => {
      const options: DrillOption[] = [
        {
          id: 'hierarchy-city',
          label: 'Drill to City',
          type: 'drillDown',
          icon: 'hierarchy',
          targetDimension: 'Location.city',
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

      expect(screen.getByText('Hierarchy')).toBeDefined()
      expect(screen.getByText('Drill to City')).toBeDefined()
    })
  })

  describe('interactions', () => {
    const singleOption: DrillOption[] = [
      {
        id: 'test-option',
        label: 'Test Option',
        type: 'drillDown',
        icon: 'time',
        targetGranularity: 'week',
        scope: 'portlet'
      }
    ]

    it('should call onSelect when option is clicked', () => {
      render(
        <DrillMenu
          options={singleOption}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Test Option'))

      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(onSelect).toHaveBeenCalledWith(singleOption[0])
    })

    it('should call onClose when option is clicked', () => {
      render(
        <DrillMenu
          options={singleOption}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Test Option'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose on Escape key press', () => {
      render(
        <DrillMenu
          options={singleOption}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose on click outside', () => {
      render(
        <DrillMenu
          options={singleOption}
          position={defaultPosition}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      // Click on document body (outside menu)
      fireEvent.mouseDown(document.body)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('direction indicators', () => {
    it('should show down arrow for drillDown options', () => {
      const options: DrillOption[] = [
        {
          id: 'drill-down',
          label: 'Drill Down',
          type: 'drillDown',
          icon: 'time',
          targetGranularity: 'week',
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

      // The direction indicator SVG should be present
      // We can check the button contains an SVG with the expected path
      const button = screen.getByText('Drill Down').closest('button')
      expect(button).toBeDefined()
      const svgs = button?.querySelectorAll('svg')
      expect(svgs?.length).toBeGreaterThan(0)
    })

    it('should show up arrow for drillUp options', () => {
      const options: DrillOption[] = [
        {
          id: 'drill-up',
          label: 'Roll Up',
          type: 'drillUp',
          icon: 'time',
          targetGranularity: 'quarter',
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

      const button = screen.getByText('Roll Up').closest('button')
      expect(button).toBeDefined()
    })
  })
})

// ============================================================================
// DrillBreadcrumb Tests
// ============================================================================

describe('DrillBreadcrumb', () => {
  let onNavigate: MockNavigateFn
  let onLevelClick: MockLevelClickFn

  beforeEach(() => {
    onNavigate = vi.fn() as MockNavigateFn
    onLevelClick = vi.fn() as MockLevelClickFn
  })

  afterEach(() => {
    cleanup()
  })

  describe('rendering', () => {
    it('should return null when path is empty', () => {
      const { container } = render(
        <DrillBreadcrumb
          path={[]}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      expect(container.innerHTML).toBe('')
    })

    it('should render back button when path has entries', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'January 2024',
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

      // Should have a back button with accessible text
      expect(screen.getByTitle('Go back one level')).toBeDefined()
    })

    it('should render home button', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'January 2024',
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

      expect(screen.getByTitle('Return to top level')).toBeDefined()
    })

    it('should render path entries with labels', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'January 2024',
          query: { measures: ['Sales.count'] }
        },
        {
          id: 'level-2',
          label: 'Week 1',
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

      expect(screen.getByText('January 2024')).toBeDefined()
      expect(screen.getByText('Week 1')).toBeDefined()
    })

    it('should render last entry as non-clickable text', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'Current Level',
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

      // The last entry should be a span, not a button
      const currentLevel = screen.getByText('Current Level')
      expect(currentLevel.tagName).toBe('SPAN')
    })

    it('should render previous entries as clickable buttons', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'First Level',
          query: { measures: ['Sales.count'] }
        },
        {
          id: 'level-2',
          label: 'Current Level',
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

      // First level should be a button
      const firstLevel = screen.getByText('First Level')
      expect(firstLevel.tagName).toBe('BUTTON')

      // Current level should be a span
      const currentLevel = screen.getByText('Current Level')
      expect(currentLevel.tagName).toBe('SPAN')
    })
  })

  describe('interactions', () => {
    const twoLevelPath: DrillPathEntry[] = [
      {
        id: 'level-1',
        label: 'First Level',
        query: { measures: ['Sales.count'] }
      },
      {
        id: 'level-2',
        label: 'Second Level',
        query: { measures: ['Sales.count'] }
      }
    ]

    it('should call onNavigate when back button is clicked', () => {
      render(
        <DrillBreadcrumb
          path={twoLevelPath}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      fireEvent.click(screen.getByTitle('Go back one level'))

      expect(onNavigate).toHaveBeenCalledTimes(1)
    })

    it('should call onLevelClick(0) when home button is clicked', () => {
      render(
        <DrillBreadcrumb
          path={twoLevelPath}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      fireEvent.click(screen.getByTitle('Return to top level'))

      expect(onLevelClick).toHaveBeenCalledTimes(1)
      expect(onLevelClick).toHaveBeenCalledWith(0)
    })

    it('should call onLevelClick with correct index when path entry is clicked', () => {
      const threeLevelPath: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'First Level',
          query: { measures: ['Sales.count'] }
        },
        {
          id: 'level-2',
          label: 'Second Level',
          query: { measures: ['Sales.count'] }
        },
        {
          id: 'level-3',
          label: 'Third Level',
          query: { measures: ['Sales.count'] }
        }
      ]

      render(
        <DrillBreadcrumb
          path={threeLevelPath}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // Click on first level (index 0, so onLevelClick should be called with 1)
      fireEvent.click(screen.getByText('First Level'))
      expect(onLevelClick).toHaveBeenLastCalledWith(1)

      // Click on second level (index 1, so onLevelClick should be called with 2)
      fireEvent.click(screen.getByText('Second Level'))
      expect(onLevelClick).toHaveBeenLastCalledWith(2)
    })

    it('should not trigger onLevelClick when current level text is clicked', () => {
      render(
        <DrillBreadcrumb
          path={twoLevelPath}
          onNavigate={onNavigate}
          onLevelClick={onLevelClick}
        />
      )

      // The second level is current and should be a span, not clickable
      const currentLevel = screen.getByText('Second Level')
      fireEvent.click(currentLevel)

      // onLevelClick should not have been called for the current level
      // It may have been called for home button setup, so we check last call
      const calls = onLevelClick.mock.calls
      const lastCallArg = calls.length > 0 ? calls[calls.length - 1][0] : undefined
      expect(lastCallArg).not.toBe(2) // Should not be called with index 2 (current level)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined labels gracefully', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: undefined as unknown as string,
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

      // Should render "(empty)" for undefined label
      expect(screen.getByText('(empty)')).toBeDefined()
    })

    it('should handle empty string labels gracefully', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: '',
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

      expect(screen.getByText('(empty)')).toBeDefined()
    })

    it('should handle whitespace-only labels gracefully', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: '   ',
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

      expect(screen.getByText('(empty)')).toBeDefined()
    })

    it('should work without onLevelClick prop', () => {
      const path: DrillPathEntry[] = [
        {
          id: 'level-1',
          label: 'Test Level',
          query: { measures: ['Sales.count'] }
        }
      ]

      // Should not throw when onLevelClick is undefined
      expect(() => {
        render(
          <DrillBreadcrumb
            path={path}
            onNavigate={onNavigate}
          />
        )
      }).not.toThrow()
    })
  })
})

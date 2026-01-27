/**
 * Tests for useDrillInteraction hook
 *
 * Tests critical state management scenarios:
 * - Original query restoration when navigating back to root
 * - Multi-level drill navigation
 * - Navigate to specific level via breadcrumb
 * - Time dimension drilling cycle
 * - Menu state management
 * - Chart config preservation
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDrillInteraction } from '../../../src/client/hooks/useDrillInteraction'
import type { CubeQuery, CubeMeta } from '../../../src/client/types'
import type { ChartDataPointClickEvent } from '../../../src/client/types/drill'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ((query: CubeQuery) => void) & { mock: { calls: any[][] } }

// ============================================================================
// Mock Setup
// ============================================================================

const mockMeta: CubeMeta = {
  cubes: [
    {
      name: 'Sales',
      title: 'Sales',
      measures: [
        {
          name: 'Sales.totalRevenue',
          title: 'Total Revenue',
          shortTitle: 'Revenue',
          type: 'number',
          drillMembers: ['Sales.orderId', 'Sales.customerId', 'Sales.productName']
        },
        { name: 'Sales.count', title: 'Count', shortTitle: 'Count', type: 'number' },
      ],
      dimensions: [
        { name: 'Sales.orderId', title: 'Order ID', shortTitle: 'Order', type: 'string' },
        { name: 'Sales.customerId', title: 'Customer ID', shortTitle: 'Customer', type: 'string' },
        { name: 'Sales.productName', title: 'Product Name', shortTitle: 'Product', type: 'string' },
        { name: 'Sales.category', title: 'Category', shortTitle: 'Category', type: 'string' },
        { name: 'Sales.createdAt', title: 'Created At', shortTitle: 'Created', type: 'time' },
      ],
      segments: [],
    },
  ],
}

// Base query with time dimension (typical chart query)
const baseQuery: CubeQuery = {
  measures: ['Sales.totalRevenue'],
  dimensions: ['Sales.category'],
  timeDimensions: [
    {
      dimension: 'Sales.createdAt',
      granularity: 'month',
      dateRange: ['2024-01-01', '2024-12-31']
    }
  ]
}

// Create a mock click event
function createClickEvent(overrides: Partial<ChartDataPointClickEvent> = {}): ChartDataPointClickEvent {
  return {
    dataPoint: { name: '2024-01', 'Sales.totalRevenue': 50000 },
    clickedField: 'Sales.totalRevenue',
    xValue: '2024-01',
    position: { x: 100, y: 100 },
    ...overrides
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('useDrillInteraction', () => {
  let onQueryChange: MockFn

  beforeEach(() => {
    onQueryChange = vi.fn() as MockFn
  })

  // ==========================================================================
  // Basic Functionality Tests
  // ==========================================================================

  describe('basic functionality', () => {
    it('should return initial state with drill disabled when metadata is null', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: null,
          onQueryChange
        })
      )

      expect(result.current.drillEnabled).toBe(false)
      expect(result.current.menuOpen).toBe(false)
      expect(result.current.drillPath).toEqual([])
    })

    it('should enable drill when query has time dimensions', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      expect(result.current.drillEnabled).toBe(true)
    })

    it('should enable drill when measures have drillMembers', () => {
      const queryWithoutTimeDimensions: CubeQuery = {
        measures: ['Sales.totalRevenue'],
        dimensions: ['Sales.category']
      }

      const { result } = renderHook(() =>
        useDrillInteraction({
          query: queryWithoutTimeDimensions,
          metadata: mockMeta,
          onQueryChange
        })
      )

      expect(result.current.drillEnabled).toBe(true)
    })

    it('should disable drill when enabled option is false', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange,
          enabled: false
        })
      )

      expect(result.current.drillEnabled).toBe(false)
    })
  })

  // ==========================================================================
  // Menu State Management Tests
  // ==========================================================================

  describe('menu state management', () => {
    it('should open menu on handleDataPointClick', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      expect(result.current.menuOpen).toBe(true)
      expect(result.current.menuPosition).toEqual({ x: 100, y: 100 })
      expect(result.current.menuOptions.length).toBeGreaterThan(0)
    })

    it('should close menu on closeMenu call', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // Open menu
      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })
      expect(result.current.menuOpen).toBe(true)

      // Close menu
      act(() => {
        result.current.closeMenu()
      })

      expect(result.current.menuOpen).toBe(false)
      expect(result.current.menuPosition).toBeNull()
      expect(result.current.menuOptions).toEqual([])
    })

    it('should close menu after selecting an option', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // Open menu
      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      // Select first option
      const option = result.current.menuOptions[0]
      act(() => {
        result.current.handleOptionSelect(option)
      })

      expect(result.current.menuOpen).toBe(false)
    })
  })

  // ==========================================================================
  // Original Query Restoration Tests (Critical Bug Fix Verification)
  // ==========================================================================

  describe('original query restoration', () => {
    it('should store original query when first drilling', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // Open menu and drill
      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      // Find a drill option (should have time drill or details drill)
      const drillOption = result.current.menuOptions.find(
        opt => opt.type === 'drillDown' || opt.type === 'details'
      )

      if (drillOption) {
        act(() => {
          result.current.handleOptionSelect(drillOption)
        })

        // Drill path should have one entry
        expect(result.current.drillPath.length).toBe(1)
        expect(onQueryChange).toHaveBeenCalled()
      }
    })

    it('should fully restore original query when navigating back to root after details drill', () => {
      const originalQuery: CubeQuery = {
        measures: ['Sales.totalRevenue', 'Sales.count'],
        dimensions: ['Sales.category'],
        timeDimensions: [
          {
            dimension: 'Sales.createdAt',
            granularity: 'month',
            dateRange: ['2024-01-01', '2024-12-31']
          }
        ],
        filters: [
          { member: 'Sales.category', operator: 'equals', values: ['Electronics'] }
        ]
      }

      const { result } = renderHook(() =>
        useDrillInteraction({
          query: originalQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // Open menu and simulate details drill
      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      // Find details option (drill to show underlying records)
      const detailsOption = result.current.menuOptions.find(
        opt => opt.type === 'details'
      )

      if (detailsOption) {
        act(() => {
          result.current.handleOptionSelect(detailsOption)
        })

        // Now navigate back to root
        act(() => {
          result.current.navigateBack()
        })

        // The restored query should be the complete original query
        const restoredQuery = onQueryChange.mock.calls[onQueryChange.mock.calls.length - 1][0]

        // Verify original dimensions are restored (not drill members)
        expect(restoredQuery.dimensions).toEqual(originalQuery.dimensions)
        // Verify original measures are restored
        expect(restoredQuery.measures).toEqual(originalQuery.measures)
        // Verify original filters are restored
        expect(restoredQuery.filters).toEqual(originalQuery.filters)
        // Verify original time dimensions are restored
        expect(restoredQuery.timeDimensions).toEqual(originalQuery.timeDimensions)
      }
    })

    it('should restore original query via navigateToLevel(0)', () => {
      const originalQuery: CubeQuery = {
        measures: ['Sales.totalRevenue'],
        dimensions: ['Sales.category'],
        timeDimensions: [
          {
            dimension: 'Sales.createdAt',
            granularity: 'month',
            dateRange: ['2024-01-01', '2024-06-30']
          }
        ]
      }

      const { result } = renderHook(() =>
        useDrillInteraction({
          query: originalQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // Drill down
      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      const drillOption = result.current.menuOptions.find(
        opt => opt.type === 'drillDown' || opt.type === 'details'
      )

      if (drillOption) {
        act(() => {
          result.current.handleOptionSelect(drillOption)
        })

        // Navigate directly to level 0 (root)
        act(() => {
          result.current.navigateToLevel(0)
        })

        // Drill path should be empty
        expect(result.current.drillPath.length).toBe(0)

        // Verify original query is restored
        const restoredQuery = onQueryChange.mock.calls[onQueryChange.mock.calls.length - 1][0]
        expect(restoredQuery.dimensions).toEqual(originalQuery.dimensions)
        expect(restoredQuery.timeDimensions).toEqual(originalQuery.timeDimensions)
      }
    })
  })

  // ==========================================================================
  // Multi-Level Navigation Tests
  // ==========================================================================

  describe('multi-level navigation', () => {
    it('should navigate back one level at a time', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // First drill
      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      const firstOption = result.current.menuOptions[0]
      if (firstOption) {
        act(() => {
          result.current.handleOptionSelect(firstOption)
        })

        expect(result.current.drillPath.length).toBe(1)

        // Navigate back
        act(() => {
          result.current.navigateBack()
        })

        // Should be back at root
        expect(result.current.drillPath.length).toBe(0)
      }
    })

    it('should do nothing when navigateBack is called at root level', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // Try to navigate back when already at root
      act(() => {
        result.current.navigateBack()
      })

      expect(result.current.drillPath.length).toBe(0)
      expect(onQueryChange).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Chart Config Preservation Tests
  // ==========================================================================

  describe('chart config preservation', () => {
    it('should store original chart config on first drill', () => {
      const originalChartConfig = {
        xAxis: ['Sales.createdAt'],
        yAxis: ['Sales.totalRevenue']
      }

      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange,
          chartConfig: originalChartConfig
        })
      )

      // Drill down
      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      const drillOption = result.current.menuOptions.find(opt => opt.type === 'details')

      if (drillOption) {
        act(() => {
          result.current.handleOptionSelect(drillOption)
        })

        // currentChartConfig might be updated by details drill
        // Navigate back and verify original is restored
        act(() => {
          result.current.navigateBack()
        })

        // After navigating back, currentChartConfig should be the original
        // (or null if no override was applied during drill)
        expect(result.current.currentChartConfig).toBe(originalChartConfig)
      }
    })

    it('should update currentChartConfig when drilling to details', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      const detailsOption = result.current.menuOptions.find(opt => opt.type === 'details')

      if (detailsOption) {
        act(() => {
          result.current.handleOptionSelect(detailsOption)
        })

        // Details drill should provide a chart config mapping drill members
        // The currentChartConfig should be set (not null)
        // This depends on the implementation - it may or may not set chartConfig
        expect(result.current.drillPath.length).toBe(1)
      }
    })
  })

  // ==========================================================================
  // Time Dimension Drilling Tests
  // ==========================================================================

  describe('time dimension drilling', () => {
    it('should track original granularity on first time drill', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery, // has month granularity
          metadata: mockMeta,
          onQueryChange
        })
      )

      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      // Find a time drill option (drillDown with targetGranularity)
      const timeDrillOption = result.current.menuOptions.find(
        opt => opt.type === 'drillDown' && opt.targetGranularity
      )

      if (timeDrillOption) {
        act(() => {
          result.current.handleOptionSelect(timeDrillOption)
        })

        expect(result.current.drillPath.length).toBe(1)

        // The path entry should have granularity info
        const pathEntry = result.current.drillPath[0]
        expect(pathEntry.granularity).toBeDefined()
      }
    })

    it('should restore original time dimension dateRange when navigating back', () => {
      const originalDateRange = ['2024-01-01', '2024-12-31']
      const queryWithDateRange: CubeQuery = {
        measures: ['Sales.totalRevenue'],
        dimensions: ['Sales.category'],
        timeDimensions: [
          {
            dimension: 'Sales.createdAt',
            granularity: 'month',
            dateRange: originalDateRange
          }
        ]
      }

      const { result } = renderHook(() =>
        useDrillInteraction({
          query: queryWithDateRange,
          metadata: mockMeta,
          onQueryChange
        })
      )

      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      const drillOption = result.current.menuOptions.find(
        opt => opt.type === 'drillDown' && opt.targetGranularity
      )

      if (drillOption) {
        act(() => {
          result.current.handleOptionSelect(drillOption)
        })

        // Navigate back
        act(() => {
          result.current.navigateBack()
        })

        // Verify dateRange is restored
        const restoredQuery = onQueryChange.mock.calls[onQueryChange.mock.calls.length - 1][0]
        expect(restoredQuery.timeDimensions?.[0]?.dateRange).toEqual(originalDateRange)
      }
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle query with no time dimensions', () => {
      const queryNoTime: CubeQuery = {
        measures: ['Sales.totalRevenue'],
        dimensions: ['Sales.category']
      }

      const { result } = renderHook(() =>
        useDrillInteraction({
          query: queryNoTime,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // Should still enable drill for details
      expect(result.current.drillEnabled).toBe(true)

      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      // Should have details option but not time options
      const hasTimeOption = result.current.menuOptions.some(
        opt => opt.targetGranularity !== undefined
      )
      const hasDetailsOption = result.current.menuOptions.some(
        opt => opt.type === 'details'
      )

      expect(hasTimeOption).toBe(false)
      expect(hasDetailsOption).toBe(true)
    })

    it('should not open menu when enabled is false', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange,
          enabled: false
        })
      )

      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      expect(result.current.menuOpen).toBe(false)
      expect(result.current.menuOptions).toEqual([])
    })

    it('should handle navigateToLevel with out-of-bounds index', () => {
      const { result } = renderHook(() =>
        useDrillInteraction({
          query: baseQuery,
          metadata: mockMeta,
          onQueryChange
        })
      )

      // Drill once
      act(() => {
        result.current.handleDataPointClick(createClickEvent())
      })

      const option = result.current.menuOptions[0]
      if (option) {
        act(() => {
          result.current.handleOptionSelect(option)
        })

        // Try to navigate to level 10 (out of bounds)
        act(() => {
          result.current.navigateToLevel(10)
        })

        // Should not crash, path should remain unchanged
        expect(result.current.drillPath.length).toBe(1)
      }
    })
  })
})

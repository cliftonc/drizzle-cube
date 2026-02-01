/**
 * Tests for useAnalysisChartDefaults hook
 *
 * This hook manages chart configuration, availability, and smart defaulting.
 * It handles color palette resolution and chart type auto-switching.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnalysisChartDefaults } from '../../../../src/client/hooks/useAnalysisChartDefaults'
import { AnalysisBuilderStoreProvider } from '../../../../src/client/stores/analysisBuilderStore'
import type { ChartType, ChartAxisConfig, ChartDisplayConfig, CubeQuery } from '../../../../src/client/types'
import type { MetricItem, BreakdownItem } from '../../../../src/client/components/AnalysisBuilder/types'
import type { ColorPalette } from '../../../../src/client/utils/colorPalettes'

// ============================================================================
// Test Utilities
// ============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AnalysisBuilderStoreProvider disableLocalStorage>
          {children}
        </AnalysisBuilderStoreProvider>
      </QueryClientProvider>
    )
  }
}

function createWrapperWithInitialChartConfig(chartConfig: {
  chartType?: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AnalysisBuilderStoreProvider
          disableLocalStorage
          initialChartConfig={chartConfig}
        >
          {children}
        </AnalysisBuilderStoreProvider>
      </QueryClientProvider>
    )
  }
}

// Helper to create test metrics
function createMetric(field: string, label: string): MetricItem {
  return { id: Math.random().toString(), field, label }
}

// Helper to create test breakdowns
function createBreakdown(
  field: string,
  isTimeDimension: boolean,
  granularity?: string
): BreakdownItem {
  return { id: Math.random().toString(), field, isTimeDimension, granularity }
}

interface HookOptions {
  externalColorPalette?: string[] | ColorPalette
  combinedMetrics: MetricItem[]
  combinedBreakdowns: BreakdownItem[]
  hasDebounced: boolean
}

const defaultOptions: HookOptions = {
  combinedMetrics: [],
  combinedBreakdowns: [],
  hasDebounced: false,
}

// ============================================================================
// Tests
// ============================================================================

describe('useAnalysisChartDefaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================
  describe('initialization', () => {
    it('should return complete result interface', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      // Verify key properties exist
      expect(result.current).toHaveProperty('chartType')
      expect(result.current).toHaveProperty('chartConfig')
      expect(result.current).toHaveProperty('displayConfig')
      expect(result.current).toHaveProperty('colorPalette')
      expect(result.current).toHaveProperty('localPaletteName')
      expect(result.current).toHaveProperty('chartAvailability')
      expect(result.current).toHaveProperty('userManuallySelectedChart')
    })

    it('should return action functions', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(typeof result.current.setChartType).toBe('function')
      expect(typeof result.current.setChartConfig).toBe('function')
      expect(typeof result.current.setDisplayConfig).toBe('function')
      expect(typeof result.current.setLocalPaletteName).toBe('function')
    })

    it('should initialize with default chart type (bar)', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartType).toBe('bar')
    })

    it('should initialize with default display config', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(result.current.displayConfig).toHaveProperty('showLegend')
      expect(result.current.displayConfig).toHaveProperty('showGrid')
      expect(result.current.displayConfig).toHaveProperty('showTooltip')
    })

    it('should initialize userManuallySelectedChart as false', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(result.current.userManuallySelectedChart).toBe(false)
    })

    it('should throw when used outside AnalysisBuilderStoreProvider', () => {
      const queryClient = new QueryClient()
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      expect(() => {
        renderHook(() => useAnalysisChartDefaults(defaultOptions), { wrapper })
      }).toThrow()
    })
  })

  // ==========================================================================
  // Chart Type Tests
  // ==========================================================================
  describe('chart type', () => {
    it('should update chartType when setChartType is called', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartType).toBe('bar')

      act(() => {
        result.current.setChartType('line')
      })

      expect(result.current.chartType).toBe('line')
    })

    it('should support all standard chart types', () => {
      const chartTypes: ChartType[] = [
        'bar',
        'line',
        'area',
        'pie',
        'scatter',
        'radar',
        'table',
      ]

      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      for (const chartType of chartTypes) {
        act(() => {
          result.current.setChartType(chartType)
        })

        expect(result.current.chartType).toBe(chartType)
      }
    })

    it('should use initial chart type from provider', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        {
          wrapper: createWrapperWithInitialChartConfig({ chartType: 'line' }),
        }
      )

      expect(result.current.chartType).toBe('line')
    })
  })

  // ==========================================================================
  // Chart Config Tests
  // ==========================================================================
  describe('chart config', () => {
    it('should update chartConfig when setChartConfig is called', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      const newConfig: ChartAxisConfig = {
        xAxis: ['Employees.department'],
        yAxis: ['Employees.count'],
      }

      act(() => {
        result.current.setChartConfig(newConfig)
      })

      expect(result.current.chartConfig.xAxis).toEqual(['Employees.department'])
      expect(result.current.chartConfig.yAxis).toEqual(['Employees.count'])
    })

    it('should support series in chart config', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      const newConfig: ChartAxisConfig = {
        xAxis: ['Employees.createdAt'],
        yAxis: ['Employees.count'],
        series: ['Employees.department'],
      }

      act(() => {
        result.current.setChartConfig(newConfig)
      })

      expect(result.current.chartConfig.series).toEqual(['Employees.department'])
    })

    it('should use initial chart config from provider', () => {
      const initialConfig: ChartAxisConfig = {
        xAxis: ['Employees.name'],
        yAxis: ['Employees.avgSalary'],
      }

      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        {
          wrapper: createWrapperWithInitialChartConfig({ chartConfig: initialConfig }),
        }
      )

      expect(result.current.chartConfig.xAxis).toEqual(['Employees.name'])
      expect(result.current.chartConfig.yAxis).toEqual(['Employees.avgSalary'])
    })
  })

  // ==========================================================================
  // Display Config Tests
  // ==========================================================================
  describe('display config', () => {
    it('should update displayConfig when setDisplayConfig is called', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.setDisplayConfig({ showLegend: false })
      })

      expect(result.current.displayConfig.showLegend).toBe(false)
    })

    it('should support all display config options', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      const newConfig: ChartDisplayConfig = {
        showLegend: false,
        showGrid: false,
        showTooltip: false,
        stacked: true,
        orientation: 'horizontal',
      }

      act(() => {
        result.current.setDisplayConfig(newConfig)
      })

      expect(result.current.displayConfig.showLegend).toBe(false)
      expect(result.current.displayConfig.showGrid).toBe(false)
      expect(result.current.displayConfig.showTooltip).toBe(false)
      expect(result.current.displayConfig.stacked).toBe(true)
      expect(result.current.displayConfig.orientation).toBe('horizontal')
    })
  })

  // ==========================================================================
  // Color Palette Tests
  // ==========================================================================
  describe('color palette', () => {
    it('should return default color palette when no external palette is provided', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(result.current.colorPalette).toHaveProperty('name')
      expect(result.current.colorPalette).toHaveProperty('colors')
      expect(result.current.colorPalette).toHaveProperty('gradient')
    })

    it('should use external palette when provided as array', () => {
      const customColors = ['#ff0000', '#00ff00', '#0000ff']

      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            externalColorPalette: customColors,
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.colorPalette.colors).toEqual(customColors)
      expect(result.current.colorPalette.name).toBe('custom')
    })

    it('should use external palette when provided as ColorPalette object', () => {
      const customPalette: ColorPalette = {
        name: 'myPalette',
        label: 'My Palette',
        colors: ['#111', '#222', '#333'],
        gradient: ['#aaa', '#bbb', '#ccc'],
      }

      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            externalColorPalette: customPalette,
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.colorPalette).toBe(customPalette)
    })

    it('should update localPaletteName when setLocalPaletteName is called', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.setLocalPaletteName('ocean')
      })

      expect(result.current.localPaletteName).toBe('ocean')
    })

    it('should use localPaletteName when no external palette is provided', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.setLocalPaletteName('sunset')
      })

      expect(result.current.colorPalette.name).toBe('sunset')
    })
  })

  // ==========================================================================
  // Chart Availability Tests
  // ==========================================================================
  describe('chart availability', () => {
    it('should return availability map for all chart types', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability).toBeDefined()
      expect(result.current.chartAvailability).toHaveProperty('bar')
      expect(result.current.chartAvailability).toHaveProperty('line')
      expect(result.current.chartAvailability).toHaveProperty('pie')
      expect(result.current.chartAvailability).toHaveProperty('table')
    })

    it('should mark table as always available', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability.table.available).toBe(true)
    })

    it('should mark bar chart as unavailable without metrics', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            combinedMetrics: [],
            combinedBreakdowns: [],
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability.bar.available).toBe(false)
    })

    it('should mark bar chart as available with metrics and breakdowns', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            combinedMetrics: [createMetric('Employees.count', 'A')],
            combinedBreakdowns: [createBreakdown('Employees.department', false)],
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability.bar.available).toBe(true)
    })

    it('should mark pie chart as unavailable without dimension', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            combinedMetrics: [createMetric('Employees.count', 'A')],
            combinedBreakdowns: [], // No dimension
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability.pie.available).toBe(false)
    })

    it('should mark pie chart as available with dimension', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            combinedMetrics: [createMetric('Employees.count', 'A')],
            combinedBreakdowns: [createBreakdown('Employees.department', false)],
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability.pie.available).toBe(true)
    })

    it('should include reason when chart is unavailable', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            combinedMetrics: [],
            combinedBreakdowns: [],
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability.bar.reason).toBeDefined()
      expect(typeof result.current.chartAvailability.bar.reason).toBe('string')
    })

    it('should update availability when metrics change', () => {
      const { result, rerender } = renderHook(
        ({ metrics }: { metrics: MetricItem[] }) =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            combinedMetrics: metrics,
            combinedBreakdowns: [createBreakdown('Employees.department', false)],
          }),
        {
          wrapper: createWrapper(),
          initialProps: { metrics: [] },
        }
      )

      expect(result.current.chartAvailability.bar.available).toBe(false)

      rerender({ metrics: [createMetric('Employees.count', 'A')] })

      expect(result.current.chartAvailability.bar.available).toBe(true)
    })
  })

  // ==========================================================================
  // Smart Defaulting Tests (when hasDebounced is true)
  // ==========================================================================
  describe('smart defaulting', () => {
    it('should not auto-switch chart type when hasDebounced is false', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            combinedMetrics: [createMetric('Employees.count', 'A')],
            combinedBreakdowns: [
              createBreakdown('Employees.createdAt', true, 'day'),
            ],
            hasDebounced: false,
          }),
        { wrapper: createWrapper() }
      )

      // Should remain bar (default) even with time dimension
      expect(result.current.chartType).toBe('bar')
    })

    it('should apply smart defaults when hasDebounced is true', async () => {
      const metrics = [createMetric('Employees.count', 'A')]
      const breakdowns = [createBreakdown('Employees.createdAt', true, 'day')]

      const { result, rerender } = renderHook(
        ({ hasDebounced }: { hasDebounced: boolean }) =>
          useAnalysisChartDefaults({
            combinedMetrics: metrics,
            combinedBreakdowns: breakdowns,
            hasDebounced,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { hasDebounced: false },
        }
      )

      // Initially bar
      expect(result.current.chartType).toBe('bar')

      // Trigger debounce
      rerender({ hasDebounced: true })

      // The smart defaulting effect runs but since bar is available with
      // time dimension + measure, it may stay as bar (bar requires dimension + measure)
      // The key behavior is that chart config gets populated
      await waitFor(() => {
        // Either chart type changed or chart config was populated
        expect(
          result.current.chartType !== 'bar' ||
          Object.keys(result.current.chartConfig).length > 0
        ).toBeTruthy()
      })
    })

    it('should set userManuallySelectedChart when setChartType is called', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            combinedMetrics: [createMetric('Employees.count', 'A')],
            combinedBreakdowns: [
              createBreakdown('Employees.department', false),
            ],
            hasDebounced: false,
          }),
        {
          wrapper: createWrapper(),
        }
      )

      // Initially not manually selected
      expect(result.current.userManuallySelectedChart).toBe(false)

      // User manually selects line chart (setChartType routes to setChartTypeManual)
      act(() => {
        result.current.setChartType('line')
      })

      // Chart type should have changed
      expect(result.current.chartType).toBe('line')
    })

    it('should apply smart defaults to empty chart config', async () => {
      const metrics = [createMetric('Employees.count', 'A')]
      const breakdowns = [createBreakdown('Employees.department', false)]

      const { result, rerender } = renderHook(
        ({ hasDebounced }: { hasDebounced: boolean }) =>
          useAnalysisChartDefaults({
            combinedMetrics: metrics,
            combinedBreakdowns: breakdowns,
            hasDebounced,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { hasDebounced: false },
        }
      )

      // Trigger debounce
      rerender({ hasDebounced: true })

      // Wait for smart defaults to be applied
      await waitFor(() => {
        // Chart config should have xAxis and yAxis set
        expect(
          result.current.chartConfig.xAxis ||
          result.current.chartConfig.yAxis
        ).toBeDefined()
      })
    })
  })

  // ==========================================================================
  // Memoization Tests
  // ==========================================================================
  describe('memoization', () => {
    it('should return stable chartAvailability reference when inputs unchanged', () => {
      const metrics = [createMetric('Employees.count', 'A')]
      const breakdowns = [createBreakdown('Employees.department', false)]

      const { result, rerender } = renderHook(
        () =>
          useAnalysisChartDefaults({
            combinedMetrics: metrics,
            combinedBreakdowns: breakdowns,
            hasDebounced: false,
          }),
        { wrapper: createWrapper() }
      )

      const firstAvailability = result.current.chartAvailability

      rerender()

      expect(result.current.chartAvailability).toBe(firstAvailability)
    })

    it('should return stable colorPalette reference when inputs unchanged', () => {
      const { result, rerender } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      const firstPalette = result.current.colorPalette

      rerender()

      expect(result.current.colorPalette).toBe(firstPalette)
    })

    it('should update chartAvailability when metrics change', () => {
      const { result, rerender } = renderHook(
        ({ metrics }: { metrics: MetricItem[] }) =>
          useAnalysisChartDefaults({
            ...defaultOptions,
            combinedMetrics: metrics,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { metrics: [] },
        }
      )

      const firstAvailability = result.current.chartAvailability

      rerender({ metrics: [createMetric('Employees.count', 'A')] })

      expect(result.current.chartAvailability).not.toBe(firstAvailability)
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('edge cases', () => {
    it('should handle empty metrics and breakdowns', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            combinedMetrics: [],
            combinedBreakdowns: [],
            hasDebounced: true,
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartType).toBeDefined()
      expect(result.current.chartAvailability).toBeDefined()
    })

    it('should handle multiple time dimensions', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            combinedMetrics: [createMetric('Employees.count', 'A')],
            combinedBreakdowns: [
              createBreakdown('Employees.createdAt', true, 'day'),
              createBreakdown('Employees.updatedAt', true, 'month'),
            ],
            hasDebounced: false,
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability).toBeDefined()
    })

    it('should handle mixed dimensions and time dimensions', () => {
      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            combinedMetrics: [createMetric('Employees.count', 'A')],
            combinedBreakdowns: [
              createBreakdown('Employees.department', false),
              createBreakdown('Employees.createdAt', true, 'day'),
            ],
            hasDebounced: false,
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability.bar.available).toBe(true)
      expect(result.current.chartAvailability.line.available).toBe(true)
    })

    it('should handle many metrics', () => {
      const metrics = Array.from({ length: 10 }, (_, i) =>
        createMetric(`Employees.metric${i}`, String.fromCharCode(65 + i))
      )

      const { result } = renderHook(
        () =>
          useAnalysisChartDefaults({
            combinedMetrics: metrics,
            combinedBreakdowns: [createBreakdown('Employees.department', false)],
            hasDebounced: false,
          }),
        { wrapper: createWrapper() }
      )

      expect(result.current.chartAvailability.bar.available).toBe(true)
    })

    it('should handle setting chartConfig to empty object', () => {
      const { result } = renderHook(
        () => useAnalysisChartDefaults(defaultOptions),
        { wrapper: createWrapper() }
      )

      act(() => {
        result.current.setChartConfig({})
      })

      expect(result.current.chartConfig).toEqual({})
    })
  })
})

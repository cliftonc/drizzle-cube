/**
 * Tests for AnalyticsPortlet
 * Covers query execution, lazy loading, refresh mechanism, chart rendering, and error handling
 */

import React, { createRef } from 'react'
import { render, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AnalyticsPortlet from '../../src/client/components/AnalyticsPortlet'
import type { CubeResultSet } from '../../src/client/types'

// Mock react-intersection-observer
let mockInView = true
vi.mock('react-intersection-observer', () => ({
  useInView: vi.fn(() => ({
    ref: vi.fn(),
    inView: mockInView
  }))
}))

// Mock useCubeQuery
let mockUseCubeQueryResult = {
  resultSet: null as CubeResultSet | null,
  isLoading: false,
  error: null as Error | null
}
vi.mock('../../src/client/hooks/useCubeQuery', () => ({
  useCubeQuery: vi.fn(() => mockUseCubeQueryResult)
}))

// Mock useScrollContainer
vi.mock('../../src/client/providers/ScrollContainerContext', () => ({
  useScrollContainer: vi.fn(() => null)
}))

// Mock chart components
vi.mock('../../src/client/components/charts', () => ({
  RechartsBarChart: (props: any) => <div data-testid="bar-chart" data-config={JSON.stringify(props.chartConfig)} />,
  RechartsLineChart: (props: any) => <div data-testid="line-chart" />,
  RechartsAreaChart: (props: any) => <div data-testid="area-chart" />,
  RechartsPieChart: (props: any) => <div data-testid="pie-chart" />,
  RechartsScatterChart: (props: any) => <div data-testid="scatter-chart" />,
  RechartsRadarChart: (props: any) => <div data-testid="radar-chart" />,
  RechartsRadialBarChart: (props: any) => <div data-testid="radial-bar-chart" />,
  RechartsTreeMapChart: (props: any) => <div data-testid="treemap-chart" />,
  BubbleChart: (props: any) => <div data-testid="bubble-chart" />,
  DataTable: (props: any) => <div data-testid="data-table" />,
  ActivityGridChart: (props: any) => <div data-testid="activity-grid-chart" />,
  KpiNumber: (props: any) => <div data-testid="kpi-number" />,
  KpiDelta: (props: any) => <div data-testid="kpi-delta" />,
  KpiText: (props: any) => <div data-testid="kpi-text" />,
  MarkdownChart: (props: any) => <div data-testid="markdown-chart" />
}))

// Mock ChartErrorBoundary
vi.mock('../../src/client/components/ChartErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}))

// Mock LoadingIndicator
vi.mock('../../src/client/components/LoadingIndicator', () => ({
  default: () => <div data-testid="loading-indicator">Loading...</div>
}))

// Mock chartConfigRegistry
vi.mock('../../src/client/charts/chartConfigRegistry', () => ({
  chartConfigRegistry: {}
}))

// Mock chartConfigs
vi.mock('../../src/client/charts/chartConfigs', () => ({
  getChartConfig: vi.fn((chartType: string) => ({
    skipQuery: chartType === 'markdown',
    dropZones: [
      { key: 'yAxis', mandatory: true, label: 'Measures' }
    ]
  }))
}))

// Mock filterUtils
vi.mock('../../src/client/utils/filterUtils', () => ({
  getApplicableDashboardFilters: vi.fn((filters, mapping) => filters || []),
  mergeDashboardAndPortletFilters: vi.fn((dashboardFilters, portletFilters) => [...(dashboardFilters || []), ...(portletFilters || [])]),
  applyUniversalTimeFilters: vi.fn((dashboardFilters, mapping, timeDimensions) => timeDimensions || [])
}))

// Helper to create mock result set
function createMockResultSet(data: Record<string, unknown>[] = []): CubeResultSet {
  return {
    rawData: () => data,
    tablePivot: () => data,
    series: () => [],
    annotation: () => ({
      measures: {},
      dimensions: {},
      timeDimensions: {}
    })
  }
}

describe('AnalyticsPortlet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInView = true
    mockUseCubeQueryResult = {
      resultSet: null,
      isLoading: false,
      error: null
    }
  })

  describe('query execution', () => {
    it('should parse query JSON and pass to useCubeQuery', async () => {
      const { useCubeQuery } = await import('../../src/client/hooks/useCubeQuery')
      const mockQuery = { measures: ['Test.count'] }
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify(mockQuery)}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(useCubeQuery).toHaveBeenCalled()
      const call = (useCubeQuery as any).mock.calls[0]
      expect(call[0]).toMatchObject({
        measures: ['Test.count']
      })
    })

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { container } = render(
        <AnalyticsPortlet
          query="invalid-json"
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(consoleSpy).toHaveBeenCalled()
      expect(container.textContent).toContain('No data available')
      consoleSpy.mockRestore()
    })

    it('should add refresh counter to query for re-fetching', async () => {
      const { useCubeQuery } = await import('../../src/client/hooks/useCubeQuery')
      const mockQuery = { measures: ['Test.count'] }
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify(mockQuery)}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      const call = (useCubeQuery as any).mock.calls[0]
      expect(call[0]).toHaveProperty('__refresh_counter')
    })
  })

  describe('lazy loading', () => {
    it('should not query when not in view and eagerLoad is false', async () => {
      mockInView = false
      const { useCubeQuery } = await import('../../src/client/hooks/useCubeQuery')

      const { container } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
          eagerLoad={false}
        />
      )

      expect(container.textContent).toContain('Scroll to load')
      const call = (useCubeQuery as any).mock.calls[0]
      expect(call[1]).toMatchObject({ skip: true })
    })

    it('should query immediately when eagerLoad is true', async () => {
      mockInView = false // Not in view, but eagerLoad overrides
      const { useCubeQuery } = await import('../../src/client/hooks/useCubeQuery')
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
          eagerLoad={true}
        />
      )

      const call = (useCubeQuery as any).mock.calls[0]
      expect(call[1]).toMatchObject({ skip: false })
    })

    it('should query when in view', async () => {
      mockInView = true
      const { useCubeQuery } = await import('../../src/client/hooks/useCubeQuery')
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
          eagerLoad={false}
        />
      )

      const call = (useCubeQuery as any).mock.calls[0]
      expect(call[1]).toMatchObject({ skip: false })
    })
  })

  describe('refresh mechanism', () => {
    it('should expose refresh function through ref', async () => {
      const ref = createRef<{ refresh: () => void }>()
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          ref={ref}
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(ref.current).not.toBeNull()
      expect(typeof ref.current?.refresh).toBe('function')
    })

    it('should increment refresh counter when refresh is called', async () => {
      const ref = createRef<{ refresh: () => void }>()
      const { useCubeQuery } = await import('../../src/client/hooks/useCubeQuery')
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          ref={ref}
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      const initialCallCount = (useCubeQuery as any).mock.calls.length
      const initialCall = (useCubeQuery as any).mock.calls[initialCallCount - 1]
      const initialRefreshCounter = initialCall[0].__refresh_counter

      act(() => {
        ref.current?.refresh()
      })

      await waitFor(() => {
        const finalCallCount = (useCubeQuery as any).mock.calls.length
        const finalCall = (useCubeQuery as any).mock.calls[finalCallCount - 1]
        expect(finalCall[0].__refresh_counter).toBe(initialRefreshCounter + 1)
      })
    })
  })

  describe('chart rendering', () => {
    it('should render bar chart when chartType is bar', () => {
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      const { getByTestId } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('should render line chart when chartType is line', () => {
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      const { getByTestId } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="line"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(getByTestId('line-chart')).toBeInTheDocument()
    })

    it('should render pie chart when chartType is pie', () => {
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      const { getByTestId } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="pie"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(getByTestId('pie-chart')).toBeInTheDocument()
    })

    it('should render data table when chartType is table', () => {
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      const { getByTestId } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="table"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(getByTestId('data-table')).toBeInTheDocument()
    })

    it('should pass chartConfig to chart component', () => {
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])
      const chartConfig = { yAxis: ['Test.count'], xAxis: ['Test.name'] }

      const { getByTestId } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={chartConfig}
        />
      )

      const barChart = getByTestId('bar-chart')
      expect(barChart.getAttribute('data-config')).toBe(JSON.stringify(chartConfig))
    })

    it('should show unsupported chart type message for unknown types', () => {
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      const { container } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType={'unknown' as any}
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(container.textContent).toContain('Unsupported chart type')
    })
  })

  describe('loading state', () => {
    it('should show loading indicator while loading', () => {
      mockUseCubeQueryResult.isLoading = true

      const { getByTestId } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(getByTestId('loading-indicator')).toBeInTheDocument()
    })

    it('should show custom loading component if provided', () => {
      mockUseCubeQueryResult.isLoading = true
      const customLoader = <div data-testid="custom-loader">Custom Loading...</div>

      const { getByTestId } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
          loadingComponent={customLoader}
        />
      )

      expect(getByTestId('custom-loader')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should show error message when query fails', () => {
      mockUseCubeQueryResult.error = new Error('Query failed')

      const { container } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(container.textContent).toContain('Query Error')
      expect(container.textContent).toContain('Query failed')
    })

    it('should show retry button on error', () => {
      mockUseCubeQueryResult.error = new Error('Query failed')

      const { container } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      const retryButton = container.querySelector('button')
      expect(retryButton).toBeInTheDocument()
      expect(retryButton?.textContent).toBe('Retry')
    })
  })

  describe('configuration required state', () => {
    it('should show configuration required when chartConfig is missing for mandatory fields', () => {
      mockUseCubeQueryResult.resultSet = createMockResultSet([])

      const { container } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={undefined}
        />
      )

      expect(container.textContent).toContain('Configuration Required')
    })
  })

  describe('skip query charts', () => {
    it('should not execute query for markdown charts', async () => {
      const { useCubeQuery } = await import('../../src/client/hooks/useCubeQuery')
      const { getChartConfig } = await import('../../src/client/charts/chartConfigs')

      // Make markdown return skipQuery: true
      ;(getChartConfig as any).mockImplementation((chartType: string) => ({
        skipQuery: chartType === 'markdown',
        dropZones: []
      }))

      render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="markdown"
          chartConfig={{ content: 'Hello World' }}
        />
      )

      const call = (useCubeQuery as any).mock.calls[0]
      expect(call[1]).toMatchObject({ skip: true })
    })
  })

  describe('debug data callback', () => {
    it('should call onDebugDataReady when result is available', async () => {
      const onDebugDataReady = vi.fn()
      const chartConfig = { yAxis: ['Test.count'] }
      mockUseCubeQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={chartConfig}
          onDebugDataReady={onDebugDataReady}
        />
      )

      await waitFor(() => {
        expect(onDebugDataReady).toHaveBeenCalledWith({
          chartConfig,
          displayConfig: {},
          queryObject: expect.objectContaining({ measures: ['Test.count'] }),
          data: [{ 'Test.count': 10 }],
          chartType: 'bar'
        })
      })
    })
  })
})

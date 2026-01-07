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

// Mock @tanstack/react-query useQueryClient
const mockInvalidateQueries = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries
  }))
}))

// Mock useCubeLoadQuery
let mockUseCubeLoadQueryResult = {
  resultSet: null as CubeResultSet | null,
  rawData: null as unknown[] | null,
  isLoading: false,
  isFetching: false,
  isDebouncing: false,
  error: null as Error | null,
  debouncedQuery: null,
  isValidQuery: false,
  refetch: vi.fn(),
  clearCache: vi.fn()
}
vi.mock('../../src/client/hooks/queries/useCubeLoadQuery', () => ({
  useCubeLoadQuery: vi.fn(() => mockUseCubeLoadQueryResult),
  createQueryKey: vi.fn((query) => ['cube', 'load', JSON.stringify(query)])
}))

// Mock useMultiCubeLoadQuery (used for multi-query portlets)
let mockUseMultiCubeLoadQueryResult = {
  mergedData: null as unknown[] | null,
  queryResults: [] as any[],
  isLoading: false,
  isFetching: false,
  isDebouncing: false,
  errors: [] as (Error | null)[],
  isAnyLoading: false,
  areAllComplete: true,
  refetch: vi.fn()
}
vi.mock('../../src/client/hooks/queries/useMultiCubeLoadQuery', () => ({
  useMultiCubeLoadQuery: vi.fn(() => mockUseMultiCubeLoadQueryResult),
  createMultiQueryKey: vi.fn((config) => ['cube', 'multiLoad', JSON.stringify(config)])
}))

// Mock useScrollContainer
vi.mock('../../src/client/providers/ScrollContainerContext', () => ({
  useScrollContainer: vi.fn(() => null)
}))

// Mock ChartLoader (LazyChart renders the chart based on chartType)
vi.mock('../../src/client/charts/ChartLoader', () => ({
  LazyChart: ({ chartType, ...props }: any) => (
    <div data-testid={`${chartType}-chart`} data-config={JSON.stringify(props.chartConfig)} />
  ),
  isValidChartType: (chartType: string) => [
    'bar', 'line', 'area', 'pie', 'scatter', 'radar', 'radialBar', 'treemap',
    'bubble', 'table', 'activityGrid', 'kpiNumber', 'kpiDelta', 'kpiText', 'markdown'
  ].includes(chartType),
  preloadChart: vi.fn(),
  preloadCharts: vi.fn(),
  getAvailableChartTypes: vi.fn(() => [
    'bar', 'line', 'area', 'pie', 'scatter', 'radar', 'radialBar', 'treemap',
    'bubble', 'table', 'activityGrid', 'kpiNumber', 'kpiDelta', 'kpiText', 'markdown'
  ])
}))

// Mock lazyChartConfigRegistry
vi.mock('../../src/client/charts/lazyChartConfigRegistry', () => ({
  useChartConfig: vi.fn((chartType: string) => ({
    config: {
      skipQuery: chartType === 'markdown',
      dropZones: [
        { key: 'yAxis', mandatory: true, label: 'Measures' }
      ]
    },
    loading: false,
    loaded: true
  })),
  getChartConfigAsync: vi.fn(),
  getChartConfigSync: vi.fn(),
  preloadChartConfig: vi.fn(),
  preloadChartConfigs: vi.fn(),
  loadAllChartConfigs: vi.fn()
}))

// Mock ChartErrorBoundary
vi.mock('../../src/client/components/ChartErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}))

// Mock LoadingIndicator
vi.mock('../../src/client/components/LoadingIndicator', () => ({
  default: () => <div data-testid="loading-indicator">Loading...</div>
}))

// Mock filterUtils
vi.mock('../../src/client/utils/filterUtils', () => ({
  getApplicableDashboardFilters: vi.fn((filters, mapping) => filters || []),
  mergeDashboardAndPortletFilters: vi.fn((dashboardFilters, portletFilters) => [...(dashboardFilters || []), ...(portletFilters || [])]),
  applyUniversalTimeFilters: vi.fn((dashboardFilters, mapping, timeDimensions) => timeDimensions || [])
}))

// Mock shared/utils (cleanQueryForServer)
vi.mock('../../src/client/shared/utils', () => ({
  cleanQueryForServer: vi.fn((query) => {
    // Remove empty arrays to match real behavior
    const cleaned: any = {}
    if (query.measures && query.measures.length > 0) cleaned.measures = query.measures
    if (query.dimensions && query.dimensions.length > 0) cleaned.dimensions = query.dimensions
    if (query.timeDimensions && query.timeDimensions.length > 0) cleaned.timeDimensions = query.timeDimensions
    if (query.filters && query.filters.length > 0) cleaned.filters = query.filters
    if (query.order) cleaned.order = query.order
    if (query.limit) cleaned.limit = query.limit
    return cleaned
  })
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
    mockUseCubeLoadQueryResult = {
      resultSet: null,
      rawData: null,
      isLoading: false,
      isFetching: false,
      isDebouncing: false,
      error: null,
      debouncedQuery: null,
      isValidQuery: false,
      refetch: vi.fn(),
      clearCache: vi.fn()
    }
    mockUseMultiCubeLoadQueryResult = {
      mergedData: null,
      queryResults: [],
      isLoading: false,
      isFetching: false,
      isDebouncing: false,
      errors: [],
      isAnyLoading: false,
      areAllComplete: true,
      refetch: vi.fn()
    }
  })

  describe('query execution', () => {
    it('should parse query JSON and pass to useCubeLoadQuery', async () => {
      const { useCubeLoadQuery } = await import('../../src/client/hooks/queries/useCubeLoadQuery')
      const mockQuery = { measures: ['Test.count'] }
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify(mockQuery)}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(useCubeLoadQuery).toHaveBeenCalled()
      const call = (useCubeLoadQuery as any).mock.calls[0]
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

    it('should pass query without refresh metadata', async () => {
      const { useCubeLoadQuery } = await import('../../src/client/hooks/queries/useCubeLoadQuery')
      const mockQuery = { measures: ['Test.count'] }
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify(mockQuery)}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      const call = (useCubeLoadQuery as any).mock.calls[0]
      expect(call[0]).not.toHaveProperty('__refresh_counter')
    })
  })

  describe('lazy loading', () => {
    it('should not query when not in view and eagerLoad is false', async () => {
      mockInView = false
      const { useCubeLoadQuery } = await import('../../src/client/hooks/queries/useCubeLoadQuery')

      render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
          eagerLoad={false}
        />
      )

      // Query should be skipped when not in view and eagerLoad is false
      const call = (useCubeLoadQuery as any).mock.calls[0]
      expect(call[1]).toMatchObject({ skip: true })
    })

    it('should query immediately when eagerLoad is true', async () => {
      mockInView = false // Not in view, but eagerLoad overrides
      const { useCubeLoadQuery } = await import('../../src/client/hooks/queries/useCubeLoadQuery')
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
          eagerLoad={true}
        />
      )

      const call = (useCubeLoadQuery as any).mock.calls[0]
      expect(call[1]).toMatchObject({ skip: false })
    })

    it('should query when in view', async () => {
      mockInView = true
      const { useCubeLoadQuery } = await import('../../src/client/hooks/queries/useCubeLoadQuery')
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
          eagerLoad={false}
        />
      )

      const call = (useCubeLoadQuery as any).mock.calls[0]
      expect(call[1]).toMatchObject({ skip: false })
    })
  })

  describe('refresh mechanism', () => {
    it('should expose refresh function through ref', async () => {
      const ref = createRef<{ refresh: () => void }>()
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

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

    it('should invalidate cache when refresh is called', async () => {
      const ref = createRef<{ refresh: () => void }>()
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      render(
        <AnalyticsPortlet
          ref={ref}
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="bar"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      act(() => {
        ref.current?.refresh()
      })

      await waitFor(() => {
        // Component uses invalidateQueries to clear cache and trigger refetch
        // The query is cleaned (empty arrays removed) to match the cache key format
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ['cube', 'load', JSON.stringify({ measures: ['Test.count'] })]
        })
      })
    })
  })

  describe('chart rendering', () => {
    it('should render bar chart when chartType is bar', () => {
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

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
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

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
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

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
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

      const { getByTestId } = render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="table"
          chartConfig={{ yAxis: ['Test.count'] }}
        />
      )

      expect(getByTestId('table-chart')).toBeInTheDocument()
    })

    it('should pass chartConfig to chart component', () => {
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])
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
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

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
      mockUseCubeLoadQueryResult.isLoading = true

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
      mockUseCubeLoadQueryResult.isLoading = true
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
      mockUseCubeLoadQueryResult.error = new Error('Query failed')

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
      mockUseCubeLoadQueryResult.error = new Error('Query failed')

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
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([])

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
      const { useCubeLoadQuery } = await import('../../src/client/hooks/queries/useCubeLoadQuery')

      // The mock for useChartConfig already returns skipQuery: true for markdown
      // (see mock at top of file)

      render(
        <AnalyticsPortlet
          query={JSON.stringify({ measures: ['Test.count'] })}
          chartType="markdown"
          chartConfig={{ content: 'Hello World' }}
        />
      )

      const call = (useCubeLoadQuery as any).mock.calls[0]
      expect(call[1]).toMatchObject({ skip: true })
    })
  })

  describe('debug data callback', () => {
    it('should call onDebugDataReady when result is available', async () => {
      const onDebugDataReady = vi.fn()
      const chartConfig = { yAxis: ['Test.count'] }
      mockUseCubeLoadQueryResult.resultSet = createMockResultSet([{ 'Test.count': 10 }])

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

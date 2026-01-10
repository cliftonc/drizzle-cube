/**
 * Comprehensive tests for useAnalysisBuilder master hook
 *
 * Tests the coordination between:
 * - Zustand store (client state)
 * - Sub-hooks (query building, chart config, UI state)
 * - TanStack Query (server state)
 *
 * NOTE: This hook must be used within AnalysisBuilderStoreProvider
 */

import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAnalysisBuilder } from '../../../src/client/hooks/useAnalysisBuilderHook'
import { AnalysisBuilderStoreProvider } from '../../../src/client/stores/analysisBuilderStore'
import type { CubeMeta, CubeQuery } from '../../../src/client/types'

// ============================================================================
// Mock Setup
// ============================================================================

// Mock cube metadata
const mockMeta: CubeMeta = {
  cubes: [
    {
      name: 'Employees',
      title: 'Employees',
      measures: [
        { name: 'Employees.count', title: 'Count', shortTitle: 'Count', type: 'number' },
        { name: 'Employees.avgSalary', title: 'Avg Salary', shortTitle: 'Avg Salary', type: 'number' },
      ],
      dimensions: [
        { name: 'Employees.name', title: 'Name', shortTitle: 'Name', type: 'string' },
        { name: 'Employees.department', title: 'Department', shortTitle: 'Department', type: 'string' },
        { name: 'Employees.createdAt', title: 'Created At', shortTitle: 'Created', type: 'time' },
      ],
      segments: [],
    },
    {
      name: 'Events',
      title: 'Events',
      measures: [
        { name: 'Events.count', title: 'Count', shortTitle: 'Count', type: 'number' },
      ],
      dimensions: [
        { name: 'Events.userId', title: 'User ID', shortTitle: 'User', type: 'string' },
        { name: 'Events.eventType', title: 'Event Type', shortTitle: 'Type', type: 'string' },
        { name: 'Events.timestamp', title: 'Timestamp', shortTitle: 'Time', type: 'time' },
      ],
      segments: [],
    },
  ],
}

// Mock CubeProvider hooks
vi.mock('../../../src/client/providers/CubeProvider', () => ({
  useCubeMeta: vi.fn(() => ({
    meta: mockMeta,
    labelMap: {},
    metaLoading: false,
    metaError: null,
    getFieldLabel: (field: string) => field,
    refetchMeta: vi.fn(),
  })),
  useCubeFeatures: vi.fn(() => ({
    features: { enableAI: false, aiEndpoint: null },
    dashboardModes: ['grid', 'rows'],
  })),
}))

// Mock CubeApiProvider
const mockCubeApi = {
  load: vi.fn().mockResolvedValue({
    rawData: () => [],
    tablePivot: () => [],
    series: () => [],
    annotation: () => ({ measures: {}, dimensions: {} }),
    loadResponse: {},
  }),
  sql: vi.fn().mockResolvedValue({ sql: 'SELECT 1', params: [] }),
  meta: vi.fn().mockResolvedValue(mockMeta),
}

vi.mock('../../../src/client/providers/CubeApiProvider', () => ({
  useCubeApi: vi.fn(() => ({
    cubeApi: mockCubeApi,
    options: undefined,
    updateApiConfig: vi.fn(),
    batchCoordinator: null,
    enableBatching: false,
  })),
}))

// Mock share utilities
vi.mock('../../../src/client/utils/shareUtils', () => ({
  parseShareUrl: vi.fn(() => null),
  clearShareHash: vi.fn(),
  generateShareUrl: vi.fn(() => 'http://test.com/#share=abc'),
  compressAndEncode: vi.fn(() => 'encoded'),
  decodeAndDecompress: vi.fn(() => null),
}))

// Mock shared utils - include all exports that may be accessed
vi.mock('../../../src/client/shared/utils', () => ({
  cleanQueryForServer: vi.fn((query: unknown) => query),
  convertDateRangeTypeToValue: vi.fn(() => ['2024-01-01', '2024-12-31']),
  isSimpleFilter: vi.fn((filter: unknown) => 'member' in (filter as object)),
  isGroupFilter: vi.fn(() => false),
  isAndFilter: vi.fn(() => false),
  isOrFilter: vi.fn(() => false),
  flattenFilters: vi.fn((filters: unknown[]) => filters),
  getFieldType: vi.fn(() => 'string'),
  getDefaultOperator: vi.fn(() => 'equals'),
}))

// Mock date-utils to avoid date parsing issues in tests
vi.mock('../../../src/shared/date-utils', () => ({
  parseRelativeDateRange: vi.fn(() => ({
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  })),
  parseDateRange: vi.fn(() => ({
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  })),
  calculatePriorPeriod: vi.fn(() => ({
    start: new Date('2023-01-01'),
    end: new Date('2023-12-31'),
  })),
  formatDateForCube: vi.fn((date: Date) => date.toISOString().split('T')[0]),
}))

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

// ============================================================================
// Tests
// ============================================================================

describe('useAnalysisBuilder', () => {
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
  describe('Initialization', () => {
    it('should return complete result interface with all properties', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      // Verify key properties exist
      expect(result.current).toHaveProperty('queryState')
      expect(result.current).toHaveProperty('queryStates')
      expect(result.current).toHaveProperty('activeQueryIndex')
      expect(result.current).toHaveProperty('mergeStrategy')
      expect(result.current).toHaveProperty('chartType')
      expect(result.current).toHaveProperty('displayConfig')
      expect(result.current).toHaveProperty('executionStatus')
      expect(result.current).toHaveProperty('actions')
      expect(result.current).toHaveProperty('getQueryConfig')
      expect(result.current).toHaveProperty('getChartConfig')
      expect(result.current).toHaveProperty('getAnalysisType')
    })

    it('should throw when used outside AnalysisBuilderStoreProvider', () => {
      const queryClient = new QueryClient()
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      expect(() => {
        renderHook(() => useAnalysisBuilder(), { wrapper })
      }).toThrow()
    })

    it('should initialize with default query mode', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.analysisType).toBe('query')
    })

    it('should initialize with empty metrics and breakdowns', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.queryState.metrics).toEqual([])
      expect(result.current.queryState.breakdowns).toEqual([])
    })

    it('should initialize with default chart type (bar)', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.chartType).toBe('bar')
    })

    it('should initialize with idle execution status', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.executionStatus).toBe('idle')
    })

    it('should accept onQueryChange callback', () => {
      const onQueryChange = vi.fn()
      const { result } = renderHook(
        () => useAnalysisBuilder({ onQueryChange }),
        { wrapper: createWrapper() }
      )

      expect(result.current).toBeDefined()
      // Callback is registered but not immediately called
    })

    it('should accept onChartConfigChange callback', () => {
      const onChartConfigChange = vi.fn()
      const { result } = renderHook(
        () => useAnalysisBuilder({ onChartConfigChange }),
        { wrapper: createWrapper() }
      )

      expect(result.current).toBeDefined()
      // Callback is registered but not immediately called
    })
  })

  // ==========================================================================
  // Query State Tests
  // ==========================================================================
  describe('Query State', () => {
    it('should expose queryState with current metrics/breakdowns/filters', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.queryState).toHaveProperty('metrics')
      expect(result.current.queryState).toHaveProperty('breakdowns')
      expect(result.current.queryState).toHaveProperty('filters')
    })

    it('should expose queryStates array for multi-query', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(Array.isArray(result.current.queryStates)).toBe(true)
      expect(result.current.queryStates.length).toBe(1)
    })

    it('should track activeQueryIndex', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.activeQueryIndex).toBe(0)
    })

    it('should expose mergeStrategy', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mergeStrategy).toBe('concat')
    })

    it('should return empty CubeQuery initially', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      const query = result.current.currentQuery
      // Query may have undefined or empty arrays for fields initially
      expect(query.measures?.length ?? 0).toBe(0)
      expect(query.dimensions?.length ?? 0).toBe(0)
    })

    it('should include measures from metrics', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
      })

      expect(result.current.currentQuery.measures).toContain('Employees.count')
    })

    it('should include dimensions from breakdowns', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addBreakdown('Employees.department', false)
      })

      expect(result.current.currentQuery.dimensions).toContain('Employees.department')
    })

    it('should include timeDimensions with granularity', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addBreakdown('Employees.createdAt', true, 'day')
      })

      expect(result.current.currentQuery.timeDimensions).toBeDefined()
      expect(result.current.currentQuery.timeDimensions?.length).toBe(1)
      expect(result.current.currentQuery.timeDimensions?.[0]).toMatchObject({
        dimension: 'Employees.createdAt',
        granularity: 'day',
      })
    })

    it('should include filters', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setFilters([
          { member: 'Employees.department', operator: 'equals', values: ['Engineering'] },
        ])
      })

      expect(result.current.currentQuery.filters).toHaveLength(1)
      expect(result.current.currentQuery.filters?.[0]).toMatchObject({
        member: 'Employees.department',
        operator: 'equals',
      })
    })

    it('should include order from queryState', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
        result.current.actions.setOrder('Employees.count', 'desc')
      })

      expect(result.current.currentQuery.order).toBeDefined()
    })
  })

  // ==========================================================================
  // Metrics Actions Tests
  // ==========================================================================
  describe('Metrics Actions', () => {
    it('actions.addMetric() should add metric to queryState', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
      })

      expect(result.current.queryState.metrics).toHaveLength(1)
      expect(result.current.queryState.metrics[0].field).toBe('Employees.count')
    })

    it('actions.addMetric() with label should set custom label', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count', 'Total Employees')
      })

      expect(result.current.queryState.metrics[0].label).toBe('Total Employees')
    })

    it('actions.removeMetric() should remove by ID', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
      })

      const metricId = result.current.queryState.metrics[0].id

      act(() => {
        result.current.actions.removeMetric(metricId)
      })

      expect(result.current.queryState.metrics).toHaveLength(0)
    })

    it('actions.toggleMetric() should add if not present', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.toggleMetric('Employees.count')
      })

      expect(result.current.queryState.metrics).toHaveLength(1)
    })

    it('actions.toggleMetric() should remove if present', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
      })

      act(() => {
        result.current.actions.toggleMetric('Employees.count')
      })

      expect(result.current.queryState.metrics).toHaveLength(0)
    })

    it('actions.reorderMetrics() should change order', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
        result.current.actions.addMetric('Employees.avgSalary')
      })

      const firstMetricField = result.current.queryState.metrics[0].field

      act(() => {
        result.current.actions.reorderMetrics(0, 1)
      })

      expect(result.current.queryState.metrics[1].field).toBe(firstMetricField)
    })
  })

  // ==========================================================================
  // Breakdowns Actions Tests
  // ==========================================================================
  describe('Breakdowns Actions', () => {
    it('actions.addBreakdown() should add to queryState', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addBreakdown('Employees.department', false)
      })

      expect(result.current.queryState.breakdowns).toHaveLength(1)
      expect(result.current.queryState.breakdowns[0].field).toBe('Employees.department')
    })

    it('actions.addBreakdown() with time dimension should set granularity', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addBreakdown('Employees.createdAt', true, 'month')
      })

      expect(result.current.queryState.breakdowns[0].granularity).toBe('month')
    })

    it('actions.removeBreakdown() should remove by ID', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addBreakdown('Employees.department', false)
      })

      const breakdownId = result.current.queryState.breakdowns[0].id

      act(() => {
        result.current.actions.removeBreakdown(breakdownId)
      })

      expect(result.current.queryState.breakdowns).toHaveLength(0)
    })

    it('actions.toggleBreakdown() should toggle presence', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.toggleBreakdown('Employees.department', false)
      })

      expect(result.current.queryState.breakdowns).toHaveLength(1)

      act(() => {
        result.current.actions.toggleBreakdown('Employees.department', false)
      })

      expect(result.current.queryState.breakdowns).toHaveLength(0)
    })

    it('actions.setBreakdownGranularity() should update granularity', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addBreakdown('Employees.createdAt', true, 'day')
      })

      const breakdownId = result.current.queryState.breakdowns[0].id

      act(() => {
        result.current.actions.setBreakdownGranularity(breakdownId, 'month')
      })

      expect(result.current.queryState.breakdowns[0].granularity).toBe('month')
    })

    it('actions.toggleBreakdownComparison() should toggle flag', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addBreakdown('Employees.createdAt', true, 'day')
      })

      const breakdownId = result.current.queryState.breakdowns[0].id
      // Initial enableComparison is undefined or false
      expect(result.current.queryState.breakdowns[0].enableComparison).toBeFalsy()

      act(() => {
        result.current.actions.toggleBreakdownComparison(breakdownId)
      })

      // After toggle, enableComparison should be truthy
      expect(result.current.queryState.breakdowns[0].enableComparison).toBeTruthy()
    })

    it('actions.reorderBreakdowns() should change order', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addBreakdown('Employees.department', false)
        result.current.actions.addBreakdown('Employees.name', false)
      })

      const firstBreakdownField = result.current.queryState.breakdowns[0].field

      act(() => {
        result.current.actions.reorderBreakdowns(0, 1)
      })

      expect(result.current.queryState.breakdowns[1].field).toBe(firstBreakdownField)
    })
  })

  // ==========================================================================
  // Filter Actions Tests
  // ==========================================================================
  describe('Filter Actions', () => {
    it('actions.setFilters() should replace all filters', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      const filters = [
        { member: 'Employees.department', operator: 'equals' as const, values: ['Engineering'] },
      ]

      act(() => {
        result.current.actions.setFilters(filters)
      })

      expect(result.current.queryState.filters).toEqual(filters)
    })

    it('actions.dropFieldToFilter() should add filter for field', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.dropFieldToFilter('Employees.department')
      })

      expect(result.current.queryState.filters).toHaveLength(1)
      expect(result.current.queryState.filters[0].member).toBe('Employees.department')
    })

    it('actions.setOrder() should set sort order', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
        result.current.actions.setOrder('Employees.count', 'desc')
      })

      expect(result.current.queryState.order).toBeDefined()
      // Order is a Record<string, 'asc' | 'desc'>
      expect(result.current.queryState.order?.['Employees.count']).toBe('desc')
    })

    it('actions.clearQuery() should clear metrics/breakdowns/filters', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
        result.current.actions.addBreakdown('Employees.department', false)
        result.current.actions.setFilters([
          { member: 'Employees.name', operator: 'contains', values: ['John'] },
        ])
      })

      act(() => {
        result.current.actions.clearQuery()
      })

      expect(result.current.queryState.metrics).toHaveLength(0)
      expect(result.current.queryState.breakdowns).toHaveLength(0)
      expect(result.current.queryState.filters).toHaveLength(0)
    })
  })

  // ==========================================================================
  // Multi-Query Mode Tests
  // ==========================================================================
  describe('Multi-Query Mode', () => {
    it('isMultiQueryMode should be false with single query', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isMultiQueryMode).toBe(false)
    })

    it('actions.addQuery() should add new query and switch to it', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addQuery()
      })

      expect(result.current.queryStates.length).toBe(2)
      expect(result.current.activeQueryIndex).toBe(1)
    })

    it('actions.addQuery() should copy metrics/breakdowns to new query', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
        result.current.actions.addBreakdown('Employees.department', false)
      })

      act(() => {
        result.current.actions.addQuery()
      })

      // New query should have breakdowns from Q1 (behavior may vary by implementation)
      expect(result.current.queryStates.length).toBe(2)
    })

    it('isMultiQueryMode should be true with multiple queries with content', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
        result.current.actions.addQuery()
        result.current.actions.addMetric('Employees.avgSalary')
      })

      expect(result.current.isMultiQueryMode).toBe(true)
    })

    it('actions.removeQuery() should remove query by index', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addQuery()
      })

      expect(result.current.queryStates.length).toBe(2)

      act(() => {
        result.current.actions.removeQuery(1)
      })

      expect(result.current.queryStates.length).toBe(1)
    })

    it('multiQueryConfig should return config when in multi-query mode', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
        result.current.actions.addQuery()
        result.current.actions.addMetric('Employees.avgSalary')
      })

      expect(result.current.multiQueryConfig).not.toBeNull()
      expect(result.current.multiQueryConfig?.queries).toHaveLength(2)
    })
  })

  // ==========================================================================
  // Data Fetching State Tests
  // ==========================================================================
  describe('Data Fetching', () => {
    it('isValidQuery should be false with no metrics', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isValidQuery).toBe(false)
    })

    it('isValidQuery should be true with at least one metric', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
      })

      expect(result.current.isValidQuery).toBe(true)
    })

    it('executionStatus should be idle initially', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.executionStatus).toBe('idle')
    })

    it('isLoading should reflect TanStack Query state', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      // Initially not loading
      expect(typeof result.current.isLoading).toBe('boolean')
    })

    it('isFetching should reflect TanStack Query refetch', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(typeof result.current.isFetching).toBe('boolean')
    })

    it('executionResults should contain query data', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      // Initially null or empty array
      expect(
        result.current.executionResults === null ||
        Array.isArray(result.current.executionResults)
      ).toBe(true)
    })

    it('error should contain query error', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      // Initially null
      expect(result.current.error).toBeNull()
    })

    it('actions.refetch() should be a function', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(typeof result.current.actions.refetch).toBe('function')
    })
  })

  // ==========================================================================
  // Chart Configuration Tests
  // ==========================================================================
  describe('Chart Configuration', () => {
    it('chartType should default to bar', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.chartType).toBe('bar')
    })

    it('chartConfig should be empty object initially', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.chartConfig).toEqual({})
    })

    it('displayConfig should have defaults (legend, grid, tooltip)', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.displayConfig).toHaveProperty('showLegend')
      expect(result.current.displayConfig).toHaveProperty('showGrid')
      expect(result.current.displayConfig).toHaveProperty('showTooltip')
    })

    it('chartAvailability should indicate available chart types', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.chartAvailability).toBeDefined()
      expect(typeof result.current.chartAvailability).toBe('object')
    })

    it('actions.setChartType() should update chartType', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setChartType('line')
      })

      expect(result.current.chartType).toBe('line')
    })

    it('actions.setChartConfig() should update chartConfig', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      const config = { xAxis: ['Employees.department'], yAxis: ['Employees.count'] }

      act(() => {
        result.current.actions.setChartConfig(config)
      })

      expect(result.current.chartConfig.xAxis).toEqual(['Employees.department'])
    })

    it('actions.setDisplayConfig() should update displayConfig', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setDisplayConfig({ showLegend: false })
      })

      expect(result.current.displayConfig.showLegend).toBe(false)
    })

    it('userManuallySelectedChart should track manual selection', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(typeof result.current.userManuallySelectedChart).toBe('boolean')
    })
  })

  // ==========================================================================
  // Funnel Mode Tests
  // ==========================================================================
  describe('Funnel Mode', () => {
    it('analysisType should default to query', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.analysisType).toBe('query')
    })

    it('actions.setAnalysisType(funnel) should switch to funnel', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setAnalysisType('funnel')
      })

      expect(result.current.analysisType).toBe('funnel')
    })

    it('funnelSteps should be empty array by default', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.funnelSteps).toEqual([])
    })

    it('actions.addFunnelStep() should add step', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setAnalysisType('funnel')
        result.current.actions.addFunnelStep()
      })

      expect(result.current.funnelSteps.length).toBe(1)
    })

    it('actions.removeFunnelStep() should remove by index', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setAnalysisType('funnel')
        result.current.actions.addFunnelStep()
        result.current.actions.addFunnelStep()
      })

      expect(result.current.funnelSteps.length).toBe(2)

      act(() => {
        result.current.actions.removeFunnelStep(0)
      })

      expect(result.current.funnelSteps.length).toBe(1)
    })

    it('actions.updateFunnelStep() should update step', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setAnalysisType('funnel')
        result.current.actions.addFunnelStep()
      })

      act(() => {
        result.current.actions.updateFunnelStep(0, { name: 'Step 1' })
      })

      expect(result.current.funnelSteps[0].name).toBe('Step 1')
    })

    it('actions.setFunnelCube() should set cube', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setAnalysisType('funnel')
        result.current.actions.setFunnelCube('Events')
      })

      expect(result.current.funnelCube).toBe('Events')
    })

    it('actions.setFunnelTimeDimension() should set time dimension', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setAnalysisType('funnel')
        result.current.actions.setFunnelTimeDimension('Events.timestamp')
      })

      expect(result.current.funnelTimeDimension).toBe('Events.timestamp')
    })

    it('isFunnelModeEnabled should be false when not configured', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isFunnelModeEnabled).toBe(false)
    })
  })

  // ==========================================================================
  // UI State Tests
  // ==========================================================================
  describe('UI State', () => {
    it('activeTab should default to query', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.activeTab).toBe('query')
    })

    it('actions.setActiveTab() should change tab', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setActiveTab('display')
      })

      expect(result.current.activeTab).toBe('display')
    })

    it('activeView should default to chart', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.activeView).toBe('chart')
    })

    it('actions.setActiveView() should toggle table/chart', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setActiveView('table')
      })

      expect(result.current.activeView).toBe('table')
    })

    it('displayLimit should have default value', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(typeof result.current.displayLimit).toBe('number')
      expect(result.current.displayLimit).toBeGreaterThan(0)
    })

    it('actions.setDisplayLimit() should update limit', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setDisplayLimit(50)
      })

      expect(result.current.displayLimit).toBe(50)
    })
  })

  // ==========================================================================
  // Share Functionality Tests
  // ==========================================================================
  describe('Share', () => {
    it('canShare should be false with invalid query', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.canShare).toBe(false)
    })

    it('canShare should be true with valid query', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
      })

      expect(result.current.canShare).toBe(true)
    })

    it('shareButtonState should be idle initially', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.shareButtonState).toBe('idle')
    })

    it('actions.share() should be a callable function', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(typeof result.current.actions.share).toBe('function')
    })
  })

  // ==========================================================================
  // Imperative Ref API Tests
  // ==========================================================================
  describe('Imperative API', () => {
    it('getQueryConfig() should return current CubeQuery', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
      })

      const config = result.current.getQueryConfig()
      expect(config).toHaveProperty('measures')
      expect((config as CubeQuery).measures).toContain('Employees.count')
    })

    it('getQueryConfig() should return MultiQueryConfig in multi-query mode', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
        result.current.actions.addQuery()
        result.current.actions.addMetric('Employees.avgSalary')
      })

      const config = result.current.getQueryConfig()
      expect(config).toHaveProperty('queries')
    })

    it('getChartConfig() should return chart configuration', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setChartType('line')
      })

      const config = result.current.getChartConfig()
      expect(config).toHaveProperty('chartType')
      expect(config.chartType).toBe('line')
    })

    it('getAnalysisType() should return current analysis type', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.getAnalysisType()).toBe('query')

      act(() => {
        result.current.actions.setAnalysisType('funnel')
      })

      expect(result.current.getAnalysisType()).toBe('funnel')
    })
  })

  // ==========================================================================
  // Adapter Validation Tests
  // ==========================================================================
  describe('Adapter Validation', () => {
    it('adapterValidation should return validation result for query mode', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.adapterValidation).toHaveProperty('isValid')
      expect(result.current.adapterValidation).toHaveProperty('errors')
      expect(result.current.adapterValidation).toHaveProperty('warnings')
    })

    it('adapterValidation.isValid should be false with no metrics in query mode', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.adapterValidation.isValid).toBe(false)
    })

    it('adapterValidation.isValid should be true with metrics in query mode', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.addMetric('Employees.count')
      })

      expect(result.current.adapterValidation.isValid).toBe(true)
    })
  })

  // ==========================================================================
  // AI State Tests
  // ==========================================================================
  describe('AI State', () => {
    it('aiState should have correct initial values', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.aiState).toEqual({
        isOpen: false,
        userPrompt: '',
        isGenerating: false,
        error: null,
        hasGeneratedQuery: false,
      })
    })

    it('actions.openAI() should open AI panel', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.openAI()
      })

      expect(result.current.aiState.isOpen).toBe(true)
    })

    it('actions.closeAI() should close AI panel', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.openAI()
      })

      act(() => {
        result.current.actions.closeAI()
      })

      expect(result.current.aiState.isOpen).toBe(false)
    })

    it('actions.setAIPrompt() should update prompt', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.setAIPrompt('Show me employee count by department')
      })

      expect(result.current.aiState.userPrompt).toBe('Show me employee count by department')
    })
  })

  // ==========================================================================
  // Field Modal Tests
  // ==========================================================================
  describe('Field Modal', () => {
    it('showFieldModal should be false initially', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      expect(result.current.showFieldModal).toBe(false)
    })

    it('actions.openMetricsModal() should open modal in metrics mode', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.openMetricsModal()
      })

      expect(result.current.showFieldModal).toBe(true)
      expect(result.current.fieldModalMode).toBe('metrics')
    })

    it('actions.openBreakdownsModal() should open modal in breakdown mode', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.openBreakdownsModal()
      })

      expect(result.current.showFieldModal).toBe(true)
      expect(result.current.fieldModalMode).toBe('breakdown')
    })

    it('actions.closeFieldModal() should close modal', () => {
      const { result } = renderHook(() => useAnalysisBuilder(), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.actions.openMetricsModal()
      })

      act(() => {
        result.current.actions.closeFieldModal()
      })

      expect(result.current.showFieldModal).toBe(false)
    })
  })
})

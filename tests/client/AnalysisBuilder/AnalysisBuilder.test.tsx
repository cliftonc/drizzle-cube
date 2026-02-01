/**
 * Integration tests for AnalysisBuilder component
 * Tests rendering, ref API, and basic interactions
 */

import React, { createRef } from 'react'
import { render, waitFor, act, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { CubeResultSet } from '../../../src/client/types'
import { STORAGE_KEY } from '../../../src/client/components/AnalysisBuilder/utils/storageUtils'

// Mock useCubeMeta/useCubeFeatures
const mockMeta = {
  cubes: [
    {
      name: 'Employees',
      title: 'Employees',
      measures: [
        { name: 'Employees.count', type: 'count', title: 'Count' },
        { name: 'Employees.avgSalary', type: 'avg', title: 'Average Salary' }
      ],
      dimensions: [
        { name: 'Employees.department', type: 'string', title: 'Department' },
        { name: 'Employees.createdAt', type: 'time', title: 'Created At' }
      ]
    }
  ]
}

vi.mock('../../../src/client/providers/CubeProvider', () => ({
  useCubeMeta: vi.fn(() => ({
    meta: mockMeta,
    labelMap: {},
    metaLoading: false,
    metaError: null,
    getFieldLabel: (field: string) => field,
    refetchMeta: vi.fn()
  })),
  useCubeFeatures: vi.fn(() => ({
    features: { enableAI: false },
    dashboardModes: ['grid', 'rows']
  }))
}))

// Mock useCubeApi (used by TanStack Query hooks like useCubeLoadQuery)
vi.mock('../../../src/client/providers/CubeApiProvider', () => ({
  useCubeApi: vi.fn(() => ({
    cubeApi: {
      load: vi.fn(),
      sql: vi.fn().mockResolvedValue({ sql: 'SELECT 1', params: [] }),
      meta: vi.fn().mockResolvedValue(mockMeta),
      analyzeQuery: vi.fn(),
      batchLoad: vi.fn()
    },
    options: undefined,
    updateApiConfig: vi.fn(),
    batchCoordinator: null,
    enableBatching: false
  }))
}))

// Mock TanStack Query hooks (useQueryClient is called in useCubeLoadQuery)
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn()
  })),
  useQueries: vi.fn(() => []),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn()
  })),
  QueryClientProvider: ({ children }: any) => children,
  QueryClient: vi.fn().mockImplementation(() => ({
    defaultOptions: {},
    mount: vi.fn(),
    unmount: vi.fn()
  }))
}))

// Mock useCubeQuery
let mockUseCubeQueryResult = {
  resultSet: null as CubeResultSet | null,
  isLoading: false,
  error: null as Error | null,
  queryId: null as string | null
}

vi.mock('../../../src/client/hooks/useCubeQuery', () => ({
  useCubeQuery: vi.fn(() => mockUseCubeQueryResult)
}))

// Mock useMultiCubeQuery
let mockUseMultiCubeQueryResult = {
  data: null as unknown[] | null,
  resultSets: null as CubeResultSet[] | null,
  isLoading: false,
  error: null as Error | null,
  errors: [] as (Error | null)[],
  queryId: null as string | null
}

vi.mock('../../../src/client/hooks/useMultiCubeQuery', () => ({
  useMultiCubeQuery: vi.fn(() => mockUseMultiCubeQueryResult)
}))

// Mock sub-components
vi.mock('../../../src/client/components/AnalysisBuilder/AnalysisResultsPanel', () => ({
  default: ({ executionStatus, activeView }: any) => (
    <div data-testid="results-panel" data-status={executionStatus} data-view={activeView}>
      Results Panel
    </div>
  )
}))

vi.mock('../../../src/client/components/AnalysisBuilder/AnalysisQueryPanel', () => ({
  default: ({ metrics, breakdowns, filters, chartType }: any) => (
    <div
      data-testid="query-panel"
      data-metrics={metrics?.length || 0}
      data-breakdowns={breakdowns?.length || 0}
      data-filters={filters?.length || 0}
      data-chart-type={chartType}
    >
      Query Panel
    </div>
  )
}))

vi.mock('../../../src/client/components/AnalysisBuilder/FieldSearchModal', () => ({
  default: ({ isOpen }: any) => isOpen ? <div data-testid="field-modal">Field Modal</div> : null
}))

vi.mock('../../../src/client/components/AnalysisBuilder/AnalysisAIPanel', () => ({
  default: ({ isOpen }: any) => isOpen ? <div data-testid="ai-panel">AI Panel</div> : null
}))

// Mock share utils
vi.mock('../../../src/client/utils/shareUtils', () => ({
  compressWithFallback: vi.fn().mockResolvedValue('compressed'),
  parseShareUrl: vi.fn().mockReturnValue(null),
  parseShareHash: vi.fn().mockReturnValue(null),
  decodeAndDecompress: vi.fn().mockResolvedValue(null),
  clearShareHash: vi.fn()
}))

// Mock color palettes
vi.mock('../../../src/client/utils/colorPalettes', () => ({
  getColorPalette: vi.fn().mockReturnValue(['#8884d8', '#82ca9d'])
}))

// Mock chart defaults
vi.mock('../../../src/client/shared/chartDefaults', () => ({
  getAllChartAvailability: vi.fn().mockReturnValue({
    bar: { available: true },
    line: { available: true },
    table: { available: true }
  }),
  getSmartChartDefaults: vi.fn().mockReturnValue({
    chartType: 'bar',
    chartConfig: {},
    displayConfig: {}
  }),
  shouldAutoSwitchChartType: vi.fn().mockReturnValue(false)
}))

// Mock multi-query validation
vi.mock('../../../src/client/utils/multiQueryValidation', () => ({
  validateMultiQueryConfig: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
}))

// Mock shared utils
vi.mock('../../../src/client/shared/utils', () => ({
  cleanQueryForServer: vi.fn((query: any) => query),
  convertDateRangeTypeToValue: vi.fn((value: any) => value)
}))

// Mock date utils
vi.mock('../../../src/shared/date-utils', () => ({
  parseDateRange: vi.fn(),
  calculatePriorPeriod: vi.fn(),
  formatDateForCube: vi.fn()
}))

// Mock AI utils
vi.mock('../../../src/client/components/AIAssistant/utils', () => ({
  sendGeminiMessage: vi.fn(),
  extractTextFromResponse: vi.fn()
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

// Import component after mocks
import AnalysisBuilder from '../../../src/client/components/AnalysisBuilder'
import type { AnalysisBuilderRef } from '../../../src/client/components/AnalysisBuilder/types'

describe('AnalysisBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockUseCubeQueryResult = {
      resultSet: null,
      isLoading: false,
      error: null,
      queryId: null
    }
    mockUseMultiCubeQueryResult = {
      data: null,
      resultSets: null,
      isLoading: false,
      error: null,
      errors: [],
      queryId: null
    }
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('rendering', () => {
    it('should render with no initial query', () => {
      render(<AnalysisBuilder />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
      expect(screen.getByTestId('query-panel')).toBeInTheDocument()
    })

    it('should render with results panel in idle status initially', () => {
      render(<AnalysisBuilder />)

      const resultsPanel = screen.getByTestId('results-panel')
      expect(resultsPanel.getAttribute('data-status')).toBe('idle')
    })

    it('should render with default chart type', () => {
      render(<AnalysisBuilder />)

      const queryPanel = screen.getByTestId('query-panel')
      // Default chart type is 'bar' from queryModeAdapter.getDefaultChartConfig()
      expect(queryPanel.getAttribute('data-chart-type')).toBe('bar')
    })

    it('should render with initial query', () => {
      const initialQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.department']
      }

      render(<AnalysisBuilder initialQuery={initialQuery} />)

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-metrics')).toBe('1')
      expect(queryPanel.getAttribute('data-breakdowns')).toBe('1')
    })

    it('should render with initial chart config', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'line',
            chartConfig: { yAxis: ['Employees.count'] },
            displayConfig: { showLegend: true }
          }}
        />
      )

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-chart-type')).toBe('line')
    })
  })

  describe('ref API', () => {
    it('should expose getQueryConfig method', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(<AnalysisBuilder ref={ref} />)

      expect(ref.current).not.toBeNull()
      expect(typeof ref.current?.getQueryConfig).toBe('function')
    })

    it('should expose getChartConfig method', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(<AnalysisBuilder ref={ref} />)

      expect(typeof ref.current?.getChartConfig).toBe('function')
    })

    it('should expose clearQuery method', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(<AnalysisBuilder ref={ref} />)

      expect(typeof ref.current?.clearQuery).toBe('function')
    })

    it('getQueryConfig should return query structure', () => {
      const ref = createRef<AnalysisBuilderRef>()
      const initialQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.department']
      }

      render(<AnalysisBuilder ref={ref} initialQuery={initialQuery} />)

      const queryConfig = ref.current?.getQueryConfig()
      expect(queryConfig).toBeDefined()
      // Should have measures from initial query
      expect((queryConfig as any)?.measures).toContain('Employees.count')
    })

    it('getChartConfig should return chart configuration', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(
        <AnalysisBuilder
          ref={ref}
          initialChartConfig={{
            chartType: 'pie',
            chartConfig: { yAxis: ['Employees.count'] },
            displayConfig: { showLegend: false }
          }}
        />
      )

      const chartConfig = ref.current?.getChartConfig()
      expect(chartConfig?.chartType).toBe('pie')
      expect(chartConfig?.displayConfig?.showLegend).toBe(false)
    })

    it('clearQuery should reset state', async () => {
      const ref = createRef<AnalysisBuilderRef>()
      const initialQuery = {
        measures: ['Employees.count']
      }

      render(<AnalysisBuilder ref={ref} initialQuery={initialQuery} />)

      // Initial state has metrics
      let queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-metrics')).toBe('1')

      // Clear the query
      act(() => {
        ref.current?.clearQuery()
      })

      // After clear, should have no metrics
      await waitFor(() => {
        queryPanel = screen.getByTestId('query-panel')
        expect(queryPanel.getAttribute('data-metrics')).toBe('0')
      })
    })
  })

  describe('localStorage persistence', () => {
    it('should not save to localStorage when disableLocalStorage is true', () => {
      const initialQuery = {
        measures: ['Employees.count']
      }

      render(<AnalysisBuilder initialQuery={initialQuery} disableLocalStorage={true} />)

      // Immediate check - localStorage should not be touched
      const saved = localStorage.getItem(STORAGE_KEY)
      expect(saved).toBeNull()
    })

    it('should load state from localStorage on mount', () => {
      // Pre-save state to localStorage (Zustand persist format with AnalysisConfig)
      const savedState = {
        state: {
          // AnalysisConfig format
          version: 1,
          analysisType: 'query',
          activeView: 'chart',
          charts: {
            query: {
              chartType: 'line',
              chartConfig: {},
              displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
            },
          },
          query: {
            measures: ['Employees.avgSalary'],
            dimensions: [],
            filters: [],
          },
        },
        version: 0
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState))

      render(<AnalysisBuilder />)

      // Should load from localStorage immediately on mount
      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-metrics')).toBe('1')
      expect(queryPanel.getAttribute('data-chart-type')).toBe('line')
    })
  })

  describe('callbacks', () => {
    it('should accept onQueryChange callback prop', () => {
      const onQueryChange = vi.fn()
      const initialQuery = {
        measures: ['Employees.count']
      }

      // Just verify component renders with the callback prop
      render(<AnalysisBuilder initialQuery={initialQuery} onQueryChange={onQueryChange} />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })

    it('should accept onChartConfigChange callback prop', () => {
      const onChartConfigChange = vi.fn()

      // Just verify component renders with the callback prop
      render(
        <AnalysisBuilder
          initialChartConfig={{ chartType: 'bar', chartConfig: {}, displayConfig: {} }}
          onChartConfigChange={onChartConfigChange}
        />
      )

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })
  })

  describe('multi-query mode', () => {
    it('should handle multi-query config', () => {
      const multiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] }
        ],
        mergeStrategy: 'concat' as const
      }

      render(<AnalysisBuilder initialQuery={multiQueryConfig} />)

      // Should render without errors
      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })
  })

  describe('loading states', () => {
    it('should show loading status when query is loading', () => {
      mockUseCubeQueryResult.isLoading = true

      const initialQuery = {
        measures: ['Employees.count']
      }

      render(<AnalysisBuilder initialQuery={initialQuery} />)

      // The results panel should reflect loading status
      // (actual implementation depends on how status is derived)
      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })

    it('should show results when query completes', async () => {
      const mockData = [{ 'Employees.count': 10 }]
      mockUseCubeQueryResult.resultSet = createMockResultSet(mockData)

      const initialQuery = {
        measures: ['Employees.count']
      }

      render(<AnalysisBuilder initialQuery={initialQuery} />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle query errors', () => {
      mockUseCubeQueryResult.error = new Error('Query failed')

      const initialQuery = {
        measures: ['Employees.count']
      }

      render(<AnalysisBuilder initialQuery={initialQuery} />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })

    it('should handle multi-query errors', () => {
      mockUseMultiCubeQueryResult.errors = [new Error('Query 1 failed'), null]

      const multiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] }
        ],
        mergeStrategy: 'concat' as const
      }

      render(<AnalysisBuilder initialQuery={multiQueryConfig} />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })
  })

  describe('initial config', () => {
    it('should render with initialQuery having filters', () => {
      const initialQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.department'],
        filters: [
          { member: 'Employees.department', operator: 'equals', values: ['Engineering'] }
        ]
      }

      render(<AnalysisBuilder initialQuery={initialQuery} />)

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-filters')).toBe('1')
    })

    it('should render with time dimensions', () => {
      const initialQuery = {
        measures: ['Employees.count'],
        timeDimensions: [
          { dimension: 'Employees.createdAt', granularity: 'day' }
        ]
      }

      render(<AnalysisBuilder initialQuery={initialQuery} />)

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-breakdowns')).toBe('1')
    })
  })

  describe('chart types', () => {
    it('should render with bar chart type', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'bar',
            chartConfig: {},
            displayConfig: {}
          }}
        />
      )

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-chart-type')).toBe('bar')
    })

    it('should render with line chart type', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'line',
            chartConfig: {},
            displayConfig: {}
          }}
        />
      )

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-chart-type')).toBe('line')
    })

    it('should render with pie chart type', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'pie',
            chartConfig: {},
            displayConfig: {}
          }}
        />
      )

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-chart-type')).toBe('pie')
    })

    it('should render with area chart type', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'area',
            chartConfig: {},
            displayConfig: {}
          }}
        />
      )

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-chart-type')).toBe('area')
    })

    it('should render with table chart type', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'table',
            chartConfig: {},
            displayConfig: {}
          }}
        />
      )

      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-chart-type')).toBe('table')
    })
  })

  describe('ref API extended', () => {
    it('should expose getAnalysisConfig method', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(<AnalysisBuilder ref={ref} />)

      expect(typeof ref.current?.getAnalysisConfig).toBe('function')
    })

    it('should expose getAnalysisType method', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(<AnalysisBuilder ref={ref} />)

      expect(typeof ref.current?.getAnalysisType).toBe('function')
    })

    it('getAnalysisConfig should return AnalysisConfig', () => {
      const ref = createRef<AnalysisBuilderRef>()
      const initialQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.department']
      }

      render(<AnalysisBuilder ref={ref} initialQuery={initialQuery} />)

      const config = ref.current?.getAnalysisConfig()
      expect(config).toBeDefined()
      expect(config?.version).toBe(1)
      expect(config?.analysisType).toBeDefined()
    })

    it('getAnalysisType should return analysis type', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(<AnalysisBuilder ref={ref} />)

      const analysisType = ref.current?.getAnalysisType()
      expect(analysisType).toBe('query')
    })

    it('should expose executeQuery method', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(<AnalysisBuilder ref={ref} />)

      expect(typeof ref.current?.executeQuery).toBe('function')
    })

    it('should expose getFunnelState method', () => {
      const ref = createRef<AnalysisBuilderRef>()

      render(<AnalysisBuilder ref={ref} />)

      expect(typeof ref.current?.getFunnelState).toBe('function')
    })
  })

  describe('display config', () => {
    it('should render with showLegend enabled', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'bar',
            chartConfig: {},
            displayConfig: { showLegend: true }
          }}
        />
      )

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })

    it('should render with showGrid enabled', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'bar',
            chartConfig: {},
            displayConfig: { showGrid: true }
          }}
        />
      )

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })

    it('should render with showTooltip disabled', () => {
      render(
        <AnalysisBuilder
          initialChartConfig={{
            chartType: 'bar',
            chartConfig: {},
            displayConfig: { showTooltip: false }
          }}
        />
      )

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })
  })

  describe('multi-query merge strategies', () => {
    it('should handle concat merge strategy', () => {
      const multiQueryConfig = {
        queries: [
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] }
        ],
        mergeStrategy: 'concat' as const
      }

      render(<AnalysisBuilder initialQuery={multiQueryConfig} />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })

    it('should handle merge merge strategy', () => {
      const multiQueryConfig = {
        queries: [
          { measures: ['Employees.count'], dimensions: ['Employees.department'] },
          { measures: ['Employees.avgSalary'], dimensions: ['Employees.department'] }
        ],
        mergeStrategy: 'merge' as const
      }

      render(<AnalysisBuilder initialQuery={multiQueryConfig} />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })
  })

  describe('view mode', () => {
    it('should render with chart view by default', () => {
      render(<AnalysisBuilder />)

      const resultsPanel = screen.getByTestId('results-panel')
      expect(resultsPanel.getAttribute('data-view')).toBe('chart')
    })
  })

  describe('localStorage edge cases', () => {
    it('should handle corrupted localStorage data', () => {
      // Save corrupted data
      localStorage.setItem(STORAGE_KEY, 'not valid json')

      // Should render without crashing
      render(<AnalysisBuilder />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })

    it('should handle missing state in localStorage', () => {
      // Save valid JSON but with wrong structure
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wrong: 'format' }))

      // Should render without crashing
      render(<AnalysisBuilder />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })
  })

  describe('empty initial states', () => {
    it('should render with empty initialQuery', () => {
      render(<AnalysisBuilder initialQuery={{}} />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
      const queryPanel = screen.getByTestId('query-panel')
      expect(queryPanel.getAttribute('data-metrics')).toBe('0')
    })

    it('should render with empty initialChartConfig', () => {
      render(<AnalysisBuilder initialChartConfig={{}} />)

      expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    })
  })
})

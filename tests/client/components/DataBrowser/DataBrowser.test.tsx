/**
 * Tests for DataBrowser component
 * Covers rendering, cube selection, sorting, pagination, and column management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataBrowser from '../../../../src/client/components/DataBrowser'
import type { CubeMeta, CubeQuery } from '../../../../src/client/types'

// Mock metadata
const mockMeta: CubeMeta = {
  cubes: [
    {
      name: 'Employees',
      title: 'Employees',
      measures: [
        { name: 'Employees.totalSalary', type: 'number', title: 'Total Salary', shortTitle: 'Total Salary' },
      ],
      dimensions: [
        { name: 'Employees.id', type: 'number', title: 'ID', shortTitle: 'ID' },
        { name: 'Employees.name', type: 'string', title: 'Name', shortTitle: 'Name' },
        { name: 'Employees.email', type: 'string', title: 'Email', shortTitle: 'Email' },
      ],
      segments: [],
    },
    {
      name: 'Departments',
      title: 'Departments',
      measures: [],
      dimensions: [
        { name: 'Departments.id', type: 'number', title: 'ID', shortTitle: 'ID' },
        { name: 'Departments.name', type: 'string', title: 'Name', shortTitle: 'Name' },
      ],
      segments: [],
    },
  ],
}

// Mock employee data
const mockEmployeesData = [
  { 'Employees.id': 1, 'Employees.name': 'Alice', 'Employees.email': 'alice@test.com' },
  { 'Employees.id': 2, 'Employees.name': 'Bob', 'Employees.email': 'bob@test.com' },
  { 'Employees.id': 3, 'Employees.name': 'Charlie', 'Employees.email': 'charlie@test.com' },
]

const { capturedQueries } = vi.hoisted(() => ({
  capturedQueries: [] as Array<CubeQuery | null>,
}))

function latestQuery(): CubeQuery | null {
  return capturedQueries[capturedQueries.length - 1] ?? null
}

// Mock CubeProvider hooks
vi.mock('../../../../src/client/providers/CubeProvider', () => ({
  useCubeMeta: vi.fn(() => ({
    meta: mockMeta,
    labelMap: {},
    metaLoading: false,
    metaError: null,
    getFieldLabel: (field: string) => {
      // Find the field in metadata and return its title
      for (const cube of mockMeta.cubes) {
        for (const dim of cube.dimensions) {
          if (dim.name === field) return dim.title
        }
        for (const meas of cube.measures) {
          if (meas.name === field) return meas.title
        }
      }
      return field
    },
    refetchMeta: vi.fn(),
  })),
  useCubeFeatures: vi.fn(() => ({
    features: {},
    dashboardModes: ['grid'],
  })),
}))

// Mock useCubeLoadQuery to return data without network calls
const mockRefetch = vi.fn()
let mockQueryResponse: {
  rawData: unknown[] | null
  isLoading: boolean
  isFetching: boolean
  isDebouncing: boolean
  error: Error | null
} = {
  rawData: null,
  isLoading: false,
  isFetching: false,
  isDebouncing: false,
  error: null,
}

vi.mock('../../../../src/client/hooks/queries/useCubeLoadQuery', () => ({
  useCubeLoadQuery: vi.fn((_query: CubeQuery | null, _options?: unknown) => {
    capturedQueries.push(_query)
    return {
      resultSet: null,
      rawData: mockQueryResponse.rawData,
      isLoading: mockQueryResponse.isLoading,
      isFetching: mockQueryResponse.isFetching,
      isDebouncing: mockQueryResponse.isDebouncing,
      error: mockQueryResponse.error,
      debouncedQuery: _query,
      isValidQuery: !!_query,
      refetch: mockRefetch,
      clearCache: vi.fn(),
      needsRefresh: false,
      executeQuery: vi.fn(),
      warnings: undefined,
    }
  }),
}))

describe('DataBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    capturedQueries.length = 0
    mockQueryResponse = {
      rawData: null,
      isLoading: false,
      isFetching: false,
      isDebouncing: false,
      error: null,
    }
  })

  describe('Initial rendering', () => {
    it('should render the sidebar with cube list sorted alphabetically', () => {
      render(<DataBrowser />)

      expect(screen.getByText('Cubes')).toBeInTheDocument()
      // Departments comes before Employees alphabetically
      const buttons = screen.getAllByRole('button').filter(b =>
        b.textContent === 'Departments' || b.textContent === 'Employees'
      )
      expect(buttons).toHaveLength(2)
      expect(buttons[0].textContent).toBe('Departments')
      expect(buttons[1].textContent).toBe('Employees')
    })

    it('should show "Select a cube" message when no cube is selected', () => {
      render(<DataBrowser />)
      expect(screen.getByText('Select a cube')).toBeInTheDocument()
    })

    it('should render search input in sidebar', () => {
      render(<DataBrowser />)
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('should not show toolbar when no cube is selected', () => {
      render(<DataBrowser />)
      expect(screen.queryByText('Filters')).not.toBeInTheDocument()
      expect(screen.queryByText('Columns')).not.toBeInTheDocument()
    })
  })

  describe('Cube selection', () => {
    it('should show toolbar after clicking a cube', async () => {
      mockQueryResponse.rawData = mockEmployeesData
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))

      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Columns')).toBeInTheDocument()
    })

    it('should show data table after clicking a cube', async () => {
      mockQueryResponse.rawData = mockEmployeesData
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
    })

    it('should show column headers with field labels', async () => {
      mockQueryResponse.rawData = mockEmployeesData
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))

      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should show row count in toolbar', async () => {
      mockQueryResponse.rawData = mockEmployeesData
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))

      expect(screen.getByText('3 rows')).toBeInTheDocument()
    })

    it('should show loading indicator when data is null', async () => {
      mockQueryResponse.rawData = null
      mockQueryResponse.isFetching = true
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))

      expect(screen.getByText('Loading data...')).toBeInTheDocument()
    })
  })

  describe('Sidebar search', () => {
    it('should filter cubes by search term', async () => {
      const user = userEvent.setup()
      render(<DataBrowser />)

      await user.type(screen.getByPlaceholderText('Search...'), 'Dep')

      expect(screen.getByText('Departments')).toBeInTheDocument()
      expect(screen.queryByText('Employees')).not.toBeInTheDocument()
    })

    it('should show "No cubes found" for unmatched search', async () => {
      const user = userEvent.setup()
      render(<DataBrowser />)

      await user.type(screen.getByPlaceholderText('Search...'), 'zzzzz')

      expect(screen.getByText('No cubes found')).toBeInTheDocument()
    })
  })

  describe('Quick search', () => {
    it('should render row search input in the filter panel', async () => {
      const user = userEvent.setup()
      render(<DataBrowser />)

      await user.click(screen.getByText('Employees'))
      await user.click(screen.getByText('Filters'))

      expect(screen.getByPlaceholderText('Search rows...')).toBeInTheDocument()
    })

    it('should search all string dimensions and exclude numeric dimensions', async () => {
      const user = userEvent.setup()
      render(<DataBrowser />)

      await user.click(screen.getByText('Employees'))
      await user.click(screen.getByText('Filters'))
      await user.type(screen.getByPlaceholderText('Search rows...'), 'alice')

      await waitFor(() => {
        expect(latestQuery()?.filters).toEqual([
          {
            type: 'or',
            filters: [
              { member: 'Employees.name', operator: 'contains', values: ['alice'] },
              { member: 'Employees.email', operator: 'contains', values: ['alice'] },
            ],
          },
        ])
      })
    })

    it('should clear quick-search filters with the clear button', async () => {
      const user = userEvent.setup()
      render(<DataBrowser />)

      await user.click(screen.getByText('Employees'))
      await user.click(screen.getByText('Filters'))
      await user.type(screen.getByPlaceholderText('Search rows...'), 'alice')
      await user.click(screen.getByRole('button', { name: 'Clear search' }))

      await waitFor(() => {
        expect(latestQuery()?.filters).toBeUndefined()
      })
    })
  })

  describe('Pagination', () => {
    it('should show page size selector', async () => {
      mockQueryResponse.rawData = mockEmployeesData
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))

      expect(screen.getByDisplayValue('20')).toBeInTheDocument()
    })

    it('should use defaultPageSize prop', async () => {
      mockQueryResponse.rawData = mockEmployeesData
      const user = userEvent.setup()

      render(<DataBrowser defaultPageSize={50} />)
      await user.click(screen.getByText('Employees'))

      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    })

    it('should show pagination controls', async () => {
      mockQueryResponse.rawData = mockEmployeesData
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))

      // Page size selector exists
      expect(screen.getByDisplayValue('20')).toBeInTheDocument()
      // Row count shown
      expect(screen.getByText('3 rows')).toBeInTheDocument()
    })
  })

  describe('Custom loading component', () => {
    it('should use custom loading component when provided', async () => {
      mockQueryResponse.rawData = null
      mockQueryResponse.isFetching = true

      const user = userEvent.setup()
      render(
        <DataBrowser loadingComponent={<div data-testid="custom-loader">Custom!</div>} />
      )

      await user.click(screen.getByText('Employees'))

      expect(screen.getByTestId('custom-loader')).toBeInTheDocument()
      expect(screen.queryByText('Loading data...')).not.toBeInTheDocument()
    })

    it('should show default loading indicator when no custom component', async () => {
      mockQueryResponse.rawData = null
      mockQueryResponse.isFetching = true

      const user = userEvent.setup()
      render(<DataBrowser />)

      await user.click(screen.getByText('Employees'))

      expect(screen.getByText('Loading data...')).toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('should accept className prop', () => {
      const { container } = render(<DataBrowser className="my-custom-class" />)
      const wrapper = container.firstElementChild
      expect(wrapper?.className).toContain('my-custom-class')
    })
  })
})

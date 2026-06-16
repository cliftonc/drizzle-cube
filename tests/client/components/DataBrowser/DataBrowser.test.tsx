/**
 * Tests for DataBrowser component
 * Covers rendering, cube selection, sorting, pagination, and column management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataBrowser from '../../../../src/client/components/DataBrowser'
import { DataBrowserStoreProvider } from '../../../../src/client/stores/dataBrowserStore'
import { useDataBrowser } from '../../../../src/client/hooks/useDataBrowser'
import { useCubeLoadQuery } from '../../../../src/client/hooks/queries/useCubeLoadQuery'
import type { CubeMeta, Filter } from '../../../../src/client/types'

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
        { name: 'Employees.active', type: 'boolean', title: 'Active', shortTitle: 'Active' },
        { name: 'Employees.hiredAt', type: 'time', title: 'Hired At', shortTitle: 'Hired At' },
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
    {
      name: 'AuditEvents',
      title: 'Audit Events',
      measures: [],
      dimensions: [
        { name: 'AuditEvents.id', type: 'number', title: 'ID', shortTitle: 'ID' },
        { name: 'AuditEvents.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created At' },
        { name: 'AuditEvents.success', type: 'boolean', title: 'Success', shortTitle: 'Success' },
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
  useCubeLoadQuery: vi.fn((_query: unknown, _options?: unknown) => ({
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
  })),
}))

const getLastLoadQueryArgument = () => {
  const calls = vi.mocked(useCubeLoadQuery).mock.calls
  return calls[calls.length - 1]?.[0]
}

describe('DataBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
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
      // Audit Events comes before Departments and Employees alphabetically
      const buttons = screen.getAllByRole('button').filter(b =>
        b.textContent === 'Audit Events' || b.textContent === 'Departments' || b.textContent === 'Employees'
      )
      expect(buttons).toHaveLength(3)
      expect(buttons[0].textContent).toBe('Audit Events')
      expect(buttons[1].textContent).toBe('Departments')
      expect(buttons[2].textContent).toBe('Employees')
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
    it('should render a translated quick search input after selecting a cube', async () => {
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))

      expect(screen.getByPlaceholderText('Search rows...')).toBeInTheDocument()
    })

    it('should build an OR contains filter for string dimensions only', async () => {
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))
      await user.type(screen.getByPlaceholderText('Search rows...'), 'ali')

      await waitFor(() => {
        expect(getLastLoadQueryArgument()).toMatchObject({
          filters: [
            {
              type: 'or',
              filters: [
                { member: 'Employees.name', operator: 'contains', values: ['ali'] },
                { member: 'Employees.email', operator: 'contains', values: ['ali'] },
              ],
            },
          ],
        })
      })
      const searchFilters = (getLastLoadQueryArgument() as { filters?: unknown[] }).filters
      expect(JSON.stringify(searchFilters)).not.toContain('Employees.id')
      expect(JSON.stringify(searchFilters)).not.toContain('Employees.active')
      expect(JSON.stringify(searchFilters)).not.toContain('Employees.hiredAt')
    })

    it('should clear the quick search from the query', async () => {
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Employees'))
      await user.type(screen.getByPlaceholderText('Search rows...'), 'ali')

      await waitFor(() => {
        expect(getLastLoadQueryArgument()).toHaveProperty('filters')
      })

      await user.click(screen.getByRole('button', { name: 'Clear search' }))

      await waitFor(() => {
        expect(getLastLoadQueryArgument()).not.toHaveProperty('filters')
      })
      expect(screen.getByPlaceholderText('Search rows...')).toHaveValue('')
    })

    it('should not create a search filter when the selected cube has no text dimensions', async () => {
      const user = userEvent.setup()

      render(<DataBrowser />)
      await user.click(screen.getByText('Audit Events'))
      await user.type(screen.getByPlaceholderText('Search rows...'), 'ali')

      await waitFor(() => {
        expect(getLastLoadQueryArgument()).not.toHaveProperty('filters')
      })
    })

    it('should AND quick search with structured filters', async () => {
      const structuredFilter: Filter = { member: 'Employees.active', operator: 'equals', values: [true] }

      function Harness() {
        const {
          query,
          selectCube,
          setFilters,
          setSearchText,
        } = useDataBrowser()

        useEffect(() => {
          selectCube('Employees', ['Employees.id', 'Employees.name', 'Employees.email'])
          setFilters([structuredFilter])
          setSearchText('ali')
        }, [selectCube, setFilters, setSearchText])

        return <pre data-testid="query">{JSON.stringify(query)}</pre>
      }

      render(
        <DataBrowserStoreProvider>
          <Harness />
        </DataBrowserStoreProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('query').textContent).toContain('Employees.name')
      })

      expect(JSON.parse(screen.getByTestId('query').textContent || 'null')).toMatchObject({
        filters: [
          {
            type: 'and',
            filters: [
              structuredFilter,
              {
                type: 'or',
                filters: [
                  { member: 'Employees.name', operator: 'contains', values: ['ali'] },
                  { member: 'Employees.email', operator: 'contains', values: ['ali'] },
                ],
              },
            ],
          },
        ],
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

/**
 * ReadOnlyFilterList Component Tests
 *
 * Tests for the read-only filter list component which displays filters
 * with interactive value selectors but no edit/delete capabilities.
 * Supports both regular filters and universal time filters.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReadOnlyFilterList from '../../../../src/client/components/DashboardFilters/ReadOnlyFilterList'
import type { DashboardFilter, CubeMeta, SimpleFilter } from '../../../../src/client/types'
import type { MetaResponse } from '../../../../src/client/shared/types'
import { renderWithProviders } from '../../../client-setup/test-utils'

// Mock the child components to simplify testing
vi.mock('../../../../src/client/components/shared/FilterItem', () => ({
  default: function MockFilterItem({
    filter,
    onFilterChange,
    hideFieldSelector,
    hideOperatorSelector,
    hideRemoveButton,
  }: {
    filter: SimpleFilter
    index: number
    onFilterChange: (index: number, filter: SimpleFilter) => void
    onFilterRemove: () => void
    schema: MetaResponse | null
    query: object
    hideFieldSelector?: boolean
    hideOperatorSelector?: boolean
    hideRemoveButton?: boolean
  }) {
    return (
      <div data-testid={`filter-item-${filter.member}`}>
        <div data-testid="filter-field">{filter.member}</div>
        <div data-testid="filter-operator">{filter.operator}</div>
        <div data-testid="filter-values">{filter.values?.join(', ')}</div>
        <div data-testid="hide-flags">
          {hideFieldSelector && 'hideField '}
          {hideOperatorSelector && 'hideOperator '}
          {hideRemoveButton && 'hideRemove'}
        </div>
        <button
          data-testid="change-filter-btn"
          onClick={() => onFilterChange(0, { ...filter, values: ['newValue'] })}
        >
          Change Filter
        </button>
      </div>
    )
  },
}))

vi.mock('../../../../src/client/components/shared/DateRangeSelector', () => ({
  default: function MockDateRangeSelector({
    timeDimension,
    currentDateRange,
    onDateRangeChange,
    hideFieldSelector,
    hideRemoveButton,
  }: {
    timeDimension: string
    availableTimeDimensions: string[]
    currentDateRange?: string | string[]
    onDateRangeChange: (timeDim: string, dateRange: string | string[]) => void
    onTimeDimensionChange: () => void
    onRemove: () => void
    hideFieldSelector?: boolean
    hideRemoveButton?: boolean
  }) {
    const displayRange = Array.isArray(currentDateRange)
      ? currentDateRange.join(' to ')
      : currentDateRange || '(not set)'

    return (
      <div data-testid={`date-range-selector-${timeDimension}`}>
        <div data-testid="date-range-value">{displayRange}</div>
        <div data-testid="date-hide-flags">
          {hideFieldSelector && 'hideField '}
          {hideRemoveButton && 'hideRemove'}
        </div>
        <button
          data-testid="change-date-btn"
          onClick={() => onDateRangeChange(timeDimension, 'last 30 days')}
        >
          Change Date
        </button>
      </div>
    )
  },
}))

// Mock schema
const mockCubeMeta: CubeMeta = {
  cubes: [
    {
      name: 'Users',
      title: 'Users',
      description: 'User data',
      measures: [
        { name: 'Users.count', type: 'count', title: 'Count', shortTitle: 'Count' },
      ],
      dimensions: [
        { name: 'Users.status', type: 'string', title: 'Status', shortTitle: 'Status' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created At' },
      ],
      segments: [],
    },
  ],
}

describe('ReadOnlyFilterList', () => {
  const createSimpleFilter = (
    member: string,
    operator: string,
    values: any[],
    dateRange?: string | string[]
  ): SimpleFilter => ({
    member,
    operator: operator as any,
    values,
    ...(dateRange && { dateRange }),
  })

  const createDashboardFilter = (
    id: string,
    label: string,
    filter: SimpleFilter,
    isUniversalTime = false
  ): DashboardFilter => ({
    id,
    label,
    filter,
    isUniversalTime,
  })

  const mockConvertToMetaResponse = vi.fn((cubeMeta: CubeMeta | null): MetaResponse | null => {
    if (!cubeMeta) return null
    return {
      cubes: cubeMeta.cubes.map((cube) => ({
        name: cube.name,
        title: cube.title || cube.name,
        description: cube.description || '',
        measures: cube.measures.map((m) => ({
          name: m.name,
          title: m.title || m.name,
          type: m.type,
          description: '',
          shortTitle: m.shortTitle || m.title || m.name,
        })),
        dimensions: cube.dimensions.map((d) => ({
          name: d.name,
          title: d.title || d.name,
          type: d.type,
          description: '',
          shortTitle: d.shortTitle || d.title || d.name,
        })),
        segments: [],
      })),
    }
  })

  const mockIsTimeDimensionField = vi.fn((fieldName: string) => {
    return fieldName.includes('createdAt') || fieldName === '__universal_time__'
  })

  const defaultProps = {
    dashboardFilters: [] as DashboardFilter[],
    schema: mockCubeMeta,
    onFilterChange: vi.fn(),
    onDateRangeChange: vi.fn(),
    convertToMetaResponse: mockConvertToMetaResponse,
    isTimeDimensionField: mockIsTimeDimensionField,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('should return null when no filters exist', () => {
      const { container } = render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={[]} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('header display', () => {
    it('should render "Filters" header when filters exist', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('should show filter count badge', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region', createSimpleFilter('Users.region', 'equals', ['US'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('regular filter rendering', () => {
    it('should render FilterItem for regular string filters', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByTestId('filter-item-Users.status')).toBeInTheDocument()
    })

    it('should render filter label above FilterItem', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Label should be in uppercase styling
      expect(screen.getByText('Status Filter')).toBeInTheDocument()
    })

    it('should hide field selector in read-only mode', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByText(/hideField/)).toBeInTheDocument()
    })

    it('should hide operator selector in read-only mode', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByText(/hideOperator/)).toBeInTheDocument()
    })

    it('should hide remove button in read-only mode', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByText(/hideRemove/)).toBeInTheDocument()
    })

    it('should call onFilterChange when filter value is changed', async () => {
      const user = userEvent.setup()
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]
      const onFilterChange = vi.fn()

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} onFilterChange={onFilterChange} />)

      await user.click(screen.getByTestId('change-filter-btn'))

      expect(onFilterChange).toHaveBeenCalledWith(
        'filter-1',
        expect.objectContaining({
          filter: expect.objectContaining({
            values: ['newValue'],
          }),
        })
      )
    })
  })

  describe('time dimension filter rendering', () => {
    it('should render DateRangeSelector for time dimension filters with inDateRange', () => {
      const filters = [
        createDashboardFilter(
          'filter-1',
          'Created Date',
          createSimpleFilter('Users.createdAt', 'inDateRange', [], 'last 7 days')
        ),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByTestId('date-range-selector-Users.createdAt')).toBeInTheDocument()
    })

    it('should display current date range value', () => {
      const filters = [
        createDashboardFilter(
          'filter-1',
          'Created Date',
          createSimpleFilter('Users.createdAt', 'inDateRange', [], 'last 30 days')
        ),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByText('last 30 days')).toBeInTheDocument()
    })

    it('should call onDateRangeChange when date range is changed', async () => {
      const user = userEvent.setup()
      const filters = [
        createDashboardFilter(
          'filter-1',
          'Created Date',
          createSimpleFilter('Users.createdAt', 'inDateRange', [], 'last 7 days')
        ),
      ]
      const onDateRangeChange = vi.fn()

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} onDateRangeChange={onDateRangeChange} />)

      await user.click(screen.getByTestId('change-date-btn'))

      expect(onDateRangeChange).toHaveBeenCalledWith('filter-1', 'last 30 days')
    })
  })

  describe('universal time filter rendering', () => {
    it('should render DateRangeSelector for universal time filters', () => {
      const filters = [
        createDashboardFilter(
          'filter-1',
          'Date Range',
          createSimpleFilter('__universal_time__', 'inDateRange', ['last 7 days'], 'last 7 days'),
          true // isUniversalTime
        ),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Universal time uses special dimension name
      expect(screen.getByTestId('date-range-selector-__universal_time__')).toBeInTheDocument()
    })

    it('should render time icon for universal time filter label', () => {
      const filters = [
        createDashboardFilter(
          'filter-1',
          'Date Range',
          createSimpleFilter('__universal_time__', 'inDateRange', ['last 7 days'], 'last 7 days'),
          true
        ),
      ]

      const { container } = render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Should have an icon rendered for universal time
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
    })

    it('should handle date range from values when dateRange property not set', () => {
      const filters = [
        createDashboardFilter(
          'filter-1',
          'Date Range',
          createSimpleFilter('__universal_time__', 'inDateRange', ['last 14 days']),
          true
        ),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByText('last 14 days')).toBeInTheDocument()
    })

    it('should handle array date range from values', () => {
      const filters = [
        createDashboardFilter(
          'filter-1',
          'Date Range',
          createSimpleFilter('__universal_time__', 'inDateRange', ['2024-01-01', '2024-01-31']),
          true
        ),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Array should be displayed as "start to end"
      expect(screen.getByText('2024-01-01 to 2024-01-31')).toBeInTheDocument()
    })
  })

  describe('group filter handling', () => {
    it('should not render group filters', () => {
      const groupFilter: DashboardFilter = {
        id: 'group-1',
        label: 'Group Filter',
        filter: {
          type: 'and',
          filters: [createSimpleFilter('Users.status', 'equals', ['active'])],
        },
      }

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={[groupFilter]} />)

      // Group filters should be skipped (return null for them)
      // Only the header might render if filters array is non-empty
      expect(screen.queryByTestId('filter-item-Users.status')).not.toBeInTheDocument()
    })
  })

  describe('grid layout', () => {
    it('should render filters in a responsive grid', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region', createSimpleFilter('Users.region', 'equals', ['US'])),
      ]

      const { container } = render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Check for grid classes
      const gridContainer = container.querySelector('.dc\\:grid')
      expect(gridContainer).toBeInTheDocument()
    })

    it('should have responsive column classes', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      const { container } = render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Check for responsive grid classes
      const gridContainer = container.querySelector('.dc\\:md\\:grid-cols-2')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('multiple filters', () => {
    it('should render all filter types correctly', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter(
          'filter-2',
          'Created Date',
          createSimpleFilter('Users.createdAt', 'inDateRange', [], 'last 7 days')
        ),
        createDashboardFilter(
          'filter-3',
          'Date Range',
          createSimpleFilter('__universal_time__', 'inDateRange', ['last 30 days']),
          true
        ),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Regular filter
      expect(screen.getByTestId('filter-item-Users.status')).toBeInTheDocument()
      // Time dimension filter
      expect(screen.getByTestId('date-range-selector-Users.createdAt')).toBeInTheDocument()
      // Universal time filter
      expect(screen.getByTestId('date-range-selector-__universal_time__')).toBeInTheDocument()
    })

    it('should display correct filter count for multiple filters', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region', createSimpleFilter('Users.region', 'equals', ['US'])),
        createDashboardFilter('filter-3', 'Category', createSimpleFilter('Users.category', 'equals', ['premium'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('schema handling', () => {
    it('should pass converted schema to FilterItem', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // convertToMetaResponse should have been called
      expect(mockConvertToMetaResponse).toHaveBeenCalledWith(mockCubeMeta)
    })

    it('should handle null schema gracefully', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} schema={null} />)

      // Should still render (convertToMetaResponse returns null)
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have accessible labels for each filter', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Filter label should have title attribute
      const label = screen.getByTitle('Status Filter')
      expect(label).toBeInTheDocument()
    })

    it('should have title attribute for universal time filter indicating scope', () => {
      const filters = [
        createDashboardFilter(
          'filter-1',
          'Date Range',
          createSimpleFilter('__universal_time__', 'inDateRange', ['last 7 days']),
          true
        ),
      ]

      render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Universal time should have tooltip explaining it applies to all time dimensions
      const label = screen.getByTitle(/applies to all time dimensions/i)
      expect(label).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have padding on container', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      const { container } = render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      const mainContainer = container.querySelector('.dc\\:px-4')
      expect(mainContainer).toBeInTheDocument()
    })

    it('should have filter icon in header', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      const { container } = render(<ReadOnlyFilterList {...defaultProps} dashboardFilters={filters} />)

      // Should have SVG icons
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
    })
  })
})

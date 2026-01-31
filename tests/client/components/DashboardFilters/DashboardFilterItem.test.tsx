/**
 * DashboardFilterItem Component Tests
 *
 * Tests for the dashboard filter item component which displays filters as
 * compact chips with field type icons, labels, operators, and value previews.
 * Supports both universal time filters and regular dimension/measure filters.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DashboardFilterItem from '../../../../src/client/components/DashboardFilters/DashboardFilterItem'
import type { DashboardFilter, SimpleFilter } from '../../../../src/client/types'
import type { MetaResponse } from '../../../../src/client/shared/types'

// Mock schema with different field types
const mockSchema: MetaResponse = {
  cubes: [
    {
      name: 'Users',
      title: 'Users',
      description: 'User data',
      measures: [
        { name: 'Users.count', type: 'count', title: 'Count', shortTitle: 'Count' },
        { name: 'Users.totalSales', type: 'sum', title: 'Total Sales', shortTitle: 'Total Sales' },
      ],
      dimensions: [
        { name: 'Users.status', type: 'string', title: 'Status', shortTitle: 'Status' },
        { name: 'Users.name', type: 'string', title: 'Name', shortTitle: 'Name' },
        { name: 'Users.age', type: 'number', title: 'Age', shortTitle: 'Age' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created At' },
        { name: 'Users.isActive', type: 'boolean', title: 'Is Active', shortTitle: 'Is Active' },
      ],
      segments: [],
    },
  ],
}

describe('DashboardFilterItem', () => {
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

  const defaultProps = {
    filter: createDashboardFilter(
      'filter-1',
      'Status Filter',
      createSimpleFilter('Users.status', 'equals', ['active'])
    ),
    schema: mockSchema,
    onClick: vi.fn(),
    onRemove: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('regular filter display', () => {
    it('should render the filter label', () => {
      render(<DashboardFilterItem {...defaultProps} />)

      expect(screen.getByText('Status Filter')).toBeInTheDocument()
    })

    it('should render the field title', () => {
      render(<DashboardFilterItem {...defaultProps} />)

      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should render the operator label', () => {
      render(<DashboardFilterItem {...defaultProps} />)

      expect(screen.getByText('equals')).toBeInTheDocument()
    })

    it('should render single value display', () => {
      render(<DashboardFilterItem {...defaultProps} />)

      expect(screen.getByText('active')).toBeInTheDocument()
    })

    it('should render multiple values with comma separator', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status Filter',
        createSimpleFilter('Users.status', 'equals', ['active', 'pending'])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('active, pending')).toBeInTheDocument()
    })

    it('should render "+N more" for many values', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status Filter',
        createSimpleFilter('Users.status', 'equals', ['active', 'pending', 'inactive', 'deleted'])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('active, pending, +2 more')).toBeInTheDocument()
    })

    it('should show "Click to configure" when values are required but empty', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status Filter',
        createSimpleFilter('Users.status', 'equals', [])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      // Component shows "Click to configure" when operator requires values but none provided
      expect(screen.getByText('Click to configure')).toBeInTheDocument()
    })

    it('should not render value display for set operator', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status Filter',
        createSimpleFilter('Users.status', 'set', [])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      // Should not show "(empty)" since set doesn't require values
      expect(screen.queryByText('(empty)')).not.toBeInTheDocument()
    })

    it('should not render value display for notSet operator', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status Filter',
        createSimpleFilter('Users.status', 'notSet', [])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.queryByText('(empty)')).not.toBeInTheDocument()
    })
  })

  describe('field type icons', () => {
    it('should render dimension icon for string fields', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status Filter',
        createSimpleFilter('Users.status', 'equals', ['active'])
      )

      const { container } = render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      // Check for dimension icon class
      const iconSpan = container.querySelector('.bg-dc-dimension')
      expect(iconSpan).toBeInTheDocument()
    })

    it('should render time dimension icon for time fields', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Created At Filter',
        createSimpleFilter('Users.createdAt', 'inDateRange', [], 'last 7 days')
      )

      const { container } = render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      // Check for time dimension icon class
      const iconSpan = container.querySelector('.bg-dc-time-dimension')
      expect(iconSpan).toBeInTheDocument()
    })

    it('should render measure icon for measure fields', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Count Filter',
        createSimpleFilter('Users.count', 'gt', [100])
      )

      const { container } = render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      // Check for measure icon class
      const iconSpan = container.querySelector('.bg-dc-measure')
      expect(iconSpan).toBeInTheDocument()
    })
  })

  describe('universal time filter display', () => {
    it('should render universal time filter with date range', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Date Range',
        createSimpleFilter('__universal_time__', 'inDateRange', ['last 7 days'], 'last 7 days'),
        true // isUniversalTime
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(screen.getByText('last 7 days')).toBeInTheDocument()
    })

    it('should render universal time filter with array date range', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Date Range',
        createSimpleFilter('__universal_time__', 'inDateRange', ['2024-01-01', '2024-01-31'], ['2024-01-01', '2024-01-31']),
        true
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('Date Range')).toBeInTheDocument()
      expect(screen.getByText('2024-01-01 to 2024-01-31')).toBeInTheDocument()
    })

    it('should render "(not set)" when universal time filter has no value', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Date Range',
        createSimpleFilter('__universal_time__', 'inDateRange', []),
        true
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('(not set)')).toBeInTheDocument()
    })

    it('should render time icon for universal time filter', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Date Range',
        createSimpleFilter('__universal_time__', 'inDateRange', ['last 30 days']),
        true
      )

      const { container } = render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      // Universal time filters use time dimension styling
      const iconSpan = container.querySelector('.bg-dc-time-dimension')
      expect(iconSpan).toBeInTheDocument()
    })
  })

  describe('needs configuration state', () => {
    it('should show "Click to configure" when no field is set', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'New Filter',
        createSimpleFilter('', 'equals', [])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('Click to configure')).toBeInTheDocument()
    })

    it('should show "Click to configure" when operator requires values but none provided', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status Filter',
        createSimpleFilter('Users.status', 'equals', [])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('Click to configure')).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('should call onClick when filter button is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<DashboardFilterItem {...defaultProps} onClick={onClick} />)

      // Find the clickable button area
      const button = screen.getByRole('button', { name: /Status Filter/i })
      await user.click(button)

      expect(onClick).toHaveBeenCalled()
    })

    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(<DashboardFilterItem {...defaultProps} onRemove={onRemove} />)

      const removeButton = screen.getByTitle('Remove filter')
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalled()
    })

    it('should not call onClick when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const onRemove = vi.fn()

      render(<DashboardFilterItem {...defaultProps} onClick={onClick} onRemove={onRemove} />)

      const removeButton = screen.getByTitle('Remove filter')
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalled()
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('title attributes', () => {
    it('should have descriptive title for regular filter', () => {
      render(<DashboardFilterItem {...defaultProps} />)

      const button = screen.getByRole('button', { name: /Status Filter/i })
      expect(button).toHaveAttribute('title')
      expect(button.getAttribute('title')).toContain('Status Filter')
    })

    it('should have descriptive title for needs configuration state', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'New Filter',
        createSimpleFilter('', 'equals', [])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      const button = screen.getByRole('button', { name: /New Filter/i })
      expect(button).toHaveAttribute('title')
      expect(button.getAttribute('title')).toContain('Click to configure')
    })

    it('should have title for remove button', () => {
      render(<DashboardFilterItem {...defaultProps} />)

      expect(screen.getByTitle('Remove filter')).toBeInTheDocument()
    })
  })

  describe('date range display', () => {
    it('should format string date range from dateRange property', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Created At',
        createSimpleFilter('Users.createdAt', 'inDateRange', [], 'last 30 days')
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('last 30 days')).toBeInTheDocument()
    })

    it('should format array date range from dateRange property', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Created At',
        createSimpleFilter('Users.createdAt', 'inDateRange', [], ['2024-01-01', '2024-12-31'])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      expect(screen.getByText('2024-01-01 to 2024-12-31')).toBeInTheDocument()
    })

    it('should show values as comma-separated when dateRange property not set', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Created At',
        createSimpleFilter('Users.createdAt', 'inDateRange', ['2024-01-01', '2024-06-30'])
      )

      render(<DashboardFilterItem {...defaultProps} filter={filter} />)

      // Without dateRange property, values are shown as comma-separated
      expect(screen.getByText('2024-01-01, 2024-06-30')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have accessible button for filter content', () => {
      render(<DashboardFilterItem {...defaultProps} />)

      const button = screen.getByRole('button', { name: /Status Filter/i })
      expect(button).toBeInTheDocument()
    })

    it('should have accessible remove button', () => {
      render(<DashboardFilterItem {...defaultProps} />)

      const removeButton = screen.getByTitle('Remove filter')
      expect(removeButton.tagName.toLowerCase()).toBe('button')
    })
  })

  describe('schema not loaded', () => {
    it('should render filter when schema is null', () => {
      render(<DashboardFilterItem {...defaultProps} schema={null} />)

      // Should still render the filter label
      expect(screen.getByText('Status Filter')).toBeInTheDocument()
    })

    it('should display field name when title cannot be resolved from schema', () => {
      render(<DashboardFilterItem {...defaultProps} schema={null} />)

      // When schema is null, field name is displayed as-is
      expect(screen.getByText('Users.status')).toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should have hover styles on container', () => {
      const { container } = render(<DashboardFilterItem {...defaultProps} />)

      // Check for hover class on the main container
      const filterItem = container.querySelector('.hover\\:bg-dc-surface-tertiary')
      expect(filterItem).toBeInTheDocument()
    })

    it('should have transition animation', () => {
      const { container } = render(<DashboardFilterItem {...defaultProps} />)

      const filterItem = container.querySelector('.dc\\:transition-all')
      expect(filterItem).toBeInTheDocument()
    })
  })
})

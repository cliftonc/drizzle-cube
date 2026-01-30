/**
 * FilterBuilder Component Tests
 *
 * Tests for the filter builder container which manages:
 * - List of FilterItems
 * - Adding new filters
 * - Removing filters
 * - Smart filter grouping (AND/OR logic)
 * - Empty state
 */

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FilterBuilder from '../../../../src/client/components/shared/FilterBuilder'
import type { Filter, SimpleFilter, GroupFilter } from '../../../../src/client/types'
import type { MetaResponse } from '../../../../src/client/shared/types'
import { renderWithProviders } from '../../../client-setup/test-utils'

// Mock the useFilterValues hook to avoid API calls
vi.mock('../../../../src/client/hooks/useFilterValues', () => ({
  useFilterValues: vi.fn(() => ({
    values: ['active', 'pending', 'inactive'],
    loading: false,
    error: null,
    searchValues: vi.fn(),
  })),
}))

// Mock schema with different field types
const mockSchema: MetaResponse = {
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
        { name: 'Users.name', type: 'string', title: 'Name', shortTitle: 'Name' },
        { name: 'Users.age', type: 'number', title: 'Age', shortTitle: 'Age' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created At' },
      ],
      segments: [],
    },
    {
      name: 'Orders',
      title: 'Orders',
      description: 'Order data',
      measures: [
        { name: 'Orders.count', type: 'count', title: 'Count', shortTitle: 'Count' },
        { name: 'Orders.total', type: 'sum', title: 'Total', shortTitle: 'Total' },
      ],
      dimensions: [
        { name: 'Orders.id', type: 'number', title: 'ID', shortTitle: 'ID' },
        { name: 'Orders.status', type: 'string', title: 'Status', shortTitle: 'Status' },
      ],
      segments: [],
    },
  ],
}

const mockQuery = {
  measures: ['Users.count'],
  dimensions: ['Users.status', 'Users.name'],
}

describe('FilterBuilder', () => {
  const defaultProps = {
    filters: [] as Filter[],
    schema: mockSchema,
    query: mockQuery,
    onFiltersChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('filter list', () => {
    it('should render list of FilterItems', () => {
      const filters: Filter[] = [
        { member: 'Users.status', operator: 'equals', values: ['active'] },
        { member: 'Users.name', operator: 'contains', values: ['John'] },
      ]

      // When there are 2+ filters, they get wrapped in an AND group
      const wrappedFilters: Filter[] = [
        { type: 'and', filters }
      ]

      renderWithProviders(<FilterBuilder {...defaultProps} filters={wrappedFilters} />)

      // Should show filter count
      expect(screen.getByText('Filters (2)')).toBeInTheDocument()
    })

    it('should show "Add filter" button', () => {
      renderWithProviders(<FilterBuilder {...defaultProps} />)

      expect(screen.getByText('Add Filter')).toBeInTheDocument()
    })

    it('should add new empty filter when Add Filter button is clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      renderWithProviders(<FilterBuilder {...defaultProps} onFiltersChange={onFiltersChange} />)

      await user.click(screen.getByText('Add Filter'))

      expect(onFiltersChange).toHaveBeenCalled()
      // First filter should be added as a simple filter
      const call = onFiltersChange.mock.calls[0][0]
      expect(call).toHaveLength(1)
      expect(call[0]).toHaveProperty('member')
      expect(call[0]).toHaveProperty('operator', 'equals')
      expect(call[0]).toHaveProperty('values', [])
    })

    it('should create AND group when second filter is added', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      // Start with one simple filter
      const filters: Filter[] = [
        { member: 'Users.status', operator: 'equals', values: ['active'] },
      ]

      renderWithProviders(
        <FilterBuilder
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )

      await user.click(screen.getByText('Add Filter'))

      expect(onFiltersChange).toHaveBeenCalled()
      const call = onFiltersChange.mock.calls[0][0]
      // Should create an AND group with both filters
      expect(call).toHaveLength(1)
      expect(call[0]).toHaveProperty('type', 'and')
      expect((call[0] as GroupFilter).filters).toHaveLength(2)
    })
  })

  describe('filter grouping', () => {
    it('should show AND indicator between filters in an AND group', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
            { member: 'Users.name', operator: 'contains', values: ['John'] },
          ],
        },
      ]

      renderWithProviders(<FilterBuilder {...defaultProps} filters={filters} />)

      // Should show AND button to toggle logic
      expect(screen.getByText('AND')).toBeInTheDocument()
    })

    it('should show OR indicator when OR group is used', () => {
      const filters: Filter[] = [
        {
          type: 'or',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
            { member: 'Users.status', operator: 'equals', values: ['pending'] },
          ],
        },
      ]

      renderWithProviders(<FilterBuilder {...defaultProps} filters={filters} />)

      expect(screen.getByText('OR')).toBeInTheDocument()
    })

    it('should toggle from AND to OR when clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
            { member: 'Users.name', operator: 'contains', values: ['John'] },
          ],
        },
      ]

      renderWithProviders(
        <FilterBuilder
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )

      await user.click(screen.getByText('AND'))

      expect(onFiltersChange).toHaveBeenCalled()
      const call = onFiltersChange.mock.calls[0][0]
      expect(call[0]).toHaveProperty('type', 'or')
    })
  })

  describe('empty state', () => {
    it('should show header with filter count of 0 when no filters', () => {
      renderWithProviders(<FilterBuilder {...defaultProps} />)

      expect(screen.getByText('Filters (0)')).toBeInTheDocument()
    })

    it('should not show "Clear all" button when no filters', () => {
      renderWithProviders(<FilterBuilder {...defaultProps} />)

      expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
    })
  })

  describe('onChange callbacks', () => {
    it('should call onChange when filter is added', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      renderWithProviders(<FilterBuilder {...defaultProps} onFiltersChange={onFiltersChange} />)

      await user.click(screen.getByText('Add Filter'))

      expect(onFiltersChange).toHaveBeenCalled()
    })

    it('should call onChange when "Clear all" is clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      const filters: Filter[] = [
        { member: 'Users.status', operator: 'equals', values: ['active'] },
      ]

      renderWithProviders(
        <FilterBuilder
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )

      await user.click(screen.getByText('Clear all'))

      expect(onFiltersChange).toHaveBeenCalledWith([])
    })
  })

  describe('disable Add Filter when no fields available', () => {
    it('should disable Add Filter button when schema has no filterable fields', () => {
      const emptySchema: MetaResponse = {
        cubes: [
          {
            name: 'Empty',
            title: 'Empty',
            description: 'Empty cube',
            measures: [],
            dimensions: [],
            segments: [],
          },
        ],
      }

      renderWithProviders(<FilterBuilder {...defaultProps} schema={emptySchema} />)

      const addButton = screen.getByText('Add Filter').closest('button')
      expect(addButton).toBeDisabled()
    })

    it('should enable Add Filter button when schema has filterable fields', () => {
      renderWithProviders(<FilterBuilder {...defaultProps} />)

      const addButton = screen.getByText('Add Filter').closest('button')
      expect(addButton).not.toBeDisabled()
    })
  })

  describe('hideFieldSelector mode', () => {
    it('should hide header when hideFieldSelector is true', () => {
      renderWithProviders(<FilterBuilder {...defaultProps} hideFieldSelector={true} />)

      // The filter header should be hidden
      expect(screen.queryByText('Filters (0)')).not.toBeInTheDocument()
    })
  })

  describe('filter removal', () => {
    it('should call onChange when filter is removed from a single filter', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      const filters: Filter[] = [
        { member: 'Users.status', operator: 'equals', values: ['active'] },
      ]

      renderWithProviders(
        <FilterBuilder
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )

      // Click remove button on the filter
      await user.click(screen.getByTitle('Remove filter'))

      expect(onFiltersChange).toHaveBeenCalledWith([])
    })
  })

  describe('multiple filters management', () => {
    it('should show correct filter count in header', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
            { member: 'Users.name', operator: 'contains', values: ['John'] },
            { member: 'Users.age', operator: 'gt', values: [18] },
          ],
        },
      ]

      renderWithProviders(<FilterBuilder {...defaultProps} filters={filters} />)

      expect(screen.getByText('Filters (3)')).toBeInTheDocument()
    })

    it('should add filter to existing AND group', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
            { member: 'Users.name', operator: 'contains', values: ['John'] },
          ],
        },
      ]

      renderWithProviders(
        <FilterBuilder
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )

      await user.click(screen.getByText('Add Filter'))

      expect(onFiltersChange).toHaveBeenCalled()
      const call = onFiltersChange.mock.calls[0][0]
      // Should have updated the AND group to have 3 filters
      expect(call[0]).toHaveProperty('type', 'and')
      expect((call[0] as GroupFilter).filters).toHaveLength(3)
    })

    it('should add filter to existing OR group maintaining OR logic', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()

      const filters: Filter[] = [
        {
          type: 'or',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
            { member: 'Users.status', operator: 'equals', values: ['pending'] },
          ],
        },
      ]

      renderWithProviders(
        <FilterBuilder
          {...defaultProps}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )

      await user.click(screen.getByText('Add Filter'))

      expect(onFiltersChange).toHaveBeenCalled()
      const call = onFiltersChange.mock.calls[0][0]
      // Should maintain OR logic when adding
      expect(call[0]).toHaveProperty('type', 'or')
      expect((call[0] as GroupFilter).filters).toHaveLength(3)
    })
  })

  describe('nested groups', () => {
    it('should render nested filter groups', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
            {
              type: 'or',
              filters: [
                { member: 'Users.name', operator: 'contains', values: ['John'] },
                { member: 'Users.name', operator: 'contains', values: ['Jane'] },
              ],
            },
          ],
        },
      ]

      renderWithProviders(<FilterBuilder {...defaultProps} filters={filters} />)

      // Should show both AND and OR indicators
      expect(screen.getByText('AND')).toBeInTheDocument()
      expect(screen.getByText('OR')).toBeInTheDocument()
    })
  })

  describe('schema null handling', () => {
    it('should handle null schema gracefully', () => {
      renderWithProviders(<FilterBuilder {...defaultProps} schema={null} />)

      // Should still render, but Add Filter should be disabled
      const addButton = screen.getByText('Add Filter').closest('button')
      expect(addButton).toBeDisabled()
    })
  })
})

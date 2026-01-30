/**
 * FilterItem Component Tests
 *
 * Tests for the individual filter row component which handles:
 * - Field selection
 * - Operator selection based on field type
 * - Value input adapted to operator type
 * - Filter removal
 */

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FilterItem from '../../../../src/client/components/shared/FilterItem'
import type { SimpleFilter } from '../../../../src/client/types'
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

describe('FilterItem', () => {
  const defaultProps = {
    filter: { member: 'Users.status', operator: 'equals' as const, values: ['active'] } as SimpleFilter,
    index: 0,
    onFilterChange: vi.fn(),
    onFilterRemove: vi.fn(),
    schema: mockSchema,
    query: mockQuery,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('field display', () => {
    it('should show selected field name', () => {
      renderWithProviders(<FilterItem {...defaultProps} />)

      expect(screen.getByText('Users.status')).toBeInTheDocument()
    })

    it('should show placeholder when no field is selected', () => {
      const props = {
        ...defaultProps,
        filter: { member: '', operator: 'equals' as const, values: [] } as SimpleFilter,
      }
      renderWithProviders(<FilterItem {...props} />)

      expect(screen.getByText('Select field...')).toBeInTheDocument()
    })

    it('should allow changing field via dropdown', async () => {
      const user = userEvent.setup()
      const onFilterChange = vi.fn()

      renderWithProviders(<FilterItem {...defaultProps} onFilterChange={onFilterChange} />)

      // Click to open field dropdown
      await user.click(screen.getByText('Users.status'))

      // Search for a field
      const searchInput = screen.getByPlaceholderText('Search fields...')
      await user.type(searchInput, 'name')

      // Click on the filtered result - use getAllByText and click the first one (in dropdown)
      const nameOptions = screen.getAllByText('Users.name')
      await user.click(nameOptions[0])

      expect(onFilterChange).toHaveBeenCalledWith(0, expect.objectContaining({
        member: 'Users.name',
      }))
    })
  })

  describe('operator selection', () => {
    it('should show operator dropdown', () => {
      renderWithProviders(<FilterItem {...defaultProps} />)

      // The operator dropdown should show the current operator label
      expect(screen.getByText('equals')).toBeInTheDocument()
    })

    it('should show string operators for string fields', async () => {
      const user = userEvent.setup()

      renderWithProviders(<FilterItem {...defaultProps} />)

      // Click to open operator dropdown - find the button that contains 'equals'
      const operatorButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('equals')
      )
      expect(operatorButton).toBeDefined()
      await user.click(operatorButton!)

      // Check that string operators are available
      expect(screen.getByText('not equals')).toBeInTheDocument()
      expect(screen.getByText('contains')).toBeInTheDocument()
      expect(screen.getByText('not contains')).toBeInTheDocument()
      expect(screen.getByText('starts with')).toBeInTheDocument()
      expect(screen.getByText('ends with')).toBeInTheDocument()
    })

    it('should show numeric operators for number fields', async () => {
      const user = userEvent.setup()
      const props = {
        ...defaultProps,
        filter: { member: 'Users.age', operator: 'equals' as const, values: [] } as SimpleFilter,
      }

      renderWithProviders(<FilterItem {...props} />)

      // Click to open operator dropdown
      const operatorButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('equals')
      )
      await user.click(operatorButton!)

      // Check that numeric operators are available
      expect(screen.getByText('greater than')).toBeInTheDocument()
      expect(screen.getByText('less than')).toBeInTheDocument()
      expect(screen.getByText('greater than or equal')).toBeInTheDocument()
      expect(screen.getByText('less than or equal')).toBeInTheDocument()
    })

    it('should show date operators for time fields', async () => {
      const user = userEvent.setup()
      const props = {
        ...defaultProps,
        filter: { member: 'Users.createdAt', operator: 'equals' as const, values: [] } as SimpleFilter,
      }

      renderWithProviders(<FilterItem {...props} />)

      // Click to open operator dropdown
      const operatorButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('equals')
      )
      await user.click(operatorButton!)

      // Check that date operators are available
      expect(screen.getByText('in date range')).toBeInTheDocument()
      expect(screen.getByText('before date')).toBeInTheDocument()
      expect(screen.getByText('after date')).toBeInTheDocument()
    })

    it('should call onFilterChange when operator is changed', async () => {
      const user = userEvent.setup()
      const onFilterChange = vi.fn()

      renderWithProviders(<FilterItem {...defaultProps} onFilterChange={onFilterChange} />)

      // Click to open operator dropdown
      const operatorButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('equals')
      )
      await user.click(operatorButton!)

      // Select a different operator
      await user.click(screen.getByText('contains'))

      expect(onFilterChange).toHaveBeenCalledWith(0, expect.objectContaining({
        operator: 'contains',
        values: [], // Values should be reset when operator changes
      }))
    })

    it('should reset values when operator changes type', async () => {
      const user = userEvent.setup()
      const onFilterChange = vi.fn()

      // Start with a filter that has values
      const props = {
        ...defaultProps,
        filter: { member: 'Users.status', operator: 'equals' as const, values: ['active', 'pending'] } as SimpleFilter,
        onFilterChange,
      }

      renderWithProviders(<FilterItem {...props} />)

      // Click to open operator dropdown
      const operatorButton = screen.getAllByRole('button').find(btn =>
        btn.textContent?.includes('equals')
      )
      await user.click(operatorButton!)

      // Change to a different operator
      await user.click(screen.getByText('contains'))

      // Values should be reset
      expect(onFilterChange).toHaveBeenCalledWith(0, expect.objectContaining({
        values: [],
      }))
    })
  })

  describe('value input - string fields', () => {
    it('should show no input for "set" operator', () => {
      const props = {
        ...defaultProps,
        filter: { member: 'Users.status', operator: 'set' as const, values: [] } as SimpleFilter,
      }
      renderWithProviders(<FilterItem {...props} />)

      expect(screen.getByText('No value required')).toBeInTheDocument()
    })

    it('should show no input for "notSet" operator', () => {
      const props = {
        ...defaultProps,
        filter: { member: 'Users.status', operator: 'notSet' as const, values: [] } as SimpleFilter,
      }
      renderWithProviders(<FilterItem {...props} />)

      expect(screen.getByText('No value required')).toBeInTheDocument()
    })
  })

  describe('value input - date fields', () => {
    it('should show date range selector for "inDateRange" operator on time field', () => {
      const props = {
        ...defaultProps,
        filter: { member: 'Users.createdAt', operator: 'inDateRange' as const, values: [] } as SimpleFilter,
      }

      renderWithProviders(<FilterItem {...props} />)

      // Should show a date range dropdown (either "This month" default or some range selector)
      // The component renders a date range selector when fieldType is time and operator is inDateRange
      const buttons = screen.getAllByRole('button')
      // There should be buttons for date range selection
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should show custom date inputs when custom range is selected', async () => {
      const props = {
        ...defaultProps,
        filter: {
          member: 'Users.createdAt',
          operator: 'inDateRange' as const,
          values: [],
          dateRange: ['2024-01-01', '2024-01-31']
        } as SimpleFilter,
      }

      renderWithProviders(<FilterItem {...props} />)

      // Should show Custom label when array dateRange is provided
      expect(screen.getByText('Custom')).toBeInTheDocument()

      // Should show two date inputs with the values
      expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-31')).toBeInTheDocument()
    })
  })

  describe('removal', () => {
    it('should show remove button', () => {
      renderWithProviders(<FilterItem {...defaultProps} />)

      const removeButton = screen.getByTitle('Remove filter')
      expect(removeButton).toBeInTheDocument()
    })

    it('should call onFilterRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onFilterRemove = vi.fn()

      renderWithProviders(<FilterItem {...defaultProps} onFilterRemove={onFilterRemove} />)

      await user.click(screen.getByTitle('Remove filter'))

      expect(onFilterRemove).toHaveBeenCalledWith(0)
    })

    it('should hide remove button when hideRemoveButton is true', () => {
      renderWithProviders(<FilterItem {...defaultProps} hideRemoveButton={true} />)

      expect(screen.queryByTitle('Remove filter')).not.toBeInTheDocument()
    })
  })

  describe('hiding controls', () => {
    it('should hide field selector when hideFieldSelector is true', () => {
      renderWithProviders(<FilterItem {...defaultProps} hideFieldSelector={true} />)

      // Field selector button should not be visible
      expect(screen.queryByText('Users.status')).not.toBeInTheDocument()
    })
  })

  describe('schema not loaded', () => {
    it('should show message when schema is null', () => {
      const props = {
        ...defaultProps,
        schema: null,
      }

      renderWithProviders(<FilterItem {...props} />)

      expect(screen.getByText('Schema not loaded')).toBeInTheDocument()
    })
  })

  describe('field search', () => {
    it('should filter fields based on search term', async () => {
      const user = userEvent.setup()

      renderWithProviders(<FilterItem {...defaultProps} />)

      // Open field dropdown
      await user.click(screen.getByText('Users.status'))

      // Type search term
      const searchInput = screen.getByPlaceholderText('Search fields...')
      await user.type(searchInput, 'Orders')

      // Should show only Orders fields
      expect(screen.getByText('Orders.id')).toBeInTheDocument()
      expect(screen.getByText('Orders.status')).toBeInTheDocument()

      // Users fields should be filtered out
      expect(screen.queryByText('Users.name')).not.toBeInTheDocument()
    })

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup()

      renderWithProviders(<FilterItem {...defaultProps} />)

      // Open field dropdown
      await user.click(screen.getByText('Users.status'))

      // Type non-matching search term
      const searchInput = screen.getByPlaceholderText('Search fields...')
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText(/No fields found matching/)).toBeInTheDocument()
    })
  })
})

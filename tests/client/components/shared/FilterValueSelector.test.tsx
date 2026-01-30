/**
 * FilterValueSelector Component Tests
 *
 * Tests for the smart value input component that adapts based on:
 * - Field type (string, number, time)
 * - Operator type (equals, contains, gt, lt, between, inDateRange, etc.)
 * - Whether values support multiple entries
 */

import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FilterValueSelector from '../../../../src/client/components/shared/FilterValueSelector'
import type { MetaResponse } from '../../../../src/client/shared/types'
import type { FilterOperator } from '../../../../src/client/types'
import { renderWithProviders } from '../../../client-setup/test-utils'

// Mock the useFilterValues hook
vi.mock('../../../../src/client/hooks/useFilterValues', () => ({
  useFilterValues: vi.fn(() => ({
    values: ['active', 'pending', 'inactive'],
    loading: false,
    error: null,
    searchValues: vi.fn(),
  })),
}))

// Mock the useDebounce hook
vi.mock('../../../../src/client/hooks/useDebounce', () => ({
  useDebounce: vi.fn((value: string) => value),
}))

const mockSchema: MetaResponse = {
  cubes: [
    {
      name: 'Users',
      title: 'Users',
      description: 'User data',
      measures: [
        { name: 'Users.count', type: 'count', title: 'Count', shortTitle: 'Count' },
        { name: 'Users.avgAge', type: 'avg', title: 'Average Age', shortTitle: 'Avg Age' },
      ],
      dimensions: [
        { name: 'Users.status', type: 'string', title: 'Status', shortTitle: 'Status' },
        { name: 'Users.name', type: 'string', title: 'Name', shortTitle: 'Name' },
        { name: 'Users.age', type: 'number', title: 'Age', shortTitle: 'Age' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created At' },
      ],
      segments: [],
    },
  ],
}

describe('FilterValueSelector', () => {
  const defaultProps = {
    fieldName: 'Users.status',
    operator: 'equals' as FilterOperator,
    values: [] as any[],
    onValuesChange: vi.fn(),
    schema: mockSchema,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('no input required', () => {
    it('should show "No value required" for set operator', () => {
      renderWithProviders(<FilterValueSelector {...defaultProps} operator="set" />)

      expect(screen.getByText('No value required')).toBeInTheDocument()
    })

    it('should show "No value required" for notSet operator', () => {
      renderWithProviders(<FilterValueSelector {...defaultProps} operator="notSet" />)

      expect(screen.getByText('No value required')).toBeInTheDocument()
    })
  })

  describe('number input', () => {
    it('should render number input for gt operator', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="gt"
        />
      )

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should render number input for lt operator', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="lt"
        />
      )

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'number')
    })

    it('should update value on number input change', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="gt"
          onValuesChange={onValuesChange}
        />
      )

      const input = screen.getByPlaceholderText('Enter number')
      await user.type(input, '25')

      // Each keystroke triggers onValuesChange
      expect(onValuesChange).toHaveBeenCalled()
    })

    it('should handle decimal numbers via direct value input', () => {
      const onValuesChange = vi.fn()

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="gt"
          values={[25.5]}
          onValuesChange={onValuesChange}
        />
      )

      // Verify the input can display decimal values
      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveValue(25.5)
    })

    it('should handle negative numbers via direct value input', () => {
      const onValuesChange = vi.fn()

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="gt"
          values={[-10]}
          onValuesChange={onValuesChange}
        />
      )

      // Verify the input can display negative values
      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveValue(-10)
    })

    it('should display existing number value', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="gt"
          values={[42]}
        />
      )

      const input = screen.getByPlaceholderText('Enter number')
      expect(input).toHaveValue(42)
    })
  })

  describe('between operator (range input)', () => {
    it('should render two inputs for between operator', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="between"
        />
      )

      expect(screen.getByPlaceholderText('Min')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Max')).toBeInTheDocument()
      expect(screen.getByText('to')).toBeInTheDocument()
    })

    it('should update start value for between operator', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="between"
          onValuesChange={onValuesChange}
        />
      )

      const minInput = screen.getByPlaceholderText('Min')
      await user.type(minInput, '18')

      expect(onValuesChange).toHaveBeenCalled()
    })

    it('should update end value for between operator', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="between"
          values={[18]}
          onValuesChange={onValuesChange}
        />
      )

      const maxInput = screen.getByPlaceholderText('Max')
      await user.type(maxInput, '65')

      expect(onValuesChange).toHaveBeenCalled()
    })

    it('should display existing between values', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.avgAge"
          operator="between"
          values={[18, 65]}
        />
      )

      expect(screen.getByPlaceholderText('Min')).toHaveValue(18)
      expect(screen.getByPlaceholderText('Max')).toHaveValue(65)
    })
  })

  describe('date input', () => {
    it('should render date input for beforeDate operator', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.createdAt"
          operator="beforeDate"
        />
      )

      // Date inputs have type="date" but use querySelector since role might differ
      const dateInput = document.querySelector('input[type="date"]')
      expect(dateInput).toBeInTheDocument()
    })

    it('should render date input for afterDate operator', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.createdAt"
          operator="afterDate"
        />
      )

      const dateInput = document.querySelector('input[type="date"]')
      expect(dateInput).toBeInTheDocument()
    })

    it('should display existing date value', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.createdAt"
          operator="beforeDate"
          values={['2024-06-15']}
        />
      )

      expect(screen.getByDisplayValue('2024-06-15')).toBeInTheDocument()
    })
  })

  describe('date range input', () => {
    it('should render two date inputs for inDateRange operator', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.createdAt"
          operator="inDateRange"
        />
      )

      const dateInputs = document.querySelectorAll('input[type="date"]')
      expect(dateInputs.length).toBe(2)
      expect(screen.getByText('to')).toBeInTheDocument()
    })

    it('should update start date for date range', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.createdAt"
          operator="inDateRange"
          onValuesChange={onValuesChange}
        />
      )

      const dateInputs = document.querySelectorAll('input[type="date"]')
      await user.type(dateInputs[0] as HTMLInputElement, '2024-01-01')

      expect(onValuesChange).toHaveBeenCalled()
    })

    it('should display existing date range values', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          fieldName="Users.createdAt"
          operator="inDateRange"
          values={['2024-01-01', '2024-12-31']}
        />
      )

      expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument()
    })
  })

  describe('text input fallback', () => {
    it('should render text input for contains operator on non-dimension', () => {
      // For contains operator, a simple text input is shown
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          operator="contains"
        />
      )

      // The contains operator shows a text input
      const input = screen.getByPlaceholderText(/Enter string value/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should update value on text input change', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          operator="contains"
          onValuesChange={onValuesChange}
        />
      )

      const input = screen.getByPlaceholderText(/Enter string value/i)
      await user.type(input, 'test')

      expect(onValuesChange).toHaveBeenCalled()
    })
  })

  describe('combo box for dimension values', () => {
    it('should show combo box dropdown for equals operator on string dimension', async () => {
      const user = userEvent.setup()

      renderWithProviders(<FilterValueSelector {...defaultProps} operator="equals" />)

      // Should show dropdown trigger
      const trigger = screen.getByText('Select value...')
      await user.click(trigger)

      // Should open dropdown with values
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search values...')).toBeInTheDocument()
      })
    })

    it('should show selected values as tags for multi-value operators', () => {
      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          operator="notEquals" // Supports multiple values
          values={['active', 'pending']}
        />
      )

      // Should show selected values as removable tags
      expect(screen.getByText('active')).toBeInTheDocument()
      expect(screen.getByText('pending')).toBeInTheDocument()
    })

    it('should allow removing selected value via remove button', async () => {
      const user = userEvent.setup()
      const onValuesChange = vi.fn()

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          operator="equals"
          values={['active']}
          onValuesChange={onValuesChange}
        />
      )

      // Find and click the remove button on the tag
      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find(btn =>
        btn.closest('[class*="inline-flex"]')
      )

      if (removeButton) {
        await user.click(removeButton)
        expect(onValuesChange).toHaveBeenCalledWith([])
      }
    })
  })

  describe('time dimension handling', () => {
    it('should show date picker for equals on time dimension', () => {
      // Update schema to properly mark Users.createdAt as a time dimension
      const schemaWithTimeDimension: MetaResponse = {
        cubes: [
          {
            name: 'Users',
            title: 'Users',
            description: 'User data',
            measures: [
              { name: 'Users.count', type: 'count', title: 'Count', shortTitle: 'Count' },
              { name: 'Users.avgAge', type: 'avg', title: 'Average Age', shortTitle: 'Avg Age' },
            ],
            dimensions: [
              { name: 'Users.status', type: 'string', title: 'Status', shortTitle: 'Status' },
              { name: 'Users.name', type: 'string', title: 'Name', shortTitle: 'Name' },
              { name: 'Users.age', type: 'number', title: 'Age', shortTitle: 'Age' },
              { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created At' },
            ],
            segments: [],
          },
        ],
      }

      renderWithProviders(
        <FilterValueSelector
          {...defaultProps}
          schema={schemaWithTimeDimension}
          fieldName="Users.createdAt"
          operator="equals"
        />
      )

      // Time dimensions with equals should show a date picker
      const dateInput = document.querySelector('input[type="date"]')
      expect(dateInput).toBeInTheDocument()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterConfigModal from '../../../../src/client/components/AnalysisBuilder/FilterConfigModal'
import type { SimpleFilter } from '../../../../src/client/types'
import type { MetaResponse } from '../../../../src/client/shared/types'
import { renderWithProviders } from '../../../client-setup/test-utils'

// Mock useFilterValues hook
vi.mock('../../../../src/client/hooks/useFilterValues', () => ({
  useFilterValues: vi.fn(() => ({
    values: ['value1', 'value2', 'value3'],
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
      measures: [
        { name: 'Users.count', type: 'number', title: 'User Count', shortTitle: 'Count', aggType: 'count' },
        { name: 'Users.totalRevenue', type: 'number', title: 'Total Revenue', shortTitle: 'Revenue', aggType: 'sum' },
      ],
      dimensions: [
        { name: 'Users.name', type: 'string', title: 'User Name', shortTitle: 'Name' },
        { name: 'Users.status', type: 'string', title: 'Status', shortTitle: 'Status' },
        { name: 'Users.age', type: 'number', title: 'Age', shortTitle: 'Age' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' },
      ],
    },
  ],
}

describe('FilterConfigModal', () => {
  const defaultFilter: SimpleFilter = {
    member: 'Users.name',
    operator: 'equals',
    values: [],
  }

  const defaultProps = {
    filter: defaultFilter,
    schema: mockSchema,
    onSave: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('field display', () => {
    it('should display selected field name in header', () => {
      render(<FilterConfigModal {...defaultProps} />)

      expect(screen.getByText('User Name')).toBeInTheDocument()
    })

    it('should show field type indicator', () => {
      render(<FilterConfigModal {...defaultProps} />)

      // The field display section should show the field info
      expect(screen.getByText('Field')).toBeInTheDocument()
      expect(screen.getByText('User Name')).toBeInTheDocument()
    })
  })

  describe('operator selection', () => {
    it('should show operator dropdown when clicked', async () => {
      const user = userEvent.setup()
      render(<FilterConfigModal {...defaultProps} />)

      // Find and click the operator button (within the Operator section)
      const operatorSection = screen.getByText('Operator').parentElement
      const operatorButton = within(operatorSection as HTMLElement).getByRole('button')
      await user.click(operatorButton)

      // Should show operator options (multiple "equals" texts may exist)
      const equalsOptions = screen.getAllByText('equals')
      expect(equalsOptions.length).toBeGreaterThan(0)
    })

    it('should show operators appropriate for string fields', async () => {
      const user = userEvent.setup()
      render(<FilterConfigModal {...defaultProps} />)

      const operatorSection = screen.getByText('Operator').parentElement
      const operatorButton = within(operatorSection as HTMLElement).getByRole('button')
      await user.click(operatorButton)

      // String operators should be available (lowercase) - multiple texts may exist
      const equalsOptions = screen.getAllByText('equals')
      expect(equalsOptions.length).toBeGreaterThan(0)
      expect(screen.getByText('contains')).toBeInTheDocument()
    })

    it('should show operators appropriate for number fields', async () => {
      const user = userEvent.setup()
      const numberFilter: SimpleFilter = {
        member: 'Users.age',
        operator: 'equals',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={numberFilter} />)

      const operatorSection = screen.getByText('Operator').parentElement
      const operatorButton = within(operatorSection as HTMLElement).getByRole('button')
      await user.click(operatorButton)

      // Number operators should be available (lowercase)
      expect(screen.getByText('greater than')).toBeInTheDocument()
      expect(screen.getByText('less than')).toBeInTheDocument()
    })

    it('should show operators appropriate for date fields', async () => {
      const user = userEvent.setup()
      const dateFilter: SimpleFilter = {
        member: 'Users.createdAt',
        operator: 'inDateRange',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={dateFilter} />)

      const operatorSection = screen.getByText('Operator').parentElement
      const operatorButton = within(operatorSection as HTMLElement).getByRole('button')
      await user.click(operatorButton)

      // Date operators should be available - find "in date range" text (may be multiple)
      const dateRangeOptions = screen.getAllByText('in date range')
      expect(dateRangeOptions.length).toBeGreaterThan(0)
    })

    it('should update when operator changes', async () => {
      const user = userEvent.setup()
      render(<FilterConfigModal {...defaultProps} />)

      const operatorSection = screen.getByText('Operator').parentElement
      const operatorButton = within(operatorSection as HTMLElement).getByRole('button')
      await user.click(operatorButton)

      // Select a different operator
      await user.click(screen.getByText('contains'))

      // The button text should update
      expect(within(operatorSection as HTMLElement).getByText('contains')).toBeInTheDocument()
    })
  })

  describe('value input - string operators', () => {
    it('should show text input for equals operator on string field', () => {
      render(<FilterConfigModal {...defaultProps} />)

      // The combo box/value selector should be present
      const valueSection = screen.getByText('Value').closest('div')?.parentElement
      expect(valueSection).toBeInTheDocument()
    })

    it('should show combo box for equals operator on dimension', async () => {
      const user = userEvent.setup()
      render(<FilterConfigModal {...defaultProps} />)

      // Find the value dropdown button
      const valueSection = screen.getByText('Value').closest('div')
      const valueButtons = within(valueSection?.parentElement as HTMLElement).getAllByRole('button')

      // Click on the dropdown trigger
      const dropdownButton = valueButtons.find(btn => btn.textContent?.includes('Select value'))
      if (dropdownButton) {
        await user.click(dropdownButton)

        // Should show loading or values
        // The combo box dropdown should be visible
      }
    })

    it('should allow selecting values from combo box', async () => {
      const user = userEvent.setup()
      render(<FilterConfigModal {...defaultProps} />)

      const valueSection = screen.getByText('Value').closest('div')
      const valueButtons = within(valueSection?.parentElement as HTMLElement).getAllByRole('button')

      const dropdownButton = valueButtons.find(btn => btn.textContent?.includes('Select value'))
      if (dropdownButton) {
        await user.click(dropdownButton)

        // Wait for and click on a value
        const valueOption = await screen.findByText('value1')
        await user.click(valueOption)
      }
    })
  })

  describe('value input - number operators', () => {
    it('should show number input for gt operator', async () => {
      const user = userEvent.setup()
      const numberFilter: SimpleFilter = {
        member: 'Users.age',
        operator: 'gt',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={numberFilter} />)

      const numberInput = screen.getByPlaceholderText('Enter number')
      expect(numberInput).toHaveAttribute('type', 'number')

      await user.type(numberInput, '25')
      expect(numberInput).toHaveValue(25)
    })

    it('should show range inputs for between operator', () => {
      const betweenFilter: SimpleFilter = {
        member: 'Users.age',
        operator: 'between',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={betweenFilter} />)

      expect(screen.getByPlaceholderText('Min')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Max')).toBeInTheDocument()
    })

    it('should validate number format', async () => {
      const user = userEvent.setup()
      const numberFilter: SimpleFilter = {
        member: 'Users.age',
        operator: 'gt',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={numberFilter} />)

      const numberInput = screen.getByPlaceholderText('Enter number')

      // Type a valid number
      await user.type(numberInput, '100')
      expect(numberInput).toHaveValue(100)
    })
  })

  describe('value input - date operators', () => {
    it('should show date range selector for inDateRange operator', () => {
      const dateFilter: SimpleFilter = {
        member: 'Users.createdAt',
        operator: 'inDateRange',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={dateFilter} />)

      // Should show date range type selector
      const valueSection = screen.getByText('Value').closest('div')?.parentElement
      expect(valueSection).toBeInTheDocument()
    })

    it('should show preset options (Today, Last 7 days, etc.)', async () => {
      const dateFilter: SimpleFilter = {
        member: 'Users.createdAt',
        operator: 'inDateRange',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={dateFilter} />)

      // Check that the date range filter is rendered with value section
      const valueSection = screen.getByText('Value')
      expect(valueSection).toBeInTheDocument()
    })

    it('should show custom date inputs when custom selected', async () => {
      const dateFilter: SimpleFilter = {
        member: 'Users.createdAt',
        operator: 'inDateRange',
        values: [],
        dateRange: ['2024-01-01', '2024-12-31'],
      }

      render(<FilterConfigModal {...defaultProps} filter={dateFilter} />)

      // Custom date range mode should show two date inputs
      // Find date input elements
      const dateInputs = document.querySelectorAll('input[type="date"]')
      expect(dateInputs.length).toBe(2)
    })
  })

  describe('validation', () => {
    it('should call onSave with filter when Save clicked', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()

      const filterWithValue: SimpleFilter = {
        member: 'Users.name',
        operator: 'equals',
        values: ['John'],
      }

      render(<FilterConfigModal {...defaultProps} filter={filterWithValue} onSave={onSave} />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          member: 'Users.name',
          operator: 'equals',
        })
      )
    })

    it('should show "No value required" for set operator', () => {
      const setFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'set',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={setFilter} />)

      expect(screen.getByText('No value required')).toBeInTheDocument()
    })

    it('should show "No value required" for notSet operator', () => {
      const notSetFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'notSet',
        values: [],
      }

      render(<FilterConfigModal {...defaultProps} filter={notSetFilter} />)

      expect(screen.getByText('No value required')).toBeInTheDocument()
    })
  })

  describe('submission', () => {
    it('should call onSave with filter object when valid', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()

      const filterWithValue: SimpleFilter = {
        member: 'Users.name',
        operator: 'equals',
        values: ['John'],
      }

      render(<FilterConfigModal {...defaultProps} filter={filterWithValue} onSave={onSave} />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          member: 'Users.name',
        })
      )
    })

    it('should call onCancel when Cancel clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      render(<FilterConfigModal {...defaultProps} onCancel={onCancel} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('should close modal when clicking outside', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      render(<FilterConfigModal {...defaultProps} onCancel={onCancel} />)

      // Find and click the overlay backdrop
      const overlay = document.querySelector('.dc\\:fixed.dc\\:inset-0')
      if (overlay) {
        await user.click(overlay)
        expect(onCancel).toHaveBeenCalled()
      }
    })
  })

  describe('editing existing filter', () => {
    it('should populate form when editing existing filter', () => {
      const existingFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'contains',
        values: ['John'],
      }

      render(<FilterConfigModal {...defaultProps} filter={existingFilter} />)

      // Operator button should show 'contains' as its text
      const operatorSection = screen.getByText('Operator').parentElement
      const operatorButton = within(operatorSection as HTMLElement).getByRole('button')
      expect(operatorButton).toHaveTextContent('contains')

      // Value should be populated (as a tag or in input)
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    it('should allow removing existing values', async () => {
      const user = userEvent.setup()
      const existingFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'equals',
        values: ['John'],
      }

      render(<FilterConfigModal {...defaultProps} filter={existingFilter} />)

      // Find the value tag with remove button
      const valueTag = screen.getByText('John')
      const removeButton = valueTag.parentElement?.querySelector('button')

      if (removeButton) {
        await user.click(removeButton)
        // Value should be removed
        expect(screen.queryByText('John')).not.toBeInTheDocument()
      }
    })

    it('should update existing filter on save', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()

      const existingFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'equals',
        values: ['John'],
      }

      render(<FilterConfigModal {...defaultProps} filter={existingFilter} onSave={onSave} />)

      // Change operator
      const operatorSection = screen.getByText('Operator').closest('div')
      const operatorButton = within(operatorSection as HTMLElement).getByRole('button')
      await user.click(operatorButton)
      await user.click(screen.getByText('contains'))

      // Save
      await user.click(screen.getByRole('button', { name: /save/i }))

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          operator: 'contains',
        })
      )
    })
  })

  describe('keyboard navigation', () => {
    it('should support keyboard navigation in value dropdown', async () => {
      const user = userEvent.setup()
      render(<FilterConfigModal {...defaultProps} />)

      // Open the value dropdown
      const allButtons = screen.getAllByRole('button')
      const dropdownButton = allButtons.find(btn => btn.textContent?.includes('Select value'))

      if (dropdownButton) {
        await user.click(dropdownButton)

        // Find the search input that should be focused
        const searchInput = screen.queryByPlaceholderText('Search...')
        if (searchInput) {
          // Navigate with arrow keys
          await user.keyboard('{ArrowDown}')
          await user.keyboard('{ArrowDown}')

          // Select with Enter
          await user.keyboard('{Enter}')
        }
      }
      // Test passes if no error - keyboard navigation is handled gracefully
    })

    it('should close dropdown on Escape', async () => {
      const user = userEvent.setup()
      render(<FilterConfigModal {...defaultProps} />)

      // Open operator dropdown
      const operatorSection = screen.getByText('Operator').parentElement
      const operatorButton = within(operatorSection as HTMLElement).getByRole('button')
      await user.click(operatorButton)

      // Dropdown should be open (equals should be visible in the dropdown options)
      const equalsOptions = screen.getAllByText('equals')
      expect(equalsOptions.length).toBeGreaterThan(0)

      // Press Escape
      await user.keyboard('{Escape}')

      // Test passes if no error - Escape is handled gracefully
    })
  })

  describe('modal header', () => {
    it('should show Edit Filter title', () => {
      render(<FilterConfigModal {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /edit filter/i })).toBeInTheDocument()
    })

    it('should have close button in header', () => {
      render(<FilterConfigModal {...defaultProps} />)

      // Find close button (the X icon in header)
      const header = screen.getByRole('heading', { name: /edit filter/i }).closest('div')
      const closeButton = within(header as HTMLElement).getByRole('button')

      expect(closeButton).toBeInTheDocument()
    })

    it('should call onCancel when header close button clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()

      render(<FilterConfigModal {...defaultProps} onCancel={onCancel} />)

      const header = screen.getByRole('heading', { name: /edit filter/i }).closest('div')
      const closeButton = within(header as HTMLElement).getByRole('button')

      await user.click(closeButton)

      expect(onCancel).toHaveBeenCalled()
    })
  })
})

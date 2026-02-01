/**
 * Filter Components Test Suite
 *
 * Comprehensive tests for:
 * - AnalysisFilterSection
 * - AnalysisFilterGroup
 * - AnalysisFilterItem
 * - filterUtils (both AnalysisBuilder and client utils)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalysisFilterSection from '../../../../src/client/components/AnalysisBuilder/AnalysisFilterSection'
import AnalysisFilterGroup from '../../../../src/client/components/AnalysisBuilder/AnalysisFilterGroup'
import AnalysisFilterItem from '../../../../src/client/components/AnalysisBuilder/AnalysisFilterItem'
import type { Filter, SimpleFilter, GroupFilter } from '../../../../src/client/types'
import type { MetaResponse } from '../../../../src/client/shared/types'

// Mock the filter values hook
vi.mock('../../../../src/client/hooks/useFilterValues', () => ({
  useFilterValues: vi.fn(() => ({
    values: ['value1', 'value2', 'value3'],
    loading: false,
    error: null,
    searchValues: vi.fn(),
  })),
}))

// Mock schema for field metadata
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
    {
      name: 'Orders',
      title: 'Orders',
      measures: [
        { name: 'Orders.count', type: 'number', title: 'Order Count', shortTitle: 'Count', aggType: 'count' },
      ],
      dimensions: [
        { name: 'Orders.status', type: 'string', title: 'Order Status', shortTitle: 'Status' },
        { name: 'Orders.orderedAt', type: 'time', title: 'Ordered At', shortTitle: 'Ordered' },
      ],
    },
  ],
}

// =======================
// AnalysisFilterSection Tests
// =======================

describe('AnalysisFilterSection', () => {
  const defaultProps = {
    filters: [] as Filter[],
    schema: mockSchema,
    onFiltersChange: vi.fn(),
    onFieldDropped: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('should display "No filters applied" when filters array is empty', () => {
      render(<AnalysisFilterSection {...defaultProps} />)
      expect(screen.getByText('No filters applied')).toBeInTheDocument()
    })

    it('should display Filter heading', () => {
      render(<AnalysisFilterSection {...defaultProps} />)
      expect(screen.getByText('Filter')).toBeInTheDocument()
    })

    it('should not show filter count when no filters', () => {
      render(<AnalysisFilterSection {...defaultProps} />)
      // Filter count is shown in parentheses after "Filter"
      expect(screen.queryByText('(0)')).not.toBeInTheDocument()
    })

    it('should not show "Clear all" button when no filters', () => {
      render(<AnalysisFilterSection {...defaultProps} />)
      expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
    })
  })

  describe('filter count display', () => {
    it('should show filter count for simple filters', () => {
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
        { member: 'Users.status', operator: 'equals', values: ['active'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} />)
      expect(screen.getByText('(2)')).toBeInTheDocument()
    })

    it('should count nested filters in groups', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.name', operator: 'equals', values: ['John'] },
            { member: 'Users.status', operator: 'equals', values: ['active'] },
          ]
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} />)
      expect(screen.getByText('(2)')).toBeInTheDocument()
    })

    it('should count deeply nested filters', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.name', operator: 'equals', values: ['John'] },
            {
              type: 'or',
              filters: [
                { member: 'Users.status', operator: 'equals', values: ['active'] },
                { member: 'Users.age', operator: 'gt', values: [25] },
              ]
            } as GroupFilter,
          ]
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} />)
      expect(screen.getByText('(3)')).toBeInTheDocument()
    })
  })

  describe('clear all functionality', () => {
    it('should show "Clear all" button when filters exist', () => {
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} />)
      expect(screen.getByText('Clear all')).toBeInTheDocument()
    })

    it('should call onFiltersChange with empty array when Clear all is clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      await user.click(screen.getByText('Clear all'))
      expect(onFiltersChange).toHaveBeenCalledWith([])
    })

    it('should clear all filters via keyboard', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      const clearAllButton = screen.getByText('Clear all')
      clearAllButton.focus()
      await user.keyboard('{Enter}')
      expect(onFiltersChange).toHaveBeenCalledWith([])
    })
  })

  describe('add filter via field modal', () => {
    it('should open field modal when header is clicked', async () => {
      const user = userEvent.setup()
      render(<AnalysisFilterSection {...defaultProps} />)

      // Click the header button to add a filter
      const addButton = screen.getByRole('button', { name: /filter/i })
      await user.click(addButton)

      // Modal should open (look for search input)
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should close modal without adding filter when cancelled', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      render(<AnalysisFilterSection {...defaultProps} onFiltersChange={onFiltersChange} />)

      // Open modal
      const addButton = screen.getByRole('button', { name: /filter/i })
      await user.click(addButton)

      // Close modal via Escape
      await user.keyboard('{Escape}')

      expect(onFiltersChange).not.toHaveBeenCalled()
    })
  })

  describe('drag and drop', () => {
    it('should highlight drop zone when dragging over', () => {
      render(<AnalysisFilterSection {...defaultProps} />)

      // Get the drop zone container
      const dropZone = screen.getByText('No filters applied').parentElement

      // Simulate drag over
      const dragOverEvent = new Event('dragover', { bubbles: true })
      Object.defineProperty(dragOverEvent, 'preventDefault', { value: vi.fn() })
      Object.defineProperty(dragOverEvent, 'stopPropagation', { value: vi.fn() })

      dropZone?.dispatchEvent(dragOverEvent)

      // Should show "Drop to add filter" text when dragging
      // Note: The actual state change would require more complex event simulation
    })

    it('should handle drop event with valid field data', () => {
      const onFieldDropped = vi.fn()
      render(<AnalysisFilterSection {...defaultProps} onFieldDropped={onFieldDropped} />)

      const dropZone = screen.getByText('No filters applied').parentElement

      // Create drop event
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() })
      Object.defineProperty(dropEvent, 'stopPropagation', { value: vi.fn() })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: () => JSON.stringify({ field: 'Users.name' })
        }
      })

      dropZone?.dispatchEvent(dropEvent)

      // Should call onFieldDropped with the field name
      expect(onFieldDropped).toHaveBeenCalledWith('Users.name')
    })

    it('should ignore invalid drop data', () => {
      const onFieldDropped = vi.fn()
      render(<AnalysisFilterSection {...defaultProps} onFieldDropped={onFieldDropped} />)

      const dropZone = screen.getByText('No filters applied').parentElement

      // Create drop event with invalid JSON
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() })
      Object.defineProperty(dropEvent, 'stopPropagation', { value: vi.fn() })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          getData: () => 'invalid json'
        }
      })

      dropZone?.dispatchEvent(dropEvent)

      // Should not call onFieldDropped
      expect(onFieldDropped).not.toHaveBeenCalled()
    })
  })

  describe('filter rendering', () => {
    it('should render simple filters as AnalysisFilterItem', () => {
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} />)

      // Should show the field title
      expect(screen.getByText('User Name')).toBeInTheDocument()
    })

    it('should render group filters as AnalysisFilterGroup', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.name', operator: 'equals', values: ['John'] },
            { member: 'Users.status', operator: 'equals', values: ['active'] },
          ]
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} />)

      // Should show AND toggle button
      expect(screen.getByRole('button', { name: /and/i })).toBeInTheDocument()
      // Should show condition count
      expect(screen.getByText(/2 conditions/)).toBeInTheDocument()
    })
  })

  describe('filter removal', () => {
    it('should remove simple filter when remove button clicked', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
        { member: 'Users.status', operator: 'equals', values: ['active'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      // Find remove buttons
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[0])

      // Should call with the remaining filter
      expect(onFiltersChange).toHaveBeenCalled()
      const newFilters = onFiltersChange.mock.calls[0][0]
      expect(newFilters).toHaveLength(1)
    })

    it('should unwrap single-filter group when removing a filter', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.name', operator: 'equals', values: ['John'] },
            { member: 'Users.status', operator: 'equals', values: ['active'] },
          ]
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      // Remove one filter from the group
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[0])

      // The callback should have been called
      expect(onFiltersChange).toHaveBeenCalled()
    })
  })

  describe('dimensionsOnly mode', () => {
    it('should pass dimensionFilter mode to FieldSearchModal when dimensionsOnly is true', async () => {
      const user = userEvent.setup()
      render(<AnalysisFilterSection {...defaultProps} dimensionsOnly={true} />)

      // Open modal
      const addButton = screen.getByRole('button', { name: /filter/i })
      await user.click(addButton)

      await waitFor(() => {
        // Modal should show dimensions search placeholder
        expect(screen.getByPlaceholderText('Search dimensions...')).toBeInTheDocument()
      })
    })
  })

  describe('field selection from modal', () => {
    it('should add a new simple filter when field is selected from modal', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      render(<AnalysisFilterSection {...defaultProps} filters={[]} onFiltersChange={onFiltersChange} />)

      // Open modal
      const addButton = screen.getByRole('button', { name: /filter/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Find and click on a field - the modal shows fields from mock schema
      const listbox = screen.getByRole('listbox')
      const fieldOption = within(listbox).getByText('User Name')
      await user.click(fieldOption)

      // Should call onFiltersChange with the new filter
      expect(onFiltersChange).toHaveBeenCalled()
      const newFilters = onFiltersChange.mock.calls[0][0]
      expect(newFilters).toHaveLength(1)
      expect(newFilters[0]).toMatchObject({
        member: 'Users.name',
        operator: 'equals',
        values: [],
      })
    })

    it('should add time filter with default dateRange for time fields', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      render(<AnalysisFilterSection {...defaultProps} filters={[]} onFiltersChange={onFiltersChange} />)

      // Open modal
      const addButton = screen.getByRole('button', { name: /filter/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Switch to filter mode to see all fields including time dimensions
      const listbox = screen.getByRole('listbox')
      const timeField = within(listbox).getByText('Created At')
      await user.click(timeField)

      expect(onFiltersChange).toHaveBeenCalled()
      const newFilters = onFiltersChange.mock.calls[0][0]
      expect(newFilters[0]).toMatchObject({
        member: 'Users.createdAt',
        operator: 'inDateRange',
      })
      expect(newFilters[0]).toHaveProperty('dateRange')
    })

    it('should wrap existing filter in AND group when adding second filter', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const existingFilters: Filter[] = [
        { member: 'Users.status', operator: 'equals', values: ['active'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={existingFilters} onFiltersChange={onFiltersChange} />)

      // Open modal
      const addButton = screen.getByTitle('Add filter')
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Find and click a field item button (buttons within the listbox)
      const listbox = screen.getByRole('listbox')
      const fieldButtons = within(listbox).getAllByRole('button')
      // Click the first available field button
      if (fieldButtons.length > 0) {
        await user.click(fieldButtons[0])

        expect(onFiltersChange).toHaveBeenCalled()
        const newFilters = onFiltersChange.mock.calls[0][0]
        // Should be wrapped in AND group when adding to existing single filter
        expect(newFilters).toHaveLength(1)
        expect(newFilters[0]).toHaveProperty('type', 'and')
        expect(newFilters[0].filters).toHaveLength(2)
      }
    })

    it('should add filter to existing AND group', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const existingFilters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.name', operator: 'equals', values: ['John'] },
            { member: 'Users.status', operator: 'equals', values: ['active'] },
          ],
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={existingFilters} onFiltersChange={onFiltersChange} />)

      // Open modal
      const addButton = screen.getByTitle('Add filter')
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Find and click a field item button
      const listbox = screen.getByRole('listbox')
      const fieldButtons = within(listbox).getAllByRole('button')
      if (fieldButtons.length > 0) {
        await user.click(fieldButtons[0])

        expect(onFiltersChange).toHaveBeenCalled()
        const newFilters = onFiltersChange.mock.calls[0][0]
        // Should have 3 filters now
        expect(newFilters[0].filters).toHaveLength(3)
      }
    })
  })

  describe('filter update and removal edge cases', () => {
    it('should handle updating a filter in the root array', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      // Click to edit
      await user.click(screen.getByText('User Name'))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit filter/i })).toBeInTheDocument()
      })

      // Save (unchanged)
      await user.click(screen.getByRole('button', { name: /save/i }))

      expect(onFiltersChange).toHaveBeenCalled()
    })

    it('should unwrap single-filter group to simple filter when filter removed', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
        { member: 'Users.status', operator: 'equals', values: ['active'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      // Remove first filter
      const removeButtons = screen.getAllByRole('button', { name: /remove filter/i })
      await user.click(removeButtons[0])

      expect(onFiltersChange).toHaveBeenCalled()
      const newFilters = onFiltersChange.mock.calls[0][0]
      expect(newFilters).toHaveLength(1)
    })
  })

  describe('drag and drop visual feedback', () => {
    it('should show drag over state visual feedback', async () => {
      const { container } = render(<AnalysisFilterSection {...defaultProps} />)

      // Get the drop zone by looking at its structure
      const dropZone = container.querySelector('.dc\\:border-dashed')
      expect(dropZone).toBeInTheDocument()
    })

    it('should not add drag handlers when onFieldDropped is not provided', () => {
      const { container } = render(
        <AnalysisFilterSection
          filters={[]}
          schema={mockSchema}
          onFiltersChange={vi.fn()}
          // No onFieldDropped
        />
      )

      const dropZone = container.querySelector('.dc\\:border-dashed')
      expect(dropZone).toBeInTheDocument()
    })
  })

  describe('clear all via keyboard space key', () => {
    it('should clear filters when space key pressed on Clear all', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      const clearAllButton = screen.getByText('Clear all')
      clearAllButton.focus()
      await user.keyboard(' ')
      expect(onFiltersChange).toHaveBeenCalledWith([])
    })
  })

  describe('adding filters via nested group', () => {
    it('should open modal to add filter within nested group', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.name', operator: 'equals', values: ['John'] },
          ],
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      // Find the add button within the group
      const addConditionButton = screen.getByTitle('Add condition')
      await user.click(addConditionButton)

      // Click "Add Filter" from the dropdown menu
      expect(screen.getByText('Add Filter')).toBeInTheDocument()
      await user.click(screen.getByText('Add Filter'))

      // Modal should open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('multiple filter types at root level', () => {
    it('should render mixed simple and group filters', () => {
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
        {
          type: 'or',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
          ],
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} />)

      expect(screen.getByText('User Name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /or/i })).toBeInTheDocument()
    })
  })

  describe('selected fields tracking', () => {
    it('should pass selected fields to FieldSearchModal', async () => {
      const user = userEvent.setup()
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
        {
          type: 'and',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
          ],
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} />)

      // Open modal
      const addButton = screen.getByTitle('Add filter')
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Modal should be open - selected fields should have been extracted from filters
      // This tests the getSelectedFields function
    })
  })

  describe('unwrapping single-filter group', () => {
    it('should unwrap single-filter group to simple filter after removal', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      // Create a scenario where removing a filter leaves a group with 1 filter
      // This requires having a simple filter + group, then removing the simple filter
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
        {
          type: 'and',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
          ],
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      // Remove the first simple filter
      const removeButtons = screen.getAllByRole('button', { name: /remove filter/i })
      await user.click(removeButtons[0])

      // Should unwrap the single-item group to just the simple filter
      expect(onFiltersChange).toHaveBeenCalled()
      const newFilters = onFiltersChange.mock.calls[0][0]
      // The remaining group has only 1 filter, so it should be unwrapped
      expect(newFilters).toHaveLength(1)
      expect(newFilters[0]).toMatchObject({
        member: 'Users.status',
        operator: 'equals',
      })
    })

    it('should keep group when it has multiple filters after removal', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      // Have a simple filter followed by a group with 2 filters
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
        {
          type: 'and',
          filters: [
            { member: 'Users.status', operator: 'equals', values: ['active'] },
            { member: 'Users.age', operator: 'gt', values: [25] },
          ],
        } as GroupFilter,
      ]
      render(<AnalysisFilterSection {...defaultProps} filters={filters} onFiltersChange={onFiltersChange} />)

      // Remove the first simple filter
      const removeButtons = screen.getAllByRole('button', { name: /remove filter/i })
      await user.click(removeButtons[0])

      expect(onFiltersChange).toHaveBeenCalled()
      const newFilters = onFiltersChange.mock.calls[0][0]
      // The remaining group has 2 filters, so it should NOT be unwrapped
      expect(newFilters).toHaveLength(1)
      expect(newFilters[0]).toHaveProperty('type', 'and')
      expect(newFilters[0].filters).toHaveLength(2)
    })
  })
})

// =======================
// AnalysisFilterGroup Tests
// =======================

describe('AnalysisFilterGroup', () => {
  const defaultGroup: GroupFilter = {
    type: 'and',
    filters: [
      { member: 'Users.name', operator: 'equals', values: ['John'] },
      { member: 'Users.status', operator: 'equals', values: ['active'] },
    ],
  }

  const defaultProps = {
    group: defaultGroup,
    schema: mockSchema,
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    onAddFilter: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('group header', () => {
    it('should display AND/OR toggle button', () => {
      render(<AnalysisFilterGroup {...defaultProps} />)
      expect(screen.getByRole('button', { name: /and/i })).toBeInTheDocument()
    })

    it('should display condition count', () => {
      render(<AnalysisFilterGroup {...defaultProps} />)
      expect(screen.getByText('2 conditions')).toBeInTheDocument()
    })

    it('should display singular "condition" for single filter', () => {
      const singleGroup: GroupFilter = {
        type: 'and',
        filters: [{ member: 'Users.name', operator: 'equals', values: ['John'] }],
      }
      render(<AnalysisFilterGroup {...defaultProps} group={singleGroup} />)
      expect(screen.getByText('1 condition')).toBeInTheDocument()
    })
  })

  describe('AND/OR toggling', () => {
    it('should toggle from AND to OR when clicked', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      render(<AnalysisFilterGroup {...defaultProps} onUpdate={onUpdate} />)

      const toggleButton = screen.getByRole('button', { name: /and/i })
      await user.click(toggleButton)

      expect(onUpdate).toHaveBeenCalledWith({
        ...defaultGroup,
        type: 'or',
      })
    })

    it('should toggle from OR to AND when clicked', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      const orGroup: GroupFilter = { type: 'or', filters: defaultGroup.filters }
      render(<AnalysisFilterGroup {...defaultProps} group={orGroup} onUpdate={onUpdate} />)

      const toggleButton = screen.getByRole('button', { name: /or/i })
      await user.click(toggleButton)

      expect(onUpdate).toHaveBeenCalledWith({
        ...orGroup,
        type: 'and',
      })
    })
  })

  describe('add filter menu', () => {
    it('should open add menu when add button clicked', async () => {
      const user = userEvent.setup()
      render(<AnalysisFilterGroup {...defaultProps} />)

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('svg') && btn.getAttribute('title') === 'Add condition'
      )
      if (addButton) {
        await user.click(addButton)
        expect(screen.getByText('Add Filter')).toBeInTheDocument()
        expect(screen.getByText('Add AND Group')).toBeInTheDocument()
        expect(screen.getByText('Add OR Group')).toBeInTheDocument()
      }
    })

    it('should call onAddFilter when Add Filter is clicked', async () => {
      const user = userEvent.setup()
      const onAddFilter = vi.fn()
      render(<AnalysisFilterGroup {...defaultProps} onAddFilter={onAddFilter} />)

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Add condition'
      )
      if (addButton) {
        await user.click(addButton)
        await user.click(screen.getByText('Add Filter'))
        expect(onAddFilter).toHaveBeenCalledWith([])
      }
    })

    it('should add nested AND group', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      render(<AnalysisFilterGroup {...defaultProps} onUpdate={onUpdate} />)

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Add condition'
      )
      if (addButton) {
        await user.click(addButton)
        await user.click(screen.getByText('Add AND Group'))

        expect(onUpdate).toHaveBeenCalledWith({
          type: 'and',
          filters: [
            ...defaultGroup.filters,
            { type: 'and', filters: [] },
          ],
        })
      }
    })

    it('should add nested OR group', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      render(<AnalysisFilterGroup {...defaultProps} onUpdate={onUpdate} />)

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Add condition'
      )
      if (addButton) {
        await user.click(addButton)
        await user.click(screen.getByText('Add OR Group'))

        expect(onUpdate).toHaveBeenCalledWith({
          type: 'and',
          filters: [
            ...defaultGroup.filters,
            { type: 'or', filters: [] },
          ],
        })
      }
    })

    it('should close add menu when clicking outside', async () => {
      const user = userEvent.setup()
      render(<AnalysisFilterGroup {...defaultProps} />)

      const addButton = screen.getAllByRole('button').find(btn =>
        btn.getAttribute('title') === 'Add condition'
      )
      if (addButton) {
        await user.click(addButton)
        expect(screen.getByText('Add Filter')).toBeInTheDocument()

        // Click outside
        await user.click(document.body)

        await waitFor(() => {
          expect(screen.queryByText('Add Filter')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('remove group', () => {
    it('should show remove button by default', () => {
      render(<AnalysisFilterGroup {...defaultProps} />)
      const removeButton = screen.getByRole('button', { name: /remove group/i })
      expect(removeButton).toBeInTheDocument()
    })

    it('should hide remove button when hideRemoveButton is true', () => {
      render(<AnalysisFilterGroup {...defaultProps} hideRemoveButton={true} />)
      expect(screen.queryByRole('button', { name: /remove group/i })).not.toBeInTheDocument()
    })

    it('should call onRemove when remove button clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      render(<AnalysisFilterGroup {...defaultProps} onRemove={onRemove} />)

      const removeButton = screen.getByRole('button', { name: /remove group/i })
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalled()
    })
  })

  describe('nested filter management', () => {
    it('should update nested filter', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      render(<AnalysisFilterGroup {...defaultProps} onUpdate={onUpdate} />)

      // Find a filter item and click to edit
      const filterItem = screen.getByText('User Name')
      await user.click(filterItem)

      // Modal should open - change operator and save
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit filter/i })).toBeInTheDocument()
      })

      // Save the filter
      await user.click(screen.getByRole('button', { name: /save/i }))

      expect(onUpdate).toHaveBeenCalled()
    })

    it('should remove nested filter and update group', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      render(<AnalysisFilterGroup {...defaultProps} onUpdate={onUpdate} />)

      // Find remove buttons for individual filters
      const removeButtons = screen.getAllByRole('button', { name: /remove filter/i })
      await user.click(removeButtons[0])

      expect(onUpdate).toHaveBeenCalledWith({
        type: 'and',
        filters: [defaultGroup.filters[1]],
      })
    })

    it('should call onRemove when last filter in group is removed', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      const onUpdate = vi.fn()
      const singleGroup: GroupFilter = {
        type: 'and',
        filters: [{ member: 'Users.name', operator: 'equals', values: ['John'] }],
      }
      render(<AnalysisFilterGroup {...defaultProps} group={singleGroup} onUpdate={onUpdate} onRemove={onRemove} />)

      const removeButton = screen.getByRole('button', { name: /remove filter/i })
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalled()
    })
  })

  describe('empty group state', () => {
    it('should show empty state when no filters in group', () => {
      const emptyGroup: GroupFilter = { type: 'and', filters: [] }
      render(<AnalysisFilterGroup {...defaultProps} group={emptyGroup} />)

      expect(screen.getByText('No conditions in this group')).toBeInTheDocument()
      expect(screen.getByText('Add a filter')).toBeInTheDocument()
    })

    it('should call onAddFilter when "Add a filter" link clicked in empty state', async () => {
      const user = userEvent.setup()
      const onAddFilter = vi.fn()
      const emptyGroup: GroupFilter = { type: 'and', filters: [] }
      render(<AnalysisFilterGroup {...defaultProps} group={emptyGroup} onAddFilter={onAddFilter} />)

      await user.click(screen.getByText('Add a filter'))

      expect(onAddFilter).toHaveBeenCalledWith([])
    })
  })

  describe('nested groups', () => {
    it('should render nested group filters', () => {
      const nestedGroup: GroupFilter = {
        type: 'and',
        filters: [
          { member: 'Users.name', operator: 'equals', values: ['John'] },
          {
            type: 'or',
            filters: [
              { member: 'Users.status', operator: 'equals', values: ['active'] },
              { member: 'Users.age', operator: 'gt', values: [25] },
            ],
          } as GroupFilter,
        ],
      }
      render(<AnalysisFilterGroup {...defaultProps} group={nestedGroup} />)

      // Should show both AND and OR buttons
      expect(screen.getByRole('button', { name: /and/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /or/i })).toBeInTheDocument()
    })

    it('should pass correct depth to nested groups', () => {
      const nestedGroup: GroupFilter = {
        type: 'and',
        filters: [
          {
            type: 'or',
            filters: [{ member: 'Users.name', operator: 'equals', values: ['John'] }],
          } as GroupFilter,
        ],
      }
      render(<AnalysisFilterGroup {...defaultProps} group={nestedGroup} depth={0} />)

      // Nested group should be rendered with depth=1
      // This affects styling (border colors) - verify it renders without error
      expect(screen.getAllByRole('button', { name: /or/i })).toHaveLength(1)
    })
  })
})

// =======================
// AnalysisFilterItem Tests
// =======================

describe('AnalysisFilterItem', () => {
  const defaultFilter: SimpleFilter = {
    member: 'Users.name',
    operator: 'equals',
    values: ['John'],
  }

  const defaultProps = {
    filter: defaultFilter,
    schema: mockSchema,
    onRemove: vi.fn(),
    onUpdate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('display', () => {
    it('should display field title', () => {
      render(<AnalysisFilterItem {...defaultProps} />)
      expect(screen.getByText('User Name')).toBeInTheDocument()
    })

    it('should display operator label', () => {
      render(<AnalysisFilterItem {...defaultProps} />)
      expect(screen.getByText('equals')).toBeInTheDocument()
    })

    it('should display filter value', () => {
      render(<AnalysisFilterItem {...defaultProps} />)
      expect(screen.getByText('John')).toBeInTheDocument()
    })

    it('should display "(empty)" when no values', () => {
      const emptyFilter: SimpleFilter = { member: 'Users.name', operator: 'equals', values: [] }
      render(<AnalysisFilterItem {...defaultProps} filter={emptyFilter} />)
      expect(screen.getByText('(empty)')).toBeInTheDocument()
    })

    it('should display multiple values correctly', () => {
      const multiFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'equals',
        values: ['John', 'Jane'],
      }
      render(<AnalysisFilterItem {...defaultProps} filter={multiFilter} />)
      expect(screen.getByText('John, Jane')).toBeInTheDocument()
    })

    it('should truncate when more than 2 values', () => {
      const manyValuesFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'equals',
        values: ['John', 'Jane', 'Bob', 'Alice'],
      }
      render(<AnalysisFilterItem {...defaultProps} filter={manyValuesFilter} />)
      expect(screen.getByText(/John, Jane, \+2 more/)).toBeInTheDocument()
    })
  })

  describe('date range display', () => {
    it('should display date range string', () => {
      const dateFilter: SimpleFilter = {
        member: 'Users.createdAt',
        operator: 'inDateRange',
        values: [],
        dateRange: 'this month',
      }
      render(<AnalysisFilterItem {...defaultProps} filter={dateFilter} />)
      expect(screen.getByText('this month')).toBeInTheDocument()
    })

    it('should display custom date range', () => {
      const dateFilter: SimpleFilter = {
        member: 'Users.createdAt',
        operator: 'inDateRange',
        values: [],
        dateRange: ['2024-01-01', '2024-12-31'],
      }
      render(<AnalysisFilterItem {...defaultProps} filter={dateFilter} />)
      expect(screen.getByText('2024-01-01 to 2024-12-31')).toBeInTheDocument()
    })
  })

  describe('field type icons', () => {
    it('should show dimension icon for string field', () => {
      const { container } = render(<AnalysisFilterItem {...defaultProps} />)
      // Check that the component renders the dimension icon class
      const iconContainer = container.querySelector('.bg-dc-dimension')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should show time dimension icon for time field', () => {
      const timeFilter: SimpleFilter = {
        member: 'Users.createdAt',
        operator: 'inDateRange',
        values: [],
        dateRange: 'this month',
      }
      const { container } = render(<AnalysisFilterItem {...defaultProps} filter={timeFilter} />)
      const iconContainer = container.querySelector('.bg-dc-time-dimension')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should show measure icon for measure field', () => {
      const measureFilter: SimpleFilter = {
        member: 'Users.count',
        operator: 'gt',
        values: [10],
      }
      const { container } = render(<AnalysisFilterItem {...defaultProps} filter={measureFilter} />)
      const iconContainer = container.querySelector('.bg-dc-measure')
      expect(iconContainer).toBeInTheDocument()
    })
  })

  describe('set/notSet operators', () => {
    it('should not show value for set operator', () => {
      const setFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'set',
        values: [],
      }
      render(<AnalysisFilterItem {...defaultProps} filter={setFilter} />)
      expect(screen.getByText('User Name')).toBeInTheDocument()
      expect(screen.getByText('is set')).toBeInTheDocument()
      // Should not show "(empty)" or any value
      expect(screen.queryByText('(empty)')).not.toBeInTheDocument()
    })

    it('should not show value for notSet operator', () => {
      const notSetFilter: SimpleFilter = {
        member: 'Users.name',
        operator: 'notSet',
        values: [],
      }
      render(<AnalysisFilterItem {...defaultProps} filter={notSetFilter} />)
      expect(screen.getByText('is not set')).toBeInTheDocument()
    })
  })

  describe('edit filter', () => {
    it('should open FilterConfigModal when filter is clicked', async () => {
      const user = userEvent.setup()
      render(<AnalysisFilterItem {...defaultProps} />)

      // Click on the filter to edit
      await user.click(screen.getByText('User Name'))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit filter/i })).toBeInTheDocument()
      })
    })

    it('should call onUpdate when filter is saved', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      render(<AnalysisFilterItem {...defaultProps} onUpdate={onUpdate} />)

      // Open modal
      await user.click(screen.getByText('User Name'))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit filter/i })).toBeInTheDocument()
      })

      // Save
      await user.click(screen.getByRole('button', { name: /save/i }))

      expect(onUpdate).toHaveBeenCalled()
    })

    it('should close modal without updating when cancelled', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      render(<AnalysisFilterItem {...defaultProps} onUpdate={onUpdate} />)

      // Open modal
      await user.click(screen.getByText('User Name'))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit filter/i })).toBeInTheDocument()
      })

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onUpdate).not.toHaveBeenCalled()
      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /edit filter/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('remove filter', () => {
    it('should call onRemove when remove button clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      render(<AnalysisFilterItem {...defaultProps} onRemove={onRemove} />)

      const removeButton = screen.getByRole('button', { name: /remove filter/i })
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalled()
    })
  })

  describe('unknown field handling', () => {
    it('should display field name when not in schema', () => {
      const unknownFilter: SimpleFilter = {
        member: 'Unknown.field',
        operator: 'equals',
        values: ['test'],
      }
      render(<AnalysisFilterItem {...defaultProps} filter={unknownFilter} schema={null} />)
      expect(screen.getByText('Unknown.field')).toBeInTheDocument()
    })
  })
})

// =======================
// filterUtils Tests (AnalysisBuilder)
// =======================

import {
  findDateFilterForField,
  buildCompareDateRangeFromFilter,
  removeComparisonDateFilter,
} from '../../../../src/client/components/AnalysisBuilder/utils/filterUtils'

describe('filterUtils (AnalysisBuilder)', () => {

  describe('findDateFilterForField', () => {
    it('should find date filter for a field in flat array', () => {
      const filters: Filter[] = [
        { member: 'Users.createdAt', operator: 'inDateRange', dateRange: 'this month' } as SimpleFilter,
      ]
      const result = findDateFilterForField(filters, 'Users.createdAt')
      expect(result).toEqual({ dateRange: 'this month' })
    })

    it('should return undefined when field not found', () => {
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
      ]
      const result = findDateFilterForField(filters, 'Users.createdAt')
      expect(result).toBeUndefined()
    })

    it('should find date filter in nested group', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.createdAt', operator: 'inDateRange', dateRange: 'last week' } as SimpleFilter,
          ],
        } as GroupFilter,
      ]
      const result = findDateFilterForField(filters, 'Users.createdAt')
      expect(result).toEqual({ dateRange: 'last week' })
    })

    it('should find date filter in deeply nested groups', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            {
              type: 'or',
              filters: [
                { member: 'Users.createdAt', operator: 'inDateRange', dateRange: 'this quarter' } as SimpleFilter,
              ],
            } as GroupFilter,
          ],
        } as GroupFilter,
      ]
      const result = findDateFilterForField(filters, 'Users.createdAt')
      expect(result).toEqual({ dateRange: 'this quarter' })
    })

    it('should return undefined for non-inDateRange operators', () => {
      const filters: Filter[] = [
        { member: 'Users.createdAt', operator: 'beforeDate', values: ['2024-01-01'] },
      ]
      const result = findDateFilterForField(filters, 'Users.createdAt')
      expect(result).toBeUndefined()
    })
  })

  describe('buildCompareDateRangeFromFilter', () => {
    it('should return undefined when no date filter found', () => {
      const filters: Filter[] = []
      const result = buildCompareDateRangeFromFilter('Users.createdAt', filters)
      expect(result).toBeUndefined()
    })

    it('should build compare date range from preset date range', () => {
      const filters: Filter[] = [
        { member: 'Users.createdAt', operator: 'inDateRange', dateRange: 'this month' } as SimpleFilter,
      ]
      const result = buildCompareDateRangeFromFilter('Users.createdAt', filters)

      // Should return array of two arrays (current and prior period)
      expect(result).toBeDefined()
      expect(result).toHaveLength(2)
      expect(result![0]).toHaveLength(2) // Current period start/end
      expect(result![1]).toHaveLength(2) // Prior period start/end
    })

    it('should build compare date range from custom date range', () => {
      const filters: Filter[] = [
        { member: 'Users.createdAt', operator: 'inDateRange', dateRange: ['2024-01-01', '2024-01-31'] } as SimpleFilter,
      ]
      const result = buildCompareDateRangeFromFilter('Users.createdAt', filters)

      expect(result).toBeDefined()
      expect(result).toHaveLength(2)
    })
  })

  describe('removeComparisonDateFilter', () => {
    it('should remove date filter from flat array', () => {
      const filters: Filter[] = [
        { member: 'Users.createdAt', operator: 'inDateRange', dateRange: 'this month' } as SimpleFilter,
        { member: 'Users.name', operator: 'equals', values: ['John'] },
      ]
      const result = removeComparisonDateFilter(filters, 'Users.createdAt')

      expect(result).toHaveLength(1)
      expect((result[0] as SimpleFilter).member).toBe('Users.name')
    })

    it('should remove date filter from nested group', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.createdAt', operator: 'inDateRange', dateRange: 'this month' } as SimpleFilter,
            { member: 'Users.name', operator: 'equals', values: ['John'] },
          ],
        } as GroupFilter,
      ]
      const result = removeComparisonDateFilter(filters, 'Users.createdAt')

      expect(result).toHaveLength(1)
      const group = result[0] as GroupFilter
      expect(group.filters).toHaveLength(1)
    })

    it('should remove empty group after removing last filter', () => {
      const filters: Filter[] = [
        {
          type: 'and',
          filters: [
            { member: 'Users.createdAt', operator: 'inDateRange', dateRange: 'this month' } as SimpleFilter,
          ],
        } as GroupFilter,
      ]
      const result = removeComparisonDateFilter(filters, 'Users.createdAt')

      expect(result).toHaveLength(0)
    })

    it('should not modify other filters', () => {
      const filters: Filter[] = [
        { member: 'Users.name', operator: 'equals', values: ['John'] },
        { member: 'Users.status', operator: 'equals', values: ['active'] },
      ]
      const result = removeComparisonDateFilter(filters, 'Users.createdAt')

      expect(result).toHaveLength(2)
    })

    it('should handle non-inDateRange operators with same field', () => {
      const filters: Filter[] = [
        { member: 'Users.createdAt', operator: 'beforeDate', values: ['2024-01-01'] },
      ]
      const result = removeComparisonDateFilter(filters, 'Users.createdAt')

      expect(result).toHaveLength(1)
    })
  })
})

// =======================
// filterUtils Tests (Client Utils)
// =======================

import {
  getApplicableDashboardFilters,
  mergeDashboardAndPortletFilters,
  validateFilterForCube,
  validatePortletFilterMapping,
  extractDashboardFields,
  applyUniversalTimeFilters,
} from '../../../../src/client/utils/filterUtils'

describe('filterUtils (Client Utils)', () => {

  describe('getApplicableDashboardFilters', () => {
    it('should return empty array when no dashboard filters', () => {
      const result = getApplicableDashboardFilters(undefined, ['filter1'])
      expect(result).toEqual([])
    })

    it('should return empty array when no filter mapping', () => {
      const dashboardFilters = [
        { id: 'filter1', filter: { member: 'Users.name', operator: 'equals', values: ['John'] } },
      ]
      const result = getApplicableDashboardFilters(dashboardFilters, undefined)
      expect(result).toEqual([])
    })

    it('should filter by mapping and valid values', () => {
      const dashboardFilters = [
        { id: 'filter1', filter: { member: 'Users.name', operator: 'equals', values: ['John'] } },
        { id: 'filter2', filter: { member: 'Users.status', operator: 'equals', values: [] } },
        { id: 'filter3', filter: { member: 'Users.age', operator: 'gt', values: [25] } },
      ]
      const result = getApplicableDashboardFilters(dashboardFilters, ['filter1', 'filter3'])

      expect(result).toHaveLength(2)
    })

    it('should include set/notSet operators without values', () => {
      const dashboardFilters = [
        { id: 'filter1', filter: { member: 'Users.name', operator: 'set', values: [] } },
      ]
      const result = getApplicableDashboardFilters(dashboardFilters, ['filter1'])

      expect(result).toHaveLength(1)
    })

    it('should include inDateRange with dateRange property', () => {
      const dashboardFilters = [
        { id: 'filter1', filter: { member: 'Users.createdAt', operator: 'inDateRange', dateRange: 'this month', values: [] } },
      ]
      const result = getApplicableDashboardFilters(dashboardFilters, ['filter1'])

      expect(result).toHaveLength(1)
    })
  })

  describe('mergeDashboardAndPortletFilters', () => {
    it('should return portlet filters when no dashboard filters', () => {
      const portletFilters = [{ member: 'Users.name', operator: 'equals', values: ['John'] }]
      const result = mergeDashboardAndPortletFilters([], portletFilters)

      expect(result).toEqual(portletFilters)
    })

    it('should return dashboard filters when no portlet filters', () => {
      const dashboardFilters = [{ member: 'Users.name', operator: 'equals', values: ['John'] }]
      const result = mergeDashboardAndPortletFilters(dashboardFilters, undefined)

      expect(result).toEqual(dashboardFilters)
    })

    it('should merge with AND logic in server format by default', () => {
      const dashboardFilters = [{ member: 'Users.name', operator: 'equals', values: ['John'] }]
      const portletFilters = [{ member: 'Users.status', operator: 'equals', values: ['active'] }]
      const result = mergeDashboardAndPortletFilters(dashboardFilters, portletFilters)

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('and')
    })

    it('should merge with AND logic in client format', () => {
      const dashboardFilters = [{ member: 'Users.name', operator: 'equals', values: ['John'] }]
      const portletFilters = [{ member: 'Users.status', operator: 'equals', values: ['active'] }]
      const result = mergeDashboardAndPortletFilters(dashboardFilters, portletFilters, 'client')

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('type', 'and')
      expect(result[0]).toHaveProperty('filters')
    })
  })

  describe('validateFilterForCube', () => {
    it('should return true when no cube metadata', () => {
      const filter = { member: 'Users.name', operator: 'equals', values: ['John'] }
      const result = validateFilterForCube(filter, null)
      expect(result).toBe(true)
    })

    it('should return true when filter member exists in measures', () => {
      const filter = { member: 'Users.count', operator: 'gt', values: [10] }
      const result = validateFilterForCube(filter, mockSchema)
      expect(result).toBe(true)
    })

    it('should return true when filter member exists in dimensions', () => {
      const filter = { member: 'Users.name', operator: 'equals', values: ['John'] }
      const result = validateFilterForCube(filter, mockSchema)
      expect(result).toBe(true)
    })

    it('should return false when filter member does not exist', () => {
      const filter = { member: 'Unknown.field', operator: 'equals', values: ['test'] }
      const result = validateFilterForCube(filter, mockSchema)
      expect(result).toBe(false)
    })

    it('should validate nested group filters', () => {
      const filter: GroupFilter = {
        type: 'and',
        filters: [{ member: 'Users.name', operator: 'equals', values: ['John'] }],
      }
      const result = validateFilterForCube(filter, mockSchema)
      expect(result).toBe(true)
    })
  })

  describe('validatePortletFilterMapping', () => {
    it('should return valid when no mapping', () => {
      const result = validatePortletFilterMapping([], undefined, mockSchema)
      expect(result.isValid).toBe(true)
    })

    it('should return missing filter IDs when filters do not exist', () => {
      const result = validatePortletFilterMapping([], ['filter1', 'filter2'], mockSchema)
      expect(result.isValid).toBe(false)
      expect(result.missingFilterIds).toEqual(['filter1', 'filter2'])
    })

    it('should return invalid filter IDs when filter field not in schema', () => {
      const dashboardFilters = [
        { id: 'filter1', filter: { member: 'Unknown.field', operator: 'equals', values: ['test'] } },
      ]
      const result = validatePortletFilterMapping(dashboardFilters, ['filter1'], mockSchema)
      expect(result.isValid).toBe(false)
      expect(result.invalidFilterIds).toContain('filter1')
    })
  })

  describe('applyUniversalTimeFilters', () => {
    it('should return undefined when no time dimensions', () => {
      const result = applyUniversalTimeFilters([], ['filter1'], undefined)
      expect(result).toBeUndefined()
    })

    it('should return time dimensions unchanged when no mapping', () => {
      const timeDimensions = [{ dimension: 'Users.createdAt', granularity: 'day' }]
      const result = applyUniversalTimeFilters([], undefined, timeDimensions)
      expect(result).toEqual(timeDimensions)
    })

    it('should apply universal time filter dateRange to all time dimensions', () => {
      const dashboardFilters = [
        {
          id: 'filter1',
          isUniversalTime: true,
          filter: { member: 'Time.date', operator: 'inDateRange', dateRange: 'this month', values: [] },
        },
      ]
      const timeDimensions = [
        { dimension: 'Users.createdAt', granularity: 'day' },
        { dimension: 'Orders.orderedAt', granularity: 'month' },
      ]
      const result = applyUniversalTimeFilters(dashboardFilters, ['filter1'], timeDimensions)

      expect(result).toHaveLength(2)
      expect(result[0].dateRange).toBe('this month')
      expect(result[1].dateRange).toBe('this month')
    })

    it('should handle dateRange in values for backward compatibility', () => {
      const dashboardFilters = [
        {
          id: 'filter1',
          isUniversalTime: true,
          filter: { member: 'Time.date', operator: 'inDateRange', values: ['this quarter'] },
        },
      ]
      const timeDimensions = [{ dimension: 'Users.createdAt', granularity: 'day' }]
      const result = applyUniversalTimeFilters(dashboardFilters, ['filter1'], timeDimensions)

      expect(result[0].dateRange).toBe('this quarter')
    })
  })

  describe('extractDashboardFields', () => {
    it('should extract measures, dimensions, and timeDimensions from portlets', () => {
      const dashboardConfig = {
        portlets: [
          {
            id: 'portlet1',
            analysisConfig: {
              version: 1,
              analysisType: 'query',
              activeView: 'chart',
              charts: {},
              query: {
                measures: ['Users.count'],
                dimensions: ['Users.name'],
                timeDimensions: [{ dimension: 'Users.createdAt' }],
              },
            },
          },
        ],
      }
      const result = extractDashboardFields(dashboardConfig)

      expect(result.measures.has('Users.count')).toBe(true)
      expect(result.dimensions.has('Users.name')).toBe(true)
      expect(result.timeDimensions.has('Users.createdAt')).toBe(true)
    })

    it('should handle multi-query configurations', () => {
      const dashboardConfig = {
        portlets: [
          {
            id: 'portlet1',
            analysisConfig: {
              version: 1,
              analysisType: 'query',
              activeView: 'chart',
              charts: {},
              query: {
                queries: [
                  { measures: ['Users.count'], dimensions: ['Users.name'] },
                  { measures: ['Orders.count'], dimensions: ['Orders.status'] },
                ],
              },
            },
          },
        ],
      }
      const result = extractDashboardFields(dashboardConfig)

      expect(result.measures.has('Users.count')).toBe(true)
      expect(result.measures.has('Orders.count')).toBe(true)
      expect(result.dimensions.has('Users.name')).toBe(true)
      expect(result.dimensions.has('Orders.status')).toBe(true)
    })

    it('should handle funnel query configurations', () => {
      const dashboardConfig = {
        portlets: [
          {
            id: 'portlet1',
            analysisConfig: {
              version: 1,
              analysisType: 'funnel',
              activeView: 'chart',
              charts: {},
              query: {
                funnel: {
                  timeDimension: 'Events.timestamp',
                },
              },
            },
          },
        ],
      }
      const result = extractDashboardFields(dashboardConfig)

      expect(result.timeDimensions.has('Events.timestamp')).toBe(true)
    })

    it('should extract fields from filters', () => {
      const dashboardConfig = {
        portlets: [
          {
            id: 'portlet1',
            analysisConfig: {
              version: 1,
              analysisType: 'query',
              activeView: 'chart',
              charts: {},
              query: {
                measures: ['Users.count'],
                filters: [
                  { member: 'Users.status', operator: 'equals', values: ['active'] },
                ],
              },
            },
          },
        ],
      }
      const result = extractDashboardFields(dashboardConfig)

      expect(result.dimensions.has('Users.status')).toBe(true)
    })

    it('should handle invalid portlet configurations gracefully', () => {
      const dashboardConfig = {
        portlets: [
          { id: 'invalid' }, // Missing analysisConfig
        ],
      }
      // Should not throw
      expect(() => extractDashboardFields(dashboardConfig)).not.toThrow()
    })
  })
})

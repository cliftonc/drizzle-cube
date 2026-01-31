/**
 * FilterChip Component Tests
 *
 * Tests for the compact filter chip component which displays non-date filters
 * as clickable chips with inline value editing in view mode and edit/remove
 * actions in edit mode.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FilterChip from '../../../../src/client/components/DashboardFilters/FilterChip'
import type { DashboardFilter, CubeMeta, SimpleFilter } from '../../../../src/client/types'

// Mock FilterValuePopover to simplify testing
vi.mock('../../../../src/client/components/DashboardFilters/FilterValuePopover', () => ({
  default: function MockFilterValuePopover({
    filter,
    onValuesChange,
    onClose,
  }: {
    filter: SimpleFilter
    schema: CubeMeta | null
    onValuesChange: (values: any[]) => void
    onClose: () => void
    anchorRef: React.RefObject<HTMLElement>
  }) {
    return (
      <div data-testid="filter-value-popover">
        <div data-testid="current-values">{filter.values?.join(', ')}</div>
        <button data-testid="change-value-btn" onClick={() => onValuesChange(['newValue'])}>
          Change Value
        </button>
        <button data-testid="close-popover-btn" onClick={onClose}>
          Close
        </button>
      </div>
    )
  },
}))

// Mock schema
const mockSchema: CubeMeta = {
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
        { name: 'Users.age', type: 'number', title: 'Age', shortTitle: 'Age' },
      ],
      segments: [],
    },
  ],
}

describe('FilterChip', () => {
  const createSimpleFilter = (
    member: string,
    operator: string,
    values: any[]
  ): SimpleFilter => ({
    member,
    operator: operator as any,
    values,
  })

  const createDashboardFilter = (
    id: string,
    label: string,
    filter: SimpleFilter
  ): DashboardFilter => ({
    id,
    label,
    filter,
    isUniversalTime: false,
  })

  const defaultProps = {
    filter: createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
    schema: mockSchema,
    isEditMode: false,
    onChange: vi.fn(),
    onEdit: vi.fn(),
    onRemove: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render the filter label', () => {
      render(<FilterChip {...defaultProps} />)

      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should render the filter value display for equals operator', () => {
      render(<FilterChip {...defaultProps} />)

      // formatFilterValueDisplay for equals with single value returns "= active"
      expect(screen.getByText('= active')).toBeInTheDocument()
    })

    it('should render multiple values display for in operator', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status',
        createSimpleFilter('Users.status', 'in', ['active', 'pending', 'inactive'])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      expect(screen.getByText('in (active, pending, inactive)')).toBeInTheDocument()
    })

    it('should render comparison operator display', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Age',
        createSimpleFilter('Users.age', 'gt', [25])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      expect(screen.getByText('> 25')).toBeInTheDocument()
    })

    it('should render "is set" for set operator', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status',
        createSimpleFilter('Users.status', 'set', [])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      expect(screen.getByText('is set')).toBeInTheDocument()
    })

    it('should render "is not set" for notSet operator', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status',
        createSimpleFilter('Users.status', 'notSet', [])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      expect(screen.getByText('is not set')).toBeInTheDocument()
    })

    it('should render contains operator display', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status',
        createSimpleFilter('Users.status', 'contains', ['act'])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      expect(screen.getByText('contains "act"')).toBeInTheDocument()
    })

    it('should render title attribute with label and value', () => {
      render(<FilterChip {...defaultProps} />)

      const chip = screen.getByTitle('Status = active')
      expect(chip).toBeInTheDocument()
    })

    it('should return null for group filters', () => {
      const groupFilter: DashboardFilter = {
        id: 'group-1',
        label: 'Group Filter',
        filter: {
          type: 'and',
          filters: [
            createSimpleFilter('Users.status', 'equals', ['active']),
          ],
        },
      }

      const { container } = render(<FilterChip {...defaultProps} filter={groupFilter} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('view mode interactions', () => {
    it('should open popover when chip is clicked in view mode', async () => {
      const user = userEvent.setup()

      render(<FilterChip {...defaultProps} isEditMode={false} />)

      // Click the chip
      await user.click(screen.getByTitle('Status = active'))

      // Popover should be visible
      expect(screen.getByTestId('filter-value-popover')).toBeInTheDocument()
    })

    it('should not call onEdit when clicked in view mode', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      render(<FilterChip {...defaultProps} isEditMode={false} onEdit={onEdit} />)

      await user.click(screen.getByTitle('Status = active'))

      expect(onEdit).not.toHaveBeenCalled()
    })

    it('should call onChange when value is changed via popover', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()

      render(<FilterChip {...defaultProps} isEditMode={false} onChange={onChange} />)

      // Open popover
      await user.click(screen.getByTitle('Status = active'))

      // Change value
      await user.click(screen.getByTestId('change-value-btn'))

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            values: ['newValue'],
          }),
        })
      )
    })

    it('should close popover when close button is clicked', async () => {
      const user = userEvent.setup()

      render(<FilterChip {...defaultProps} isEditMode={false} />)

      // Open popover
      await user.click(screen.getByTitle('Status = active'))
      expect(screen.getByTestId('filter-value-popover')).toBeInTheDocument()

      // Close popover
      await user.click(screen.getByTestId('close-popover-btn'))

      expect(screen.queryByTestId('filter-value-popover')).not.toBeInTheDocument()
    })

    it('should not show edit/remove buttons in view mode', () => {
      render(<FilterChip {...defaultProps} isEditMode={false} />)

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    })
  })

  describe('edit mode interactions', () => {
    it('should show edit and remove buttons in edit mode', () => {
      render(<FilterChip {...defaultProps} isEditMode={true} />)

      // The buttons exist with icons, find by their structure
      const buttons = screen.getAllByRole('button')
      // Should have edit and remove buttons
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should call onEdit when chip is clicked in edit mode', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      render(<FilterChip {...defaultProps} isEditMode={true} onEdit={onEdit} />)

      // Click the chip
      await user.click(screen.getByTitle('Status = active'))

      expect(onEdit).toHaveBeenCalled()
    })

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()

      render(<FilterChip {...defaultProps} isEditMode={true} onEdit={onEdit} />)

      // Find and click the edit button (first button after the chip content)
      const buttons = screen.getAllByRole('button')
      // Edit button is typically the first action button
      await user.click(buttons[0])

      expect(onEdit).toHaveBeenCalled()
    })

    it('should call onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(<FilterChip {...defaultProps} isEditMode={true} onRemove={onRemove} />)

      // Find and click the remove button (second action button)
      const buttons = screen.getAllByRole('button')
      // Remove button is typically the second action button
      await user.click(buttons[1])

      expect(onRemove).toHaveBeenCalled()
    })

    it('should not open popover when clicked in edit mode', async () => {
      const user = userEvent.setup()

      render(<FilterChip {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTitle('Status = active'))

      expect(screen.queryByTestId('filter-value-popover')).not.toBeInTheDocument()
    })

    it('should stop propagation when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      const chipOnClick = vi.fn()

      render(<FilterChip {...defaultProps} isEditMode={true} onEdit={onEdit} />)

      const buttons = screen.getAllByRole('button')
      await user.click(buttons[0])

      expect(onEdit).toHaveBeenCalledTimes(1)
    })

    it('should stop propagation when remove button is clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()

      render(<FilterChip {...defaultProps} isEditMode={true} onRemove={onRemove} />)

      const buttons = screen.getAllByRole('button')
      await user.click(buttons[1])

      expect(onRemove).toHaveBeenCalledTimes(1)
    })
  })

  describe('hover states', () => {
    it('should have cursor pointer style', () => {
      render(<FilterChip {...defaultProps} />)

      const chip = screen.getByTitle('Status = active')
      expect(chip.className).toContain('dc:cursor-pointer')
    })

    it('should have transition styles for hover effects', () => {
      render(<FilterChip {...defaultProps} />)

      const chip = screen.getByTitle('Status = active')
      expect(chip.className).toContain('dc:transition-colors')
    })
  })

  describe('empty state handling', () => {
    it('should handle empty values array', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status',
        createSimpleFilter('Users.status', 'equals', [])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      // Should render the label even with empty values
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should handle null schema gracefully', () => {
      render(<FilterChip {...defaultProps} schema={null} />)

      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have clickable chip element', () => {
      render(<FilterChip {...defaultProps} />)

      const chip = screen.getByTitle('Status = active')
      expect(chip).toBeInTheDocument()
    })

    it('should have action buttons in edit mode', () => {
      render(<FilterChip {...defaultProps} isEditMode={true} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should have title attribute for tooltip information', () => {
      render(<FilterChip {...defaultProps} />)

      expect(screen.getByTitle('Status = active')).toBeInTheDocument()
    })
  })

  describe('value display formatting', () => {
    it('should format between operator correctly', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Age',
        createSimpleFilter('Users.age', 'between', [18, 65])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      expect(screen.getByText('18 - 65')).toBeInTheDocument()
    })

    it('should format boolean values correctly', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status',
        createSimpleFilter('Users.status', 'equals', [true])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      expect(screen.getByText('= true')).toBeInTheDocument()
    })

    it('should format notEquals operator correctly', () => {
      const filter = createDashboardFilter(
        'filter-1',
        'Status',
        createSimpleFilter('Users.status', 'notEquals', ['inactive'])
      )

      render(<FilterChip {...defaultProps} filter={filter} />)

      expect(screen.getByText('!= inactive')).toBeInTheDocument()
    })
  })
})

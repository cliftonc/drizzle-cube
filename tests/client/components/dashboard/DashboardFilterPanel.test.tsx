/**
 * Comprehensive tests for DashboardFilterPanel
 *
 * Tests cover:
 * - Component visibility based on editable and isEditMode props
 * - Edit mode vs View mode rendering
 * - Filter CRUD operations (add, edit, remove)
 * - Universal time filter handling
 * - Modal interactions
 * - Callback invocations
 * - Schema conversion
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardFilterPanel from '../../../../src/client/components/DashboardFilterPanel'
import type { DashboardFilter, CubeMeta, DashboardConfig } from '../../../../src/client/types'

// Mock the child components to isolate DashboardFilterPanel tests
vi.mock('../../../../src/client/components/DashboardFilters/FilterEditModal', () => ({
  default: vi.fn(({ isOpen, onSave, onClose, onDelete, filter }) => {
    if (!isOpen) return null
    return (
      <div data-testid="filter-edit-modal">
        <span data-testid="editing-filter-id">{filter?.id}</span>
        <span data-testid="editing-filter-label">{filter?.label}</span>
        <button onClick={() => onSave(filter)} data-testid="modal-save">Save</button>
        <button onClick={onClose} data-testid="modal-close">Close</button>
        <button onClick={onDelete} data-testid="modal-delete">Delete</button>
      </div>
    )
  })
}))

vi.mock('../../../../src/client/components/DashboardFilters/EditModeFilterList', () => ({
  default: vi.fn(({ dashboardFilters, onAddFilter, onAddTimeFilter, onEditFilter, onRemoveFilter, selectedFilterId, onFilterSelect }) => (
    <div data-testid="edit-mode-filter-list">
      <button onClick={onAddFilter} data-testid="add-filter-btn">Add Filter</button>
      <button onClick={onAddTimeFilter} data-testid="add-time-filter-btn">Add Time Filter</button>
      {dashboardFilters.map((filter: DashboardFilter) => (
        <div key={filter.id} data-testid={`filter-item-${filter.id}`}>
          <span>{filter.label}</span>
          <button onClick={() => onEditFilter(filter.id)} data-testid={`edit-${filter.id}`}>Edit</button>
          <button onClick={() => onRemoveFilter(filter.id)} data-testid={`remove-${filter.id}`}>Remove</button>
          <button onClick={() => onFilterSelect?.(filter.id)} data-testid={`select-${filter.id}`}>Select</button>
        </div>
      ))}
      {selectedFilterId && <span data-testid="selected-filter">{selectedFilterId}</span>}
    </div>
  ))
}))

vi.mock('../../../../src/client/components/DashboardFilters/CompactFilterBar', () => ({
  default: vi.fn(({ dashboardFilters, onAddFilter, onEditFilter, onRemoveFilter }) => (
    <div data-testid="compact-filter-bar">
      <button onClick={onAddFilter} data-testid="compact-add-filter">Add Filter</button>
      {dashboardFilters.map((filter: DashboardFilter) => (
        <div key={filter.id} data-testid={`compact-filter-${filter.id}`}>
          <span>{filter.label}</span>
          <button onClick={() => onEditFilter(filter.id)} data-testid={`compact-edit-${filter.id}`}>Edit</button>
          <button onClick={() => onRemoveFilter(filter.id)} data-testid={`compact-remove-${filter.id}`}>Remove</button>
        </div>
      ))}
    </div>
  ))
}))

// Sample data for testing
const sampleFilters: DashboardFilter[] = [
  {
    id: 'filter-1',
    label: 'Department Filter',
    filter: {
      member: 'Employees.departmentId',
      operator: 'equals',
      values: ['engineering']
    }
  },
  {
    id: 'filter-2',
    label: 'Active Status',
    filter: {
      member: 'Employees.isActive',
      operator: 'equals',
      values: [true]
    }
  }
]

const sampleSchema: CubeMeta = {
  cubes: [
    {
      name: 'Employees',
      title: 'Employees',
      measures: [
        { name: 'Employees.count', type: 'number', title: 'Count', shortTitle: 'Cnt' }
      ],
      dimensions: [
        { name: 'Employees.id', type: 'number', title: 'ID', shortTitle: 'ID' },
        { name: 'Employees.departmentId', type: 'number', title: 'Department ID', shortTitle: 'Dept ID' },
        { name: 'Employees.isActive', type: 'boolean', title: 'Is Active', shortTitle: 'Active' }
      ],
      segments: []
    }
  ]
}

const sampleDashboardConfig: DashboardConfig = {
  portlets: [],
  layoutMode: 'grid'
}

describe('DashboardFilterPanel', () => {
  const defaultProps = {
    dashboardFilters: sampleFilters,
    editable: true,
    schema: sampleSchema,
    dashboardConfig: sampleDashboardConfig,
    onDashboardFiltersChange: vi.fn(),
    onSaveFilters: vi.fn(),
    selectedFilterId: null,
    onFilterSelect: vi.fn(),
    isEditMode: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Visibility Tests
  // ==========================================================================
  describe('Component Visibility', () => {
    it('should return null when not editable', () => {
      const { container } = render(
        <DashboardFilterPanel {...defaultProps} editable={false} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should return null when not in edit mode and no filters exist', () => {
      const { container } = render(
        <DashboardFilterPanel {...defaultProps} dashboardFilters={[]} isEditMode={false} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render when editable and in edit mode', () => {
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      expect(screen.getByTestId('edit-mode-filter-list')).toBeInTheDocument()
    })

    it('should render when editable and has filters (view mode)', () => {
      render(<DashboardFilterPanel {...defaultProps} isEditMode={false} />)

      expect(screen.getByTestId('compact-filter-bar')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Edit Mode vs View Mode Tests
  // ==========================================================================
  describe('Edit Mode vs View Mode', () => {
    it('should show EditModeFilterList when isEditMode is true', () => {
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      expect(screen.getByTestId('edit-mode-filter-list')).toBeInTheDocument()
      expect(screen.queryByTestId('compact-filter-bar')).not.toBeInTheDocument()
    })

    it('should show CompactFilterBar when isEditMode is false', () => {
      render(<DashboardFilterPanel {...defaultProps} isEditMode={false} />)

      expect(screen.getByTestId('compact-filter-bar')).toBeInTheDocument()
      expect(screen.queryByTestId('edit-mode-filter-list')).not.toBeInTheDocument()
    })

    it('should pass filters to EditModeFilterList', () => {
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      expect(screen.getByTestId('filter-item-filter-1')).toBeInTheDocument()
      expect(screen.getByTestId('filter-item-filter-2')).toBeInTheDocument()
    })

    it('should pass filters to CompactFilterBar', () => {
      render(<DashboardFilterPanel {...defaultProps} isEditMode={false} />)

      expect(screen.getByTestId('compact-filter-filter-1')).toBeInTheDocument()
      expect(screen.getByTestId('compact-filter-filter-2')).toBeInTheDocument()
    })

    it('should pass selectedFilterId to EditModeFilterList', () => {
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} selectedFilterId="filter-1" />)

      expect(screen.getByTestId('selected-filter')).toHaveTextContent('filter-1')
    })
  })

  // ==========================================================================
  // Add Filter Tests
  // ==========================================================================
  describe('Add Filter', () => {
    it('should open modal with new filter when Add Filter is clicked in edit mode', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTestId('add-filter-btn'))

      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()
    })

    it('should generate unique ID for new filter', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTestId('add-filter-btn'))

      const filterId = screen.getByTestId('editing-filter-id').textContent
      expect(filterId).toMatch(/^df_\d+_[a-z0-9]+$/)
    })

    it('should generate incrementing label for new filter', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTestId('add-filter-btn'))

      // With 2 existing filters, new filter should be "Filter 3"
      expect(screen.getByTestId('editing-filter-label')).toHaveTextContent('Filter 3')
    })

    it('should open modal from CompactFilterBar add button', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={false} />)

      await user.click(screen.getByTestId('compact-add-filter'))

      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Add Time Filter Tests
  // ==========================================================================
  describe('Add Time Filter', () => {
    it('should add universal time filter directly without opening modal', async () => {
      const user = userEvent.setup()
      const onDashboardFiltersChange = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onDashboardFiltersChange={onDashboardFiltersChange}
        />
      )

      await user.click(screen.getByTestId('add-time-filter-btn'))

      expect(onDashboardFiltersChange).toHaveBeenCalledTimes(1)

      const newFilters = onDashboardFiltersChange.mock.calls[0][0]
      expect(newFilters).toHaveLength(3) // 2 existing + 1 new

      const newTimeFilter = newFilters[2]
      expect(newTimeFilter.label).toBe('Date Range Filter')
      expect(newTimeFilter.isUniversalTime).toBe(true)
      expect(newTimeFilter.filter.operator).toBe('inDateRange')
      expect(newTimeFilter.filter.values).toEqual(['last 30 days'])
    })

    it('should not open modal when adding time filter', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTestId('add-time-filter-btn'))

      expect(screen.queryByTestId('filter-edit-modal')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Edit Filter Tests
  // ==========================================================================
  describe('Edit Filter', () => {
    it('should open modal with existing filter when Edit is clicked', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTestId('edit-filter-1'))

      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()
      expect(screen.getByTestId('editing-filter-id')).toHaveTextContent('filter-1')
    })

    it('should open modal from CompactFilterBar edit button', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={false} />)

      await user.click(screen.getByTestId('compact-edit-filter-2'))

      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()
      expect(screen.getByTestId('editing-filter-id')).toHaveTextContent('filter-2')
    })
  })

  // ==========================================================================
  // Remove Filter Tests
  // ==========================================================================
  describe('Remove Filter', () => {
    it('should remove filter when Remove is clicked in edit mode', async () => {
      const user = userEvent.setup()
      const onDashboardFiltersChange = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onDashboardFiltersChange={onDashboardFiltersChange}
        />
      )

      await user.click(screen.getByTestId('remove-filter-1'))

      expect(onDashboardFiltersChange).toHaveBeenCalledTimes(1)

      const updatedFilters = onDashboardFiltersChange.mock.calls[0][0]
      expect(updatedFilters).toHaveLength(1)
      expect(updatedFilters[0].id).toBe('filter-2')
    })

    it('should remove filter from CompactFilterBar', async () => {
      const user = userEvent.setup()
      const onDashboardFiltersChange = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={false}
          onDashboardFiltersChange={onDashboardFiltersChange}
        />
      )

      await user.click(screen.getByTestId('compact-remove-filter-2'))

      expect(onDashboardFiltersChange).toHaveBeenCalledTimes(1)

      const updatedFilters = onDashboardFiltersChange.mock.calls[0][0]
      expect(updatedFilters).toHaveLength(1)
      expect(updatedFilters[0].id).toBe('filter-1')
    })

    it('should close modal if editing filter is removed', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      // Open modal for filter-1
      await user.click(screen.getByTestId('edit-filter-1'))
      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()

      // Remove filter-1
      await user.click(screen.getByTestId('remove-filter-1'))

      // Modal should be closed
      expect(screen.queryByTestId('filter-edit-modal')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Modal Save Behavior Tests
  // ==========================================================================
  describe('Modal Save Behavior', () => {
    it('should update existing filter when saving from modal', async () => {
      const user = userEvent.setup()
      const onDashboardFiltersChange = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onDashboardFiltersChange={onDashboardFiltersChange}
        />
      )

      // Open modal for existing filter
      await user.click(screen.getByTestId('edit-filter-1'))

      // Save the filter
      await user.click(screen.getByTestId('modal-save'))

      expect(onDashboardFiltersChange).toHaveBeenCalled()
    })

    it('should add new filter when saving a new filter from modal', async () => {
      const user = userEvent.setup()
      const onDashboardFiltersChange = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onDashboardFiltersChange={onDashboardFiltersChange}
        />
      )

      // Open modal for new filter
      await user.click(screen.getByTestId('add-filter-btn'))

      // Save the new filter
      await user.click(screen.getByTestId('modal-save'))

      expect(onDashboardFiltersChange).toHaveBeenCalled()

      const updatedFilters = onDashboardFiltersChange.mock.calls[0][0]
      expect(updatedFilters.length).toBe(3) // 2 existing + 1 new
    })

    it('should call onSaveFilters if provided', async () => {
      const user = userEvent.setup()
      const onSaveFilters = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onSaveFilters={onSaveFilters}
        />
      )

      await user.click(screen.getByTestId('edit-filter-1'))
      await user.click(screen.getByTestId('modal-save'))

      expect(onSaveFilters).toHaveBeenCalled()
    })

    it('should handle async onSaveFilters', async () => {
      const user = userEvent.setup()
      const onSaveFilters = vi.fn().mockResolvedValue(undefined)
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onSaveFilters={onSaveFilters}
        />
      )

      await user.click(screen.getByTestId('edit-filter-1'))
      await user.click(screen.getByTestId('modal-save'))

      await waitFor(() => {
        expect(onSaveFilters).toHaveBeenCalled()
      })
    })
  })

  // ==========================================================================
  // Modal Close Behavior Tests
  // ==========================================================================
  describe('Modal Close Behavior', () => {
    it('should close modal when Close button is clicked', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTestId('edit-filter-1'))
      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()

      await user.click(screen.getByTestId('modal-close'))
      expect(screen.queryByTestId('filter-edit-modal')).not.toBeInTheDocument()
    })

    it('should clear editing state when modal is closed', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTestId('edit-filter-1'))
      await user.click(screen.getByTestId('modal-close'))

      // Open modal for different filter
      await user.click(screen.getByTestId('edit-filter-2'))

      expect(screen.getByTestId('editing-filter-id')).toHaveTextContent('filter-2')
    })
  })

  // ==========================================================================
  // Modal Delete Behavior Tests
  // ==========================================================================
  describe('Modal Delete Behavior', () => {
    it('should remove filter when Delete is clicked in modal', async () => {
      const user = userEvent.setup()
      const onDashboardFiltersChange = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onDashboardFiltersChange={onDashboardFiltersChange}
        />
      )

      await user.click(screen.getByTestId('edit-filter-1'))
      await user.click(screen.getByTestId('modal-delete'))

      expect(onDashboardFiltersChange).toHaveBeenCalled()

      const updatedFilters = onDashboardFiltersChange.mock.calls[0][0]
      expect(updatedFilters).toHaveLength(1)
      expect(updatedFilters[0].id).toBe('filter-2')
    })
  })

  // ==========================================================================
  // Filter Selection Tests
  // ==========================================================================
  describe('Filter Selection', () => {
    it('should call onFilterSelect when filter is selected', async () => {
      const user = userEvent.setup()
      const onFilterSelect = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onFilterSelect={onFilterSelect}
        />
      )

      await user.click(screen.getByTestId('select-filter-1'))

      expect(onFilterSelect).toHaveBeenCalledWith('filter-1')
    })
  })

  // ==========================================================================
  // Schema Conversion Tests
  // ==========================================================================
  describe('Schema Conversion', () => {
    it('should convert CubeMeta to MetaResponse format for modal', async () => {
      const user = userEvent.setup()

      // The component internally converts schema - we verify it doesn't crash
      render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      await user.click(screen.getByTestId('edit-filter-1'))

      // If the modal renders, the conversion succeeded
      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()
    })

    it('should handle null schema gracefully', async () => {
      const user = userEvent.setup()
      render(<DashboardFilterPanel {...defaultProps} schema={null} isEditMode={true} />)

      await user.click(screen.getByTestId('edit-filter-1'))

      // Should still render modal
      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()
    })

    it('should handle schema with missing optional fields', async () => {
      const user = userEvent.setup()
      const minimalSchema: CubeMeta = {
        cubes: [{
          name: 'Test',
          title: 'Test Cube',
          measures: [],
          dimensions: [],
          segments: []
        }]
      }

      render(<DashboardFilterPanel {...defaultProps} schema={minimalSchema} isEditMode={true} />)

      await user.click(screen.getByTestId('edit-filter-1'))

      expect(screen.getByTestId('filter-edit-modal')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle empty filters array', () => {
      render(<DashboardFilterPanel {...defaultProps} dashboardFilters={[]} isEditMode={true} />)

      // Should still render the container
      expect(screen.getByTestId('edit-mode-filter-list')).toBeInTheDocument()
    })

    it('should handle undefined callbacks gracefully', async () => {
      const user = userEvent.setup()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onFilterSelect={undefined}
        />
      )

      // Should not throw when clicking select (onFilterSelect is optional)
      await user.click(screen.getByTestId('select-filter-1'))
    })

    it('should handle filter with no member in filter definition', async () => {
      const user = userEvent.setup()
      const filtersWithEmptyMember: DashboardFilter[] = [{
        id: 'empty-member',
        label: 'Empty Member Filter',
        filter: {
          member: '',
          operator: 'equals',
          values: []
        }
      }]

      render(
        <DashboardFilterPanel
          {...defaultProps}
          dashboardFilters={filtersWithEmptyMember}
          isEditMode={true}
        />
      )

      expect(screen.getByTestId('filter-item-empty-member')).toBeInTheDocument()
    })

    it('should handle concurrent add operations', async () => {
      const user = userEvent.setup()
      const onDashboardFiltersChange = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onDashboardFiltersChange={onDashboardFiltersChange}
        />
      )

      // Quickly click add time filter multiple times
      await user.click(screen.getByTestId('add-time-filter-btn'))
      await user.click(screen.getByTestId('add-time-filter-btn'))

      // Each click should result in a call
      expect(onDashboardFiltersChange).toHaveBeenCalledTimes(2)
    })

    it('should maintain stable filter IDs when updating', async () => {
      const user = userEvent.setup()
      const onDashboardFiltersChange = vi.fn()
      render(
        <DashboardFilterPanel
          {...defaultProps}
          isEditMode={true}
          onDashboardFiltersChange={onDashboardFiltersChange}
        />
      )

      // Edit filter-1
      await user.click(screen.getByTestId('edit-filter-1'))
      await user.click(screen.getByTestId('modal-save'))

      // The filter ID should remain the same
      const updatedFilters = onDashboardFiltersChange.mock.calls[0][0]
      expect(updatedFilters.find((f: DashboardFilter) => f.id === 'filter-1')).toBeDefined()
    })

    it('should handle special characters in filter labels', () => {
      const specialFilters: DashboardFilter[] = [{
        id: 'special',
        label: 'Filter with "quotes" & <brackets>',
        filter: { member: 'test', operator: 'equals', values: [] }
      }]

      render(<DashboardFilterPanel {...defaultProps} dashboardFilters={specialFilters} isEditMode={true} />)

      expect(screen.getByText('Filter with "quotes" & <brackets>')).toBeInTheDocument()
    })

    it('should handle large number of filters', () => {
      const manyFilters: DashboardFilter[] = Array.from({ length: 100 }, (_, i) => ({
        id: `filter-${i}`,
        label: `Filter ${i}`,
        filter: { member: `Cube.field${i}`, operator: 'equals' as const, values: [i] }
      }))

      render(<DashboardFilterPanel {...defaultProps} dashboardFilters={manyFilters} isEditMode={true} />)

      // Should render all filters
      expect(screen.getByTestId('filter-item-filter-0')).toBeInTheDocument()
      expect(screen.getByTestId('filter-item-filter-99')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Container Styling Tests
  // ==========================================================================
  describe('Container Styling', () => {
    it('should have proper margin bottom on container', () => {
      const { container } = render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      const mainDiv = container.querySelector('.dc\\:mb-4')
      expect(mainDiv).toBeInTheDocument()
    })

    it('should have border and rounded styling in edit mode', () => {
      const { container } = render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      const editModeContainer = container.querySelector('.dc\\:border.dc\\:rounded-lg')
      expect(editModeContainer).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Props Update Tests
  // ==========================================================================
  describe('Props Updates', () => {
    it('should update when dashboardFilters prop changes', () => {
      const { rerender } = render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      expect(screen.getByTestId('filter-item-filter-1')).toBeInTheDocument()
      expect(screen.getByTestId('filter-item-filter-2')).toBeInTheDocument()

      const newFilters: DashboardFilter[] = [{
        id: 'filter-3',
        label: 'New Filter',
        filter: { member: 'new', operator: 'equals', values: [] }
      }]

      rerender(<DashboardFilterPanel {...defaultProps} dashboardFilters={newFilters} isEditMode={true} />)

      expect(screen.queryByTestId('filter-item-filter-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('filter-item-filter-3')).toBeInTheDocument()
    })

    it('should switch views when isEditMode changes', () => {
      const { rerender } = render(<DashboardFilterPanel {...defaultProps} isEditMode={true} />)

      expect(screen.getByTestId('edit-mode-filter-list')).toBeInTheDocument()

      rerender(<DashboardFilterPanel {...defaultProps} isEditMode={false} />)

      expect(screen.getByTestId('compact-filter-bar')).toBeInTheDocument()
    })
  })
})

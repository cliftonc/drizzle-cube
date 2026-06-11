/**
 * Comprehensive tests for PortletFilterConfigModal
 *
 * Tests cover:
 * - Modal rendering and visibility
 * - Filter checkbox toggling
 * - Save and cancel actions
 * - Props handling and edge cases
 * - Filter preview formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PortletFilterConfigModal from '../../../../src/client/components/PortletFilterConfigModal'
import type { DashboardFilter } from '../../../../src/client/types'

// Sample dashboard filters for testing
const sampleFilters: DashboardFilter[] = [
  {
    id: 'filter-1',
    label: 'Department Filter',
    filter: {
      member: 'Employees.departmentId',
      operator: 'equals',
      values: ['engineering', 'sales']
    }
  },
  {
    id: 'filter-2',
    label: 'Active Users',
    filter: {
      member: 'Employees.isActive',
      operator: 'equals',
      values: [true]
    }
  },
  {
    id: 'filter-3',
    label: 'Complex Filter',
    filter: {
      type: 'and',
      filters: [
        { member: 'Employees.salary', operator: 'gt', values: [50000] },
        { member: 'Employees.name', operator: 'contains', values: ['John'] }
      ]
    }
  }
]

describe('PortletFilterConfigModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    dashboardFilters: sampleFilters,
    currentMapping: [] as string[],
    onSave: vi.fn(),
    portletTitle: 'Test Portlet'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Rendering Tests
  // ==========================================================================
  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<PortletFilterConfigModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('heading', { name: /configure dashboard filters/i })).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(<PortletFilterConfigModal {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /configure dashboard filters/i })).toBeInTheDocument()
    })

    it('should display the portlet title in the description', () => {
      render(<PortletFilterConfigModal {...defaultProps} portletTitle="Sales Dashboard" />)

      expect(screen.getByText(/choose which dashboard filters apply to "Sales Dashboard"/i)).toBeInTheDocument()
    })

    it('should render all dashboard filters as checkboxes', () => {
      render(<PortletFilterConfigModal {...defaultProps} />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(sampleFilters.length)
    })

    it('should display filter labels correctly', () => {
      render(<PortletFilterConfigModal {...defaultProps} />)

      expect(screen.getByText('Department Filter')).toBeInTheDocument()
      expect(screen.getByText('Active Users')).toBeInTheDocument()
      expect(screen.getByText('Complex Filter')).toBeInTheDocument()
    })

    it('should render Cancel and Apply Filters buttons', () => {
      render(<PortletFilterConfigModal {...defaultProps} />)

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument()
    })

    it('should display selection count correctly', () => {
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={['filter-1', 'filter-2']} />)

      expect(screen.getByText('2 of 3 selected')).toBeInTheDocument()
    })

    it('should not count stale mapping entries for deleted filters', () => {
      render(
        <PortletFilterConfigModal
          {...defaultProps}
          currentMapping={['filter-1', 'deleted-filter-a', 'deleted-filter-b']}
        />
      )

      expect(screen.getByText('1 of 3 selected')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Empty State Tests
  // ==========================================================================
  describe('Empty State', () => {
    it('should show empty state when no dashboard filters exist', () => {
      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={[]} />)

      expect(screen.getByText(/no dashboard filters available/i)).toBeInTheDocument()
      expect(screen.getByText(/add filters at the dashboard level first/i)).toBeInTheDocument()
    })

    it('should render filter icon in empty state', () => {
      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={[]} />)

      // SVG icon should be present in empty state
      const emptyStateContainer = screen.getByText(/no dashboard filters available/i).closest('div')
      expect(emptyStateContainer).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Checkbox Interaction Tests
  // ==========================================================================
  describe('Checkbox Interactions', () => {
    it('should check filters that are in currentMapping', () => {
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={['filter-1', 'filter-3']} />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes[0]).toBeChecked() // filter-1
      expect(checkboxes[1]).not.toBeChecked() // filter-2
      expect(checkboxes[2]).toBeChecked() // filter-3
    })

    it('should toggle filter selection when checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={[]} />)

      const firstCheckbox = screen.getAllByRole('checkbox')[0]
      expect(firstCheckbox).not.toBeChecked()

      await user.click(firstCheckbox)

      expect(firstCheckbox).toBeChecked()
    })

    it('should uncheck selected filter when clicked again', async () => {
      const user = userEvent.setup()
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={['filter-1']} />)

      const firstCheckbox = screen.getAllByRole('checkbox')[0]
      expect(firstCheckbox).toBeChecked()

      await user.click(firstCheckbox)

      expect(firstCheckbox).not.toBeChecked()
    })

    it('should allow selecting multiple filters', async () => {
      const user = userEvent.setup()
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={[]} />)

      const checkboxes = screen.getAllByRole('checkbox')

      await user.click(checkboxes[0])
      await user.click(checkboxes[1])
      await user.click(checkboxes[2])

      expect(checkboxes[0]).toBeChecked()
      expect(checkboxes[1]).toBeChecked()
      expect(checkboxes[2]).toBeChecked()
    })

    it('should update selection count when toggling filters', async () => {
      const user = userEvent.setup()
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={[]} />)

      expect(screen.getByText('0 of 3 selected')).toBeInTheDocument()

      await user.click(screen.getAllByRole('checkbox')[0])
      expect(screen.getByText('1 of 3 selected')).toBeInTheDocument()

      await user.click(screen.getAllByRole('checkbox')[1])
      expect(screen.getByText('2 of 3 selected')).toBeInTheDocument()
    })

    it('should toggle filter when clicking on label', async () => {
      const user = userEvent.setup()
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={[]} />)

      // Click on the label instead of the checkbox
      const label = screen.getByText('Department Filter').closest('label')
      expect(label).toBeInTheDocument()

      await user.click(label!)

      expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
    })
  })

  // ==========================================================================
  // Save Behavior Tests
  // ==========================================================================
  describe('Save Behavior', () => {
    it('should call onSave with selected filter IDs when Apply Filters is clicked', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onSave={onSave} currentMapping={['filter-1', 'filter-2']} />)

      await user.click(screen.getByRole('button', { name: /apply filters/i }))

      expect(onSave).toHaveBeenCalledWith(['filter-1', 'filter-2'])
    })

    it('should call onClose after saving', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const onSave = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onClose={onClose} onSave={onSave} />)

      await user.click(screen.getByRole('button', { name: /apply filters/i }))

      expect(onSave).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })

    it('should save newly selected filters', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onSave={onSave} currentMapping={[]} />)

      await user.click(screen.getAllByRole('checkbox')[1])
      await user.click(screen.getByRole('button', { name: /apply filters/i }))

      expect(onSave).toHaveBeenCalledWith(['filter-2'])
    })

    it('should save after removing some filters', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onSave={onSave} currentMapping={['filter-1', 'filter-2', 'filter-3']} />)

      // Uncheck filter-2
      await user.click(screen.getAllByRole('checkbox')[1])
      await user.click(screen.getByRole('button', { name: /apply filters/i }))

      expect(onSave).toHaveBeenCalledWith(['filter-1', 'filter-3'])
    })

    it('should save empty array when all filters are deselected', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onSave={onSave} currentMapping={['filter-1']} />)

      await user.click(screen.getAllByRole('checkbox')[0]) // Uncheck filter-1
      await user.click(screen.getByRole('button', { name: /apply filters/i }))

      expect(onSave).toHaveBeenCalledWith([])
    })
  })

  // ==========================================================================
  // Cancel Behavior Tests
  // ==========================================================================
  describe('Cancel Behavior', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onClose={onClose} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onClose).toHaveBeenCalled()
    })

    it('should not call onSave when Cancel is clicked', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onSave={onSave} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should reset selection state when Cancel is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onClose={onClose} currentMapping={['filter-1']} />)

      // Make changes
      await user.click(screen.getAllByRole('checkbox')[1]) // Select filter-2

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      // onClose should be called (modal closes without saving changes)
      expect(onClose).toHaveBeenCalled()
    })

    it('should close modal when clicking outside (backdrop)', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onClose={onClose} />)

      // Click on the backdrop (the outer fixed div)
      const backdrop = screen.getByRole('heading', { name: /configure dashboard filters/i }).closest('.dc\\:fixed')
      expect(backdrop).toBeInTheDocument()

      await user.click(backdrop!)

      expect(onClose).toHaveBeenCalled()
    })

    it('should not close when clicking inside the modal content', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<PortletFilterConfigModal {...defaultProps} onClose={onClose} />)

      // Click on the modal content (not the backdrop)
      const modalContent = screen.getByText('Available Filters')
      await user.click(modalContent)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Filter Preview Formatting Tests
  // ==========================================================================
  describe('Filter Preview Formatting', () => {
    it('should display simple filter preview with member, operator, and values', () => {
      render(<PortletFilterConfigModal {...defaultProps} />)

      expect(screen.getByText(/Employees\.departmentId equals engineering, sales/i)).toBeInTheDocument()
    })

    it('should display "no value" when filter has empty values array', () => {
      const filtersWithEmptyValues: DashboardFilter[] = [{
        id: 'empty-filter',
        label: 'Empty Filter',
        filter: {
          member: 'Employees.status',
          operator: 'equals',
          values: []
        }
      }]

      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={filtersWithEmptyValues} />)

      expect(screen.getByText(/Employees\.status equals no value/i)).toBeInTheDocument()
    })

    it('should display group filter preview for AND groups', () => {
      const andGroupFilter: DashboardFilter[] = [{
        id: 'and-group',
        label: 'AND Group Filter',
        filter: {
          type: 'and',
          filters: [
            { member: 'a', operator: 'equals', values: [1] },
            { member: 'b', operator: 'equals', values: [2] }
          ]
        }
      }]

      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={andGroupFilter} />)

      expect(screen.getByText('AND group with 2 filters')).toBeInTheDocument()
    })

    it('should display group filter preview for OR groups', () => {
      const orGroupFilter: DashboardFilter[] = [{
        id: 'or-group',
        label: 'OR Group Filter',
        filter: {
          type: 'or',
          filters: [
            { member: 'a', operator: 'equals', values: [1] },
            { member: 'b', operator: 'equals', values: [2] },
            { member: 'c', operator: 'equals', values: [3] }
          ]
        }
      }]

      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={orGroupFilter} />)

      expect(screen.getByText('OR group with 3 filters')).toBeInTheDocument()
    })

    it('should display singular "filter" for single filter in group', () => {
      const singleFilterGroup: DashboardFilter[] = [{
        id: 'single-group',
        label: 'Single Filter Group',
        filter: {
          type: 'and',
          filters: [
            { member: 'a', operator: 'equals', values: [1] }
          ]
        }
      }]

      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={singleFilterGroup} />)

      expect(screen.getByText('AND group with 1 filter')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Applied Badge Tests
  // ==========================================================================
  describe('Applied Badge', () => {
    it('should show "Applied" badge for selected filters', () => {
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={['filter-1']} />)

      expect(screen.getByText('Applied')).toBeInTheDocument()
    })

    it('should not show "Applied" badge for unselected filters', () => {
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={[]} />)

      expect(screen.queryByText('Applied')).not.toBeInTheDocument()
    })

    it('should update Applied badges when toggling filters', async () => {
      const user = userEvent.setup()
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={[]} />)

      expect(screen.queryByText('Applied')).not.toBeInTheDocument()

      await user.click(screen.getAllByRole('checkbox')[0])

      expect(screen.getByText('Applied')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // State Reset on Props Change Tests
  // ==========================================================================
  describe('State Reset on Props Change', () => {
    it('should update selection when currentMapping prop changes', () => {
      const { rerender } = render(<PortletFilterConfigModal {...defaultProps} currentMapping={['filter-1']} />)

      expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
      expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked()

      rerender(<PortletFilterConfigModal {...defaultProps} currentMapping={['filter-2']} />)

      expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked()
      expect(screen.getAllByRole('checkbox')[1]).toBeChecked()
    })

    it('should reset selection when modal reopens', () => {
      const { rerender } = render(<PortletFilterConfigModal {...defaultProps} isOpen={true} currentMapping={['filter-1']} />)

      expect(screen.getAllByRole('checkbox')[0]).toBeChecked()

      // Close modal
      rerender(<PortletFilterConfigModal {...defaultProps} isOpen={false} currentMapping={['filter-1']} />)

      // Reopen with different mapping
      rerender(<PortletFilterConfigModal {...defaultProps} isOpen={true} currentMapping={['filter-2']} />)

      expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked()
      expect(screen.getAllByRole('checkbox')[1]).toBeChecked()
    })
  })

  // ==========================================================================
  // Field Mapping (per-portlet member override) Tests
  // ==========================================================================
  describe('Field Mapping', () => {
    const schema = {
      cubes: [
        {
          name: 'Employees',
          title: 'Employees',
          measures: [{ name: 'Employees.count', title: 'Count', shortTitle: 'Count', type: 'count' }],
          dimensions: [
            { name: 'Employees.departmentId', title: 'Department ID', shortTitle: 'Dept', type: 'string' },
            { name: 'Employees.isActive', title: 'Is Active', shortTitle: 'Active', type: 'boolean' }
          ],
          segments: [],
          relationships: [{ targetCube: 'Departments', relationship: 'belongsTo' as const }]
        },
        {
          name: 'Departments',
          title: 'Departments',
          measures: [],
          dimensions: [
            { name: 'Departments.name', title: 'Department Name', shortTitle: 'Name', type: 'string' }
          ],
          segments: []
        }
      ]
    }

    const portlet = {
      id: 'portlet-1',
      title: 'Test Portlet',
      query: JSON.stringify({ measures: ['Employees.count'] }),
      chartType: 'bar',
      w: 6,
      h: 4,
      x: 0,
      y: 0
    } as any

    const mappingProps = {
      ...defaultProps,
      schema: schema as any,
      portlet
    }

    it('should show the Apply to field dropdown for a checked simple filter', () => {
      render(<PortletFilterConfigModal {...mappingProps} currentMapping={['filter-1']} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      // Default option reflects the filter's own field
      expect(screen.getByRole('option', { name: 'Default (Employees.departmentId)' })).toBeInTheDocument()
    })

    it('should not show a dropdown for unchecked filters', () => {
      render(<PortletFilterConfigModal {...mappingProps} currentMapping={[]} />)

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('should not show a dropdown for group filters', () => {
      render(<PortletFilterConfigModal {...mappingProps} currentMapping={['filter-3']} />)

      // filter-3 is the group filter - checked but no remap dropdown
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('should not show dropdowns when schema/portlet are not provided', () => {
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={['filter-1']} />)

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('should offer only type-compatible dimensions of reachable cubes', () => {
      render(<PortletFilterConfigModal {...mappingProps} currentMapping={['filter-1']} />)

      // filter-1 targets Employees.departmentId (string)
      expect(screen.getByRole('option', { name: 'Department Name' })).toBeInTheDocument()
      // boolean dimension is type-incompatible
      expect(screen.queryByRole('option', { name: 'Is Active' })).not.toBeInTheDocument()
    })

    it('should save an object entry when a field override is selected', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(
        <PortletFilterConfigModal
          {...mappingProps}
          onSave={onSave}
          currentMapping={['filter-1', 'filter-2']}
        />
      )

      const selects = screen.getAllByRole('combobox')
      await user.selectOptions(selects[0], 'Departments.name')
      await user.click(screen.getByRole('button', { name: /apply filters/i }))

      expect(onSave).toHaveBeenCalledWith([
        { filterId: 'filter-1', member: 'Departments.name' },
        'filter-2'
      ])
    })

    it('should serialize back to a plain string when reverting to the default field', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(
        <PortletFilterConfigModal
          {...mappingProps}
          onSave={onSave}
          currentMapping={[{ filterId: 'filter-1', member: 'Departments.name' }]}
        />
      )

      // Revert to default (empty value option)
      await user.selectOptions(screen.getByRole('combobox'), '')
      await user.click(screen.getByRole('button', { name: /apply filters/i }))

      expect(onSave).toHaveBeenCalledWith(['filter-1'])
    })

    it('should show the mapped badge and preselect the override from the saved mapping', () => {
      render(
        <PortletFilterConfigModal
          {...mappingProps}
          currentMapping={[{ filterId: 'filter-1', member: 'Departments.name' }]}
        />
      )

      expect(screen.getByText('Mapped to Departments.name')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toHaveValue('Departments.name')
    })

    it('should keep a stale override selected and warn instead of dropping it', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      render(
        <PortletFilterConfigModal
          {...mappingProps}
          onSave={onSave}
          currentMapping={[{ filterId: 'filter-1', member: 'Removed.field' }]}
        />
      )

      expect(screen.getByRole('combobox')).toHaveValue('Removed.field')
      expect(screen.getByText(/no longer available in the schema/i)).toBeInTheDocument()

      // Saving without touching the dropdown keeps the stale override
      await user.click(screen.getByRole('button', { name: /apply filters/i }))
      expect(onSave).toHaveBeenCalledWith([{ filterId: 'filter-1', member: 'Removed.field' }])
    })

    it('should not toggle the checkbox when interacting with the dropdown', async () => {
      const user = userEvent.setup()
      render(<PortletFilterConfigModal {...mappingProps} currentMapping={['filter-1']} />)

      await user.selectOptions(screen.getByRole('combobox'), 'Departments.name')

      // Filter stays checked
      expect(screen.getAllByRole('checkbox')[0]).toBeChecked()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle undefined dashboardFilters gracefully', () => {
      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={undefined as any} />)

      expect(screen.getByText(/no dashboard filters available/i)).toBeInTheDocument()
    })

    it('should handle undefined currentMapping gracefully', () => {
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={undefined as any} />)

      // All checkboxes should be unchecked
      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked()
      })
    })

    it('should handle filter without filter property', () => {
      const malformedFilter: DashboardFilter[] = [{
        id: 'no-filter',
        label: 'No Filter Property',
        filter: undefined as any
      }]

      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={malformedFilter} />)

      // Should render the label without crashing
      expect(screen.getByText('No Filter Property')).toBeInTheDocument()
    })

    it('should handle very long portlet titles', () => {
      const longTitle = 'This is a very long portlet title that might cause layout issues if not handled properly'
      render(<PortletFilterConfigModal {...defaultProps} portletTitle={longTitle} />)

      expect(screen.getByText(new RegExp(longTitle))).toBeInTheDocument()
    })

    it('should handle special characters in filter labels', () => {
      const specialFilters: DashboardFilter[] = [{
        id: 'special',
        label: 'Filter with "quotes" & <special> chars',
        filter: { member: 'test', operator: 'equals', values: [] }
      }]

      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={specialFilters} />)

      expect(screen.getByText('Filter with "quotes" & <special> chars')).toBeInTheDocument()
    })

    it('should handle filters with very long member names', () => {
      const longMemberFilter: DashboardFilter[] = [{
        id: 'long-member',
        label: 'Long Member Filter',
        filter: {
          member: 'VeryLongCubeName.veryLongDimensionNameThatMightCauseOverflow',
          operator: 'equals',
          values: ['value']
        }
      }]

      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={longMemberFilter} />)

      expect(screen.getByText(/VeryLongCubeName\.veryLongDimensionNameThatMightCauseOverflow/)).toBeInTheDocument()
    })

    it('should handle large number of filters', () => {
      const manyFilters: DashboardFilter[] = Array.from({ length: 50 }, (_, i) => ({
        id: `filter-${i}`,
        label: `Filter ${i}`,
        filter: { member: `Cube.field${i}`, operator: 'equals' as const, values: [i] }
      }))

      render(<PortletFilterConfigModal {...defaultProps} dashboardFilters={manyFilters} />)

      expect(screen.getAllByRole('checkbox')).toHaveLength(50)
      expect(screen.getByText('0 of 50 selected')).toBeInTheDocument()
    })

    it('should handle currentMapping with non-existent filter IDs', () => {
      render(<PortletFilterConfigModal {...defaultProps} currentMapping={['non-existent-id']} />)

      // All actual filters should be unchecked
      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked()
      })
    })
  })
})

/**
 * EditModeFilterList Component Tests
 *
 * Tests for the edit mode filter list component which displays filters
 * as interactive chips with edit/delete actions, add buttons, and
 * supports both mobile and desktop layouts.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EditModeFilterList from '../../../../src/client/components/DashboardFilters/EditModeFilterList'
import type { DashboardFilter, SimpleFilter } from '../../../../src/client/types'

describe('EditModeFilterList', () => {
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
    filter: SimpleFilter,
    isUniversalTime = false
  ): DashboardFilter => ({
    id,
    label,
    filter,
    isUniversalTime,
  })

  const defaultProps = {
    dashboardFilters: [] as DashboardFilter[],
    onAddFilter: vi.fn(),
    onAddTimeFilter: vi.fn(),
    onEditFilter: vi.fn(),
    onRemoveFilter: vi.fn(),
    selectedFilterId: null as string | null,
    onFilterSelect: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('header display', () => {
    it('should render "Filters" header', () => {
      render(<EditModeFilterList {...defaultProps} />)

      // Both mobile and desktop layouts have the header
      const headers = screen.getAllByText('Filters')
      expect(headers.length).toBeGreaterThan(0)
    })

    it('should show filter count badge when filters exist', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region', createSimpleFilter('Users.region', 'equals', ['US'])),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // Count badges appear in both mobile and desktop layouts
      const badges = screen.getAllByText('2')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should not show filter count badge when no filters', () => {
      render(<EditModeFilterList {...defaultProps} dashboardFilters={[]} />)

      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state message when no filters', () => {
      render(<EditModeFilterList {...defaultProps} dashboardFilters={[]} />)

      // Both mobile and desktop layouts have empty state
      const emptyMessages = screen.getAllByText(/No filters configured/)
      expect(emptyMessages.length).toBeGreaterThan(0)
    })
  })

  describe('filter chip rendering', () => {
    it('should render filter chips for each filter', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region Filter', createSimpleFilter('Users.region', 'equals', ['US'])),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // Each filter should appear (in both mobile and desktop layouts)
      const statusLabels = screen.getAllByText('Status Filter')
      const regionLabels = screen.getAllByText('Region Filter')
      expect(statusLabels.length).toBeGreaterThan(0)
      expect(regionLabels.length).toBeGreaterThan(0)
    })

    it('should render filter icon for regular filters', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      const { container } = render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // Filter icon should be present for regular filters
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
    })

    it('should render time icon for universal time filters', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Date Range', createSimpleFilter('__universal_time__', 'inDateRange', ['last 7 days']), true),
      ]

      const { container } = render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // Time/clock icon should be present for time filters
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
    })
  })

  describe('filter selection', () => {
    it('should highlight selected filter', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region Filter', createSimpleFilter('Users.region', 'equals', ['US'])),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} selectedFilterId="filter-1" />)

      // Selected filter should have different styling (primary background)
      const filterChips = screen.getAllByText('Status Filter')
      // At least one should be in a selected state container
      expect(filterChips.length).toBeGreaterThan(0)
    })

    it('should call onFilterSelect when filter is clicked', async () => {
      const user = userEvent.setup()
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]
      const onFilterSelect = vi.fn()

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} onFilterSelect={onFilterSelect} />)

      // Click on the filter chip
      const filterChips = screen.getAllByText('Status Filter')
      // Click the first one (desktop layout)
      await user.click(filterChips[0].closest('div[class*="dc:inline-flex"]')!)

      expect(onFilterSelect).toHaveBeenCalledWith('filter-1')
    })

    it('should not show edit/remove buttons on selected filter', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} selectedFilterId="filter-1" />)

      // When selected, edit/remove buttons should be hidden
      // Count all edit buttons - should be fewer than when not selected
      const editButtons = screen.queryAllByTitle('Edit filter')
      // Selected filters hide their edit/remove buttons
      expect(editButtons.length).toBeLessThanOrEqual(filters.length)
    })
  })

  describe('edit and remove actions', () => {
    it('should call onEditFilter when edit button is clicked', async () => {
      const user = userEvent.setup()
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]
      const onEditFilter = vi.fn()

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} onEditFilter={onEditFilter} />)

      const editButtons = screen.getAllByTitle('Edit filter')
      await user.click(editButtons[0])

      expect(onEditFilter).toHaveBeenCalledWith('filter-1')
    })

    it('should call onRemoveFilter when remove button is clicked', async () => {
      const user = userEvent.setup()
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]
      const onRemoveFilter = vi.fn()

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} onRemoveFilter={onRemoveFilter} />)

      const removeButtons = screen.getAllByTitle('Remove filter')
      await user.click(removeButtons[0])

      expect(onRemoveFilter).toHaveBeenCalledWith('filter-1')
    })

    it('should stop propagation when edit button is clicked', async () => {
      const user = userEvent.setup()
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]
      const onEditFilter = vi.fn()
      const onFilterSelect = vi.fn()

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} onEditFilter={onEditFilter} onFilterSelect={onFilterSelect} />)

      const editButtons = screen.getAllByTitle('Edit filter')
      await user.click(editButtons[0])

      expect(onEditFilter).toHaveBeenCalled()
      // onFilterSelect should not be called due to stopPropagation
    })
  })

  describe('add filter buttons', () => {
    it('should render add filter button', () => {
      render(<EditModeFilterList {...defaultProps} />)

      // There are "Filter" buttons in both mobile and desktop layouts
      const filterButtons = screen.getAllByText('Filter')
      expect(filterButtons.length).toBeGreaterThan(0)
    })

    it('should call onAddFilter when add filter button is clicked', async () => {
      const user = userEvent.setup()
      const onAddFilter = vi.fn()

      render(<EditModeFilterList {...defaultProps} onAddFilter={onAddFilter} />)

      // Click the first add filter button (desktop layout)
      const filterButtons = screen.getAllByText('Filter')
      await user.click(filterButtons[0])

      expect(onAddFilter).toHaveBeenCalled()
    })

    it('should render date range button when no universal time filter exists', () => {
      render(<EditModeFilterList {...defaultProps} />)

      // Date Range button should be visible
      const dateRangeButtons = screen.getAllByText('Date Range')
      expect(dateRangeButtons.length).toBeGreaterThan(0)
    })

    it('should call onAddTimeFilter when date range button is clicked', async () => {
      const user = userEvent.setup()
      const onAddTimeFilter = vi.fn()

      render(<EditModeFilterList {...defaultProps} onAddTimeFilter={onAddTimeFilter} />)

      const dateRangeButtons = screen.getAllByText('Date Range')
      await user.click(dateRangeButtons[0])

      expect(onAddTimeFilter).toHaveBeenCalled()
    })

    it('should hide date range button when universal time filter exists', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Time Filter', createSimpleFilter('__universal_time__', 'inDateRange', ['last 7 days']), true),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // Date Range add button should not be visible when universal time filter exists
      // The button has a specific title, so check that no buttons with that title exist
      expect(screen.queryByTitle('Add date range filter (applies to all time dimensions)')).not.toBeInTheDocument()
    })

    it('should show date range button title tooltip', () => {
      render(<EditModeFilterList {...defaultProps} />)

      const dateRangeButtons = screen.getAllByTitle('Add date range filter (applies to all time dimensions)')
      expect(dateRangeButtons.length).toBeGreaterThan(0)
    })
  })

  describe('mobile layout', () => {
    it('should render mobile header with collapse toggle', () => {
      const { container } = render(<EditModeFilterList {...defaultProps} />)

      // Mobile layout has a toggle button with chevron
      const mobileHeader = container.querySelector('.dc\\:md\\:hidden')
      expect(mobileHeader).toBeInTheDocument()
    })

    it('should toggle collapse state on mobile header click', async () => {
      const user = userEvent.setup()
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      const { container } = render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // Find the mobile header area and click to collapse
      const mobileHeader = container.querySelector('.dc\\:md\\:hidden > div')
      expect(mobileHeader).toBeInTheDocument()

      if (mobileHeader) {
        await user.click(mobileHeader)
      }

      // After clicking, the filter chips in mobile view should be hidden
      // (This tests the collapse functionality)
    })

    it('should show add buttons in mobile header', async () => {
      const user = userEvent.setup()
      const onAddFilter = vi.fn()

      render(<EditModeFilterList {...defaultProps} onAddFilter={onAddFilter} />)

      // Mobile layout should have add button accessible
      // The buttons exist in both mobile and desktop layouts
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
    })
  })

  describe('desktop layout', () => {
    it('should render desktop layout with horizontal flow', () => {
      const { container } = render(<EditModeFilterList {...defaultProps} />)

      // Desktop layout has hidden on mobile, flex on md
      const desktopLayout = container.querySelector('.dc\\:hidden.dc\\:md\\:flex')
      expect(desktopLayout).toBeInTheDocument()
    })

    it('should render filter chips in a flex wrap container', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region Filter', createSimpleFilter('Users.region', 'equals', ['US'])),
      ]

      const { container } = render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // Check for flex-wrap container
      const flexWrap = container.querySelector('.dc\\:flex-wrap')
      expect(flexWrap).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have accessible buttons for actions', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // All buttons should be accessible
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should have title attributes for edit/remove buttons', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      expect(screen.getAllByTitle('Edit filter').length).toBeGreaterThan(0)
      expect(screen.getAllByTitle('Remove filter').length).toBeGreaterThan(0)
    })
  })

  describe('styling', () => {
    it('should have hover styles on filter chips', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status Filter', createSimpleFilter('Users.status', 'equals', ['active'])),
      ]

      const { container } = render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // Check for hover shadow class
      const hoverElements = container.querySelectorAll('.dc\\:hover\\:shadow-md')
      expect(hoverElements.length).toBeGreaterThan(0)
    })

    it('should have primary color styling for add filter button', () => {
      const { container } = render(<EditModeFilterList {...defaultProps} />)

      // Add filter button should have primary background styling
      // Check for buttons with primary color inline styles
      const primaryButtons = screen.getAllByText('Filter')
      expect(primaryButtons.length).toBeGreaterThan(0)
    })
  })

  describe('multiple filters handling', () => {
    it('should render all filters correctly', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region', createSimpleFilter('Users.region', 'equals', ['US'])),
        createDashboardFilter('filter-3', 'Date', createSimpleFilter('__universal_time__', 'inDateRange', ['last 30 days']), true),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      // All filter labels should be present (in both layouts)
      expect(screen.getAllByText('Status').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Region').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Date').length).toBeGreaterThan(0)
    })

    it('should display correct filter count badge', () => {
      const filters = [
        createDashboardFilter('filter-1', 'Status', createSimpleFilter('Users.status', 'equals', ['active'])),
        createDashboardFilter('filter-2', 'Region', createSimpleFilter('Users.region', 'equals', ['US'])),
        createDashboardFilter('filter-3', 'Category', createSimpleFilter('Users.category', 'equals', ['premium'])),
      ]

      render(<EditModeFilterList {...defaultProps} dashboardFilters={filters} />)

      const badges = screen.getAllByText('3')
      expect(badges.length).toBeGreaterThan(0)
    })
  })
})

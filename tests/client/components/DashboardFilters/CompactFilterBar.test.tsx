import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CompactFilterBar from '../../../../src/client/components/DashboardFilters/CompactFilterBar'
import type { DashboardFilter, CubeMeta, SimpleFilter } from '../../../../src/client/types'

// Mock the child components to simplify testing
vi.mock('../../../../src/client/components/DashboardFilters/DatePresetChips', () => ({
  default: function MockDatePresetChips({
    activePreset,
    onPresetSelect
  }: {
    activePreset: string | null
    onPresetSelect: (preset: string) => void
  }) {
    // activePreset is the preset ID ('7d', '30d') from detectPresetFromDateRange
    // onPresetSelect receives the preset value ('last 7 days') to update the filter
    return (
      <div data-testid="date-preset-chips">
        <button data-testid="preset-7d" data-active={activePreset === '7d'} onClick={() => onPresetSelect('last 7 days')}>
          7D
        </button>
        <button data-testid="preset-30d" data-active={activePreset === '30d'} onClick={() => onPresetSelect('last 30 days')}>
          30D
        </button>
      </div>
    )
  }
}))

vi.mock('../../../../src/client/components/DashboardFilters/CustomDateDropdown', () => ({
  default: function MockCustomDateDropdown({
    isOpen,
    onClose,
    onDateRangeChange
  }: {
    isOpen: boolean
    onClose: () => void
    onDateRangeChange: (range: string | string[]) => void
  }) {
    if (!isOpen) return null
    return (
      <div data-testid="custom-date-dropdown">
        <button onClick={() => onDateRangeChange(['2024-01-01', '2024-01-31'])}>
          Apply Custom Range
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}))

vi.mock('../../../../src/client/components/DashboardFilters/XTDDropdown', () => ({
  default: function MockXTDDropdown({
    isOpen,
    onClose,
    onSelect,
    currentXTD
  }: {
    isOpen: boolean
    onClose: () => void
    onSelect: (xtd: string) => void
    currentXTD: string | null
  }) {
    if (!isOpen) return null
    return (
      <div data-testid="xtd-dropdown">
        <button onClick={() => onSelect('MTD')}>MTD</button>
        <button onClick={() => onSelect('YTD')}>YTD</button>
        <button onClick={onClose}>Close</button>
      </div>
    )
  }
}))

vi.mock('../../../../src/client/components/DashboardFilters/FilterChip', () => ({
  default: function MockFilterChip({
    filter,
    isEditMode,
    onEdit,
    onRemove
  }: {
    filter: DashboardFilter
    schema: CubeMeta | null
    isEditMode: boolean
    onChange: (filter: DashboardFilter) => void
    onEdit: () => void
    onRemove: () => void
  }) {
    return (
      <div data-testid={`filter-chip-${filter.id}`}>
        <span>{filter.label}</span>
        {isEditMode && (
          <>
            <button data-testid={`edit-${filter.id}`} onClick={onEdit}>Edit</button>
            <button data-testid={`remove-${filter.id}`} onClick={onRemove}>Remove</button>
          </>
        )}
      </div>
    )
  }
}))

describe('CompactFilterBar', () => {
  const createUniversalTimeFilter = (dateRange: string | string[]): DashboardFilter => ({
    id: 'universal-time',
    label: 'Date Range',
    isUniversalTime: true,
    filter: {
      member: '__universal_time__',
      operator: 'inDateRange',
      values: Array.isArray(dateRange) ? dateRange : [dateRange],
      dateRange
    } as SimpleFilter & { dateRange: string | string[] }
  })

  const createRegularFilter = (id: string, label: string): DashboardFilter => ({
    id,
    label,
    isUniversalTime: false,
    filter: {
      member: `Users.${id}`,
      operator: 'equals',
      values: ['value1']
    }
  })

  const createDefaultProps = () => ({
    dashboardFilters: [] as DashboardFilter[],
    schema: null as CubeMeta | null,
    isEditMode: false,
    onDashboardFiltersChange: vi.fn(),
    onAddFilter: vi.fn(),
    onEditFilter: vi.fn(),
    onRemoveFilter: vi.fn()
  })

  describe('visibility', () => {
    it('should not render anything when no filters and not in edit mode', () => {
      const props = createDefaultProps()
      props.dashboardFilters = []
      props.isEditMode = false

      const { container } = render(<CompactFilterBar {...props} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render when in edit mode even without filters', () => {
      const props = createDefaultProps()
      props.dashboardFilters = []
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Should show the filter bar with date presets (component has both mobile and desktop layouts)
      const presetChips = screen.getAllByTestId('date-preset-chips')
      expect(presetChips.length).toBeGreaterThan(0)
    })

    it('should render when filters exist even in view mode', () => {
      const props = createDefaultProps()
      props.dashboardFilters = [createUniversalTimeFilter('last 7 days')]
      props.isEditMode = false

      render(<CompactFilterBar {...props} />)

      const presetChips = screen.getAllByTestId('date-preset-chips')
      expect(presetChips.length).toBeGreaterThan(0)
    })
  })

  describe('date preset chips', () => {
    it('should render date preset chips', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      const presetChips = screen.getAllByTestId('date-preset-chips')
      expect(presetChips.length).toBeGreaterThan(0)
    })

    it('should highlight active preset when universal time filter matches', () => {
      const props = createDefaultProps()
      // Use lowercase value that matches the preset - detectPresetFromDateRange normalizes to lowercase
      props.dashboardFilters = [createUniversalTimeFilter('last 7 days')]

      render(<CompactFilterBar {...props} />)

      // Find first preset-7d button (from desktop layout)
      // The component detects '7d' as preset ID via detectPresetFromDateRange
      const preset7dButtons = screen.getAllByTestId('preset-7d')
      expect(preset7dButtons[0]).toHaveAttribute('data-active', 'true')
    })

    it('should call onDashboardFiltersChange when preset selected', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Click first preset button
      const preset30dButtons = screen.getAllByTestId('preset-30d')
      await user.click(preset30dButtons[0])

      expect(props.onDashboardFiltersChange).toHaveBeenCalled()
      const newFilters = props.onDashboardFiltersChange.mock.calls[0][0]
      expect(newFilters).toHaveLength(1)
      expect(newFilters[0].isUniversalTime).toBe(true)
    })

    it('should update existing universal time filter when preset selected', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.dashboardFilters = [createUniversalTimeFilter('last 7 days')]

      render(<CompactFilterBar {...props} />)

      const preset30dButtons = screen.getAllByTestId('preset-30d')
      await user.click(preset30dButtons[0])

      expect(props.onDashboardFiltersChange).toHaveBeenCalled()
      const newFilters = props.onDashboardFiltersChange.mock.calls[0][0]
      // Should update, not add
      expect(newFilters).toHaveLength(1)
    })
  })

  describe('custom date button', () => {
    it('should show Custom button', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Should have a Custom button (both desktop and mobile)
      const customButtons = screen.getAllByText('Custom')
      expect(customButtons.length).toBeGreaterThan(0)
    })

    it('should open custom date dropdown when clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Click the first Custom button
      const customButtons = screen.getAllByText('Custom')
      await user.click(customButtons[0])

      // Component may render dropdown in multiple places
      const dropdowns = screen.getAllByTestId('custom-date-dropdown')
      expect(dropdowns.length).toBeGreaterThan(0)
    })

    it('should apply custom date range when selected', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Open custom dropdown
      const customButtons = screen.getAllByText('Custom')
      await user.click(customButtons[0])

      // Apply a custom range (use first apply button)
      const applyButtons = screen.getAllByText('Apply Custom Range')
      await user.click(applyButtons[0])

      expect(props.onDashboardFiltersChange).toHaveBeenCalled()
      const newFilters = props.onDashboardFiltersChange.mock.calls[0][0]
      expect(newFilters[0].filter.values).toEqual(['2024-01-01', '2024-01-31'])
    })

    it('should close custom dropdown when close button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Open and close dropdown
      const customButtons = screen.getAllByText('Custom')
      await user.click(customButtons[0])

      const dropdowns = screen.getAllByTestId('custom-date-dropdown')
      expect(dropdowns.length).toBeGreaterThan(0)

      const closeButtons = screen.getAllByText('Close')
      await user.click(closeButtons[0])

      // After closing, should have no dropdowns visible (or fewer)
      expect(screen.queryByTestId('custom-date-dropdown')).not.toBeInTheDocument()
    })
  })

  describe('XTD button', () => {
    it('should show XTD button', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Should have XTD buttons (both desktop and mobile)
      const xtdButtons = screen.getAllByText('XTD')
      expect(xtdButtons.length).toBeGreaterThan(0)
    })

    it('should open XTD dropdown when clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      const xtdButtons = screen.getAllByText('XTD')
      await user.click(xtdButtons[0])

      const dropdowns = screen.getAllByTestId('xtd-dropdown')
      expect(dropdowns.length).toBeGreaterThan(0)
    })

    it('should apply XTD option when selected', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      const xtdButtons = screen.getAllByText('XTD')
      await user.click(xtdButtons[0])

      const ytdButtons = screen.getAllByText('YTD')
      await user.click(ytdButtons[0])

      expect(props.onDashboardFiltersChange).toHaveBeenCalled()
      const newFilters = props.onDashboardFiltersChange.mock.calls[0][0]
      expect(newFilters[0].filter.values).toContain('YTD')
    })

    it('should close XTD dropdown when close button clicked', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      const xtdButtons = screen.getAllByText('XTD')
      await user.click(xtdButtons[0])

      const dropdowns = screen.getAllByTestId('xtd-dropdown')
      expect(dropdowns.length).toBeGreaterThan(0)

      const closeButtons = screen.getAllByText('Close')
      await user.click(closeButtons[0])

      expect(screen.queryByTestId('xtd-dropdown')).not.toBeInTheDocument()
    })

    it('should close custom dropdown when XTD dropdown opens', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Open custom dropdown first
      const customButtons = screen.getAllByText('Custom')
      await user.click(customButtons[0])
      const customDropdowns = screen.getAllByTestId('custom-date-dropdown')
      expect(customDropdowns.length).toBeGreaterThan(0)

      // Open XTD dropdown
      const xtdButtons = screen.getAllByText('XTD')
      await user.click(xtdButtons[0])

      // Custom should be closed, XTD should be open
      expect(screen.queryByTestId('custom-date-dropdown')).not.toBeInTheDocument()
      const xtdDropdowns = screen.getAllByTestId('xtd-dropdown')
      expect(xtdDropdowns.length).toBeGreaterThan(0)
    })
  })

  describe('non-date filter chips', () => {
    it('should render filter chips for non-date filters', () => {
      const props = createDefaultProps()
      props.dashboardFilters = [
        createRegularFilter('status', 'Status'),
        createRegularFilter('region', 'Region')
      ]

      render(<CompactFilterBar {...props} />)

      // Component has mobile and desktop layouts, so chips appear twice
      const statusChips = screen.getAllByTestId('filter-chip-status')
      const regionChips = screen.getAllByTestId('filter-chip-region')
      expect(statusChips.length).toBeGreaterThan(0)
      expect(regionChips.length).toBeGreaterThan(0)
    })

    it('should call onEditFilter when filter chip edit clicked in edit mode', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.dashboardFilters = [createRegularFilter('status', 'Status')]
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Use first edit button (from desktop layout)
      const editButtons = screen.getAllByTestId('edit-status')
      await user.click(editButtons[0])

      expect(props.onEditFilter).toHaveBeenCalledWith('status')
    })

    it('should call onRemoveFilter when filter chip remove clicked in edit mode', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.dashboardFilters = [createRegularFilter('status', 'Status')]
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      // Use first remove button (from desktop layout)
      const removeButtons = screen.getAllByTestId('remove-status')
      await user.click(removeButtons[0])

      expect(props.onRemoveFilter).toHaveBeenCalledWith('status')
    })

    it('should not show edit/remove buttons in view mode', () => {
      const props = createDefaultProps()
      props.dashboardFilters = [createRegularFilter('status', 'Status')]
      props.isEditMode = false

      render(<CompactFilterBar {...props} />)

      expect(screen.queryByTestId('edit-status')).not.toBeInTheDocument()
      expect(screen.queryByTestId('remove-status')).not.toBeInTheDocument()
    })

    it('should exclude universal time filter from regular filter chips', () => {
      const props = createDefaultProps()
      props.dashboardFilters = [
        createUniversalTimeFilter('Last 7 days'),
        createRegularFilter('status', 'Status')
      ]

      render(<CompactFilterBar {...props} />)

      // Should have filter chip for status but not for universal time
      const statusChips = screen.getAllByTestId('filter-chip-status')
      expect(statusChips.length).toBeGreaterThan(0)
      expect(screen.queryByTestId('filter-chip-universal-time')).not.toBeInTheDocument()
    })
  })

  describe('filter change handling', () => {
    it('should call onDashboardFiltersChange when filter values change', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.dashboardFilters = [createUniversalTimeFilter('last 7 days')]

      render(<CompactFilterBar {...props} />)

      // Select a different preset
      const preset30dButtons = screen.getAllByTestId('preset-30d')
      await user.click(preset30dButtons[0])

      expect(props.onDashboardFiltersChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            isUniversalTime: true,
            filter: expect.objectContaining({
              values: expect.arrayContaining(['last 30 days'])
            })
          })
        ])
      )
    })

    it('should create new universal time filter if none exists when preset selected', async () => {
      const user = userEvent.setup()
      const props = createDefaultProps()
      props.dashboardFilters = []
      props.isEditMode = true

      render(<CompactFilterBar {...props} />)

      const preset7dButtons = screen.getAllByTestId('preset-7d')
      await user.click(preset7dButtons[0])

      const call = props.onDashboardFiltersChange.mock.calls[0][0]
      expect(call).toHaveLength(1)
      expect(call[0]).toMatchObject({
        isUniversalTime: true,
        filter: expect.objectContaining({
          member: '__universal_time__',
          operator: 'inDateRange'
        })
      })
    })
  })

  describe('component structure', () => {
    it('should render filter bar container', () => {
      const props = createDefaultProps()
      props.isEditMode = true

      const { container } = render(<CompactFilterBar {...props} />)

      // The main container should have border and rounded corners
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv.className).toContain('dc:border')
      expect(mainDiv.className).toContain('dc:rounded-lg')
    })
  })
})

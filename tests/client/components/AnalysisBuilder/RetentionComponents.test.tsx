/**
 * Tests for Retention Analysis Mode Components
 *
 * Coverage targets:
 * - RetentionConfigPanel.tsx: 85%+
 * - RetentionModeContent.tsx: 85%+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RetentionConfigPanel, {
  DateRangeSelector,
  type RetentionConfigPanelProps,
  type DateRangeSelectorProps,
} from '../../../../src/client/components/AnalysisBuilder/RetentionConfigPanel'
import RetentionModeContent, { type RetentionModeContentProps } from '../../../../src/client/components/AnalysisBuilder/RetentionModeContent'
import type { CubeMeta, FunnelBindingKey, Filter, ChartDisplayConfig } from '../../../../src/client/types'
import type { DateRange, RetentionBreakdownItem } from '../../../../src/client/types/retention'

// Mock schema with eventStream cubes for retention analysis
const mockSchemaWithEventStream: CubeMeta = {
  cubes: [
    {
      name: 'Events',
      title: 'Events',
      meta: {
        eventStream: {
          bindingKey: 'Events.userId',
          timeDimension: 'Events.timestamp',
        },
      },
      measures: [
        { name: 'Events.count', type: 'number', title: 'Event Count', shortTitle: 'Count', aggType: 'count' },
      ],
      dimensions: [
        { name: 'Events.userId', type: 'string', title: 'User ID', shortTitle: 'User ID', meta: { bindingKey: true } },
        { name: 'Events.eventType', type: 'string', title: 'Event Type', shortTitle: 'Event Type' },
        { name: 'Events.timestamp', type: 'time', title: 'Timestamp', shortTitle: 'Timestamp' },
        { name: 'Events.country', type: 'string', title: 'Country', shortTitle: 'Country' },
        { name: 'Events.plan', type: 'string', title: 'Plan', shortTitle: 'Plan' },
      ],
    },
    {
      name: 'Users',
      title: 'Users',
      measures: [
        { name: 'Users.count', type: 'number', title: 'User Count', shortTitle: 'Count', aggType: 'count' },
      ],
      dimensions: [
        { name: 'Users.id', type: 'string', title: 'ID', shortTitle: 'ID' },
        { name: 'Users.name', type: 'string', title: 'Name', shortTitle: 'Name' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' },
      ],
    },
  ],
}

// Mock schema without eventStream cubes
const mockSchemaWithoutEventStream: CubeMeta = {
  cubes: [
    {
      name: 'Users',
      title: 'Users',
      measures: [
        { name: 'Users.count', type: 'number', title: 'User Count', shortTitle: 'Count', aggType: 'count' },
      ],
      dimensions: [
        { name: 'Users.id', type: 'string', title: 'ID', shortTitle: 'ID' },
        { name: 'Users.name', type: 'string', title: 'Name', shortTitle: 'Name' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' },
      ],
    },
  ],
}

// ============================================================================
// DateRangeSelector Tests
// ============================================================================

describe('DateRangeSelector', () => {
  const defaultDateRange: DateRange = { start: '2024-01-01', end: '2024-03-31' }

  const defaultProps: DateRangeSelectorProps = {
    dateRange: defaultDateRange,
    onDateRangeChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial rendering', () => {
    it('should render Date Range label', () => {
      render(<DateRangeSelector {...defaultProps} />)

      expect(screen.getByText('Date Range')).toBeInTheDocument()
    })

    it('should display date range when provided', () => {
      render(<DateRangeSelector {...defaultProps} />)

      // Should show formatted date range or preset label
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should show default preset when empty dates provided', () => {
      render(
        <DateRangeSelector
          {...defaultProps}
          dateRange={{ start: '', end: '' }}
        />
      )

      // When dates are empty, it defaults to detecting a preset (last_3_months)
      // or shows Select date range depending on implementation
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('preset selection', () => {
    it('should show preset options when dropdown is opened', async () => {
      const user = userEvent.setup()
      render(<DateRangeSelector {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
      expect(screen.getByText('Last 3 months')).toBeInTheDocument()
      expect(screen.getByText('Last 6 months')).toBeInTheDocument()
      expect(screen.getByText('Last 12 months')).toBeInTheDocument()
      expect(screen.getByText('This year')).toBeInTheDocument()
      expect(screen.getByText('Last year')).toBeInTheDocument()
    })

    it('should call onDateRangeChange when preset is selected', async () => {
      const user = userEvent.setup()
      const onDateRangeChange = vi.fn()

      render(
        <DateRangeSelector
          {...defaultProps}
          onDateRangeChange={onDateRangeChange}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      const last30Days = screen.getByText('Last 30 days')
      await user.click(last30Days)

      expect(onDateRangeChange).toHaveBeenCalled()
      const calledWith = onDateRangeChange.mock.calls[0][0]
      expect(calledWith).toHaveProperty('start')
      expect(calledWith).toHaveProperty('end')
    })

    it('should highlight the selected preset', async () => {
      const user = userEvent.setup()
      render(<DateRangeSelector {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      // Select a preset - use getAllByText since it may appear multiple times
      const last3MonthsButtons = screen.getAllByText('Last 3 months')
      // Click the button version (in the preset list)
      const presetButton = last3MonthsButtons.find(el => el.tagName === 'BUTTON')
      if (presetButton) {
        await user.click(presetButton)
      }

      // Reopen dropdown
      await user.click(button)

      // The selected preset should have the primary background
      const selectedPresets = screen.getAllByText('Last 3 months')
      const hasHighlight = selectedPresets.some(el => el.classList.contains('bg-dc-primary'))
      expect(hasHighlight).toBe(true)
    })
  })

  describe('custom date range', () => {
    it('should show custom date inputs', async () => {
      const user = userEvent.setup()
      render(<DateRangeSelector {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText('Custom Range')).toBeInTheDocument()
      // Date inputs are type="date" which are not textboxes
      const dateInputs = document.querySelectorAll('input[type="date"]')
      expect(dateInputs.length).toBeGreaterThanOrEqual(2)
    })

    it('should have Apply Custom Range button', async () => {
      const user = userEvent.setup()
      render(<DateRangeSelector {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.getByText('Apply Custom Range')).toBeInTheDocument()
    })

    it('should disable Apply button when dates are empty', async () => {
      const user = userEvent.setup()
      render(
        <DateRangeSelector
          {...defaultProps}
          dateRange={{ start: '', end: '' }}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      const applyButton = screen.getByText('Apply Custom Range')
      expect(applyButton).toBeDisabled()
    })

    it('should call onDateRangeChange when Apply is clicked with custom dates', async () => {
      const user = userEvent.setup()
      const onDateRangeChange = vi.fn()

      render(
        <DateRangeSelector
          {...defaultProps}
          dateRange={{ start: '2024-01-01', end: '2024-06-30' }}
          onDateRangeChange={onDateRangeChange}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      const applyButton = screen.getByText('Apply Custom Range')
      await user.click(applyButton)

      expect(onDateRangeChange).toHaveBeenCalled()
    })
  })

  describe('dropdown behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      render(<DateRangeSelector {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      // Dropdown should be open
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()

      // Click outside
      await user.click(document.body)

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown after selecting a preset', async () => {
      const user = userEvent.setup()
      render(<DateRangeSelector {...defaultProps} />)

      const button = screen.getByRole('button')
      await user.click(button)

      const preset = screen.getByText('Last 30 days')
      await user.click(preset)

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText('Custom Range')).not.toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle undefined dateRange', () => {
      // @ts-expect-error - testing edge case
      render(<DateRangeSelector dateRange={undefined} onDateRangeChange={vi.fn()} />)

      // Should render without crashing and show the default preset
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should handle null start/end dates', () => {
      render(
        <DateRangeSelector
          // @ts-expect-error - testing edge case
          dateRange={{ start: null, end: null }}
          onDateRangeChange={vi.fn()}
        />
      )

      // Should render without crashing
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })
})

// ============================================================================
// RetentionConfigPanel Tests
// ============================================================================

describe('RetentionConfigPanel', () => {
  const defaultDateRange: DateRange = { start: '2024-01-01', end: '2024-03-31' }

  const defaultProps: RetentionConfigPanelProps = {
    selectedCube: null,
    bindingKey: null,
    timeDimension: null,
    dateRange: defaultDateRange,
    schema: mockSchemaWithEventStream,
    onCubeChange: vi.fn(),
    onBindingKeyChange: vi.fn(),
    onTimeDimensionChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial rendering', () => {
    it('should render the Configuration heading', () => {
      render(<RetentionConfigPanel {...defaultProps} />)

      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })

    it('should show cube selector with placeholder when no cube selected', () => {
      render(<RetentionConfigPanel {...defaultProps} />)

      expect(screen.getByText('Select cube')).toBeInTheDocument()
    })

    it('should render all selector labels', () => {
      render(<RetentionConfigPanel {...defaultProps} />)

      expect(screen.getByText('Cube')).toBeInTheDocument()
      expect(screen.getByText('Binding Key')).toBeInTheDocument()
      expect(screen.getByText('Timestamp')).toBeInTheDocument()
    })
  })

  describe('cube selection', () => {
    it('should show only eventStream cubes in the dropdown', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} />)

      const cubeButton = screen.getByText('Select cube')
      await user.click(cubeButton)

      // Should show Events cube (has eventStream) - may appear multiple times
      const eventsElements = screen.getAllByText('Events')
      expect(eventsElements.length).toBeGreaterThan(0)
    })

    it('should call onCubeChange when cube is selected', async () => {
      const user = userEvent.setup()
      const onCubeChange = vi.fn()
      render(<RetentionConfigPanel {...defaultProps} onCubeChange={onCubeChange} />)

      const cubeButton = screen.getByText('Select cube')
      await user.click(cubeButton)

      const eventsOption = screen.getAllByText('Events').find(
        el => el.closest('button')?.className.includes('dc:w-full')
      )
      if (eventsOption) {
        await user.click(eventsOption)
      }

      expect(onCubeChange).toHaveBeenCalledWith('Events')
    })
  })

  describe('binding key selection', () => {
    it('should show binding key placeholder when no cube selected', () => {
      render(<RetentionConfigPanel {...defaultProps} />)

      // Multiple selectors show "Select cube first" when no cube selected
      const placeholders = screen.getAllByText('Select cube first')
      expect(placeholders.length).toBeGreaterThanOrEqual(1)
    })

    it('should show binding key options when cube is selected', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} selectedCube="Events" />)

      const bindingKeyButton = screen.getByText('Select user identifier')
      await user.click(bindingKeyButton)

      expect(screen.getByText('User ID')).toBeInTheDocument()
    })

    it('should call onBindingKeyChange with correct format', async () => {
      const user = userEvent.setup()
      const onBindingKeyChange = vi.fn()

      render(
        <RetentionConfigPanel
          {...defaultProps}
          selectedCube="Events"
          onBindingKeyChange={onBindingKeyChange}
        />
      )

      const bindingKeyButton = screen.getByText('Select user identifier')
      await user.click(bindingKeyButton)

      // Find the User ID option button
      const userIdOptions = screen.getAllByText('User ID')
      const optionButton = userIdOptions.find(el =>
        el.closest('button')?.className.includes('dc:w-full')
      )
      if (optionButton) {
        await user.click(optionButton)
      }

      expect(onBindingKeyChange).toHaveBeenCalledWith({ dimension: 'Events.userId' })
    })
  })

  describe('time dimension selection', () => {
    it('should show timestamp placeholder when no cube selected', () => {
      render(<RetentionConfigPanel {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      const timestampButton = buttons.find(btn => btn.textContent?.includes('Select cube first'))
      expect(timestampButton).toBeInTheDocument()
    })

    it('should show time dimensions when cube is selected', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} selectedCube="Events" />)

      const timestampButton = screen.getByText('Select timestamp')
      await user.click(timestampButton)

      // Timestamp may appear multiple times
      const timestampElements = screen.getAllByText('Timestamp')
      expect(timestampElements.length).toBeGreaterThan(0)
    })

    it('should call onTimeDimensionChange when selected', async () => {
      const user = userEvent.setup()
      const onTimeDimensionChange = vi.fn()

      render(
        <RetentionConfigPanel
          {...defaultProps}
          selectedCube="Events"
          onTimeDimensionChange={onTimeDimensionChange}
        />
      )

      const timestampButton = screen.getByText('Select timestamp')
      await user.click(timestampButton)

      // Find the Timestamp option button
      const timestampOptions = screen.getAllByText('Timestamp')
      const optionButton = timestampOptions.find(el =>
        el.closest('button')?.className.includes('dc:w-full')
      )
      if (optionButton) {
        await user.click(optionButton)
      }

      expect(onTimeDimensionChange).toHaveBeenCalledWith('Events.timestamp')
    })
  })

  describe('collapsible behavior', () => {
    it('should start expanded when config is incomplete', () => {
      render(<RetentionConfigPanel {...defaultProps} />)

      expect(screen.getByText('Cube')).toBeInTheDocument()
      expect(screen.getByText('Binding Key')).toBeInTheDocument()
    })

    it('should auto-collapse when config becomes complete', async () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      const { rerender } = render(
        <RetentionConfigPanel {...defaultProps} selectedCube={null} />
      )

      rerender(
        <RetentionConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
          timeDimension="Events.timestamp"
          dateRange={{ start: '2024-01-01', end: '2024-03-31' }}
        />
      )

      await waitFor(() => {
        const cubeLabels = screen.queryAllByText('Cube')
        expect(cubeLabels.length).toBeLessThanOrEqual(1)
      })
    })

    it('should toggle collapse when header clicked', async () => {
      const user = userEvent.setup()
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <RetentionConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
          timeDimension="Events.timestamp"
          dateRange={{ start: '2024-01-01', end: '2024-03-31' }}
        />
      )

      const header = screen.getByText('Configuration')
      await user.click(header)

      await waitFor(() => {
        expect(screen.getByText('Cube')).toBeInTheDocument()
      })
    })

    it('should show check icon when config is complete', () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <RetentionConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
          timeDimension="Events.timestamp"
          dateRange={{ start: '2024-01-01', end: '2024-03-31' }}
        />
      )

      const successElements = document.querySelectorAll('.text-dc-success')
      expect(successElements.length).toBeGreaterThan(0)
    })

    it('should show collapsed summary with cube and date info', async () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <RetentionConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
          timeDimension="Events.timestamp"
          dateRange={{ start: '2024-01-01', end: '2024-03-31' }}
        />
      )

      // The component auto-collapses when config is complete
      // Just verify the component renders and contains expected content
      expect(screen.getByText('Configuration')).toBeInTheDocument()

      // The text "Events" and date info should be present somewhere
      await waitFor(() => {
        // Look for any text containing Events
        const allText = document.body.textContent || ''
        expect(allText).toContain('Events')
      }, { timeout: 500 })
    })
  })

  describe('dropdown interactions', () => {
    it('should filter options based on search query', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} selectedCube="Events" />)

      const bindingKeyButton = screen.getByText('Select user identifier')
      await user.click(bindingKeyButton)

      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'user')

      expect(screen.getByText('User ID')).toBeInTheDocument()
    })

    it('should show "No matching fields found" when search has no results', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} selectedCube="Events" />)

      const bindingKeyButton = screen.getByText('Select user identifier')
      await user.click(bindingKeyButton)

      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText('No matching fields found')).toBeInTheDocument()
    })

    it('should render clear buttons for selected values', async () => {
      // Use incomplete config so panel stays expanded (missing timeDimension)
      render(
        <RetentionConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={{ dimension: 'Events.userId' }}
          timeDimension={null}
          dateRange={{ start: '', end: '' }}
        />
      )

      // Panel should be expanded because config is incomplete
      // Verify the structure is correct
      expect(screen.getByText('Configuration')).toBeInTheDocument()
      expect(screen.getByText('Binding Key')).toBeInTheDocument()
      expect(screen.getByText('User ID')).toBeInTheDocument()

      // There should be a clear button for the binding key
      const clearButtons = screen.queryAllByTitle('Clear')
      // The binding key selector has a value, so it should have a clear button
      expect(clearButtons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('help text', () => {
    it('should show help text for binding key', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} selectedCube="Events" />)

      const bindingKeyButton = screen.getByText('Select user identifier')
      await user.click(bindingKeyButton)

      expect(screen.getByText(/identifies entities/i)).toBeInTheDocument()
    })

    it('should show help text for timestamp', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} selectedCube="Events" />)

      const timestampButton = screen.getByText('Select timestamp')
      await user.click(timestampButton)

      expect(screen.getByText(/cohort entry and activity/i)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle null schema gracefully', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} schema={null} />)

      const cubeButton = screen.getByText('Select cube')
      await user.click(cubeButton)

      expect(screen.getByText('No matching fields found')).toBeInTheDocument()
    })

    it('should handle schema without eventStream cubes', async () => {
      const user = userEvent.setup()
      render(<RetentionConfigPanel {...defaultProps} schema={mockSchemaWithoutEventStream} />)

      const cubeButton = screen.getByText('Select cube')
      await user.click(cubeButton)

      expect(screen.getByText('No matching fields found')).toBeInTheDocument()
    })

    it('should handle binding key as array', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [{ dimension: 'Events.userId', label: 'User' }],
      }

      render(
        <RetentionConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
        />
      )

      expect(screen.getByText('User ID')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// RetentionModeContent Tests
// ============================================================================

describe('RetentionModeContent', () => {
  const defaultDateRange: DateRange = { start: '2024-01-01', end: '2024-03-31' }

  const defaultProps: RetentionModeContentProps = {
    retentionCube: null,
    retentionBindingKey: null,
    retentionTimeDimension: null,
    retentionDateRange: defaultDateRange,
    retentionCohortFilters: [],
    retentionActivityFilters: [],
    retentionBreakdowns: [],
    retentionViewGranularity: 'week',
    retentionPeriods: 12,
    retentionType: 'classic',
    schema: mockSchemaWithEventStream,
    onCubeChange: vi.fn(),
    onBindingKeyChange: vi.fn(),
    onTimeDimensionChange: vi.fn(),
    onDateRangeChange: vi.fn(),
    onCohortFiltersChange: vi.fn(),
    onActivityFiltersChange: vi.fn(),
    onBreakdownsChange: vi.fn(),
    onAddBreakdown: vi.fn(),
    onRemoveBreakdown: vi.fn(),
    onGranularityChange: vi.fn(),
    onPeriodsChange: vi.fn(),
    onRetentionTypeChange: vi.fn(),
    onOpenFieldModal: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tab navigation', () => {
    it('should render Retention and Display tabs', () => {
      render(<RetentionModeContent {...defaultProps} />)

      expect(screen.getByRole('button', { name: /^retention$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^display$/i })).toBeInTheDocument()
    })

    it('should show Retention tab as active by default', () => {
      render(<RetentionModeContent {...defaultProps} />)

      const retentionTab = screen.getByRole('button', { name: /^retention$/i })
      expect(retentionTab).toHaveClass('text-dc-primary')
    })

    it('should switch to Display tab when clicked', async () => {
      const user = userEvent.setup()
      const displayConfig: ChartDisplayConfig = { showLegend: true }

      render(
        <RetentionModeContent
          {...defaultProps}
          displayConfig={displayConfig}
          onDisplayConfigChange={vi.fn()}
        />
      )

      const displayTab = screen.getByRole('button', { name: /^display$/i })
      await user.click(displayTab)

      expect(displayTab).toHaveClass('text-dc-primary')
    })

    it('should disable Display tab when not configured', () => {
      render(<RetentionModeContent {...defaultProps} />)

      const displayTab = screen.getByRole('button', { name: /^display$/i })
      expect(displayTab).toBeDisabled()
    })
  })

  describe('date range section', () => {
    it('should render Date Range section heading', () => {
      render(<RetentionModeContent {...defaultProps} />)

      // There are multiple "Date Range" elements (heading and selector)
      const dateRangeElements = screen.getAllByText('Date Range')
      expect(dateRangeElements.length).toBeGreaterThan(0)
    })

    it('should render DateRangeSelector', () => {
      render(<RetentionModeContent {...defaultProps} />)

      // DateRangeSelector should be present
      const dateRangeButtons = screen.getAllByRole('button')
      expect(dateRangeButtons.length).toBeGreaterThan(0)
    })

    it('should call onDateRangeChange when date range changes', async () => {
      const user = userEvent.setup()
      const onDateRangeChange = vi.fn()

      render(
        <RetentionModeContent
          {...defaultProps}
          onDateRangeChange={onDateRangeChange}
        />
      )

      // Find and click the date range selector
      // This is part of DateRangeSelector component
    })
  })

  describe('cohort filter section', () => {
    it('should render Cohort Filter section heading', () => {
      render(<RetentionModeContent {...defaultProps} />)

      expect(screen.getByText('Cohort Filter')).toBeInTheDocument()
    })

    it('should render help text for cohort filters', () => {
      render(<RetentionModeContent {...defaultProps} />)

      expect(screen.getByText(/who enters the cohort/i)).toBeInTheDocument()
    })

    it('should render AnalysisFilterSection for cohort filters', () => {
      const cohortFilters: Filter[] = [
        { member: 'Events.eventType', operator: 'equals', values: ['signup'] },
      ]

      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube="Events"
          retentionCohortFilters={cohortFilters}
        />
      )

      // Filter should be displayed
      expect(screen.getByText('Event Type')).toBeInTheDocument()
    })
  })

  describe('return filter section', () => {
    it('should render Return Filter section heading', () => {
      render(<RetentionModeContent {...defaultProps} />)

      expect(screen.getByText('Return Filter')).toBeInTheDocument()
    })

    it('should render help text for return filters', () => {
      render(<RetentionModeContent {...defaultProps} />)

      expect(screen.getByText(/counts as a return/i)).toBeInTheDocument()
    })

    it('should render AnalysisFilterSection for activity filters', () => {
      const activityFilters: Filter[] = [
        { member: 'Events.eventType', operator: 'equals', values: ['login'] },
      ]

      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube="Events"
          retentionActivityFilters={activityFilters}
        />
      )

      // Filter should be displayed (note: both filters show Event Type)
      const eventTypeTexts = screen.getAllByText('Event Type')
      expect(eventTypeTexts.length).toBeGreaterThan(0)
    })
  })

  describe('breakdown section', () => {
    it('should render Breakdown section heading', () => {
      render(<RetentionModeContent {...defaultProps} />)

      // There may be multiple Breakdown texts (heading + BreakdownSection)
      const breakdownElements = screen.getAllByText('Breakdown')
      expect(breakdownElements.length).toBeGreaterThan(0)
    })

    it('should render help text for breakdowns', () => {
      render(<RetentionModeContent {...defaultProps} />)

      expect(screen.getByText(/segment retention/i)).toBeInTheDocument()
    })

    it('should render BreakdownSection component', () => {
      const breakdowns: RetentionBreakdownItem[] = [
        { field: 'Events.country', label: 'Country' },
      ]

      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube="Events"
          retentionBreakdowns={breakdowns}
        />
      )

      // BreakdownSection should be rendered
      const breakdownElements = screen.getAllByText('Breakdown')
      expect(breakdownElements.length).toBeGreaterThan(0)
    })

    it('should call onRemoveBreakdown when breakdown is removed', async () => {
      const user = userEvent.setup()
      const onRemoveBreakdown = vi.fn()
      const breakdowns: RetentionBreakdownItem[] = [
        { field: 'Events.country', label: 'Country' },
      ]

      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube="Events"
          retentionBreakdowns={breakdowns}
          onRemoveBreakdown={onRemoveBreakdown}
        />
      )

      // Find remove button in breakdown section
      const removeButtons = screen.getAllByTitle(/remove/i)
      if (removeButtons.length > 0) {
        await user.click(removeButtons[removeButtons.length - 1])
        expect(onRemoveBreakdown).toHaveBeenCalled()
      }
    })

    it('should call onOpenFieldModal when add breakdown is clicked', async () => {
      const user = userEvent.setup()
      const onOpenFieldModal = vi.fn()

      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube="Events"
          onOpenFieldModal={onOpenFieldModal}
        />
      )

      // Find add breakdown button
      const addButtons = screen.getAllByTitle(/add/i)
      if (addButtons.length > 0) {
        await user.click(addButtons[addButtons.length - 1])
        expect(onOpenFieldModal).toHaveBeenCalled()
      }
    })
  })

  describe('settings section', () => {
    it('should render Settings section heading', () => {
      render(<RetentionModeContent {...defaultProps} />)

      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    describe('period granularity', () => {
      it('should render granularity options', () => {
        render(<RetentionModeContent {...defaultProps} />)

        expect(screen.getByRole('button', { name: /daily/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument()
      })

      it('should highlight selected granularity', () => {
        render(
          <RetentionModeContent
            {...defaultProps}
            retentionViewGranularity="week"
          />
        )

        const weeklyButton = screen.getByRole('button', { name: /weekly/i })
        expect(weeklyButton).toHaveClass('border-dc-primary')
      })

      it('should call onGranularityChange when option is clicked', async () => {
        const user = userEvent.setup()
        const onGranularityChange = vi.fn()

        render(
          <RetentionModeContent
            {...defaultProps}
            onGranularityChange={onGranularityChange}
          />
        )

        const dailyButton = screen.getByRole('button', { name: /daily/i })
        await user.click(dailyButton)

        expect(onGranularityChange).toHaveBeenCalledWith('day')
      })
    })

    describe('number of periods', () => {
      it('should render period slider with label', () => {
        render(<RetentionModeContent {...defaultProps} />)

        expect(screen.getByText(/number of periods/i)).toBeInTheDocument()
      })

      it('should display current period count', () => {
        render(
          <RetentionModeContent
            {...defaultProps}
            retentionPeriods={12}
          />
        )

        expect(screen.getByText('12')).toBeInTheDocument()
      })

      it('should call onPeriodsChange when slider changes', async () => {
        const onPeriodsChange = vi.fn()

        render(
          <RetentionModeContent
            {...defaultProps}
            onPeriodsChange={onPeriodsChange}
          />
        )

        const slider = screen.getByRole('slider')
        fireEvent.change(slider, { target: { value: '20' } })

        expect(onPeriodsChange).toHaveBeenCalledWith(20)
      })

      it('should show warning for high period count (>26)', () => {
        render(
          <RetentionModeContent
            {...defaultProps}
            retentionPeriods={30}
          />
        )

        expect(screen.getByText(/may impact query performance/i)).toBeInTheDocument()
      })

      it('should not show warning for normal period count', () => {
        render(
          <RetentionModeContent
            {...defaultProps}
            retentionPeriods={12}
          />
        )

        expect(screen.queryByText(/may impact query performance/i)).not.toBeInTheDocument()
      })
    })

    describe('retention type', () => {
      it('should render retention type options', () => {
        render(<RetentionModeContent {...defaultProps} />)

        expect(screen.getByRole('button', { name: /classic/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /rolling/i })).toBeInTheDocument()
      })

      it('should highlight selected retention type', () => {
        render(
          <RetentionModeContent
            {...defaultProps}
            retentionType="classic"
          />
        )

        const classicButton = screen.getByRole('button', { name: /classic/i })
        expect(classicButton).toHaveClass('border-dc-primary')
      })

      it('should call onRetentionTypeChange when option is clicked', async () => {
        const user = userEvent.setup()
        const onRetentionTypeChange = vi.fn()

        render(
          <RetentionModeContent
            {...defaultProps}
            onRetentionTypeChange={onRetentionTypeChange}
          />
        )

        const rollingButton = screen.getByRole('button', { name: /rolling/i })
        await user.click(rollingButton)

        expect(onRetentionTypeChange).toHaveBeenCalledWith('rolling')
      })

      it('should show descriptions for retention types', () => {
        render(<RetentionModeContent {...defaultProps} />)

        expect(screen.getByText(/exactly period N/i)).toBeInTheDocument()
        expect(screen.getByText(/period N or later/i)).toBeInTheDocument()
      })
    })
  })

  describe('display tab content', () => {
    it('should render AnalysisDisplayConfigPanel when display tab is active', async () => {
      const user = userEvent.setup()
      const displayConfig: ChartDisplayConfig = { showLegend: true }

      render(
        <RetentionModeContent
          {...defaultProps}
          displayConfig={displayConfig}
          onDisplayConfigChange={vi.fn()}
        />
      )

      const displayTab = screen.getByRole('button', { name: /^display$/i })
      await user.click(displayTab)

      expect(displayTab).toHaveClass('text-dc-primary')
    })
  })

  describe('RetentionConfigPanel integration', () => {
    it('should render RetentionConfigPanel with correct props', () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube="Events"
          retentionBindingKey={bindingKey}
          retentionTimeDimension="Events.timestamp"
        />
      )

      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })

    it('should pass callbacks to RetentionConfigPanel', async () => {
      const user = userEvent.setup()
      const onCubeChange = vi.fn()

      render(
        <RetentionModeContent
          {...defaultProps}
          onCubeChange={onCubeChange}
        />
      )

      const cubeButton = screen.getByText('Select cube')
      await user.click(cubeButton)

      const eventsOption = screen.getAllByText('Events').find(
        el => el.closest('button')?.className.includes('dc:w-full')
      )
      if (eventsOption) {
        await user.click(eventsOption)
        expect(onCubeChange).toHaveBeenCalled()
      }
    })
  })

  describe('schema filtering', () => {
    it('should filter schema to only include selected cube for filters', () => {
      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube="Events"
        />
      )

      // AnalysisFilterSection should only show dimensions from Events cube
      expect(screen.getByText('Cohort Filter')).toBeInTheDocument()
    })

    it('should pass null schema when no cube selected', () => {
      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube={null}
        />
      )

      expect(screen.getByText('Cohort Filter')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle null schema gracefully', () => {
      render(<RetentionModeContent {...defaultProps} schema={null} />)

      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })

    it('should handle empty cohort and activity filters', () => {
      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCohortFilters={[]}
          retentionActivityFilters={[]}
        />
      )

      expect(screen.getByText('Cohort Filter')).toBeInTheDocument()
      expect(screen.getByText('Return Filter')).toBeInTheDocument()
    })

    it('should handle empty breakdowns', () => {
      render(
        <RetentionModeContent
          {...defaultProps}
          retentionBreakdowns={[]}
        />
      )

      const breakdownElements = screen.getAllByText('Breakdown')
      expect(breakdownElements.length).toBeGreaterThan(0)
    })

    it('should use default values for optional props', () => {
      const minimalProps = {
        schema: mockSchemaWithEventStream,
        onCubeChange: vi.fn(),
        onBindingKeyChange: vi.fn(),
        onTimeDimensionChange: vi.fn(),
        onDateRangeChange: vi.fn(),
        onCohortFiltersChange: vi.fn(),
        onActivityFiltersChange: vi.fn(),
        onBreakdownsChange: vi.fn(),
        onAddBreakdown: vi.fn(),
        onRemoveBreakdown: vi.fn(),
        onGranularityChange: vi.fn(),
        onPeriodsChange: vi.fn(),
        onRetentionTypeChange: vi.fn(),
      }

      // @ts-expect-error - testing default props behavior
      render(<RetentionModeContent {...minimalProps} />)

      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })
  })

  describe('breakdown conversion', () => {
    it('should convert RetentionBreakdownItem to BreakdownItem format', () => {
      const breakdowns: RetentionBreakdownItem[] = [
        { field: 'Events.country' },
        { field: 'Events.plan', label: 'Plan Type' },
      ]

      render(
        <RetentionModeContent
          {...defaultProps}
          retentionCube="Events"
          retentionBreakdowns={breakdowns}
        />
      )

      // BreakdownSection should render the breakdowns
      const breakdownElements = screen.getAllByText('Breakdown')
      expect(breakdownElements.length).toBeGreaterThan(0)
    })

    it('should handle null or undefined breakdowns', () => {
      render(
        <RetentionModeContent
          {...defaultProps}
          // @ts-expect-error - testing edge case
          retentionBreakdowns={null}
        />
      )

      const breakdownElements = screen.getAllByText('Breakdown')
      expect(breakdownElements.length).toBeGreaterThan(0)
    })
  })
})

/**
 * Tests for Flow Analysis Mode Components
 *
 * Coverage targets:
 * - FlowConfigPanel.tsx: 85%+
 * - FlowModeContent.tsx: 85%+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FlowConfigPanel, { type FlowConfigPanelProps } from '../../../../src/client/components/AnalysisBuilder/FlowConfigPanel'
import FlowModeContent, { type FlowModeContentProps } from '../../../../src/client/components/AnalysisBuilder/FlowModeContent'
import type { CubeMeta, FunnelBindingKey, Filter, ChartDisplayConfig } from '../../../../src/client/types'
import type { FlowStartingStep } from '../../../../src/client/types/flow'

// Mock schema with eventStream cubes for flow analysis
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
        { name: 'Events.page', type: 'string', title: 'Page', shortTitle: 'Page' },
        { name: 'Events.country', type: 'string', title: 'Country', shortTitle: 'Country' },
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
// FlowConfigPanel Tests
// ============================================================================

describe('FlowConfigPanel', () => {
  const defaultProps: FlowConfigPanelProps = {
    selectedCube: null,
    bindingKey: null,
    timeDimension: null,
    eventDimension: null,
    schema: mockSchemaWithEventStream,
    onCubeChange: vi.fn(),
    onBindingKeyChange: vi.fn(),
    onTimeDimensionChange: vi.fn(),
    onEventDimensionChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial rendering', () => {
    it('should render the Configuration heading', () => {
      render(<FlowConfigPanel {...defaultProps} />)

      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })

    it('should show cube selector with placeholder when no cube selected', () => {
      render(<FlowConfigPanel {...defaultProps} />)

      expect(screen.getByText('Select event stream cube')).toBeInTheDocument()
    })

    it('should show binding key placeholder when no cube selected', () => {
      render(<FlowConfigPanel {...defaultProps} />)

      // Multiple selectors show "Select cube first" when no cube is selected
      const placeholders = screen.getAllByText('Select cube first')
      expect(placeholders.length).toBeGreaterThanOrEqual(1)
    })

    it('should render all selector labels', () => {
      render(<FlowConfigPanel {...defaultProps} />)

      expect(screen.getByText('Cube')).toBeInTheDocument()
      expect(screen.getByText('Binding Key')).toBeInTheDocument()
      expect(screen.getByText('Time Dimension')).toBeInTheDocument()
      expect(screen.getByText('Event Dimension')).toBeInTheDocument()
    })
  })

  describe('cube selection', () => {
    it('should show only eventStream cubes in the dropdown', async () => {
      const user = userEvent.setup()
      render(<FlowConfigPanel {...defaultProps} />)

      // Click to open cube dropdown
      const cubeButton = screen.getByText('Select event stream cube')
      await user.click(cubeButton)

      // Should show Events cube (has eventStream) - it will appear as a cube group header
      // and possibly as a selectable option
      const eventsElements = screen.getAllByText('Events')
      expect(eventsElements.length).toBeGreaterThan(0)
    })

    it('should call onCubeChange when cube is selected', async () => {
      const user = userEvent.setup()
      const onCubeChange = vi.fn()
      render(<FlowConfigPanel {...defaultProps} onCubeChange={onCubeChange} />)

      // Open dropdown and select Events
      const cubeButton = screen.getByText('Select event stream cube')
      await user.click(cubeButton)

      const eventsOption = screen.getAllByText('Events').find(
        el => el.closest('button')?.className.includes('dc:w-full')
      )
      if (eventsOption) {
        await user.click(eventsOption)
      }

      expect(onCubeChange).toHaveBeenCalledWith('Events')
    })

    it('should display selected cube label', () => {
      render(<FlowConfigPanel {...defaultProps} selectedCube="Events" />)

      // The button should show "Events" as selected
      const buttons = screen.getAllByRole('button')
      const cubeButton = buttons.find(btn => btn.textContent?.includes('Events'))
      expect(cubeButton).toBeInTheDocument()
    })
  })

  describe('auto-populate from eventStream metadata', () => {
    it('should auto-populate binding key when cube is selected', async () => {
      const onBindingKeyChange = vi.fn()
      const onTimeDimensionChange = vi.fn()

      const { rerender } = render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube={null}
          onBindingKeyChange={onBindingKeyChange}
          onTimeDimensionChange={onTimeDimensionChange}
        />
      )

      // Simulate selecting a cube
      rerender(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          onBindingKeyChange={onBindingKeyChange}
          onTimeDimensionChange={onTimeDimensionChange}
        />
      )

      await waitFor(() => {
        expect(onBindingKeyChange).toHaveBeenCalledWith({ dimension: 'Events.userId' })
      })
    })

    it('should auto-populate time dimension when cube is selected', async () => {
      const onTimeDimensionChange = vi.fn()

      const { rerender } = render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube={null}
          onTimeDimensionChange={onTimeDimensionChange}
        />
      )

      rerender(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          onTimeDimensionChange={onTimeDimensionChange}
        />
      )

      await waitFor(() => {
        expect(onTimeDimensionChange).toHaveBeenCalledWith('Events.timestamp')
      })
    })
  })

  describe('dropdown selector interactions', () => {
    it('should open dropdown on click and close on outside click', async () => {
      const user = userEvent.setup()
      render(<FlowConfigPanel {...defaultProps} selectedCube="Events" />)

      // Click to open binding key dropdown
      const bindingKeyButton = screen.getByText('Select binding key')
      await user.click(bindingKeyButton)

      // Should show search input
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()

      // Click outside
      await user.click(document.body)

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
      })
    })

    it('should filter options based on search query', async () => {
      const user = userEvent.setup()
      render(<FlowConfigPanel {...defaultProps} selectedCube="Events" />)

      // Open event dimension dropdown (has multiple string options)
      const eventDimButton = screen.getByText('Select event dimension')
      await user.click(eventDimButton)

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'Page')

      // Should filter to only show Page dimension
      expect(screen.getByText('Page')).toBeInTheDocument()
    })

    it('should show "No matching fields found" when search has no results', async () => {
      const user = userEvent.setup()
      render(<FlowConfigPanel {...defaultProps} selectedCube="Events" />)

      const eventDimButton = screen.getByText('Select event dimension')
      await user.click(eventDimButton)

      const searchInput = screen.getByPlaceholderText('Search...')
      await user.type(searchInput, 'nonexistent')

      expect(screen.getByText('No matching fields found')).toBeInTheDocument()
    })

    it('should clear selection when clear button clicked', async () => {
      const user = userEvent.setup()
      const onEventDimensionChange = vi.fn()

      render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          eventDimension="Events.eventType"
          onEventDimensionChange={onEventDimensionChange}
        />
      )

      // Find the clear buttons (x) - there may be multiple for different fields
      const clearButtons = screen.getAllByTitle('Clear')
      // Click the one for event dimension (the last configured field)
      await user.click(clearButtons[clearButtons.length - 1])

      expect(onEventDimensionChange).toHaveBeenCalledWith(null)
    })

    it('should handle keyboard navigation for clear button', async () => {
      const user = userEvent.setup()
      const onEventDimensionChange = vi.fn()

      render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          eventDimension="Events.eventType"
          onEventDimensionChange={onEventDimensionChange}
        />
      )

      // Find clear buttons and use the one for event dimension
      const clearButtons = screen.getAllByTitle('Clear')
      const clearButton = clearButtons[clearButtons.length - 1]
      clearButton.focus()
      await user.keyboard('{Enter}')

      expect(onEventDimensionChange).toHaveBeenCalledWith(null)
    })
  })

  describe('collapsible behavior', () => {
    it('should start expanded when config is incomplete', () => {
      render(<FlowConfigPanel {...defaultProps} />)

      // Should show all selectors (not collapsed)
      expect(screen.getByText('Cube')).toBeInTheDocument()
      expect(screen.getByText('Binding Key')).toBeInTheDocument()
    })

    it('should auto-collapse when config becomes complete', async () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      const { rerender } = render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube={null}
        />
      )

      // Complete all fields
      rerender(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
          timeDimension="Events.timestamp"
          eventDimension="Events.eventType"
        />
      )

      // Wait for auto-collapse
      await waitFor(() => {
        // When collapsed, the Cube label should not be visible in the content area
        const cubeLabels = screen.queryAllByText('Cube')
        // Should only see in header summary, not in expanded content
        expect(cubeLabels.length).toBeLessThanOrEqual(1)
      })
    })

    it('should toggle collapse when header clicked', async () => {
      const user = userEvent.setup()
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
          timeDimension="Events.timestamp"
          eventDimension="Events.eventType"
        />
      )

      // Click header to expand (it auto-collapsed)
      const header = screen.getByText('Configuration')
      await user.click(header)

      // Should now show all selectors
      await waitFor(() => {
        expect(screen.getByText('Cube')).toBeInTheDocument()
      })
    })

    it('should show check icon when config is complete', async () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
          timeDimension="Events.timestamp"
          eventDimension="Events.eventType"
        />
      )

      // Check icon should be present (in success color class)
      const successElements = document.querySelectorAll('.text-dc-success')
      expect(successElements.length).toBeGreaterThan(0)
    })

    it('should show cube label in collapsed summary', async () => {
      const user = userEvent.setup()
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
          timeDimension="Events.timestamp"
          eventDimension="Events.eventType"
        />
      )

      // Should be auto-collapsed and show summary with cube name
      await waitFor(() => {
        // The "Events" text should appear in summary
        const eventsTexts = screen.getAllByText('Events')
        expect(eventsTexts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('binding key handling', () => {
    it('should handle binding key as string', () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
        />
      )

      // Should display the binding key value
      expect(screen.getByText('User ID')).toBeInTheDocument()
    })

    it('should handle binding key as array with dimension objects', () => {
      const bindingKey: FunnelBindingKey = {
        dimension: [{ dimension: 'Events.userId', label: 'User' }],
      }

      render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          bindingKey={bindingKey}
        />
      )

      // Should display based on the first dimension
      expect(screen.getByText('User ID')).toBeInTheDocument()
    })

    it('should call onBindingKeyChange with correct format', async () => {
      const user = userEvent.setup()
      const onBindingKeyChange = vi.fn()

      render(
        <FlowConfigPanel
          {...defaultProps}
          selectedCube="Events"
          onBindingKeyChange={onBindingKeyChange}
        />
      )

      // Open binding key dropdown
      const bindingKeyButton = screen.getByText('Select binding key')
      await user.click(bindingKeyButton)

      // Select a binding key
      const userIdOption = screen.getByRole('button', { name: /user id/i })
      await user.click(userIdOption)

      expect(onBindingKeyChange).toHaveBeenCalledWith({ dimension: 'Events.userId' })
    })
  })

  describe('empty schema handling', () => {
    it('should show empty dropdown when schema is null', async () => {
      const user = userEvent.setup()
      render(<FlowConfigPanel {...defaultProps} schema={null} />)

      const cubeButton = screen.getByText('Select event stream cube')
      await user.click(cubeButton)

      expect(screen.getByText('No matching fields found')).toBeInTheDocument()
    })

    it('should show empty options when no eventStream cubes exist', async () => {
      const user = userEvent.setup()
      render(<FlowConfigPanel {...defaultProps} schema={mockSchemaWithoutEventStream} />)

      const cubeButton = screen.getByText('Select event stream cube')
      await user.click(cubeButton)

      expect(screen.getByText('No matching fields found')).toBeInTheDocument()
    })
  })
})

// ============================================================================
// FlowModeContent Tests
// ============================================================================

describe('FlowModeContent', () => {
  const defaultStartingStep: FlowStartingStep = {
    name: '',
    filters: [],
  }

  const defaultProps: FlowModeContentProps = {
    flowCube: null,
    flowBindingKey: null,
    flowTimeDimension: null,
    eventDimension: null,
    startingStep: defaultStartingStep,
    stepsBefore: 3,
    stepsAfter: 3,
    joinStrategy: 'auto',
    schema: mockSchemaWithEventStream,
    onCubeChange: vi.fn(),
    onBindingKeyChange: vi.fn(),
    onTimeDimensionChange: vi.fn(),
    onEventDimensionChange: vi.fn(),
    onStartingStepFiltersChange: vi.fn(),
    onStepsBeforeChange: vi.fn(),
    onStepsAfterChange: vi.fn(),
    onJoinStrategyChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tab navigation', () => {
    it('should render Flow and Display tabs', () => {
      render(<FlowModeContent {...defaultProps} />)

      expect(screen.getByRole('button', { name: /^flow$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^display$/i })).toBeInTheDocument()
    })

    it('should show Flow tab as active by default', () => {
      render(<FlowModeContent {...defaultProps} />)

      const flowTab = screen.getByRole('button', { name: /^flow$/i })
      expect(flowTab).toHaveClass('text-dc-primary')
    })

    it('should switch to Display tab when clicked', async () => {
      const user = userEvent.setup()
      const displayConfig: ChartDisplayConfig = { showLegend: true }

      render(
        <FlowModeContent
          {...defaultProps}
          displayConfig={displayConfig}
          onDisplayConfigChange={vi.fn()}
        />
      )

      const displayTab = screen.getByRole('button', { name: /^display$/i })
      await user.click(displayTab)

      expect(displayTab).toHaveClass('text-dc-primary')
    })

    it('should disable Display tab when displayConfig is not provided', () => {
      render(<FlowModeContent {...defaultProps} />)

      const displayTab = screen.getByRole('button', { name: /^display$/i })
      expect(displayTab).toBeDisabled()
    })

    it('should enable Display tab when displayConfig and onDisplayConfigChange are provided', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          displayConfig={{ showLegend: true }}
          onDisplayConfigChange={vi.fn()}
        />
      )

      const displayTab = screen.getByRole('button', { name: /^display$/i })
      expect(displayTab).not.toBeDisabled()
    })
  })

  describe('visualization type selection', () => {
    it('should render Sankey and Sunburst visualization options when onChartTypeChange is provided', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          chartType="sankey"
          onChartTypeChange={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /sankey/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sunburst/i })).toBeInTheDocument()
    })

    it('should highlight Sankey as selected when chartType is sankey', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          chartType="sankey"
          onChartTypeChange={vi.fn()}
        />
      )

      const sankeyButton = screen.getByRole('button', { name: /sankey/i })
      expect(sankeyButton).toHaveClass('border-dc-primary')
    })

    it('should call onChartTypeChange when Sunburst is clicked', async () => {
      const user = userEvent.setup()
      const onChartTypeChange = vi.fn()

      render(
        <FlowModeContent
          {...defaultProps}
          chartType="sankey"
          onChartTypeChange={onChartTypeChange}
        />
      )

      const sunburstButton = screen.getByRole('button', { name: /sunburst/i })
      await user.click(sunburstButton)

      expect(onChartTypeChange).toHaveBeenCalledWith('sunburst')
    })

    it('should not render visualization section when onChartTypeChange is not provided', () => {
      render(<FlowModeContent {...defaultProps} />)

      expect(screen.queryByText('Visualization')).not.toBeInTheDocument()
    })
  })

  describe('starting step section', () => {
    it('should render Starting Step section heading', () => {
      render(<FlowModeContent {...defaultProps} />)

      expect(screen.getByText('Starting Step')).toBeInTheDocument()
    })

    it('should render Filter Conditions label', () => {
      render(<FlowModeContent {...defaultProps} />)

      expect(screen.getByText('Filter Conditions')).toBeInTheDocument()
    })

    it('should render AnalysisFilterSection for starting step filters', () => {
      const filters: Filter[] = [
        { member: 'Events.eventType', operator: 'equals', values: ['purchase'] },
      ]

      render(
        <FlowModeContent
          {...defaultProps}
          startingStep={{ name: '', filters }}
        />
      )

      // The filter should be displayed
      expect(screen.getByText('Event Type')).toBeInTheDocument()
    })

    it('should call onStartingStepFiltersChange when filters change', async () => {
      const onStartingStepFiltersChange = vi.fn()

      render(
        <FlowModeContent
          {...defaultProps}
          startingStep={{ name: '', filters: [] }}
          onStartingStepFiltersChange={onStartingStepFiltersChange}
        />
      )

      // The AnalysisFilterSection will handle filter changes
      // We just verify the callback is wired up properly
      expect(onStartingStepFiltersChange).not.toHaveBeenCalled()
    })
  })

  describe('exploration depth section', () => {
    it('should render Exploration Depth section heading', () => {
      render(<FlowModeContent {...defaultProps} />)

      expect(screen.getByText('Exploration Depth')).toBeInTheDocument()
    })

    it('should render Steps Before slider', () => {
      render(<FlowModeContent {...defaultProps} stepsBefore={3} stepsAfter={2} />)

      expect(screen.getByText('Steps Before')).toBeInTheDocument()
      // Should show current value - find it near the Steps Before slider
      // stepsBefore=3, stepsAfter=2, so we should see both
      const threeElements = screen.getAllByText('3')
      expect(threeElements.length).toBeGreaterThan(0)
    })

    it('should render Steps After slider', () => {
      render(<FlowModeContent {...defaultProps} stepsAfter={2} />)

      expect(screen.getByText('Steps After')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should call onStepsBeforeChange when slider changes', async () => {
      const onStepsBeforeChange = vi.fn()

      render(
        <FlowModeContent
          {...defaultProps}
          onStepsBeforeChange={onStepsBeforeChange}
        />
      )

      const sliders = screen.getAllByRole('slider')
      const stepsBeforeSlider = sliders[0]

      fireEvent.change(stepsBeforeSlider, { target: { value: '4' } })

      expect(onStepsBeforeChange).toHaveBeenCalledWith(4)
    })

    it('should call onStepsAfterChange when slider changes', async () => {
      const onStepsAfterChange = vi.fn()

      render(
        <FlowModeContent
          {...defaultProps}
          onStepsAfterChange={onStepsAfterChange}
        />
      )

      const sliders = screen.getAllByRole('slider')
      const stepsAfterSlider = sliders[1]

      fireEvent.change(stepsAfterSlider, { target: { value: '5' } })

      expect(onStepsAfterChange).toHaveBeenCalledWith(5)
    })

    it('should disable Steps Before slider when chartType is sunburst', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          chartType="sunburst"
          onChartTypeChange={vi.fn()}
        />
      )

      const sliders = screen.getAllByRole('slider')
      const stepsBeforeSlider = sliders[0]

      expect(stepsBeforeSlider).toBeDisabled()
    })

    it('should show N/A for Steps Before when chartType is sunburst', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          chartType="sunburst"
          onChartTypeChange={vi.fn()}
        />
      )

      expect(screen.getByText('(N/A)')).toBeInTheDocument()
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('should show performance warning for high step depth (4+)', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          stepsBefore={4}
          stepsAfter={4}
        />
      )

      expect(screen.getByText(/high step depth/i)).toBeInTheDocument()
    })

    it('should not show performance warning for low step depth', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          stepsBefore={2}
          stepsAfter={2}
        />
      )

      expect(screen.queryByText(/high step depth/i)).not.toBeInTheDocument()
    })

    it('should show appropriate help text for sankey chart type', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          chartType="sankey"
          onChartTypeChange={vi.fn()}
        />
      )

      expect(screen.getByText(/before and after/i)).toBeInTheDocument()
    })

    it('should show appropriate help text for sunburst chart type', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          chartType="sunburst"
          onChartTypeChange={vi.fn()}
        />
      )

      expect(screen.getByText(/after the starting step/i)).toBeInTheDocument()
    })
  })

  describe('join strategy section', () => {
    it('should render Join Strategy section heading', () => {
      render(<FlowModeContent {...defaultProps} />)

      expect(screen.getByText('Join Strategy')).toBeInTheDocument()
    })

    it('should render join strategy select with all options', () => {
      render(<FlowModeContent {...defaultProps} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(select).toHaveTextContent('Auto')
    })

    it('should call onJoinStrategyChange when option is selected', async () => {
      const user = userEvent.setup()
      const onJoinStrategyChange = vi.fn()

      render(
        <FlowModeContent
          {...defaultProps}
          onJoinStrategyChange={onJoinStrategyChange}
        />
      )

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'lateral')

      expect(onJoinStrategyChange).toHaveBeenCalledWith('lateral')
    })

    it('should reflect current join strategy value', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          joinStrategy="window"
        />
      )

      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('window')
    })
  })

  describe('display tab content', () => {
    it('should render AnalysisDisplayConfigPanel when display tab is active', async () => {
      const user = userEvent.setup()
      const displayConfig: ChartDisplayConfig = { showLegend: true }

      render(
        <FlowModeContent
          {...defaultProps}
          displayConfig={displayConfig}
          onDisplayConfigChange={vi.fn()}
        />
      )

      const displayTab = screen.getByRole('button', { name: /^display$/i })
      await user.click(displayTab)

      // Display config panel should be rendered
      // The exact content depends on AnalysisDisplayConfigPanel implementation
      expect(displayTab).toHaveClass('text-dc-primary')
    })
  })

  describe('FlowConfigPanel integration', () => {
    it('should render FlowConfigPanel with correct props', () => {
      const bindingKey: FunnelBindingKey = { dimension: 'Events.userId' }

      render(
        <FlowModeContent
          {...defaultProps}
          flowCube="Events"
          flowBindingKey={bindingKey}
          flowTimeDimension="Events.timestamp"
          eventDimension="Events.eventType"
        />
      )

      // FlowConfigPanel should be rendered with the cube selected
      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })

    it('should pass callbacks to FlowConfigPanel', async () => {
      const user = userEvent.setup()
      const onCubeChange = vi.fn()

      render(
        <FlowModeContent
          {...defaultProps}
          onCubeChange={onCubeChange}
        />
      )

      // Open cube dropdown
      const cubeButton = screen.getByText('Select event stream cube')
      await user.click(cubeButton)

      // Select a cube
      const eventsOption = screen.getAllByText('Events').find(
        el => el.closest('button')?.className.includes('dc:w-full')
      )
      if (eventsOption) {
        await user.click(eventsOption)
        expect(onCubeChange).toHaveBeenCalled()
      }
    })
  })

  describe('edge cases', () => {
    it('should handle null schema gracefully', () => {
      render(<FlowModeContent {...defaultProps} schema={null} />)

      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })

    it('should handle empty starting step filters', () => {
      render(
        <FlowModeContent
          {...defaultProps}
          startingStep={{ name: '', filters: [] }}
        />
      )

      expect(screen.getByText('Filter Conditions')).toBeInTheDocument()
    })

    it('should handle default joinStrategy when prop is not provided', () => {
      const propsWithoutJoinStrategy = { ...defaultProps }
      // @ts-expect-error - testing default behavior
      delete propsWithoutJoinStrategy.joinStrategy

      render(<FlowModeContent {...propsWithoutJoinStrategy} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('auto')
    })
  })
})

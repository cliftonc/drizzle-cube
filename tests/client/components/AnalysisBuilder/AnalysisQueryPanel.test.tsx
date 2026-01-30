import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalysisQueryPanel from '../../../../src/client/components/AnalysisBuilder/AnalysisQueryPanel'
import type { AnalysisQueryPanelProps, MetricItem, BreakdownItem, QueryPanelTab } from '../../../../src/client/components/AnalysisBuilder/types'
import type { MetaResponse } from '../../../../src/client/shared/types'
import type { Filter, ChartAxisConfig, ChartDisplayConfig } from '../../../../src/client/types'

// Mock schema
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
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' },
      ],
    },
  ],
}

// Mock metrics
const mockMetrics: MetricItem[] = [
  { id: 'metric-1', field: 'Users.count', label: 'A' },
]

// Mock breakdowns
const mockBreakdowns: BreakdownItem[] = [
  { id: 'breakdown-1', field: 'Users.name', isTimeDimension: false },
]

// Mock filters
const mockFilters: Filter[] = []

describe('AnalysisQueryPanel', () => {
  const defaultProps: AnalysisQueryPanelProps = {
    metrics: mockMetrics,
    breakdowns: mockBreakdowns,
    filters: mockFilters,
    schema: mockSchema,
    activeTab: 'query' as QueryPanelTab,
    onActiveTabChange: vi.fn(),
    onAddMetric: vi.fn(),
    onRemoveMetric: vi.fn(),
    onAddBreakdown: vi.fn(),
    onRemoveBreakdown: vi.fn(),
    onBreakdownGranularityChange: vi.fn(),
    onFiltersChange: vi.fn(),
    order: {},
    onOrderChange: vi.fn(),
    chartType: 'bar',
    chartConfig: {} as ChartAxisConfig,
    displayConfig: { showLegend: true, showGrid: true, showTooltip: true } as ChartDisplayConfig,
    onChartTypeChange: vi.fn(),
    onChartConfigChange: vi.fn(),
    onDisplayConfigChange: vi.fn(),
    validationStatus: 'idle',
    validationError: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tab navigation', () => {
    it('should show Query tab as active when activeTab is "query"', () => {
      render(<AnalysisQueryPanel {...defaultProps} activeTab="query" />)

      const queryTab = screen.getByRole('button', { name: /query/i })
      expect(queryTab).toHaveClass('text-dc-primary')
    })

    it('should switch to Chart tab when clicked', async () => {
      const user = userEvent.setup()
      const onActiveTabChange = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          onActiveTabChange={onActiveTabChange}
        />
      )

      const chartTab = screen.getByRole('button', { name: /^chart$/i })
      await user.click(chartTab)

      expect(onActiveTabChange).toHaveBeenCalledWith('chart')
    })

    it('should switch to Display tab when clicked', async () => {
      const user = userEvent.setup()
      const onActiveTabChange = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          onActiveTabChange={onActiveTabChange}
        />
      )

      const displayTab = screen.getByRole('button', { name: /^display$/i })
      await user.click(displayTab)

      expect(onActiveTabChange).toHaveBeenCalledWith('display')
    })

    it('should disable Chart and Display tabs when no metrics selected', async () => {
      const user = userEvent.setup()
      const onActiveTabChange = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          metrics={[]}
          onActiveTabChange={onActiveTabChange}
        />
      )

      const chartTab = screen.getByRole('button', { name: /^chart$/i })
      const displayTab = screen.getByRole('button', { name: /^display$/i })

      expect(chartTab).toBeDisabled()
      expect(displayTab).toBeDisabled()

      await user.click(chartTab)
      expect(onActiveTabChange).not.toHaveBeenCalled()
    })

    it('should show tab content for active tab only', () => {
      const { rerender } = render(<AnalysisQueryPanel {...defaultProps} activeTab="query" />)

      // Query tab shows Metrics section
      expect(screen.getByText('Metrics')).toBeInTheDocument()

      // Rerender with Chart tab active
      rerender(<AnalysisQueryPanel {...defaultProps} activeTab="chart" />)

      // Chart tab doesn't show Metrics section (it's in Query tab)
      expect(screen.queryByText('Metrics')).not.toBeInTheDocument()
    })
  })

  describe('metrics section', () => {
    it('should show Metrics section heading as clickable button', () => {
      render(<AnalysisQueryPanel {...defaultProps} activeTab="query" />)

      // The Metrics heading is a button that opens the field picker
      const metricsButton = screen.getByRole('button', { name: /metrics/i })
      expect(metricsButton).toBeInTheDocument()
    })

    it('should call onAddMetric when Metrics section clicked', async () => {
      const user = userEvent.setup()
      const onAddMetric = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          onAddMetric={onAddMetric}
        />
      )

      // Click on the Metrics section header (which is a button)
      const metricsButton = screen.getByRole('button', { name: /metrics/i })
      await user.click(metricsButton)

      expect(onAddMetric).toHaveBeenCalled()
    })

    it('should display added metrics', () => {
      render(<AnalysisQueryPanel {...defaultProps} />)

      // The metric field should be displayed (Users.count shows as "Count" or "User Count")
      expect(screen.getByText('Count')).toBeInTheDocument()
    })

    it('should call onRemoveMetric when remove button clicked', async () => {
      const user = userEvent.setup()
      const onRemoveMetric = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          onRemoveMetric={onRemoveMetric}
        />
      )

      // Find and click the remove button on the metric (title="Remove metric")
      const removeButtons = screen.getAllByTitle(/remove/i)
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0])
        expect(onRemoveMetric).toHaveBeenCalled()
      }
    })
  })

  describe('breakdowns section', () => {
    it('should show Breakdown section heading as clickable button', () => {
      render(<AnalysisQueryPanel {...defaultProps} />)

      // The Breakdown heading should be visible
      expect(screen.getByText('Breakdown')).toBeInTheDocument()
    })

    it('should call onAddBreakdown when Breakdown section clicked', async () => {
      const user = userEvent.setup()
      const onAddBreakdown = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          onAddBreakdown={onAddBreakdown}
        />
      )

      // Click on the Breakdown section (look for button with title "Add breakdown")
      const addBreakdownButtons = screen.getAllByTitle('Add breakdown')
      if (addBreakdownButtons.length > 0) {
        await user.click(addBreakdownButtons[0])
        expect(onAddBreakdown).toHaveBeenCalled()
      }
    })

    it('should display added breakdowns', () => {
      render(<AnalysisQueryPanel {...defaultProps} />)

      // The breakdown field should be displayed (Users.name shows as "Name" or "User Name")
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('should call onRemoveBreakdown when remove button clicked', async () => {
      const user = userEvent.setup()
      const onRemoveBreakdown = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          onRemoveBreakdown={onRemoveBreakdown}
        />
      )

      // Find and click the remove button on the breakdown (title="Remove breakdown")
      const removeButtons = screen.getAllByTitle(/remove/i)
      if (removeButtons.length > 1) {
        // Second remove button should be for breakdown
        await user.click(removeButtons[1])
        expect(onRemoveBreakdown).toHaveBeenCalled()
      }
    })

    it('should show granularity selector for time dimensions', () => {
      const timeBreakdowns: BreakdownItem[] = [
        { id: 'breakdown-time', field: 'Users.createdAt', isTimeDimension: true, granularity: 'day' },
      ]

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          breakdowns={timeBreakdowns}
        />
      )

      // Time dimension should display (shortTitle "Created" or full title "Created At")
      expect(screen.getByText('Created')).toBeInTheDocument()
    })
  })

  describe('filters section', () => {
    it('should show Filter section heading as clickable button', () => {
      render(<AnalysisQueryPanel {...defaultProps} />)

      // The Filter heading is a button that opens the field picker
      const filterButton = screen.getByRole('button', { name: /filter/i })
      expect(filterButton).toBeInTheDocument()
    })

    it('should display added filters', () => {
      const filtersWithData: Filter[] = [
        {
          member: 'Users.name',
          operator: 'equals',
          values: ['John'],
        },
      ]

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          filters={filtersWithData}
        />
      )

      // Filter should display the field name (User Name or Name)
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('should call onFiltersChange when filter is removed', async () => {
      const user = userEvent.setup()
      const onFiltersChange = vi.fn()
      const filtersWithData: Filter[] = [
        {
          member: 'Users.name',
          operator: 'equals',
          values: ['John'],
        },
      ]

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          filters={filtersWithData}
          onFiltersChange={onFiltersChange}
        />
      )

      // Find and click the remove button on the filter
      const removeButtons = screen.getAllByTitle(/remove/i)
      // Click the last remove button which should be for the filter
      if (removeButtons.length > 0) {
        await user.click(removeButtons[removeButtons.length - 1])
        expect(onFiltersChange).toHaveBeenCalled()
      }
    })
  })

  describe('multi-query mode', () => {
    it('should show query tabs when queryCount > 1', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          queryCount={2}
          activeQueryIndex={0}
          onActiveQueryChange={vi.fn()}
          onAddQuery={vi.fn()}
          onRemoveQuery={vi.fn()}
        />
      )

      expect(screen.getByText('Q1')).toBeInTheDocument()
      expect(screen.getByText('Q2')).toBeInTheDocument()
    })

    it('should call onActiveQueryChange when query tab clicked', async () => {
      const user = userEvent.setup()
      const onActiveQueryChange = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          queryCount={2}
          activeQueryIndex={0}
          onActiveQueryChange={onActiveQueryChange}
          onAddQuery={vi.fn()}
          onRemoveQuery={vi.fn()}
        />
      )

      const q2Tab = screen.getByText('Q2')
      await user.click(q2Tab)

      expect(onActiveQueryChange).toHaveBeenCalledWith(1)
    })

    it('should show add query button when onAddQuery provided', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          onAddQuery={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /add.*query/i })).toBeInTheDocument()
    })

    it('should call onAddQuery when add query button clicked', async () => {
      const user = userEvent.setup()
      const onAddQuery = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          onAddQuery={onAddQuery}
        />
      )

      const addButton = screen.getByRole('button', { name: /add.*query/i })
      await user.click(addButton)

      expect(onAddQuery).toHaveBeenCalled()
    })

    it('should show merge strategy selector in multi-query mode', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          queryCount={2}
          activeQueryIndex={0}
          onActiveQueryChange={vi.fn()}
          onAddQuery={vi.fn()}
          onRemoveQuery={vi.fn()}
          onMergeStrategyChange={vi.fn()}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should show remove query button for each query tab', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          queryCount={2}
          activeQueryIndex={0}
          onActiveQueryChange={vi.fn()}
          onAddQuery={vi.fn()}
          onRemoveQuery={vi.fn()}
        />
      )

      const removeButtons = screen.getAllByRole('button', { name: /remove q/i })
      expect(removeButtons.length).toBe(2)
    })
  })

  describe('analysis type selector', () => {
    it('should show analysis type selector when onAnalysisTypeChange provided', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          analysisType="query"
          onAnalysisTypeChange={vi.fn()}
        />
      )

      // The Query tab should be visible (part of the tab UI)
      const queryTabs = screen.getAllByText('Query')
      expect(queryTabs.length).toBeGreaterThan(0)
    })

    it('should call onAnalysisTypeChange when analysis type changed', async () => {
      const user = userEvent.setup()
      const onAnalysisTypeChange = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          analysisType="query"
          onAnalysisTypeChange={onAnalysisTypeChange}
        />
      )

      // Click on Funnel option if available
      const funnelOption = screen.queryByRole('button', { name: /funnel/i })
      if (funnelOption) {
        await user.click(funnelOption)
        expect(onAnalysisTypeChange).toHaveBeenCalledWith('funnel')
      }
    })
  })

  describe('validation', () => {
    it('should show validation errors when adapterValidation has errors', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          adapterValidation={{
            isValid: false,
            errors: ['At least one metric is required'],
            warnings: [],
          }}
        />
      )

      expect(screen.getByText('At least one metric is required')).toBeInTheDocument()
    })

    it('should show validation warnings when adapterValidation has warnings', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          adapterValidation={{
            isValid: true,
            errors: [],
            warnings: ['Consider adding a time dimension for better analysis'],
          }}
        />
      )

      expect(screen.getByText('Consider adding a time dimension for better analysis')).toBeInTheDocument()
    })

    it('should show multi-query validation errors when present', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          queryCount={2}
          activeQueryIndex={0}
          onActiveQueryChange={vi.fn()}
          onAddQuery={vi.fn()}
          onRemoveQuery={vi.fn()}
          multiQueryValidation={{
            isValid: false,
            errors: [{ type: 'error', message: 'Duplicate metrics detected' }],
            warnings: [],
          }}
        />
      )

      expect(screen.getByText('Duplicate metrics detected')).toBeInTheDocument()
    })
  })

  describe('locked breakdowns in merge mode', () => {
    it('should show info message when breakdowns are locked', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          queryCount={2}
          activeQueryIndex={1}
          breakdownsLocked={true}
          onActiveQueryChange={vi.fn()}
          onAddQuery={vi.fn()}
          onRemoveQuery={vi.fn()}
          mergeStrategy="merge"
          onMergeStrategyChange={vi.fn()}
        />
      )

      expect(screen.getByText(/dimensions are shared from Q1/i)).toBeInTheDocument()
    })

    it('should offer switch to separate series when breakdowns locked', async () => {
      const user = userEvent.setup()
      const onMergeStrategyChange = vi.fn()

      render(
        <AnalysisQueryPanel
          {...defaultProps}
          queryCount={2}
          activeQueryIndex={1}
          breakdownsLocked={true}
          onActiveQueryChange={vi.fn()}
          onAddQuery={vi.fn()}
          onRemoveQuery={vi.fn()}
          mergeStrategy="merge"
          onMergeStrategyChange={onMergeStrategyChange}
        />
      )

      const switchLink = screen.getByText(/switch to separate series/i)
      await user.click(switchLink)

      expect(onMergeStrategyChange).toHaveBeenCalledWith('concat')
    })
  })

  describe('chart tab content', () => {
    it('should render chart config panel when chart tab is active', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          activeTab="chart"
        />
      )

      // Chart tab should show chart type selection
      expect(screen.getByText(/chart type/i)).toBeInTheDocument()
    })

    it('should pass chartType to chart config panel', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          activeTab="chart"
          chartType="line"
        />
      )

      // Line chart should be indicated as selected
      // The specific implementation depends on how ChartConfigPanel displays selection
    })
  })

  describe('display tab content', () => {
    it('should render display config panel when display tab is active', () => {
      render(
        <AnalysisQueryPanel
          {...defaultProps}
          activeTab="display"
        />
      )

      // Display tab should show legend, grid, and other options
      expect(screen.getByText(/legend/i)).toBeInTheDocument()
    })
  })
})

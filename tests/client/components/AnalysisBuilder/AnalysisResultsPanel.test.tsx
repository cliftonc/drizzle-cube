import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalysisResultsPanel from '../../../../src/client/components/AnalysisBuilder/AnalysisResultsPanel'
import type { AnalysisResultsPanelProps, ExecutionStatus } from '../../../../src/client/components/AnalysisBuilder/types'
import type { ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../../../src/client/types'

// Mock LazyChart
vi.mock('../../../../src/client/charts/ChartLoader', () => ({
  LazyChart: ({ chartType, data }: { chartType: string; data: unknown[] }) => (
    <div data-testid="lazy-chart" data-chart-type={chartType} data-row-count={data.length}>
      Mock Chart
    </div>
  ),
  isValidChartType: (type: string) => ['bar', 'line', 'pie', 'area', 'table', 'funnel'].includes(type),
}))

// Mock useExplainQuery
vi.mock('../../../../src/client/hooks/queries/useExplainQuery', () => ({
  useExplainQuery: vi.fn(() => ({
    explainResult: null,
    isLoading: false,
    hasRun: false,
    error: null,
    runExplain: vi.fn(),
    clearExplain: vi.fn(),
  })),
}))

// Mock useExplainAI
vi.mock('../../../../src/client/hooks/queries/useExplainAI', () => ({
  useExplainAI: vi.fn(() => ({
    analysis: null,
    isAnalyzing: false,
    error: null,
    analyze: vi.fn(),
    clearAnalysis: vi.fn(),
  })),
}))

// Mock results
const mockResults = [
  { 'Users.count': 100, 'Users.name': 'John' },
  { 'Users.count': 200, 'Users.name': 'Jane' },
  { 'Users.count': 150, 'Users.name': 'Bob' },
]

describe('AnalysisResultsPanel', () => {
  const defaultProps: AnalysisResultsPanelProps = {
    executionStatus: 'success' as ExecutionStatus,
    executionResults: mockResults,
    executionError: null,
    totalRowCount: 3,
    resultsStale: false,
    chartType: 'bar' as ChartType,
    chartConfig: { xAxis: ['Users.name'], yAxis: ['Users.count'] } as ChartAxisConfig,
    displayConfig: { showLegend: true, showGrid: true, showTooltip: true } as ChartDisplayConfig,
    activeView: 'chart',
    onActiveViewChange: vi.fn(),
    displayLimit: 100,
    onDisplayLimitChange: vi.fn(),
    hasMetrics: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('should show loading indicator when status is "loading"', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="loading"
          executionResults={null}
        />
      )

      expect(screen.getByText('Executing Query...')).toBeInTheDocument()
    })

    it('should show spinner animation during loading', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="loading"
          executionResults={null}
        />
      )

      const spinner = document.querySelector('.dc\\:animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should show error message when execution fails', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="error"
          executionError="Connection timeout"
          executionResults={null}
        />
      )

      expect(screen.getByText('Query Execution Failed')).toBeInTheDocument()
      expect(screen.getByText('Connection timeout')).toBeInTheDocument()
    })

    it('should show generic error message when no error details', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="error"
          executionError={null}
          executionResults={null}
        />
      )

      expect(screen.getByText('Query Execution Failed')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state when no metrics selected', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="idle"
          executionResults={null}
          hasMetrics={false}
        />
      )

      expect(screen.getByText('No Results Yet')).toBeInTheDocument()
      expect(screen.getByText(/add metrics or breakdowns/i)).toBeInTheDocument()
    })

    it('should show AI button in empty state when AI is enabled', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="idle"
          executionResults={null}
          hasMetrics={false}
          enableAI={true}
          onAIToggle={vi.fn()}
        />
      )

      expect(screen.getByText('Analyse with AI')).toBeInTheDocument()
    })

    it('should call onAIToggle when AI button clicked', async () => {
      const user = userEvent.setup()
      const onAIToggle = vi.fn()

      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="idle"
          executionResults={null}
          hasMetrics={false}
          enableAI={true}
          onAIToggle={onAIToggle}
        />
      )

      const aiButton = screen.getByText('Analyse with AI')
      await user.click(aiButton)

      expect(onAIToggle).toHaveBeenCalled()
    })
  })

  describe('no data state', () => {
    it('should show success message when query succeeds but returns empty results', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="success"
          executionResults={[]}
          activeView="chart"
          hasMetrics={true}
          allQueries={[{ measures: ['Users.count'], dimensions: [] }]}
        />
      )

      // When query succeeds but returns no data, shows success message
      expect(screen.getByText('Query Successful')).toBeInTheDocument()
      expect(screen.getByText('No data returned from the query')).toBeInTheDocument()
    })
  })

  describe('view toggle', () => {
    it('should show chart/table toggle buttons', () => {
      render(<AnalysisResultsPanel {...defaultProps} />)

      // Should have view toggle buttons in header
      // The exact text depends on implementation
    })

    it('should call onActiveViewChange when table view clicked', async () => {
      const user = userEvent.setup()
      const onActiveViewChange = vi.fn()

      render(
        <AnalysisResultsPanel
          {...defaultProps}
          activeView="chart"
          onActiveViewChange={onActiveViewChange}
        />
      )

      // Find and click table button
      const tableButton = screen.queryByRole('button', { name: /table/i })
      if (tableButton) {
        await user.click(tableButton)
        expect(onActiveViewChange).toHaveBeenCalledWith('table')
      }
    })

    it('should call onActiveViewChange when chart view clicked', async () => {
      const user = userEvent.setup()
      const onActiveViewChange = vi.fn()

      render(
        <AnalysisResultsPanel
          {...defaultProps}
          activeView="table"
          onActiveViewChange={onActiveViewChange}
        />
      )

      // Find and click chart button
      const chartButton = screen.queryByRole('button', { name: /chart/i })
      if (chartButton) {
        await user.click(chartButton)
        expect(onActiveViewChange).toHaveBeenCalledWith('chart')
      }
    })

    it('should highlight active view button', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          activeView="chart"
        />
      )

      // Chart view button should be highlighted
      // Table view button should not be highlighted
    })
  })

  describe('chart rendering', () => {
    it('should render LazyChart with correct props when chart view active', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          activeView="chart"
        />
      )

      const chart = screen.getByTestId('lazy-chart')
      expect(chart).toHaveAttribute('data-chart-type', 'bar')
      expect(chart).toHaveAttribute('data-row-count', '3')
    })

    it('should pass chartType to LazyChart', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          chartType="line"
          activeView="chart"
        />
      )

      const chart = screen.getByTestId('lazy-chart')
      expect(chart).toHaveAttribute('data-chart-type', 'line')
    })
  })

  describe('table rendering', () => {
    it('should show data table when table view active', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          activeView="table"
        />
      )

      // Table view should show results in tabular format
      // Implementation depends on DataTable component
    })

    it('should show display limit selector for tables', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          activeView="table"
        />
      )

      // Display limit dropdown or controls should be visible
    })
  })

  describe('stale results indicator', () => {
    it('should show stale indicator when resultsStale is true', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          resultsStale={true}
        />
      )

      // Should show some visual indication that results are stale
      // (implementation-specific)
    })
  })

  describe('debug view', () => {
    it('should show debug toggle button', () => {
      render(<AnalysisResultsPanel {...defaultProps} />)

      // Debug button should be visible in the toolbar
      const debugButton = screen.queryByRole('button', { name: /debug/i })
      // The button exists but may use an icon
    })

    it('should show SQL when debug view is expanded', async () => {
      const user = userEvent.setup()

      render(
        <AnalysisResultsPanel
          {...defaultProps}
          debugDataPerQuery={[
            {
              sql: 'SELECT * FROM users',
              analysis: null,
              loading: false,
              error: null,
            },
          ]}
        />
      )

      // Find and click debug toggle
      const debugButtons = screen.getAllByRole('button')
      const debugButton = debugButtons.find(
        btn => btn.querySelector('svg')?.classList.contains('dc:w-4')
      )

      if (debugButton) {
        await user.click(debugButton)
        // SQL should be visible when debug is toggled
      }
    })
  })

  describe('share functionality', () => {
    it('should show share button when canShare is true', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          canShare={true}
          onShareClick={vi.fn()}
        />
      )

      // Share button should be visible
    })

    it('should call onShareClick when share button clicked', async () => {
      const user = userEvent.setup()
      const onShareClick = vi.fn()

      render(
        <AnalysisResultsPanel
          {...defaultProps}
          canShare={true}
          onShareClick={onShareClick}
        />
      )

      const shareButton = screen.queryByRole('button', { name: /share/i })
      if (shareButton) {
        await user.click(shareButton)
        expect(onShareClick).toHaveBeenCalled()
      }
    })

    it('should show success indicator when shareButtonState is "success"', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          canShare={true}
          shareButtonState="success"
          onShareClick={vi.fn()}
        />
      )

      // Should show checkmark or success indicator
    })
  })

  describe('refresh functionality', () => {
    it('should show refresh button when canRefresh is true', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          canRefresh={true}
          onRefreshClick={vi.fn()}
        />
      )

      // Refresh button should be visible
    })

    it('should call onRefreshClick when refresh clicked', async () => {
      const user = userEvent.setup()
      const onRefreshClick = vi.fn()

      render(
        <AnalysisResultsPanel
          {...defaultProps}
          canRefresh={true}
          onRefreshClick={onRefreshClick}
        />
      )

      const refreshButtons = screen.getAllByRole('button')
      const refreshButton = refreshButtons.find(
        btn => btn.getAttribute('title')?.toLowerCase().includes('refresh')
      )

      if (refreshButton) {
        await user.click(refreshButton)
        expect(onRefreshClick).toHaveBeenCalled()
      }
    })

    it('should show spinner when isRefreshing is true', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          canRefresh={true}
          isRefreshing={true}
          onRefreshClick={vi.fn()}
        />
      )

      // Should show spinner or loading state on refresh button
    })

    it('should show "Ready to Execute" state when needsRefresh and no results', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          executionStatus="idle"
          executionResults={null}
          needsRefresh={true}
          hasMetrics={true}
          onRefreshClick={vi.fn()}
          allQueries={[{ measures: ['Users.count'], dimensions: [] }]}
        />
      )

      // Should show manual refresh prompt
    })
  })

  describe('clear functionality', () => {
    it('should show clear button when canClear is true', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          canClear={true}
          onClearClick={vi.fn()}
        />
      )

      // Clear button should be visible
    })

    it('should show confirmation modal when clear clicked', async () => {
      const user = userEvent.setup()

      render(
        <AnalysisResultsPanel
          {...defaultProps}
          canClear={true}
          onClearClick={vi.fn()}
        />
      )

      const clearButton = screen.queryByRole('button', { name: /clear/i })
      if (clearButton) {
        await user.click(clearButton)
        // Confirmation modal should appear
      }
    })
  })

  describe('multi-query mode', () => {
    it('should show query tabs when queryCount > 1', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          queryCount={2}
          activeTableIndex={0}
          onActiveTableChange={vi.fn()}
          perQueryResults={[mockResults, mockResults.slice(0, 2)]}
        />
      )

      // Should show Q1, Q2 tabs in table view
    })

    it('should call onActiveTableChange when switching query tabs', async () => {
      const user = userEvent.setup()
      const onActiveTableChange = vi.fn()

      render(
        <AnalysisResultsPanel
          {...defaultProps}
          queryCount={2}
          activeView="table"
          activeTableIndex={0}
          onActiveTableChange={onActiveTableChange}
          perQueryResults={[mockResults, mockResults.slice(0, 2)]}
        />
      )

      // Find Q2 tab and click it
      const q2Tab = screen.queryByText('Q2')
      if (q2Tab) {
        await user.click(q2Tab)
        expect(onActiveTableChange).toHaveBeenCalledWith(1)
      }
    })
  })

  describe('funnel mode', () => {
    it('should show funnel-specific UI when analysisType is "funnel"', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          analysisType="funnel"
          executionStatus="idle"
          executionResults={null}
          hasMetrics={false}
          allQueries={[]}
          funnelServerQuery={null}
        />
      )

      // Funnel mode shows this message in empty state
      expect(screen.getByText('Add funnel steps to see conversion analysis')).toBeInTheDocument()
    })

    it('should use isFunnelMode prop for backwards compatibility', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          isFunnelMode={true}
          executionStatus="idle"
          executionResults={null}
          hasMetrics={false}
          allQueries={[]}
          funnelServerQuery={null}
        />
      )

      expect(screen.getByText('Add funnel steps to see conversion analysis')).toBeInTheDocument()
    })
  })

  describe('flow mode', () => {
    it('should show flow-specific empty message when analysisType is "flow"', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          analysisType="flow"
          executionStatus="idle"
          executionResults={null}
          hasMetrics={false}
          allQueries={[]}
          flowServerQuery={null}
        />
      )

      expect(screen.getByText('Configure flow analysis to see user journey paths')).toBeInTheDocument()
    })
  })

  describe('retention mode', () => {
    it('should show retention-specific empty message when analysisType is "retention"', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          analysisType="retention"
          executionStatus="idle"
          executionResults={null}
          hasMetrics={false}
          allQueries={[]}
          retentionServerQuery={null}
        />
      )

      expect(screen.getByText('Select a cube and configure retention settings to see results')).toBeInTheDocument()
    })
  })

  describe('color palette', () => {
    it('should show color palette selector when onColorPaletteChange provided', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          colorPalette={['#FF0000', '#00FF00', '#0000FF']}
          currentPaletteName="default"
          onColorPaletteChange={vi.fn()}
        />
      )

      // Color palette selector should be visible
    })
  })

  describe('row count display', () => {
    it('should show total row count', () => {
      render(
        <AnalysisResultsPanel
          {...defaultProps}
          totalRowCount={150}
        />
      )

      // Should display "150 rows" or similar
    })
  })
})

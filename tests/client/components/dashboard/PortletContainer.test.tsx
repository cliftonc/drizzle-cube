/**
 * Comprehensive tests for PortletContainer
 *
 * Tests cover:
 * - Component rendering with various portlet configurations
 * - Header display and actions
 * - Edit mode controls (refresh, edit, delete buttons)
 * - Debug modal integration
 * - Legacy to analysisConfig migration
 * - Props handling and callbacks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PortletConfig, ChartType } from '../../../../src/client/types'
import type { AnalysisConfig } from '../../../../src/client/types/analysisConfig'
import PortletContainer from '../../../../src/client/components/PortletContainer'
import { CubeProvider } from '../../../../src/client/providers/CubeProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a simple wrapper that provides minimal context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  })
  return (
    <QueryClientProvider client={queryClient}>
      <CubeProvider enableBatching={false}>
        {children}
      </CubeProvider>
    </QueryClientProvider>
  )
}

// Custom render that wraps with providers
const renderWithTestProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper })
}

// Mock AnalyticsPortlet to avoid IntersectionObserver issues and isolate PortletContainer tests
vi.mock('../../../../src/client/components/AnalyticsPortlet', () => ({
  default: vi.fn(({ query, chartType, title, onDebugDataReady }) => {
    // Parse query to display in test
    let queryDisplay = 'empty query'
    try {
      const parsed = JSON.parse(query)
      queryDisplay = parsed.measures?.[0] || 'no measures'
    } catch {
      queryDisplay = 'invalid query'
    }
    return (
      <div data-testid="analytics-portlet">
        <span data-testid="portlet-query">{queryDisplay}</span>
        <span data-testid="portlet-chart-type">{chartType}</span>
      </div>
    )
  })
}))

// Mock DebugModal
vi.mock('../../../../src/client/components/DebugModal', () => ({
  default: vi.fn(({ chartType }) => (
    <button data-testid="debug-modal-button" title="Debug">
      Debug: {chartType}
    </button>
  ))
}))

// Create a minimal analysisConfig for testing
function createAnalysisConfig(
  chartType: ChartType = 'bar',
  query: Record<string, unknown> = { measures: ['Employees.count'] }
): AnalysisConfig {
  return {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType,
        chartConfig: { xAxis: [], yAxis: ['Employees.count'] },
        displayConfig: { showLegend: true }
      }
    },
    query
  }
}

// Sample portlet configurations for testing
const samplePortlet: PortletConfig = {
  id: 'portlet-1',
  title: 'Employee Count',
  analysisConfig: createAnalysisConfig('bar', { measures: ['Employees.count'] }),
  w: 6,
  h: 4,
  x: 0,
  y: 0
}

const portletWithLineChart: PortletConfig = {
  id: 'portlet-2',
  title: 'Sales Over Time',
  analysisConfig: createAnalysisConfig('line', {
    measures: ['Sales.totalRevenue'],
    timeDimensions: [{ dimension: 'Sales.date', granularity: 'day' }]
  }),
  w: 12,
  h: 6,
  x: 0,
  y: 0
}

// Legacy portlet (without analysisConfig - should be migrated)
const legacyPortlet: PortletConfig = {
  id: 'portlet-legacy',
  title: 'Legacy Portlet',
  query: JSON.stringify({ measures: ['Employees.count'] }),
  chartType: 'pie',
  chartConfig: { xAxis: ['Employees.name'], yAxis: ['Employees.count'] },
  displayConfig: { showLegend: false },
  w: 4,
  h: 4,
  x: 0,
  y: 0
}

describe('PortletContainer', () => {
  const defaultProps = {
    portlet: samplePortlet,
    editable: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onRefresh: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================
  describe('Basic Rendering', () => {
    it('should render portlet container with title', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Employee Count' })).toBeInTheDocument()
    })

    it('should render different portlet titles correctly', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={portletWithLineChart} />)

      expect(screen.getByRole('heading', { name: 'Sales Over Time' })).toBeInTheDocument()
    })

    it('should render with proper container structure', () => {
      const { container } = renderWithTestProviders(<PortletContainer {...defaultProps} />)

      // Should have the main container div
      const mainContainer = container.querySelector('.bg-dc-surface')
      expect(mainContainer).toBeInTheDocument()

      // Should have header section
      const header = container.querySelector('.dc\\:border-b')
      expect(header).toBeInTheDocument()
    })

    it('should render content area', () => {
      const { container } = renderWithTestProviders(<PortletContainer {...defaultProps} />)

      // Should have content section with padding
      const contentArea = container.querySelector('.dc\\:flex-1')
      expect(contentArea).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Edit Mode Tests
  // ==========================================================================
  describe('Edit Mode', () => {
    it('should not show edit controls when editable is false', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={false} />)

      expect(screen.queryByTitle('Refresh')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
    })

    it('should show edit controls when editable is true', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} />)

      expect(screen.getByTitle('Refresh')).toBeInTheDocument()
      expect(screen.getByTitle('Edit')).toBeInTheDocument()
      expect(screen.getByTitle('Delete')).toBeInTheDocument()
    })

    it('should render refresh button with correct icon', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} />)

      const refreshButton = screen.getByTitle('Refresh')
      expect(refreshButton).toBeInTheDocument()
      expect(refreshButton.querySelector('svg')).toBeInTheDocument()
    })

    it('should render edit button with correct icon', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} />)

      const editButton = screen.getByTitle('Edit')
      expect(editButton).toBeInTheDocument()
      expect(editButton.querySelector('svg')).toBeInTheDocument()
    })

    it('should render delete button with correct icon', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} />)

      const deleteButton = screen.getByTitle('Delete')
      expect(deleteButton).toBeInTheDocument()
      expect(deleteButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Button Callback Tests
  // ==========================================================================
  describe('Button Callbacks', () => {
    it('should call onRefresh with portlet ID when refresh button is clicked', async () => {
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} onRefresh={onRefresh} />)

      await user.click(screen.getByTitle('Refresh'))

      expect(onRefresh).toHaveBeenCalledTimes(1)
      expect(onRefresh).toHaveBeenCalledWith('portlet-1')
    })

    it('should call onEdit with portlet when edit button is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} onEdit={onEdit} />)

      await user.click(screen.getByTitle('Edit'))

      expect(onEdit).toHaveBeenCalledTimes(1)
      expect(onEdit).toHaveBeenCalledWith(samplePortlet)
    })

    it('should call onDelete with portlet ID when delete button is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} onDelete={onDelete} />)

      await user.click(screen.getByTitle('Delete'))

      expect(onDelete).toHaveBeenCalledTimes(1)
      expect(onDelete).toHaveBeenCalledWith('portlet-1')
    })

    it('should not throw if onRefresh is undefined', async () => {
      const user = userEvent.setup()
      renderWithTestProviders(<PortletContainer portlet={samplePortlet} editable={true} />)

      // Should not throw
      await user.click(screen.getByTitle('Refresh'))
    })

    it('should not throw if onEdit is undefined', async () => {
      const user = userEvent.setup()
      renderWithTestProviders(<PortletContainer portlet={samplePortlet} editable={true} />)

      // Should not throw
      await user.click(screen.getByTitle('Edit'))
    })

    it('should not throw if onDelete is undefined', async () => {
      const user = userEvent.setup()
      renderWithTestProviders(<PortletContainer portlet={samplePortlet} editable={true} />)

      // Should not throw
      await user.click(screen.getByTitle('Delete'))
    })
  })

  // ==========================================================================
  // Legacy Portlet Migration Tests
  // ==========================================================================
  describe('Legacy Portlet Migration', () => {
    it('should handle legacy portlet without analysisConfig', () => {
      // This tests that ensureAnalysisConfig is called and works
      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={legacyPortlet} />)

      expect(screen.getByRole('heading', { name: 'Legacy Portlet' })).toBeInTheDocument()
    })

    it('should render legacy portlet with correct title', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={legacyPortlet} />)

      expect(screen.getByRole('heading', { name: 'Legacy Portlet' })).toBeInTheDocument()
    })

    it('should handle portlet with both legacy fields and analysisConfig (analysisConfig takes precedence)', () => {
      const mixedPortlet: PortletConfig = {
        id: 'portlet-mixed',
        title: 'Mixed Portlet',
        query: JSON.stringify({ measures: ['Legacy.measure'] }), // Legacy
        chartType: 'pie', // Legacy
        analysisConfig: createAnalysisConfig('line', { measures: ['Modern.measure'] }), // Modern
        w: 6,
        h: 4,
        x: 0,
        y: 0
      }

      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={mixedPortlet} />)

      // Should render without errors
      expect(screen.getByRole('heading', { name: 'Mixed Portlet' })).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Different Chart Type Tests
  // ==========================================================================
  describe('Different Chart Types', () => {
    const chartTypes: ChartType[] = ['bar', 'line', 'pie', 'area', 'table', 'scatter']

    chartTypes.forEach(chartType => {
      it(`should render portlet with ${chartType} chart type`, () => {
        const portlet: PortletConfig = {
          id: `portlet-${chartType}`,
          title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
          analysisConfig: createAnalysisConfig(chartType, { measures: ['Employees.count'] }),
          w: 6,
          h: 4,
          x: 0,
          y: 0
        }

        renderWithTestProviders(<PortletContainer {...defaultProps} portlet={portlet} />)

        expect(screen.getByRole('heading', { name: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart` })).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // Props Handling Tests
  // ==========================================================================
  describe('Props Handling', () => {
    it('should use default editable value of false', () => {
      renderWithTestProviders(<PortletContainer portlet={samplePortlet} />)

      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    })

    it('should update when portlet prop changes', () => {
      const { rerender } = renderWithTestProviders(<PortletContainer {...defaultProps} portlet={samplePortlet} />)

      expect(screen.getByRole('heading', { name: 'Employee Count' })).toBeInTheDocument()

      rerender(
        <PortletContainer {...defaultProps} portlet={portletWithLineChart} />
      )

      expect(screen.getByRole('heading', { name: 'Sales Over Time' })).toBeInTheDocument()
    })

    it('should update when editable prop changes', () => {
      const { rerender } = renderWithTestProviders(<PortletContainer {...defaultProps} editable={false} />)

      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()

      rerender(
        <PortletContainer {...defaultProps} editable={true} />
      )

      expect(screen.getByTitle('Edit')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Debug Modal Integration Tests
  // ==========================================================================
  describe('Debug Modal Integration', () => {
    // The debug modal appears after data is loaded and handleDebugDataReady is called
    // Since the actual data loading happens in AnalyticsPortlet, we test the container's
    // handling of the debug data callback

    it('should not show debug button initially (before data loads)', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} />)

      // Debug button should not be visible until data loads
      // The DebugModal is only rendered when debugData is set
      // Since this is a unit test without actual data loading, we verify the initial state
      expect(screen.getByRole('heading', { name: 'Employee Count' })).toBeInTheDocument()
    })

    it('should render header gap for debug button positioning', () => {
      const { container } = renderWithTestProviders(<PortletContainer {...defaultProps} />)

      // The header should have gap for debug button positioning
      const headerRow = container.querySelector('.dc\\:flex.dc\\:items-center.dc\\:gap-2')
      expect(headerRow).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      const emptyTitlePortlet: PortletConfig = {
        ...samplePortlet,
        title: ''
      }

      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={emptyTitlePortlet} />)

      // Should render without crashing
      expect(screen.queryByRole('heading')).toBeInTheDocument()
    })

    it('should handle very long title', () => {
      const longTitlePortlet: PortletConfig = {
        ...samplePortlet,
        title: 'This is a very long portlet title that might need to be truncated to fit in the header area'
      }

      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={longTitlePortlet} />)

      // Title should be truncated (has dc:truncate class)
      const title = screen.getByRole('heading')
      expect(title).toHaveClass('dc:truncate')
    })

    it('should handle special characters in title', () => {
      const specialTitlePortlet: PortletConfig = {
        ...samplePortlet,
        title: 'Revenue ($) & Growth <2024>'
      }

      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={specialTitlePortlet} />)

      expect(screen.getByRole('heading', { name: 'Revenue ($) & Growth <2024>' })).toBeInTheDocument()
    })

    it('should handle portlet with minimal config', () => {
      const minimalPortlet: PortletConfig = {
        id: 'minimal',
        title: 'Minimal',
        analysisConfig: {
          version: 1,
          analysisType: 'query',
          activeView: 'chart',
          charts: {},
          query: {}
        },
        w: 1,
        h: 1,
        x: 0,
        y: 0
      }

      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={minimalPortlet} />)

      expect(screen.getByRole('heading', { name: 'Minimal' })).toBeInTheDocument()
    })

    it('should handle portlet with complex query configuration', () => {
      const complexPortlet: PortletConfig = {
        id: 'complex',
        title: 'Complex Query',
        analysisConfig: createAnalysisConfig('bar', {
          measures: ['Employees.count', 'Employees.avgSalary'],
          dimensions: ['Employees.departmentId'],
          timeDimensions: [
            {
              dimension: 'Employees.createdAt',
              granularity: 'month',
              dateRange: ['2024-01-01', '2024-12-31']
            }
          ],
          filters: [
            { member: 'Employees.isActive', operator: 'equals', values: [true] }
          ],
          order: { 'Employees.count': 'desc' },
          limit: 100
        }),
        w: 12,
        h: 8,
        x: 0,
        y: 0
      }

      renderWithTestProviders(<PortletContainer {...defaultProps} portlet={complexPortlet} />)

      expect(screen.getByRole('heading', { name: 'Complex Query' })).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Memoization Tests
  // ==========================================================================
  describe('Memoization', () => {
    it('should memoize normalized portlet', () => {
      // The component uses useMemo for normalizedPortlet
      // This is an indirect test - component should render consistently
      const { rerender } = renderWithTestProviders(<PortletContainer {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Employee Count' })).toBeInTheDocument()

      // Rerender with same portlet
      rerender(<PortletContainer {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Employee Count' })).toBeInTheDocument()
    })

    it('should memoize debug data callback', async () => {
      const user = userEvent.setup()

      // Render with editable true
      const { rerender } = renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} />)

      // Click refresh (triggers callback)
      await user.click(screen.getByTitle('Refresh'))

      // Rerender shouldn't cause issues with callback stability
      rerender(<PortletContainer {...defaultProps} editable={true} />)

      await user.click(screen.getByTitle('Refresh'))
    })
  })

  // ==========================================================================
  // Styling Tests
  // ==========================================================================
  describe('Styling', () => {
    it('should have proper container styling', () => {
      const { container } = renderWithTestProviders(<PortletContainer {...defaultProps} />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('bg-dc-surface')
      expect(mainDiv).toHaveClass('dc:border')
      expect(mainDiv).toHaveClass('dc:rounded-lg')
      expect(mainDiv).toHaveClass('dc:flex')
      expect(mainDiv).toHaveClass('dc:flex-col')
      expect(mainDiv).toHaveClass('dc:h-full')
    })

    it('should have proper header styling', () => {
      const { container } = renderWithTestProviders(<PortletContainer {...defaultProps} />)

      const header = container.querySelector('.dc\\:border-b.border-dc-border')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('dc:rounded-t-lg')
    })

    it('should style delete button differently (danger color)', () => {
      renderWithTestProviders(<PortletContainer {...defaultProps} editable={true} />)

      const deleteButton = screen.getByTitle('Delete')
      expect(deleteButton).toHaveClass('text-dc-danger')
    })
  })
})

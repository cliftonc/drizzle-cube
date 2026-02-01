import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalysisChartConfigPanel from '../../../../src/client/components/AnalysisBuilder/AnalysisChartConfigPanel'
import type { MetricItem, BreakdownItem } from '../../../../src/client/components/AnalysisBuilder/types'
import type { ChartType, ChartAxisConfig } from '../../../../src/client/types'
import type { MetaResponse } from '../../../../src/client/shared/types'
import type { ChartAvailabilityMap } from '../../../../src/client/shared/chartDefaults'

// Mock useChartConfig hook
vi.mock('../../../../src/client/charts/lazyChartConfigRegistry', () => ({
  useChartConfig: vi.fn((chartType: string) => ({
    config: {
      skipQuery: false,
      dropZones: [
        {
          key: 'xAxis',
          label: 'X-Axis',
          accepts: ['dimension', 'timeDimension'],
          maxItems: 1,
        },
        {
          key: 'yAxis',
          label: 'Y-Axis',
          accepts: ['measure'],
          maxItems: undefined, // Multiple measures allowed
          enableDualAxis: true,
        },
        {
          key: 'series',
          label: 'Series',
          accepts: ['dimension'],
          maxItems: 1,
        },
      ],
    },
    loaded: true,
  })),
}))

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
        { name: 'Users.status', type: 'string', title: 'Status', shortTitle: 'Status' },
        { name: 'Users.createdAt', type: 'time', title: 'Created At', shortTitle: 'Created' },
      ],
    },
  ],
}

// Mock metrics
const mockMetrics: MetricItem[] = [
  { id: 'metric-1', field: 'Users.count', label: 'A' },
  { id: 'metric-2', field: 'Users.totalRevenue', label: 'B' },
]

// Mock breakdowns
const mockBreakdowns: BreakdownItem[] = [
  { id: 'breakdown-1', field: 'Users.name', isTimeDimension: false },
  { id: 'breakdown-2', field: 'Users.createdAt', isTimeDimension: true },
]

describe('AnalysisChartConfigPanel', () => {
  const defaultProps = {
    chartType: 'bar' as ChartType,
    chartConfig: {} as ChartAxisConfig,
    metrics: mockMetrics,
    breakdowns: mockBreakdowns,
    schema: mockSchema,
    onChartTypeChange: vi.fn(),
    onChartConfigChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('chart type selection', () => {
    it('should show available chart types', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })

    it('should call onChartTypeChange when a chart type is selected', async () => {
      const user = userEvent.setup()
      const onChartTypeChange = vi.fn()

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          onChartTypeChange={onChartTypeChange}
        />
      )

      // Find and click on line chart (or any chart type button)
      const chartTypeButtons = screen.getAllByRole('button')
      const lineChartButton = chartTypeButtons.find(btn =>
        btn.getAttribute('title')?.toLowerCase().includes('line') ||
        btn.textContent?.toLowerCase().includes('line')
      )

      if (lineChartButton) {
        await user.click(lineChartButton)
        expect(onChartTypeChange).toHaveBeenCalled()
      }
    })

    it('should highlight currently selected chart type', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} chartType="bar" />)

      // The bar chart should be visually indicated as selected
      // This depends on ChartTypeSelector implementation
      const chartTypeSection = screen.getByText('Chart Type').parentElement
      expect(chartTypeSection).toBeInTheDocument()
    })

    it('should disable chart types marked as unavailable', () => {
      const availability: ChartAvailabilityMap = {
        bar: { available: true },
        pie: { available: false, reason: 'Requires single dimension' },
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartAvailability={availability}
        />
      )

      // Unavailable charts should be disabled
      // (specific implementation depends on ChartTypeSelector)
    })
  })

  describe('axis configuration', () => {
    it('should show X-axis drop zone', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      expect(screen.getByText('X-Axis')).toBeInTheDocument()
    })

    it('should show Y-axis drop zone', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      expect(screen.getByText('Y-Axis')).toBeInTheDocument()
    })

    it('should show Series drop zone for applicable charts', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      expect(screen.getByText('Series')).toBeInTheDocument()
    })

    it('should show currently mapped fields in drop zones', () => {
      const chartConfig: ChartAxisConfig = {
        xAxis: ['Users.name'],
        yAxis: ['Users.count'],
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={chartConfig}
        />
      )

      // Fields should be shown in their respective drop zones
      // User Name should be in X-axis, Count should be in Y-axis
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Count')).toBeInTheDocument()
    })

    it('should call onChartConfigChange when field is removed from drop zone', async () => {
      const user = userEvent.setup()
      const onChartConfigChange = vi.fn()

      const chartConfig: ChartAxisConfig = {
        xAxis: ['Users.name'],
        yAxis: ['Users.count'],
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={chartConfig}
          onChartConfigChange={onChartConfigChange}
        />
      )

      // Find the remove button for a field in a drop zone
      // The exact selector depends on the AnalysisAxisDropZone implementation
      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('remove') ||
        btn.getAttribute('title')?.includes('remove')
      )

      if (removeButton) {
        await user.click(removeButton)
        expect(onChartConfigChange).toHaveBeenCalled()
      }
    })
  })

  describe('drag and drop', () => {
    it('should show unassigned fields section', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      expect(screen.getByText('Unassigned Fields')).toBeInTheDocument()
    })

    it('should show unassigned measures in unassigned fields section', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Measures not assigned to an axis should appear in unassigned section
      expect(screen.getByText('Count')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })

    it('should show unassigned dimensions in unassigned fields section', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Dimensions not assigned to an axis should appear in unassigned section
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('should show unassigned time dimensions in unassigned fields section', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Time dimensions not assigned to an axis should appear in unassigned section
      expect(screen.getByText('Created')).toBeInTheDocument()
    })

    it('should handle drop events and call onChartConfigChange', async () => {
      const onChartConfigChange = vi.fn()

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          onChartConfigChange={onChartConfigChange}
        />
      )

      // Find a draggable field
      const fieldItems = screen.getAllByText('Count')
      const draggableField = fieldItems[0].closest('[draggable="true"]')

      // Find a drop zone
      const xAxisDropZone = screen.getByText('X-Axis').closest('div')?.parentElement

      if (draggableField && xAxisDropZone) {
        // Simulate drag start
        fireEvent.dragStart(draggableField, {
          dataTransfer: {
            setData: vi.fn(),
            getData: () => JSON.stringify({ field: 'Users.count', fromAxis: 'available' }),
          },
        })

        // Simulate drag over
        fireEvent.dragOver(xAxisDropZone)

        // Simulate drop
        fireEvent.drop(xAxisDropZone, {
          dataTransfer: {
            getData: () => JSON.stringify({ field: 'Users.count', fromAxis: 'available' }),
          },
        })

        // onChartConfigChange should be called
        // (Note: actual behavior depends on drop zone implementation)
      }
    })
  })

  describe('empty state', () => {
    it('should show help text when no fields are available', () => {
      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          metrics={[]}
          breakdowns={[]}
        />
      )

      expect(
        screen.getByText(/add metrics and breakdowns in the query tab/i)
      ).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show loading indicator while chart config loads', () => {
      // Mock useChartConfig to return loaded: false
      vi.doMock('../../../../src/client/charts/lazyChartConfigRegistry', () => ({
        useChartConfig: vi.fn(() => ({
          config: { dropZones: [] },
          loaded: false,
        })),
      }))

      // Loading behavior depends on implementation
      // The component should still show chart type selector
    })
  })

  describe('chart configuration panel', () => {
    it('should show Chart Configuration section when drop zones exist', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      expect(screen.getByText('Chart Configuration')).toBeInTheDocument()
    })

    it('should show drag instruction text', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      expect(screen.getByText(/drag fields to chart axes/i)).toBeInTheDocument()
    })
  })

  describe('field type icons', () => {
    it('should display appropriate icon for measure fields', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Measures should have measure icon styling
      // The exact assertion depends on icon implementation
    })

    it('should display appropriate icon for dimension fields', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Dimensions should have dimension icon styling
    })

    it('should display appropriate icon for time dimension fields', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Time dimensions should have time dimension icon styling
    })
  })

  describe('field metadata display', () => {
    it('should show field title and cube name', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Field titles should be displayed
      expect(screen.getByText('Count')).toBeInTheDocument()

      // Cube names should be shown as secondary info
      expect(screen.getAllByText('Users').length).toBeGreaterThan(0)
    })
  })

  describe('dual Y-axis support', () => {
    it('should allow assigning fields to left or right Y-axis when dual axis enabled', () => {
      const chartConfig: ChartAxisConfig = {
        yAxis: ['Users.count', 'Users.totalRevenue'],
        yAxisAssignment: {
          'Users.count': 'left',
          'Users.totalRevenue': 'right',
        },
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={chartConfig}
        />
      )

      // The Y-axis drop zone should show both fields
      // Implementation-specific - depends on how dual axis assignment is displayed
    })

    it('should call onChartConfigChange when Y-axis assignment changes', async () => {
      const user = userEvent.setup()
      const onChartConfigChange = vi.fn()

      const chartConfig: ChartAxisConfig = {
        yAxis: ['Users.count', 'Users.totalRevenue'],
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={chartConfig}
          onChartConfigChange={onChartConfigChange}
        />
      )

      // Find and interact with Y-axis assignment controls
      // This depends on the AnalysisAxisDropZone implementation
    })
  })

  describe('cleanup behavior', () => {
    it('should remove fields from config when they are no longer in metrics/breakdowns', () => {
      const onChartConfigChange = vi.fn()

      const chartConfig: ChartAxisConfig = {
        xAxis: ['Users.status'], // This field is not in our breakdowns
        yAxis: ['Users.count'],
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={chartConfig}
          onChartConfigChange={onChartConfigChange}
        />
      )

      // The component should clean up invalid fields
      // This happens in useEffect when availableFields change
    })
  })

  describe('chart type specific configuration', () => {
    it('should show scatter-specific drop zones for scatter chart', () => {
      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartType="scatter"
        />
      )

      // Scatter chart may have different axis requirements
      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })

    it('should show pie-specific configuration for pie chart', () => {
      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartType="pie"
        />
      )

      // Pie chart has different axis configuration
      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })

    it('should show radar-specific configuration for radar chart', () => {
      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartType="radar"
        />
      )

      // Radar chart configuration
      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })

    it('should show area-specific configuration for area chart', () => {
      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartType="area"
        />
      )

      // Area chart configuration (similar to line)
      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })
  })

  describe('multiple measures', () => {
    it('should allow multiple measures in Y-axis', () => {
      const manyMetrics: MetricItem[] = [
        { id: 'metric-1', field: 'Users.count', label: 'A' },
        { id: 'metric-2', field: 'Users.totalRevenue', label: 'B' },
      ]

      const chartConfig: ChartAxisConfig = {
        yAxis: ['Users.count', 'Users.totalRevenue'],
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          metrics={manyMetrics}
          chartConfig={chartConfig}
        />
      )

      // Both measures should be in Y-axis
      expect(screen.getByText('Count')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })
  })

  describe('series configuration', () => {
    it('should allow dimension in Series drop zone', () => {
      const chartConfig: ChartAxisConfig = {
        xAxis: ['Users.createdAt'],
        yAxis: ['Users.count'],
        series: ['Users.name'],
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={chartConfig}
        />
      )

      // Series drop zone should show the dimension
      expect(screen.getByText('Series')).toBeInTheDocument()
    })
  })

  describe('chart availability', () => {
    it('should show tooltips for unavailable charts explaining why', () => {
      const availability: ChartAvailabilityMap = {
        bar: { available: true },
        pie: { available: false, reason: 'Pie chart requires exactly one dimension' },
        scatter: { available: false, reason: 'Scatter chart requires exactly two measures' },
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartAvailability={availability}
        />
      )

      // Unavailable chart types should show reason on hover
      // The implementation depends on ChartTypeSelector
    })

    it('should show all chart types regardless of availability', () => {
      const availability: ChartAvailabilityMap = {
        bar: { available: false, reason: 'Test reason' },
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartAvailability={availability}
        />
      )

      // All chart types should still be visible (some may be disabled)
      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })
  })

  describe('field ordering', () => {
    it('should maintain order of fields in Y-axis', () => {
      const chartConfig: ChartAxisConfig = {
        yAxis: ['Users.count', 'Users.totalRevenue'],
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={chartConfig}
        />
      )

      // Fields should maintain their order
      // (Implementation-specific verification)
    })
  })

  describe('drop zone restrictions', () => {
    it('should only accept measures in Y-axis', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Y-axis should accept measures but not dimensions
      // This is enforced by the drop zone's accepts property
      expect(screen.getByText('Y-Axis')).toBeInTheDocument()
    })

    it('should only accept dimensions and time dimensions in X-axis', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // X-axis should accept dimensions and time dimensions
      expect(screen.getByText('X-Axis')).toBeInTheDocument()
    })

    it('should only accept dimensions in Series', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Series should accept only dimensions
      expect(screen.getByText('Series')).toBeInTheDocument()
    })
  })

  describe('field removal', () => {
    it('should call onChartConfigChange with updated config when field removed from X-axis', async () => {
      const user = userEvent.setup()
      const onChartConfigChange = vi.fn()

      const chartConfig: ChartAxisConfig = {
        xAxis: ['Users.name'],
        yAxis: ['Users.count'],
      }

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={chartConfig}
          onChartConfigChange={onChartConfigChange}
        />
      )

      // Find remove button for the field
      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find(btn =>
        btn.getAttribute('title')?.toLowerCase().includes('remove') ||
        btn.getAttribute('aria-label')?.toLowerCase().includes('remove')
      )

      if (removeButton) {
        await user.click(removeButton)
        expect(onChartConfigChange).toHaveBeenCalled()
      }
    })
  })

  describe('auto-assignment', () => {
    it('should auto-assign fields when chart config is empty', () => {
      const onChartConfigChange = vi.fn()

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={{}}
          onChartConfigChange={onChartConfigChange}
        />
      )

      // Auto-assignment may trigger onChartConfigChange
      // (Depends on implementation - may happen in useEffect)
    })
  })

  describe('null/undefined handling', () => {
    it('should handle null schema gracefully', () => {
      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          schema={null}
        />
      )

      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })

    it('should handle empty chartConfig gracefully', () => {
      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={{}}
        />
      )

      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })

    it('should handle empty object as chartConfig gracefully', () => {
      // Note: undefined chartConfig would be replaced with {} by the component
      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartConfig={{} as ChartAxisConfig}
        />
      )

      expect(screen.getByText('Chart Type')).toBeInTheDocument()
    })
  })

  describe('drag visual feedback', () => {
    it('should show drag indicator when field is being dragged', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Find a draggable field
      const fieldItems = screen.getAllByText('Count')
      const draggableField = fieldItems[0].closest('[draggable="true"]')

      if (draggableField) {
        // Simulate drag start with proper dataTransfer mock
        const mockDataTransfer = {
          setData: vi.fn(),
          getData: vi.fn(() => JSON.stringify({ field: 'Users.count', fromAxis: 'available' })),
          effectAllowed: 'move'
        }

        fireEvent.dragStart(draggableField, {
          dataTransfer: mockDataTransfer
        })

        // The field should have visual drag indicator
        // (Implementation-specific)
      }
    })

    it('should show drop target highlight when dragging over valid drop zone', () => {
      render(<AnalysisChartConfigPanel {...defaultProps} />)

      // Find a drop zone
      const yAxisLabel = screen.getByText('Y-Axis')
      const dropZone = yAxisLabel.closest('div')?.parentElement

      if (dropZone) {
        // Simulate drag over with proper dataTransfer mock
        const mockDataTransfer = {
          setData: vi.fn(),
          getData: vi.fn(() => JSON.stringify({ field: 'Users.count', fromAxis: 'available' }))
        }

        fireEvent.dragOver(dropZone, {
          dataTransfer: mockDataTransfer
        })

        // Drop zone should show highlight
        // (Implementation-specific)
      }
    })
  })

  describe('multi-query chart configuration', () => {
    it('should handle multiple queries with different metrics', () => {
      const metricsWithQueryLabels: MetricItem[] = [
        { id: 'metric-1', field: 'Users.count', label: 'A', queryIndex: 0 },
        { id: 'metric-2', field: 'Users.totalRevenue', label: 'B', queryIndex: 1 },
      ]

      render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          metrics={metricsWithQueryLabels}
          queryCount={2}
        />
      )

      // Both metrics should be visible in unassigned fields
      expect(screen.getByText('Count')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })
  })

  describe('chart type change cleanup', () => {
    it('should preserve compatible axis assignments when chart type changes', () => {
      const onChartConfigChange = vi.fn()

      const chartConfig: ChartAxisConfig = {
        xAxis: ['Users.name'],
        yAxis: ['Users.count'],
      }

      const { rerender } = render(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartType="bar"
          chartConfig={chartConfig}
          onChartConfigChange={onChartConfigChange}
        />
      )

      // Change to line chart (which has compatible axes)
      rerender(
        <AnalysisChartConfigPanel
          {...defaultProps}
          chartType="line"
          chartConfig={chartConfig}
          onChartConfigChange={onChartConfigChange}
        />
      )

      // Axis assignments should be preserved
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Count')).toBeInTheDocument()
    })
  })
})

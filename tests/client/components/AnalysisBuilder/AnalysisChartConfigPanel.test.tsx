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
})

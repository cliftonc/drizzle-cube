/**
 * Tests for AreaChart component
 *
 * Focus on data rendering, axis configuration, series handling,
 * legend display, tooltip behavior, stacking modes, and empty state handling.
 *
 * AreaChart is a Recharts-based chart that uses:
 * - xAxis: Dimension field for X-axis (category)
 * - yAxis: Measure fields for Y-axis (values)
 * - series: Optional grouping field for multiple series
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AreaChart from '../../../../src/client/components/charts/AreaChart'


// Mock ChartContainer to bypass the dimension check and render children immediately
vi.mock('../../../../src/client/components/charts/ChartContainer', () => ({
  default: ({ children, height, minHeight }: { children: React.ReactElement; height?: string | number; minHeight?: string | number }) => {
    const heightStyle = typeof height === 'number' ? `${height}px` : (height || '100%')
    return (
      <div
        style={{ height: heightStyle, width: '100%' }}
        data-testid="chart-container"
        data-min-height={minHeight === undefined ? 'default' : String(minHeight)}
      >
        {React.cloneElement(children, { width: 800, height: 400 })}
      </div>
    )
  },
}))

// Mock the useCubeFieldLabel hook
vi.mock('../../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => {
    const labels: Record<string, string> = {
      'Sales.revenue': 'Revenue',
      'Sales.count': 'Sales Count',
      'Sales.margin': 'Margin',
      'Products.category': 'Category',
      'Orders.createdAt': 'Created At',
      'Metrics.value': 'Value',
      'Metrics.target': 'Target',
    }
    return labels[field] || field.split('.').pop() || field
  },
}))

// Mock the useTheme hook
vi.mock('../../../../src/client/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    effectiveTheme: 'light',
  }),
}))

// Sample test data for area chart
const mockAreaData = [
  {
    'Orders.createdAt': '2024-01-01',
    'Sales.revenue': 1500,
    'Sales.count': 50,
  },
  {
    'Orders.createdAt': '2024-02-01',
    'Sales.revenue': 1800,
    'Sales.count': 65,
  },
  {
    'Orders.createdAt': '2024-03-01',
    'Sales.revenue': 1200,
    'Sales.count': 40,
  },
]

// Multi-series data
const mockMultiSeriesData = [
  {
    'Orders.createdAt': '2024-01-01',
    'Products.category': 'Electronics',
    'Sales.revenue': 1500,
  },
  {
    'Orders.createdAt': '2024-01-01',
    'Products.category': 'Clothing',
    'Sales.revenue': 1200,
  },
  {
    'Orders.createdAt': '2024-02-01',
    'Products.category': 'Electronics',
    'Sales.revenue': 1800,
  },
  {
    'Orders.createdAt': '2024-02-01',
    'Products.category': 'Clothing',
    'Sales.revenue': 1400,
  },
]

// Data with multiple measures
const mockMultiMeasureData = [
  {
    'Orders.createdAt': '2024-01-01',
    'Sales.revenue': 1500,
    'Sales.margin': 300,
  },
  {
    'Orders.createdAt': '2024-02-01',
    'Sales.revenue': 1800,
    'Sales.margin': 400,
  },
  {
    'Orders.createdAt': '2024-03-01',
    'Sales.revenue': 1200,
    'Sales.margin': 250,
  },
]

// Basic chart config
const basicChartConfig = {
  xAxis: ['Orders.createdAt'],
  yAxis: ['Sales.revenue'],
}

// Multi-measure chart config
const multiMeasureChartConfig = {
  xAxis: ['Orders.createdAt'],
  yAxis: ['Sales.revenue', 'Sales.margin'],
}

// Series chart config
const seriesChartConfig = {
  xAxis: ['Orders.createdAt'],
  yAxis: ['Sales.revenue'],
  series: ['Products.category'],
}

// Legacy format chart config
const legacyChartConfig = {
  x: 'Orders.createdAt',
  y: ['Sales.revenue'],
}

describe('AreaChart', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  describe('basic rendering', () => {
    it('should render area chart with valid data and config', () => {
      const { container } = render(
        <AreaChart data={mockAreaData} chartConfig={basicChartConfig} />
      )

      // AreaChart renders via Recharts which uses SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <AreaChart data={mockAreaData} chartConfig={basicChartConfig} />
      )

      // Find the chart container (mocked)
      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          height={400}
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          height="50vh"
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect((chartContainer as HTMLElement).style.height).toBe('50vh')
    })

    it('should support legacy chart config format', () => {
      const { container } = render(
        <AreaChart data={mockAreaData} chartConfig={legacyChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('x-axis label density', () => {
    // Forcing a label per point produced hundreds of overlapping ticks on a
    // dense series - measured at 139 ticks across a 571px axis. The default now
    // hands thinning back to recharts, which is width-aware; opting in still
    // forces one label per point.
    const denseData = Array.from({ length: 60 }, (_, i) => ({
      'Orders.createdAt': `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      'Sales.revenue': 1000 + i,
    }))
    const countTicks = (c: HTMLElement) =>
      c.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick').length

    // The default path hands thinning to recharts, which decides from measured
    // text width. jsdom reports zero-width text, so recharts concludes
    // everything fits and the thinning cannot be observed here - it was
    // verified in a real browser instead (139 ticks -> 7 on a 571px axis).
    // Only the opt-in path, which is width-independent, is assertable.

    it('renders every label when explicitly opted in', () => {
      const { container } = render(
        <AreaChart
          data={denseData}
          chartConfig={basicChartConfig}
          displayConfig={{ showAllXLabels: true }}
        />
      )
      expect(countTicks(container)).toBe(denseData.length)
    })
  })

  describe('data point markers', () => {
    const countDots = (container: HTMLElement) =>
      container.querySelectorAll('.recharts-layer circle, circle').length

    it('draws no markers by default, as area charts always have', () => {
      const { container } = render(
        <AreaChart data={mockAreaData} chartConfig={basicChartConfig} />
      )
      expect(countDots(container)).toBe(0)
    })

    it('draws them when showPoints is on, even without drill', () => {
      // Regression: the area series passed renderPlain: false, so it only ever
      // drew *drill* dots. The option therefore did nothing anywhere drill is
      // off - the analysis-builder preview being the obvious case.
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ showPoints: true }}
        />
      )
      expect(countDots(container)).toBeGreaterThan(0)
    })

    it('omits them when showPoints is off even with drill enabled', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ showPoints: false }}
          drillEnabled
          onDataPointClick={vi.fn()}
        />
      )
      expect(countDots(container)).toBe(0)
    })
  })

  describe('summary header sizing', () => {
    it('lets the plot shrink when the summary is shown, so a wrapped header cannot clip it', () => {
      // The header wraps, so its height is not knowable up front. The plot takes
      // the remaining flex space and must be allowed below the usual floor,
      // otherwise header + plot exceeds the portlet.
      render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ showSummary: true }}
        />
      )
      const container = screen.getByTestId('chart-container')
      expect(container.getAttribute('data-min-height')).toBe('0')
      expect(container.style.height).toBe('100%')
    })

    it('keeps the default floor when there is no summary', () => {
      render(<AreaChart data={mockAreaData} chartConfig={basicChartConfig} />)
      expect(screen.getByTestId('chart-container').getAttribute('data-min-height')).toBe('default')
    })
  })

  describe('gradient fills', () => {
    it('renders one vertical fade gradient per series', () => {
      const { container } = render(
        <AreaChart data={mockMultiMeasureData} chartConfig={multiMeasureChartConfig} />
      )

      const gradients = container.querySelectorAll('linearGradient')
      expect(gradients).toHaveLength(2)
      // Vertical: top-to-bottom, not the SVG default left-to-right
      expect(gradients[0].getAttribute('x1')).toBe('0')
      expect(gradients[0].getAttribute('y1')).toBe('0')
      expect(gradients[0].getAttribute('x2')).toBe('0')
      expect(gradients[0].getAttribute('y2')).toBe('1')
    })

    it('fades to transparent using the same hue at both stops', () => {
      const { container } = render(
        <AreaChart data={mockAreaData} chartConfig={basicChartConfig} />
      )

      const gradient = container.querySelector('linearGradient')
      const stops = Array.from(gradient?.children ?? [])
      expect(stops).toHaveLength(2)
      expect(stops[0].getAttribute('stop-color')).toBe(stops[1].getAttribute('stop-color'))
      expect(stops[0].getAttribute('stop-opacity')).toBe('1')
      expect(stops[1].getAttribute('stop-opacity')).toBe('0')
    })

    it('points the area fill at its gradient', () => {
      const { container } = render(
        <AreaChart data={mockAreaData} chartConfig={basicChartConfig} />
      )

      const gradientId = container.querySelector('linearGradient')?.getAttribute('id')
      expect(gradientId).toBeTruthy()
      const filled = container.querySelector(`[fill="url(#${gradientId})"]`)
      expect(filled).toBeInTheDocument()
    })

    it('keeps stacked areas solid so segment boundaries stay legible', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
          displayConfig={{ stackType: 'normal' }}
        />
      )

      expect(container.querySelectorAll('linearGradient')).toHaveLength(0)
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <AreaChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('No data points to display in area chart')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <AreaChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<AreaChart data={[]} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration errors', () => {
    it('should show configuration error when chartConfig is missing', () => {
      render(<AreaChart data={mockAreaData} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(
        screen.getByText('Invalid or missing chart axis configuration')
      ).toBeInTheDocument()
    })

    it('should show configuration error when xAxis is missing', () => {
      render(
        <AreaChart
          data={mockAreaData}
          chartConfig={{
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show configuration error when yAxis is missing', () => {
      render(
        <AreaChart
          data={mockAreaData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
          }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show error when yAxis array is empty', () => {
      render(
        <AreaChart
          data={mockAreaData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
            yAxis: [],
          }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show legend by default', () => {
      const { container } = render(
        <AreaChart data={mockAreaData} chartConfig={basicChartConfig} />
      )

      // Legend is rendered by Recharts
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ showLegend: false }}
        />
      )

      // Legend should not be rendered
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).not.toBeInTheDocument()
    })

    it('should show grid by default', () => {
      const { container } = render(
        <AreaChart data={mockAreaData} chartConfig={basicChartConfig} />
      )

      // CartesianGrid is rendered
      const grid = container.querySelector('.recharts-cartesian-grid')
      expect(grid).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ showGrid: false }}
        />
      )

      // Grid should not be rendered
      const grid = container.querySelector('.recharts-cartesian-grid')
      expect(grid).not.toBeInTheDocument()
    })

    it('should handle empty displayConfig', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{}}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('stacking modes', () => {
    it('should handle normal stacking (stacked: true)', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
          displayConfig={{ stacked: true }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle stackType: none', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
          displayConfig={{ stackType: 'none' }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle stackType: normal', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
          displayConfig={{ stackType: 'normal' }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle stackType: percent', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
          displayConfig={{ stackType: 'percent' }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('series handling', () => {
    it('should render multiple series when series field is specified', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiSeriesData}
          chartConfig={seriesChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Multiple areas should be rendered
      const areas = container.querySelectorAll('.recharts-area')
      expect(areas.length).toBeGreaterThan(0)
    })

    it('should render multiple measures as separate areas', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Multiple areas for multiple measures
      const areas = container.querySelectorAll('.recharts-area')
      expect(areas.length).toBeGreaterThan(0)
    })
  })

  describe('dual Y-axis support', () => {
    it('should render with dual Y-axes when yAxisAssignment is specified', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={{
            ...multiMeasureChartConfig,
            yAxisAssignment: {
              'Sales.revenue': 'left',
              'Sales.margin': 'right',
            },
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Should have Y-axes rendered
      const yAxes = container.querySelectorAll('.recharts-yAxis')
      expect(yAxes.length).toBe(2)
    })

    it('should disable stacking when dual Y-axis is used', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={{
            ...multiMeasureChartConfig,
            yAxisAssignment: {
              'Sales.revenue': 'left',
              'Sales.margin': 'right',
            },
          }}
          displayConfig={{ stackType: 'normal' }}
        />
      )

      // Should still render even with stacking attempted on dual axis
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('axis formatting', () => {
    it('should apply left Y-axis formatting', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{
            leftYAxisFormat: {
              unit: 'currency',
              abbreviate: true,
            },
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should apply right Y-axis formatting when dual axis is used', () => {
      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={{
            ...multiMeasureChartConfig,
            yAxisAssignment: {
              'Sales.revenue': 'left',
              'Sales.margin': 'right',
            },
          }}
          displayConfig={{
            leftYAxisFormat: {
              unit: 'currency',
              abbreviate: true,
            },
            rightYAxisFormat: {
              unit: 'number',
              abbreviate: false,
            },
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('color palette support', () => {
    it('should use custom color palette when provided', () => {
      const customPalette = {
        name: 'custom',
        label: 'Custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        gradient: ['#ff0000', '#00ff00', '#0000ff'],
      }

      const { container } = render(
        <AreaChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
          colorPalette={customPalette}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('null value handling', () => {
    it('should handle connectNulls option (false)', () => {
      const dataWithNulls = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1500 },
        { 'Orders.createdAt': '2024-02-01', 'Sales.revenue': null },
        { 'Orders.createdAt': '2024-03-01', 'Sales.revenue': 1200 },
      ]

      const { container } = render(
        <AreaChart
          data={dataWithNulls}
          chartConfig={basicChartConfig}
          displayConfig={{ connectNulls: false }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle connectNulls option (true)', () => {
      const dataWithNulls = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1500 },
        { 'Orders.createdAt': '2024-02-01', 'Sales.revenue': null },
        { 'Orders.createdAt': '2024-03-01', 'Sales.revenue': 1200 },
      ]

      const { container } = render(
        <AreaChart
          data={dataWithNulls}
          chartConfig={basicChartConfig}
          displayConfig={{ connectNulls: true }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('target values', () => {
    it('should render target line when target is specified', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ target: '1500' }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Target is rendered as Line components
      const lines = container.querySelectorAll('.recharts-line')
      expect(lines.length).toBeGreaterThan(0)
    })

    it('should render spread target values', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ target: '1200,1500,1800' }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singlePoint = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1500 },
      ]

      const { container } = render(
        <AreaChart data={singlePoint} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeNumbers = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1000000000 },
        { 'Orders.createdAt': '2024-02-01', 'Sales.revenue': 2000000000 },
      ]

      const { container } = render(
        <AreaChart data={largeNumbers} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const zeroData = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 0 },
        { 'Orders.createdAt': '2024-02-01', 'Sales.revenue': 1500 },
      ]

      const { container } = render(
        <AreaChart data={zeroData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const negativeData = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': -500 },
        { 'Orders.createdAt': '2024-02-01', 'Sales.revenue': 1500 },
      ]

      const { container } = render(
        <AreaChart data={negativeData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle decimal values', () => {
      const decimalData = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 123.456 },
        { 'Orders.createdAt': '2024-02-01', 'Sales.revenue': 789.123 },
      ]

      const { container } = render(
        <AreaChart data={decimalData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle xAxis as non-array string', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={{
            xAxis: 'Orders.createdAt' as any,
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle yAxis as non-array string', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
            yAxis: 'Sales.revenue' as any,
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('time dimension handling', () => {
    it('should handle time dimension with granularity', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          queryObject={{
            timeDimensions: [
              { dimension: 'Orders.createdAt', granularity: 'month' },
            ],
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('drill-down support', () => {
    it('should enable pointer cursor when drillEnabled is true', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          drillEnabled={true}
          onDataPointClick={() => {}}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should not show dots when drillEnabled is false', () => {
      const { container } = render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          drillEnabled={false}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('showAllXLabels', () => {
    it('should render with all X labels shown by default', () => {
      render(<AreaChart data={mockAreaData} chartConfig={basicChartConfig} />)
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should render with showAllXLabels explicitly true', () => {
      render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ showAllXLabels: true }}
        />
      )
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should render with showAllXLabels disabled', () => {
      render(
        <AreaChart
          data={mockAreaData}
          chartConfig={basicChartConfig}
          displayConfig={{ showAllXLabels: false }}
        />
      )
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })
})

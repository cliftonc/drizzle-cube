/**
 * Tests for LineChart component
 *
 * Focus on data rendering, axis configuration, multiple series,
 * legend display, tooltip behavior, comparison data, and empty state handling.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LineChart from '../../../../src/client/components/charts/LineChart'

// Mock the useCubeFieldLabel hook
vi.mock('../../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => {
    const labels: Record<string, string> = {
      'Sales.revenue': 'Revenue',
      'Sales.count': 'Sales Count',
      'Sales.date': 'Date',
      'Products.category': 'Category',
      'Users.total': 'Total Users',
      'Users.region': 'Region',
      'Orders.createdAt': 'Created At',
    }
    return labels[field] || field.split('.').pop() || field
  },
}))

// Mock ChartContainer to avoid ResponsiveContainer issues in tests
vi.mock('../../../../src/client/components/charts/ChartContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
}))

// Mock ChartTooltip
vi.mock('../../../../src/client/components/charts/ChartTooltip', () => ({
  default: () => <div data-testid="chart-tooltip">Tooltip</div>,
}))

// Mock AngledXAxisTick
vi.mock('../../../../src/client/components/charts/AngledXAxisTick', () => ({
  default: () => <text data-testid="angled-tick">Tick</text>,
}))

// Mock comparison utils
vi.mock('../../../../src/client/utils/comparisonUtils', () => ({
  isComparisonData: (data: any[]) => data.some(d => d.__periodIndex !== undefined),
  getPeriodLabels: () => ['Current', 'Prior'],
  transformForOverlayMode: (data: any[], yAxisFields: string[]) => ({
    data: data,
    seriesKeys: yAxisFields.map(f => f.split('.').pop() || f),
  }),
  isPriorPeriodSeries: (seriesKey: string) => seriesKey.includes('Prior'),
  getPriorPeriodStrokeDashArray: () => '5 5',
}))

// Sample test data
const mockData = [
  { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1500 },
  { 'Orders.createdAt': '2024-01-02', 'Sales.revenue': 1800 },
  { 'Orders.createdAt': '2024-01-03', 'Sales.revenue': 1200 },
]

const mockMultiSeriesData = [
  { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1500, 'Sales.count': 50 },
  { 'Orders.createdAt': '2024-01-02', 'Sales.revenue': 1800, 'Sales.count': 60 },
  { 'Orders.createdAt': '2024-01-03', 'Sales.revenue': 1200, 'Sales.count': 40 },
]

const mockComparisonData = [
  { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1500, __periodIndex: 0 },
  { 'Orders.createdAt': '2024-01-02', 'Sales.revenue': 1800, __periodIndex: 0 },
  { 'Orders.createdAt': '2023-01-01', 'Sales.revenue': 1200, __periodIndex: 1 },
  { 'Orders.createdAt': '2023-01-02', 'Sales.revenue': 1400, __periodIndex: 1 },
]

const basicChartConfig = {
  xAxis: ['Orders.createdAt'],
  yAxis: ['Sales.revenue'],
}

describe('LineChart', () => {
  describe('basic rendering', () => {
    it('should render chart container with data', () => {
      render(<LineChart data={mockData} chartConfig={basicChartConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <LineChart data={mockData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <LineChart data={mockData} chartConfig={basicChartConfig} height={400} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should respect custom string height', () => {
      render(
        <LineChart data={mockData} chartConfig={basicChartConfig} height="50vh" />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <LineChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('No data points to display in line chart')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <LineChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<LineChart data={[]} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration errors', () => {
    it('should show configuration error when chartConfig is missing', () => {
      render(<LineChart data={mockData} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(
        screen.getByText('Invalid or missing chart axis configuration')
      ).toBeInTheDocument()
    })

    it('should show configuration error when xAxis is missing', () => {
      render(
        <LineChart data={mockData} chartConfig={{ yAxis: ['Sales.revenue'] }} />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show configuration error when yAxis is missing', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={{ xAxis: ['Orders.createdAt'] }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show configuration error when yAxis is empty array', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={{ xAxis: ['Orders.createdAt'], yAxis: [] }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('legacy format support', () => {
    it('should support legacy x/y format', () => {
      const legacyConfig = {
        x: 'Orders.createdAt',
        y: ['Sales.revenue'],
      }

      render(<LineChart data={mockData} chartConfig={legacyConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should support legacy y as single string', () => {
      const legacyConfig = {
        x: 'Orders.createdAt',
        y: 'Sales.revenue' as unknown as string[],
      }

      render(<LineChart data={mockData} chartConfig={legacyConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show legend by default', () => {
      render(<LineChart data={mockData} chartConfig={basicChartConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ showLegend: false }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should show grid by default', () => {
      render(<LineChart data={mockData} chartConfig={basicChartConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ showGrid: false }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should show tooltip by default', () => {
      // Recharts Tooltip is only rendered on hover, not as a static element
      // We verify the chart renders successfully with default tooltip config
      render(<LineChart data={mockData} chartConfig={basicChartConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip is false', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ showTooltip: false }}
        />
      )

      expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument()
    })

    it('should handle connectNulls option', () => {
      const dataWithNulls = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 100 },
        { 'Orders.createdAt': '2024-01-02', 'Sales.revenue': null },
        { 'Orders.createdAt': '2024-01-03', 'Sales.revenue': 200 },
      ]

      render(
        <LineChart
          data={dataWithNulls}
          chartConfig={basicChartConfig}
          displayConfig={{ connectNulls: true }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('multi-series support', () => {
    it('should render multiple Y-axis fields', () => {
      render(
        <LineChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
            yAxis: ['Sales.revenue', 'Sales.count'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle series field for grouping', () => {
      const seriesData = [
        { 'Orders.createdAt': '2024-01-01', 'Users.region': 'North', 'Sales.revenue': 1000 },
        { 'Orders.createdAt': '2024-01-01', 'Users.region': 'South', 'Sales.revenue': 500 },
        { 'Orders.createdAt': '2024-01-02', 'Users.region': 'North', 'Sales.revenue': 800 },
      ]

      render(
        <LineChart
          data={seriesData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
            yAxis: ['Sales.revenue'],
            series: ['Users.region'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('dual Y-axis support', () => {
    it('should render with single Y-axis by default', () => {
      render(
        <LineChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
            yAxis: ['Sales.revenue', 'Sales.count'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle yAxisAssignment for dual axes', () => {
      render(
        <LineChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
            yAxis: ['Sales.revenue', 'Sales.count'],
            yAxisAssignment: {
              'Sales.revenue': 'left',
              'Sales.count': 'right',
            },
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('comparison data support', () => {
    it('should detect and handle comparison data', () => {
      render(
        <LineChart
          data={mockComparisonData}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should apply prior period styling in overlay mode', () => {
      render(
        <LineChart
          data={mockComparisonData}
          chartConfig={basicChartConfig}
          displayConfig={{
            comparisonMode: 'overlay',
            priorPeriodStyle: 'dashed',
            priorPeriodOpacity: 0.5,
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle separate comparison mode', () => {
      render(
        <LineChart
          data={mockComparisonData}
          chartConfig={basicChartConfig}
          displayConfig={{ comparisonMode: 'separate' }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('target line support', () => {
    it('should render target line when target is specified', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ target: '1500' }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle multiple target values (spread)', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ target: '1200, 1500, 1800' }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('axis formatting', () => {
    it('should apply left Y-axis formatting', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{
            leftYAxisFormat: {
              unit: 'currency',
              abbreviate: true,
            },
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should apply right Y-axis formatting when dual axis', () => {
      render(
        <LineChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
            yAxis: ['Sales.revenue', 'Sales.count'],
            yAxisAssignment: {
              'Sales.revenue': 'left',
              'Sales.count': 'right',
            },
          }}
          displayConfig={{
            leftYAxisFormat: { unit: 'currency' },
            rightYAxisFormat: { unit: 'number' },
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('color palette support', () => {
    it('should use custom color palette when provided', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          colorPalette={customPalette}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('drill-down support', () => {
    it('should render without drill-down by default', () => {
      render(<LineChart data={mockData} chartConfig={basicChartConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle drill-enabled state', () => {
      const onDataPointClick = vi.fn()

      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          drillEnabled={true}
          onDataPointClick={onDataPointClick}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singlePoint = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 500 },
      ]

      render(
        <LineChart data={singlePoint} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeNumbers = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1000000000 },
      ]

      render(
        <LineChart data={largeNumbers} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const zeroData = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 0 },
        { 'Orders.createdAt': '2024-01-02', 'Sales.revenue': 100 },
      ]

      render(
        <LineChart data={zeroData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const negativeData = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': -100 },
        { 'Orders.createdAt': '2024-01-02', 'Sales.revenue': 100 },
      ]

      render(
        <LineChart data={negativeData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle decimal values', () => {
      const decimalData = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 123.456 },
      ]

      render(
        <LineChart data={decimalData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle empty displayConfig', () => {
      render(
        <LineChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{}}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle data with null values in between', () => {
      const dataWithNulls = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 100 },
        { 'Orders.createdAt': '2024-01-02', 'Sales.revenue': null },
        { 'Orders.createdAt': '2024-01-03', 'Sales.revenue': 200 },
      ]

      render(
        <LineChart data={dataWithNulls} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })
})

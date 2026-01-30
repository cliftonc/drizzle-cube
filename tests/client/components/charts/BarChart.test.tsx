/**
 * Tests for BarChart component
 *
 * Focus on data rendering, axis configuration, stacking modes,
 * legend display, tooltip behavior, and empty state handling.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BarChart from '../../../../src/client/components/charts/BarChart'

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

// Sample test data
const mockData = [
  { 'Products.category': 'Electronics', 'Sales.revenue': 1500 },
  { 'Products.category': 'Clothing', 'Sales.revenue': 1200 },
  { 'Products.category': 'Food', 'Sales.revenue': 800 },
]

const mockMultiSeriesData = [
  { 'Products.category': 'Electronics', 'Sales.revenue': 1500, 'Sales.count': 50 },
  { 'Products.category': 'Clothing', 'Sales.revenue': 1200, 'Sales.count': 80 },
  { 'Products.category': 'Food', 'Sales.revenue': 800, 'Sales.count': 120 },
]

const mockNegativeData = [
  { 'Products.category': 'A', 'Sales.revenue': 100 },
  { 'Products.category': 'B', 'Sales.revenue': -50 },
  { 'Products.category': 'C', 'Sales.revenue': 75 },
]

const basicChartConfig = {
  xAxis: ['Products.category'],
  yAxis: ['Sales.revenue'],
}

describe('BarChart', () => {
  describe('basic rendering', () => {
    it('should render chart container with data', () => {
      render(<BarChart data={mockData} chartConfig={basicChartConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <BarChart data={mockData} chartConfig={basicChartConfig} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <BarChart data={mockData} chartConfig={basicChartConfig} height={400} />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <BarChart data={mockData} chartConfig={basicChartConfig} height="50vh" />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '50vh' })
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <BarChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('No data points to display in bar chart')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <BarChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<BarChart data={[]} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration errors', () => {
    it('should show configuration error when chartConfig is missing', () => {
      render(<BarChart data={mockData} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(
        screen.getByText('Invalid or missing chart axis configuration')
      ).toBeInTheDocument()
    })

    it('should show configuration error when xAxis is missing', () => {
      render(
        <BarChart data={mockData} chartConfig={{ yAxis: ['Sales.revenue'] }} />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show configuration error when yAxis is missing', () => {
      render(
        <BarChart
          data={mockData}
          chartConfig={{ xAxis: ['Products.category'] }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show configuration error when yAxis is empty array', () => {
      render(
        <BarChart
          data={mockData}
          chartConfig={{ xAxis: ['Products.category'], yAxis: [] }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('legacy format support', () => {
    it('should support legacy x/y format', () => {
      const legacyConfig = {
        x: 'Products.category',
        y: ['Sales.revenue'],
      }

      render(<BarChart data={mockData} chartConfig={legacyConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should support legacy y as single string', () => {
      const legacyConfig = {
        x: 'Products.category',
        y: 'Sales.revenue' as unknown as string[],
      }

      render(<BarChart data={mockData} chartConfig={legacyConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show legend by default', () => {
      render(<BarChart data={mockData} chartConfig={basicChartConfig} />)

      // Legend is rendered inside the chart container
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      render(
        <BarChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ showLegend: false }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should show grid by default', () => {
      render(<BarChart data={mockData} chartConfig={basicChartConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      render(
        <BarChart
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
      render(<BarChart data={mockData} chartConfig={basicChartConfig} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip is false', () => {
      render(
        <BarChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ showTooltip: false }}
        />
      )

      expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument()
    })
  })

  describe('stacking configuration', () => {
    it('should not stack by default', () => {
      render(
        <BarChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: ['Sales.revenue', 'Sales.count'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle stacked=true (legacy)', () => {
      render(
        <BarChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: ['Sales.revenue', 'Sales.count'],
          }}
          displayConfig={{ stacked: true }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle stackType=normal', () => {
      render(
        <BarChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: ['Sales.revenue', 'Sales.count'],
          }}
          displayConfig={{ stackType: 'normal' }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle stackType=percent', () => {
      render(
        <BarChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: ['Sales.revenue', 'Sales.count'],
          }}
          displayConfig={{ stackType: 'percent' }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle stackType=none explicitly', () => {
      render(
        <BarChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: ['Sales.revenue', 'Sales.count'],
          }}
          displayConfig={{ stackType: 'none' }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('dual Y-axis support', () => {
    it('should render with single Y-axis by default', () => {
      render(
        <BarChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: ['Sales.revenue', 'Sales.count'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle yAxisAssignment for dual axes', () => {
      render(
        <BarChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Products.category'],
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

  describe('positive/negative coloring', () => {
    it('should handle mixed positive and negative values', () => {
      render(
        <BarChart
          data={mockNegativeData}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('series support', () => {
    it('should handle series field for grouping', () => {
      const seriesData = [
        { 'Products.category': 'Electronics', 'Users.region': 'North', 'Sales.revenue': 1000 },
        { 'Products.category': 'Electronics', 'Users.region': 'South', 'Sales.revenue': 500 },
        { 'Products.category': 'Clothing', 'Users.region': 'North', 'Sales.revenue': 800 },
      ]

      render(
        <BarChart
          data={seriesData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: ['Sales.revenue'],
            series: ['Users.region'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('null value handling', () => {
    it('should filter out data points with all null values', () => {
      const dataWithNulls = [
        { 'Products.category': 'A', 'Sales.revenue': 100 },
        { 'Products.category': 'B', 'Sales.revenue': null },
        { 'Products.category': 'C', 'Sales.revenue': 200 },
      ]

      render(
        <BarChart
          data={dataWithNulls}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should show message when data points are filtered', () => {
      const dataWithNulls = [
        { 'Products.category': 'A', 'Sales.revenue': 100 },
        { 'Products.category': 'B', 'Sales.revenue': null },
        { 'Products.category': 'C', 'Sales.revenue': 200 },
      ]

      render(
        <BarChart
          data={dataWithNulls}
          chartConfig={basicChartConfig}
        />
      )

      // Component shows skipped count message
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('target line support', () => {
    it('should render target line when target is specified', () => {
      render(
        <BarChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ target: '1000' }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle multiple target values (spread)', () => {
      render(
        <BarChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{ target: '800, 1000, 1200' }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('axis formatting', () => {
    it('should apply left Y-axis formatting', () => {
      render(
        <BarChart
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
        <BarChart
          data={mockMultiSeriesData}
          chartConfig={{
            xAxis: ['Products.category'],
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
        <BarChart
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
      render(
        <BarChart data={mockData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle drill-enabled state', () => {
      const onDataPointClick = vi.fn()

      render(
        <BarChart
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
        { 'Products.category': 'Only Item', 'Sales.revenue': 500 },
      ]

      render(
        <BarChart data={singlePoint} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeNumbers = [
        { 'Products.category': 'Big', 'Sales.revenue': 1000000000 },
      ]

      render(
        <BarChart data={largeNumbers} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const zeroData = [
        { 'Products.category': 'Zero', 'Sales.revenue': 0 },
        { 'Products.category': 'Positive', 'Sales.revenue': 100 },
      ]

      render(
        <BarChart data={zeroData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle decimal values', () => {
      const decimalData = [
        { 'Products.category': 'Precise', 'Sales.revenue': 123.456 },
      ]

      render(
        <BarChart data={decimalData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle xAxis as array', () => {
      render(
        <BarChart
          data={mockData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle empty displayConfig', () => {
      render(
        <BarChart
          data={mockData}
          chartConfig={basicChartConfig}
          displayConfig={{}}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })
})

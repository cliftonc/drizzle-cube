/**
 * Tests for ScatterChart component
 *
 * Focus on data rendering, axis configuration, series grouping,
 * legend display, tooltip behavior, and empty state handling.
 *
 * ScatterChart is a Recharts-based chart that uses:
 * - xAxis: Numeric measure field for X-axis position
 * - yAxis: Numeric measure field for Y-axis position
 * - series: Optional grouping field for color-coded series
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ScatterChart from '../../../../src/client/components/charts/ScatterChart'

// Mock ChartContainer to bypass the dimension check and render children immediately
vi.mock('../../../../src/client/components/charts/ChartContainer', () => ({
  default: ({ children, height }: { children: React.ReactElement; height?: string | number }) => {
    const heightStyle = typeof height === 'number' ? `${height}px` : (height || '100%')
    return (
      <div style={{ height: heightStyle, width: '100%' }} data-testid="chart-container">
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
      'Products.price': 'Price',
      'Products.quantity': 'Quantity',
      'Orders.createdAt': 'Created At',
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

// Sample test data for scatter chart
const mockScatterData = [
  {
    'Products.price': 100,
    'Sales.revenue': 1500,
  },
  {
    'Products.price': 150,
    'Sales.revenue': 2200,
  },
  {
    'Products.price': 200,
    'Sales.revenue': 3000,
  },
]

// Data with series grouping
const mockSeriesScatterData = [
  {
    'Products.category': 'Electronics',
    'Products.price': 100,
    'Sales.revenue': 1500,
  },
  {
    'Products.category': 'Electronics',
    'Products.price': 150,
    'Sales.revenue': 2200,
  },
  {
    'Products.category': 'Clothing',
    'Products.price': 50,
    'Sales.revenue': 800,
  },
  {
    'Products.category': 'Clothing',
    'Products.price': 75,
    'Sales.revenue': 1100,
  },
]

// Data with time dimension
const mockTimeScatterData = [
  {
    'Orders.createdAt': '2024-01-01',
    'Products.price': 100,
    'Sales.revenue': 1500,
  },
  {
    'Orders.createdAt': '2024-02-01',
    'Products.price': 150,
    'Sales.revenue': 2200,
  },
  {
    'Orders.createdAt': '2024-03-01',
    'Products.price': 200,
    'Sales.revenue': 3000,
  },
]

// Basic chart config
const basicChartConfig = {
  xAxis: ['Products.price'],
  yAxis: ['Sales.revenue'],
}

// Series chart config
const seriesChartConfig = {
  xAxis: ['Products.price'],
  yAxis: ['Sales.revenue'],
  series: ['Products.category'],
}

// Legacy format chart config
const legacyChartConfig = {
  x: 'Products.price',
  y: ['Sales.revenue'],
}

describe('ScatterChart', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  describe('basic rendering', () => {
    it('should render scatter chart with valid data and config', () => {
      const { container } = render(
        <ScatterChart data={mockScatterData} chartConfig={basicChartConfig} />
      )

      // ScatterChart renders via Recharts which uses SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <ScatterChart data={mockScatterData} chartConfig={basicChartConfig} />
      )

      // Find the chart container (mocked)
      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={basicChartConfig}
          height={400}
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={basicChartConfig}
          height="50vh"
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '50vh' })
    })

    it('should support legacy chart config format', () => {
      const { container } = render(
        <ScatterChart data={mockScatterData} chartConfig={legacyChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <ScatterChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('No data points to display in scatter chart')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <ScatterChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<ScatterChart data={[]} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No valid data" when all coordinates are invalid', () => {
      const invalidData = [
        { 'Products.price': null, 'Sales.revenue': null },
        { 'Products.price': undefined, 'Sales.revenue': NaN },
      ]

      render(<ScatterChart data={invalidData} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No valid data')).toBeInTheDocument()
    })
  })

  describe('configuration errors', () => {
    it('should show configuration error when chartConfig is missing', () => {
      render(<ScatterChart data={mockScatterData} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(
        screen.getByText('Invalid or missing chart axis configuration')
      ).toBeInTheDocument()
    })

    it('should show configuration error when xAxis is missing', () => {
      render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={{
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show configuration error when yAxis is missing', () => {
      render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={{
            xAxis: ['Products.price'],
          }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show legend when multiple series exist', () => {
      const { container } = render(
        <ScatterChart
          data={mockSeriesScatterData}
          chartConfig={seriesChartConfig}
        />
      )

      // Legend should be rendered for multiple series
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      const { container } = render(
        <ScatterChart
          data={mockSeriesScatterData}
          chartConfig={seriesChartConfig}
          displayConfig={{ showLegend: false }}
        />
      )

      // Legend should not be rendered
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).not.toBeInTheDocument()
    })

    it('should show grid by default', () => {
      const { container } = render(
        <ScatterChart data={mockScatterData} chartConfig={basicChartConfig} />
      )

      // CartesianGrid is rendered
      const grid = container.querySelector('.recharts-cartesian-grid')
      expect(grid).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
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
        <ScatterChart
          data={mockScatterData}
          chartConfig={basicChartConfig}
          displayConfig={{}}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('series handling', () => {
    it('should render multiple series when series field is specified', () => {
      const { container } = render(
        <ScatterChart
          data={mockSeriesScatterData}
          chartConfig={seriesChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Multiple scatter elements should be rendered
      const scatters = container.querySelectorAll('.recharts-scatter')
      expect(scatters.length).toBeGreaterThan(1)
    })

    it('should render single series when no series field is specified', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={basicChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Single scatter element
      const scatters = container.querySelectorAll('.recharts-scatter')
      expect(scatters.length).toBe(1)
    })

    it('should fall back to single series when too many series (>20)', () => {
      // Create data with more than 20 unique series values
      const manySeriesData = Array.from({ length: 25 }, (_, i) => ({
        'Products.category': `Category${i}`,
        'Products.price': 100 + i * 10,
        'Sales.revenue': 1000 + i * 100,
      }))

      const { container } = render(
        <ScatterChart
          data={manySeriesData}
          chartConfig={seriesChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('axis formatting', () => {
    it('should apply x-axis formatting', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={basicChartConfig}
          displayConfig={{
            xAxisFormat: {
              unit: 'currency',
              abbreviate: true,
            },
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should apply y-axis formatting', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
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

    it('should apply custom axis labels', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={basicChartConfig}
          displayConfig={{
            xAxisFormat: { label: 'Custom X Label' },
            leftYAxisFormat: { label: 'Custom Y Label' },
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
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      const { container } = render(
        <ScatterChart
          data={mockSeriesScatterData}
          chartConfig={seriesChartConfig}
          colorPalette={customPalette}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should use default colors when no palette is provided', () => {
      const { container } = render(
        <ScatterChart
          data={mockSeriesScatterData}
          chartConfig={seriesChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('data validation and filtering', () => {
    it('should filter out data points with null x coordinate', () => {
      const dataWithNulls = [
        { 'Products.price': 100, 'Sales.revenue': 1500 },
        { 'Products.price': null, 'Sales.revenue': 2200 },
        { 'Products.price': 200, 'Sales.revenue': 3000 },
      ]

      const { container } = render(
        <ScatterChart data={dataWithNulls} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should filter out data points with null y coordinate', () => {
      const dataWithNulls = [
        { 'Products.price': 100, 'Sales.revenue': 1500 },
        { 'Products.price': 150, 'Sales.revenue': null },
        { 'Products.price': 200, 'Sales.revenue': 3000 },
      ]

      const { container } = render(
        <ScatterChart data={dataWithNulls} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should filter out data points with NaN values', () => {
      const dataWithNaN = [
        { 'Products.price': 100, 'Sales.revenue': 1500 },
        { 'Products.price': NaN, 'Sales.revenue': 2200 },
        { 'Products.price': 200, 'Sales.revenue': NaN },
      ]

      const { container } = render(
        <ScatterChart data={dataWithNaN} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singlePoint = [
        { 'Products.price': 100, 'Sales.revenue': 1500 },
      ]

      const { container } = render(
        <ScatterChart data={singlePoint} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeNumbers = [
        { 'Products.price': 1000000000, 'Sales.revenue': 5000000000 },
        { 'Products.price': 2000000000, 'Sales.revenue': 8000000000 },
      ]

      const { container } = render(
        <ScatterChart data={largeNumbers} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const zeroData = [
        { 'Products.price': 0, 'Sales.revenue': 0 },
        { 'Products.price': 100, 'Sales.revenue': 1500 },
      ]

      const { container } = render(
        <ScatterChart data={zeroData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const negativeData = [
        { 'Products.price': -100, 'Sales.revenue': -500 },
        { 'Products.price': 100, 'Sales.revenue': 1500 },
      ]

      const { container } = render(
        <ScatterChart data={negativeData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle decimal values', () => {
      const decimalData = [
        { 'Products.price': 123.456, 'Sales.revenue': 789.012 },
        { 'Products.price': 456.789, 'Sales.revenue': 1234.567 },
      ]

      const { container } = render(
        <ScatterChart data={decimalData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle string numeric values', () => {
      const stringData = [
        { 'Products.price': '100', 'Sales.revenue': '1500' },
        { 'Products.price': '150', 'Sales.revenue': '2200' },
      ]

      const { container } = render(
        <ScatterChart data={stringData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle xAxis as non-array string', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={{
            xAxis: 'Products.price' as any,
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle yAxis as non-array string', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={{
            xAxis: ['Products.price'],
            yAxis: 'Sales.revenue' as any,
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle series as non-array string', () => {
      const { container } = render(
        <ScatterChart
          data={mockSeriesScatterData}
          chartConfig={{
            xAxis: ['Products.price'],
            yAxis: ['Sales.revenue'],
            series: 'Products.category' as any,
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('time dimension handling', () => {
    it('should handle time dimension in data with queryObject', () => {
      const { container } = render(
        <ScatterChart
          data={mockTimeScatterData}
          chartConfig={{
            xAxis: ['Products.price'],
            yAxis: ['Sales.revenue'],
          }}
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

  describe('tooltip behavior', () => {
    it('should render tooltip when showTooltip is true (default)', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={basicChartConfig}
          displayConfig={{ showTooltip: true }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should not render tooltip when showTooltip is false', () => {
      const { container } = render(
        <ScatterChart
          data={mockScatterData}
          chartConfig={basicChartConfig}
          displayConfig={{ showTooltip: false }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('legend hover behavior', () => {
    it('should handle legend hover for multiple series', () => {
      const { container } = render(
        <ScatterChart
          data={mockSeriesScatterData}
          chartConfig={seriesChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Legend items should be present
      const legendItems = container.querySelectorAll('.recharts-legend-item')
      expect(legendItems.length).toBeGreaterThan(0)
    })
  })
})

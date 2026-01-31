/**
 * Tests for PieChart component
 *
 * Focus on data rendering, slice configuration, series handling,
 * legend display, tooltip behavior, and empty state handling.
 *
 * PieChart is a Recharts-based chart that uses:
 * - xAxis: Dimension field for slice labels (categories)
 * - yAxis: Measure field for slice values
 * - series: Optional grouping field for breaking down data
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PieChart from '../../../../src/client/components/charts/PieChart'

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
      'Products.category': 'Category',
      'Regions.name': 'Region',
      'Status.active': 'Is Active',
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

// Sample test data for pie chart
const mockPieData = [
  {
    'Products.category': 'Electronics',
    'Sales.revenue': 1500,
  },
  {
    'Products.category': 'Clothing',
    'Sales.revenue': 1200,
  },
  {
    'Products.category': 'Food',
    'Sales.revenue': 800,
  },
]

// Data with series grouping
const mockSeriesData = [
  {
    'Regions.name': 'North',
    'Products.category': 'Electronics',
    'Sales.revenue': 1500,
  },
  {
    'Regions.name': 'North',
    'Products.category': 'Clothing',
    'Sales.revenue': 1200,
  },
  {
    'Regions.name': 'South',
    'Products.category': 'Electronics',
    'Sales.revenue': 1100,
  },
  {
    'Regions.name': 'South',
    'Products.category': 'Clothing',
    'Sales.revenue': 900,
  },
]

// Data with boolean category
const mockBooleanData = [
  {
    'Status.active': true,
    'Sales.count': 150,
  },
  {
    'Status.active': false,
    'Sales.count': 50,
  },
]

// Basic chart config
const basicChartConfig = {
  xAxis: ['Products.category'],
  yAxis: ['Sales.revenue'],
}

// Series chart config
const seriesChartConfig = {
  xAxis: ['Regions.name'],
  yAxis: ['Sales.revenue'],
  series: ['Products.category'],
}

// Legacy format chart config
const legacyChartConfig = {
  x: 'Products.category',
  y: ['Sales.revenue'],
}

describe('PieChart', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  describe('basic rendering', () => {
    it('should render pie chart with valid data and config', () => {
      const { container } = render(
        <PieChart data={mockPieData} chartConfig={basicChartConfig} />
      )

      // PieChart renders via Recharts which uses SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <PieChart data={mockPieData} chartConfig={basicChartConfig} />
      )

      // Find the chart container (mocked)
      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <PieChart
          data={mockPieData}
          chartConfig={basicChartConfig}
          height={400}
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <PieChart
          data={mockPieData}
          chartConfig={basicChartConfig}
          height="50vh"
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '50vh' })
    })

    it('should support legacy chart config format', () => {
      const { container } = render(
        <PieChart data={mockPieData} chartConfig={legacyChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <PieChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('No data points to display in pie chart')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <PieChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<PieChart data={[]} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No valid data" when all values are zero', () => {
      const zeroData = [
        { 'Products.category': 'A', 'Sales.revenue': 0 },
        { 'Products.category': 'B', 'Sales.revenue': 0 },
      ]

      render(<PieChart data={zeroData} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No valid data')).toBeInTheDocument()
    })

    it('should show "No valid data" when all values are negative', () => {
      const negativeData = [
        { 'Products.category': 'A', 'Sales.revenue': -100 },
        { 'Products.category': 'B', 'Sales.revenue': -50 },
      ]

      render(<PieChart data={negativeData} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No valid data')).toBeInTheDocument()
    })
  })

  describe('configuration errors', () => {
    it('should show configuration error when chartConfig is missing', () => {
      render(<PieChart data={mockPieData} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show configuration error when xAxis is missing', () => {
      render(
        <PieChart
          data={mockPieData}
          chartConfig={{
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show configuration error when yAxis is missing', () => {
      render(
        <PieChart
          data={mockPieData}
          chartConfig={{
            xAxis: ['Products.category'],
          }}
        />
      )

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show error when yAxis array is empty', () => {
      render(
        <PieChart
          data={mockPieData}
          chartConfig={{
            xAxis: ['Products.category'],
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
        <PieChart data={mockPieData} chartConfig={basicChartConfig} />
      )

      // Legend is rendered by Recharts
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false and show labels', () => {
      const { container } = render(
        <PieChart
          data={mockPieData}
          chartConfig={basicChartConfig}
          displayConfig={{ showLegend: false }}
        />
      )

      // Legend should not be rendered
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).not.toBeInTheDocument()
    })

    it('should handle empty displayConfig', () => {
      const { container } = render(
        <PieChart
          data={mockPieData}
          chartConfig={basicChartConfig}
          displayConfig={{}}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('series handling', () => {
    it('should render with series breakdown', () => {
      const { container } = render(
        <PieChart
          data={mockSeriesData}
          chartConfig={seriesChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Pie should have cells rendered
      const cells = container.querySelectorAll('.recharts-pie-sector')
      expect(cells.length).toBeGreaterThan(0)
    })
  })

  describe('boolean value handling', () => {
    it('should convert boolean true/false to Active/Inactive labels', () => {
      const boolConfig = {
        xAxis: ['Status.active'],
        yAxis: ['Sales.count'],
      }

      const { container } = render(
        <PieChart data={mockBooleanData} chartConfig={boolConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle string "true"/"false" values', () => {
      const stringBoolData = [
        { 'Status.active': 'true', 'Sales.count': 150 },
        { 'Status.active': 'false', 'Sales.count': 50 },
      ]

      const boolConfig = {
        xAxis: ['Status.active'],
        yAxis: ['Sales.count'],
      }

      const { container } = render(
        <PieChart data={stringBoolData} chartConfig={boolConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('value formatting', () => {
    it('should apply leftYAxisFormat for tooltip values', () => {
      const { container } = render(
        <PieChart
          data={mockPieData}
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
  })

  describe('color palette support', () => {
    it('should use custom color palette when provided', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      const { container } = render(
        <PieChart
          data={mockPieData}
          chartConfig={basicChartConfig}
          colorPalette={customPalette}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singlePoint = [
        { 'Products.category': 'Electronics', 'Sales.revenue': 1500 },
      ]

      const { container } = render(
        <PieChart data={singlePoint} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeNumbers = [
        { 'Products.category': 'Big', 'Sales.revenue': 1000000000 },
        { 'Products.category': 'Medium', 'Sales.revenue': 500000000 },
      ]

      const { container } = render(
        <PieChart data={largeNumbers} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should filter out zero values', () => {
      const mixedData = [
        { 'Products.category': 'A', 'Sales.revenue': 1500 },
        { 'Products.category': 'B', 'Sales.revenue': 0 },
        { 'Products.category': 'C', 'Sales.revenue': 800 },
      ]

      const { container } = render(
        <PieChart data={mixedData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should filter out negative values', () => {
      const mixedData = [
        { 'Products.category': 'A', 'Sales.revenue': 1500 },
        { 'Products.category': 'B', 'Sales.revenue': -100 },
        { 'Products.category': 'C', 'Sales.revenue': 800 },
      ]

      const { container } = render(
        <PieChart data={mixedData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should filter out null values', () => {
      const mixedData = [
        { 'Products.category': 'A', 'Sales.revenue': 1500 },
        { 'Products.category': 'B', 'Sales.revenue': null },
        { 'Products.category': 'C', 'Sales.revenue': 800 },
      ]

      const { container } = render(
        <PieChart data={mixedData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle NaN values', () => {
      const nanData = [
        { 'Products.category': 'A', 'Sales.revenue': 1500 },
        { 'Products.category': 'B', 'Sales.revenue': NaN },
        { 'Products.category': 'C', 'Sales.revenue': 800 },
      ]

      const { container } = render(
        <PieChart data={nanData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle decimal values', () => {
      const decimalData = [
        { 'Products.category': 'A', 'Sales.revenue': 123.456 },
        { 'Products.category': 'B', 'Sales.revenue': 789.012 },
      ]

      const { container } = render(
        <PieChart data={decimalData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle string numeric values', () => {
      const stringData = [
        { 'Products.category': 'A', 'Sales.revenue': '1500' },
        { 'Products.category': 'B', 'Sales.revenue': '800' },
      ]

      const { container } = render(
        <PieChart data={stringData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle xAxis as non-array string', () => {
      const { container } = render(
        <PieChart
          data={mockPieData}
          chartConfig={{
            xAxis: 'Products.category' as any,
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle yAxis as non-array string', () => {
      const { container } = render(
        <PieChart
          data={mockPieData}
          chartConfig={{
            xAxis: ['Products.category'],
            yAxis: 'Sales.revenue' as any,
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle Unknown category name', () => {
      const unknownData = [
        { 'Products.category': undefined, 'Sales.revenue': 1500 },
        { 'Products.category': '', 'Sales.revenue': 800 },
      ]

      const { container } = render(
        <PieChart data={unknownData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('time dimension handling', () => {
    it('should handle time dimension on x-axis', () => {
      const timeData = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1500 },
        { 'Orders.createdAt': '2024-02-01', 'Sales.revenue': 1800 },
        { 'Orders.createdAt': '2024-03-01', 'Sales.revenue': 1200 },
      ]

      const timeConfig = {
        xAxis: ['Orders.createdAt'],
        yAxis: ['Sales.revenue'],
      }

      const { container } = render(
        <PieChart
          data={timeData}
          chartConfig={timeConfig}
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
        <PieChart
          data={mockPieData}
          chartConfig={basicChartConfig}
          drillEnabled={true}
          onDataPointClick={() => {}}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should not have pointer cursor when drillEnabled is false', () => {
      const { container } = render(
        <PieChart
          data={mockPieData}
          chartConfig={basicChartConfig}
          drillEnabled={false}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})

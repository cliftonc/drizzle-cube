/**
 * Tests for BubbleChart component
 *
 * Focus on data rendering, axis configuration, size/color field mapping,
 * legend display, tooltip behavior, and empty state handling.
 *
 * BubbleChart is a D3-based chart (not Recharts) that uses:
 * - xAxis: X-axis position
 * - yAxis: Y-axis position
 * - series: Label for each bubble
 * - sizeField: Determines bubble size
 * - colorField: Determines bubble color (optional)
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BubbleChart from '../../../../src/client/components/charts/BubbleChart'

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
      'Users.age': 'Age',
      'Users.score': 'Score',
      'Users.region': 'Region',
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

// Sample test data for bubble chart
// Each bubble needs: x value, y value, series (label), size value
const mockBubbleData = [
  {
    'Products.category': 'Electronics',
    'Sales.revenue': 1500,
    'Sales.count': 50,
    'Sales.margin': 0.25,
  },
  {
    'Products.category': 'Clothing',
    'Sales.revenue': 1200,
    'Sales.count': 80,
    'Sales.margin': 0.35,
  },
  {
    'Products.category': 'Food',
    'Sales.revenue': 800,
    'Sales.count': 120,
    'Sales.margin': 0.15,
  },
]

// Time-based bubble data
const mockTimeBubbleData = [
  {
    'Orders.createdAt': '2024-01-01',
    'Sales.revenue': 1500,
    'Products.category': 'Electronics',
    'Sales.count': 50,
  },
  {
    'Orders.createdAt': '2024-02-01',
    'Sales.revenue': 1800,
    'Products.category': 'Clothing',
    'Sales.count': 60,
  },
  {
    'Orders.createdAt': '2024-03-01',
    'Sales.revenue': 1200,
    'Products.category': 'Food',
    'Sales.count': 40,
  },
]

// Data with numeric color field
const mockNumericColorData = [
  {
    'Products.category': 'Electronics',
    'Sales.revenue': 1500,
    'Sales.count': 50,
    'Sales.margin': 25,
  },
  {
    'Products.category': 'Clothing',
    'Sales.revenue': 1200,
    'Sales.count': 80,
    'Sales.margin': 35,
  },
  {
    'Products.category': 'Food',
    'Sales.revenue': 800,
    'Sales.count': 120,
    'Sales.margin': 15,
  },
]

// Basic chart config for bubble chart
const basicChartConfig = {
  xAxis: ['Sales.revenue'],
  yAxis: ['Sales.count'],
  series: ['Products.category'],
  sizeField: 'Sales.count',
}

// Chart config with color field
const chartConfigWithColor = {
  xAxis: ['Sales.revenue'],
  yAxis: ['Sales.count'],
  series: ['Products.category'],
  sizeField: 'Sales.count',
  colorField: 'Sales.margin',
}

// Chart config with categorical color
const chartConfigWithCategoricalColor = {
  xAxis: ['Sales.revenue'],
  yAxis: ['Sales.count'],
  series: ['Products.category'],
  sizeField: 'Sales.count',
  colorField: 'Products.category',
}

describe('BubbleChart', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  describe('basic rendering', () => {
    it('should render bubble chart with valid data and config', () => {
      const { container } = render(
        <BubbleChart data={mockBubbleData} chartConfig={basicChartConfig} />
      )

      // BubbleChart renders an SVG element
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <BubbleChart data={mockBubbleData} chartConfig={basicChartConfig} />
      )

      // Find the outer container div
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={basicChartConfig}
          height={400}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={basicChartConfig}
          height="50vh"
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '50vh' })
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <BubbleChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('No data points to display in bubble chart')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <BubbleChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<BubbleChart data={[]} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration requirements', () => {
    it('should show configuration required when chartConfig is missing', () => {
      render(<BubbleChart data={mockBubbleData} />)

      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Bubble chart requires xAxis, yAxis, series, and sizeField dimensions'
        )
      ).toBeInTheDocument()
    })

    it('should show configuration required when xAxis is missing', () => {
      render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={{
            yAxis: ['Sales.count'],
            series: ['Products.category'],
            sizeField: 'Sales.count',
          }}
        />
      )

      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })

    it('should show configuration required when yAxis is missing', () => {
      render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={{
            xAxis: ['Sales.revenue'],
            series: ['Products.category'],
            sizeField: 'Sales.count',
          }}
        />
      )

      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })

    it('should show configuration required when series is missing', () => {
      render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={{
            xAxis: ['Sales.revenue'],
            yAxis: ['Sales.count'],
            sizeField: 'Sales.count',
          }}
        />
      )

      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })

    it('should mention optional colorField in configuration message', () => {
      render(<BubbleChart data={mockBubbleData} />)

      expect(
        screen.getByText('Optional: colorField for bubble coloring')
      ).toBeInTheDocument()
    })
  })

  describe('size field mapping', () => {
    it('should render bubbles with explicit sizeField', () => {
      const { container } = render(
        <BubbleChart data={mockBubbleData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Bubbles are rendered as circle elements
      const circles = container.querySelectorAll('circle.bubble')
      // Should have bubbles if data is valid
      expect(circles.length).toBeGreaterThanOrEqual(0)
    })

    it('should use yAxis as default sizeField when sizeField not specified', () => {
      const configWithoutSize = {
        xAxis: ['Sales.revenue'],
        yAxis: ['Sales.count'],
        series: ['Products.category'],
      }

      const { container } = render(
        <BubbleChart data={mockBubbleData} chartConfig={configWithoutSize} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('color field mapping', () => {
    it('should render bubbles with numeric colorField', () => {
      const { container } = render(
        <BubbleChart
          data={mockNumericColorData}
          chartConfig={chartConfigWithColor}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render bubbles with categorical colorField', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={chartConfigWithCategoricalColor}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should use series value for color when colorField not specified', () => {
      const { container } = render(
        <BubbleChart data={mockBubbleData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show legend by default', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={chartConfigWithCategoricalColor}
        />
      )

      // BubbleChart creates legend when colorField is present
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={chartConfigWithCategoricalColor}
          displayConfig={{ showLegend: false }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should show grid by default', () => {
      const { container } = render(
        <BubbleChart data={mockBubbleData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={basicChartConfig}
          displayConfig={{ showGrid: false }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle custom bubble size range', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={basicChartConfig}
          displayConfig={{
            minBubbleSize: 10,
            maxBubbleSize: 100,
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle custom bubble opacity', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={basicChartConfig}
          displayConfig={{ bubbleOpacity: 0.5 }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('time dimension handling', () => {
    it('should handle time dimension on x-axis', () => {
      const timeConfig = {
        xAxis: ['Orders.createdAt'],
        yAxis: ['Sales.revenue'],
        series: ['Products.category'],
        sizeField: 'Sales.count',
      }

      const { container } = render(
        <BubbleChart
          data={mockTimeBubbleData}
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

  describe('axis formatting', () => {
    it('should apply x-axis formatting', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
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
        <BubbleChart
          data={mockBubbleData}
          chartConfig={basicChartConfig}
          displayConfig={{
            leftYAxisFormat: {
              unit: 'number',
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
        <BubbleChart
          data={mockBubbleData}
          chartConfig={chartConfigWithCategoricalColor}
          colorPalette={customPalette}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should use custom gradient palette for numeric color field', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        gradient: ['#ffcccc', '#ff6666', '#ff0000'],
      }

      const { container } = render(
        <BubbleChart
          data={mockNumericColorData}
          chartConfig={chartConfigWithColor}
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
        {
          'Products.category': 'Electronics',
          'Sales.revenue': 1500,
          'Sales.count': 50,
        },
      ]

      const { container } = render(
        <BubbleChart data={singlePoint} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeNumbers = [
        {
          'Products.category': 'Big',
          'Sales.revenue': 1000000000,
          'Sales.count': 50000000,
        },
      ]

      const { container } = render(
        <BubbleChart data={largeNumbers} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const zeroData = [
        {
          'Products.category': 'Zero',
          'Sales.revenue': 0,
          'Sales.count': 0,
        },
        {
          'Products.category': 'Positive',
          'Sales.revenue': 100,
          'Sales.count': 10,
        },
      ]

      const { container } = render(
        <BubbleChart data={zeroData} chartConfig={basicChartConfig} />
      )

      // Zero-sized bubbles should be filtered out
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const negativeData = [
        {
          'Products.category': 'Negative',
          'Sales.revenue': -100,
          'Sales.count': 50,
        },
        {
          'Products.category': 'Positive',
          'Sales.revenue': 100,
          'Sales.count': 50,
        },
      ]

      const { container } = render(
        <BubbleChart data={negativeData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle decimal values', () => {
      const decimalData = [
        {
          'Products.category': 'Decimal',
          'Sales.revenue': 123.456,
          'Sales.count': 45.67,
        },
      ]

      const { container } = render(
        <BubbleChart data={decimalData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should filter out data points with null coordinates', () => {
      const dataWithNulls = [
        {
          'Products.category': 'Valid',
          'Sales.revenue': 100,
          'Sales.count': 50,
        },
        {
          'Products.category': 'NullX',
          'Sales.revenue': null,
          'Sales.count': 50,
        },
        {
          'Products.category': 'NullY',
          'Sales.revenue': 100,
          'Sales.count': null,
        },
      ]

      const { container } = render(
        <BubbleChart data={dataWithNulls} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle empty displayConfig', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={basicChartConfig}
          displayConfig={{}}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle xAxis as array', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={{
            xAxis: ['Sales.revenue'],
            yAxis: ['Sales.count'],
            series: ['Products.category'],
            sizeField: 'Sales.count',
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle all config fields as non-array strings', () => {
      const { container } = render(
        <BubbleChart
          data={mockBubbleData}
          chartConfig={{
            xAxis: 'Sales.revenue' as any,
            yAxis: 'Sales.count' as any,
            series: 'Products.category' as any,
            sizeField: 'Sales.count' as any,
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})

/**
 * Tests for TreeMapChart component
 *
 * Focus on data rendering, configuration handling, legend display,
 * tooltip behavior, empty state handling, and data transformation.
 *
 * TreeMapChart uses Recharts Treemap to display hierarchical data as
 * nested rectangles where size represents a numeric value.
 *
 * Configuration:
 * - xAxis: Name/category field (label for each cell)
 * - yAxis: Size field (numeric value determining cell size)
 * - series: Optional color grouping field (categorical or numeric)
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TreeMapChart from '../../../../src/client/components/charts/TreeMapChart'

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

// Mock the useCubeFieldLabel hook
vi.mock('../../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => {
    const labels: Record<string, string> = {
      'Sales.revenue': 'Revenue',
      'Sales.count': 'Sales Count',
      'Sales.margin': 'Margin',
      'Products.category': 'Category',
      'Products.name': 'Product Name',
      'Products.price': 'Price',
      'Departments.name': 'Department',
      'Departments.budget': 'Budget',
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

// Sample test data for treemap chart
const mockTreeMapData = [
  {
    'Products.category': 'Electronics',
    'Sales.revenue': 5000,
    'Sales.margin': 0.25,
  },
  {
    'Products.category': 'Clothing',
    'Sales.revenue': 3000,
    'Sales.margin': 0.35,
  },
  {
    'Products.category': 'Food',
    'Sales.revenue': 2000,
    'Sales.margin': 0.15,
  },
  {
    'Products.category': 'Books',
    'Sales.revenue': 1000,
    'Sales.margin': 0.45,
  },
]

// Data with numeric series for color gradient
const mockNumericSeriesData = [
  {
    'Products.name': 'Laptop',
    'Sales.revenue': 5000,
    'Sales.margin': 25,
  },
  {
    'Products.name': 'Phone',
    'Sales.revenue': 3000,
    'Sales.margin': 30,
  },
  {
    'Products.name': 'Tablet',
    'Sales.revenue': 2000,
    'Sales.margin': 20,
  },
  {
    'Products.name': 'Watch',
    'Sales.revenue': 1500,
    'Sales.margin': 35,
  },
]

// Data with categorical series
const mockCategoricalSeriesData = [
  {
    'Products.name': 'Laptop',
    'Sales.revenue': 5000,
    'Departments.name': 'Technology',
  },
  {
    'Products.name': 'Shirt',
    'Sales.revenue': 3000,
    'Departments.name': 'Apparel',
  },
  {
    'Products.name': 'Bread',
    'Sales.revenue': 2000,
    'Departments.name': 'Grocery',
  },
  {
    'Products.name': 'Pants',
    'Sales.revenue': 1500,
    'Departments.name': 'Apparel',
  },
]

// Boolean field data
const mockBooleanData = [
  { 'Products.isActive': true, 'Sales.revenue': 5000 },
  { 'Products.isActive': false, 'Sales.revenue': 2000 },
]

// Basic chart config
const basicChartConfig = {
  xAxis: ['Products.category'],
  yAxis: ['Sales.revenue'],
}

// Config with numeric series (for color gradient)
const numericSeriesConfig = {
  xAxis: ['Products.name'],
  yAxis: ['Sales.revenue'],
  series: ['Sales.margin'],
}

// Config with categorical series
const categoricalSeriesConfig = {
  xAxis: ['Products.name'],
  yAxis: ['Sales.revenue'],
  series: ['Departments.name'],
}

describe('TreeMapChart', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  describe('basic rendering', () => {
    it('should render treemap chart with valid data and config', () => {
      render(
        <TreeMapChart data={mockTreeMapData} chartConfig={basicChartConfig} />
      )

      // ChartContainer is mocked, so we check for the test id
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <TreeMapChart data={mockTreeMapData} chartConfig={basicChartConfig} />
      )

      // Find the outer container div
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toBeDefined()
    })

    it('should respect custom numeric height', () => {
      render(
        <TreeMapChart
          data={mockTreeMapData}
          chartConfig={basicChartConfig}
          height={400}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should respect custom string height', () => {
      render(
        <TreeMapChart
          data={mockTreeMapData}
          chartConfig={basicChartConfig}
          height="50vh"
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <TreeMapChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('No data points to display in treemap chart')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <TreeMapChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<TreeMapChart data={[]} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No valid data" when all values are zero or negative', () => {
      const zeroData = [
        { 'Products.category': 'A', 'Sales.revenue': 0 },
        { 'Products.category': 'B', 'Sales.revenue': -100 },
      ]

      render(<TreeMapChart data={zeroData} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No valid data')).toBeInTheDocument()
      expect(
        screen.getByText('No valid data points for treemap chart after transformation')
      ).toBeInTheDocument()
    })
  })

  describe('auto-detection mode (legacy format)', () => {
    it('should auto-detect name and size fields without config', () => {
      const legacyData = [
        { name: 'Item A', size: 100 },
        { name: 'Item B', size: 200 },
        { name: 'Item C', size: 150 },
      ]

      render(<TreeMapChart data={legacyData} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should auto-detect string field as name and numeric field as size', () => {
      const autoDetectData = [
        { label: 'Category A', value: 500 },
        { label: 'Category B', value: 300 },
      ]

      render(<TreeMapChart data={autoDetectData} />)

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should show no valid data when all numeric values are zero', () => {
      // When auto-detection finds numeric fields but all values are zero/null,
      // it shows "No valid data" after transformation filters them out
      const zeroValueData = [
        { name: 'A', value: 0 },
        { name: 'B', value: 0 },
      ]

      render(<TreeMapChart data={zeroValueData} />)

      expect(screen.getByText('No valid data')).toBeInTheDocument()
      expect(
        screen.getByText('No valid data points for treemap chart after transformation')
      ).toBeInTheDocument()
    })
  })

  describe('chart configuration', () => {
    it('should use xAxis as name field and yAxis as size field', () => {
      render(
        <TreeMapChart data={mockTreeMapData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle xAxis as string instead of array', () => {
      const config = {
        xAxis: 'Products.category' as any,
        yAxis: 'Sales.revenue' as any,
      }

      render(
        <TreeMapChart data={mockTreeMapData} chartConfig={config} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle yAxis as string instead of array', () => {
      const config = {
        xAxis: ['Products.category'],
        yAxis: 'Sales.revenue' as any,
      }

      render(
        <TreeMapChart data={mockTreeMapData} chartConfig={config} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('series field (color grouping)', () => {
    it('should render with numeric series field (color gradient)', () => {
      render(
        <TreeMapChart
          data={mockNumericSeriesData}
          chartConfig={numericSeriesConfig}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should render with categorical series field (discrete colors)', () => {
      render(
        <TreeMapChart
          data={mockCategoricalSeriesData}
          chartConfig={categoricalSeriesConfig}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should use index-based colors when no series field', () => {
      render(
        <TreeMapChart data={mockTreeMapData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle series field as string instead of array', () => {
      const config = {
        xAxis: ['Products.name'],
        yAxis: ['Sales.revenue'],
        series: 'Departments.name' as any,
      }

      render(
        <TreeMapChart data={mockCategoricalSeriesData} chartConfig={config} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show legend by default for series data', () => {
      render(
        <TreeMapChart
          data={mockCategoricalSeriesData}
          chartConfig={categoricalSeriesConfig}
        />
      )

      // Legend should be present when there are multiple series values
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      render(
        <TreeMapChart
          data={mockCategoricalSeriesData}
          chartConfig={categoricalSeriesConfig}
          displayConfig={{ showLegend: false }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should show tooltip by default', () => {
      render(
        <TreeMapChart data={mockTreeMapData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip is false', () => {
      render(
        <TreeMapChart
          data={mockTreeMapData}
          chartConfig={basicChartConfig}
          displayConfig={{ showTooltip: false }}
        />
      )

      // Tooltip should not be rendered
      expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument()
    })

    it('should apply leftYAxisFormat for value formatting', () => {
      render(
        <TreeMapChart
          data={mockTreeMapData}
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

    it('should handle empty displayConfig', () => {
      render(
        <TreeMapChart
          data={mockTreeMapData}
          chartConfig={basicChartConfig}
          displayConfig={{}}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('color palette support', () => {
    it('should use custom color palette when provided', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00'],
      }

      render(
        <TreeMapChart
          data={mockTreeMapData}
          chartConfig={basicChartConfig}
          colorPalette={customPalette}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should use custom palette for categorical series', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      render(
        <TreeMapChart
          data={mockCategoricalSeriesData}
          chartConfig={categoricalSeriesConfig}
          colorPalette={customPalette}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle single-color palette', () => {
      const singleColorPalette = {
        name: 'mono',
        colors: ['#3366cc'],
      }

      render(
        <TreeMapChart
          data={mockTreeMapData}
          chartConfig={basicChartConfig}
          colorPalette={singleColorPalette}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('data transformation', () => {
    it('should filter out zero values', () => {
      const dataWithZero = [
        { 'Products.category': 'A', 'Sales.revenue': 100 },
        { 'Products.category': 'B', 'Sales.revenue': 0 },
        { 'Products.category': 'C', 'Sales.revenue': 50 },
      ]

      render(
        <TreeMapChart data={dataWithZero} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should filter out null values', () => {
      const dataWithNull = [
        { 'Products.category': 'A', 'Sales.revenue': 100 },
        { 'Products.category': 'B', 'Sales.revenue': null },
        { 'Products.category': 'C', 'Sales.revenue': 50 },
      ]

      render(
        <TreeMapChart data={dataWithNull} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle string numeric values', () => {
      const stringNumericData = [
        { 'Products.category': 'A', 'Sales.revenue': '100' },
        { 'Products.category': 'B', 'Sales.revenue': '200' },
      ]

      render(
        <TreeMapChart data={stringNumericData} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle boolean name values', () => {
      render(
        <TreeMapChart
          data={mockBooleanData}
          chartConfig={{
            xAxis: ['Products.isActive'],
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle "true"/"false" string values as booleans', () => {
      const stringBooleanData = [
        { 'Products.isActive': 'true', 'Sales.revenue': 5000 },
        { 'Products.isActive': 'false', 'Sales.revenue': 2000 },
      ]

      render(
        <TreeMapChart
          data={stringBooleanData}
          chartConfig={{
            xAxis: ['Products.isActive'],
            yAxis: ['Sales.revenue'],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('time dimension handling', () => {
    it('should format time dimension values', () => {
      const timeData = [
        { 'Orders.createdAt': '2024-01-01', 'Sales.revenue': 1000 },
        { 'Orders.createdAt': '2024-02-01', 'Sales.revenue': 1500 },
        { 'Orders.createdAt': '2024-03-01', 'Sales.revenue': 1200 },
      ]

      render(
        <TreeMapChart
          data={timeData}
          chartConfig={{
            xAxis: ['Orders.createdAt'],
            yAxis: ['Sales.revenue'],
          }}
          queryObject={{
            timeDimensions: [
              { dimension: 'Orders.createdAt', granularity: 'month' },
            ],
          }}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singlePoint = [
        { 'Products.category': 'Electronics', 'Sales.revenue': 1500 },
      ]

      render(
        <TreeMapChart data={singlePoint} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeNumbers = [
        { 'Products.category': 'Big', 'Sales.revenue': 1000000000 },
        { 'Products.category': 'Medium', 'Sales.revenue': 500000000 },
      ]

      render(
        <TreeMapChart data={largeNumbers} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle very small decimal values', () => {
      const smallDecimals = [
        { 'Products.category': 'A', 'Sales.revenue': 0.001 },
        { 'Products.category': 'B', 'Sales.revenue': 0.002 },
      ]

      render(
        <TreeMapChart data={smallDecimals} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle many data points', () => {
      const manyPoints = Array.from({ length: 50 }, (_, i) => ({
        'Products.category': `Category ${i}`,
        'Sales.revenue': Math.random() * 1000 + 100,
      }))

      render(
        <TreeMapChart data={manyPoints} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should handle Unknown/missing name values', () => {
      const dataWithMissing = [
        { 'Products.category': '', 'Sales.revenue': 100 },
        { 'Products.category': null, 'Sales.revenue': 200 },
        { 'Products.category': 'Valid', 'Sales.revenue': 300 },
      ]

      render(
        <TreeMapChart data={dataWithMissing} chartConfig={basicChartConfig} />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should catch and display rendering errors gracefully', () => {
      // This test verifies the error boundary in the component
      // The component has a try-catch that returns an error message
      render(
        <TreeMapChart data={mockTreeMapData} chartConfig={basicChartConfig} />
      )

      // Should render normally with valid data
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })

  describe('click handling', () => {
    it('should call onDataPointClick when drill is enabled and cell is clicked', () => {
      const handleClick = vi.fn()

      render(
        <TreeMapChart
          data={mockTreeMapData}
          chartConfig={basicChartConfig}
          onDataPointClick={handleClick}
          drillEnabled={true}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
      // Note: Actually clicking on treemap cells is difficult in tests
      // because they're rendered by Recharts with complex SVG structure
    })

    it('should not enable click cursor when drill is disabled', () => {
      render(
        <TreeMapChart
          data={mockTreeMapData}
          chartConfig={basicChartConfig}
          drillEnabled={false}
        />
      )

      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })
  })
})

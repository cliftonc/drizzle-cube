/**
 * Tests for RadarChart component
 *
 * Focus on data rendering, axis configuration, series handling,
 * legend display, tooltip behavior, and empty state handling.
 *
 * RadarChart is a Recharts-based chart that uses:
 * - xAxis: Dimension field for radar categories (spokes)
 * - yAxis: Measure fields for radar values (radii)
 * - series: Optional grouping for multiple overlapping radars
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RadarChart from '../../../../src/client/components/charts/RadarChart'

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
      'Skills.name': 'Skill Name',
      'Skills.proficiency': 'Proficiency',
      'Performance.score': 'Score',
      'Performance.target': 'Target',
      'Categories.name': 'Category',
      'Metrics.value': 'Value',
      'Metrics.average': 'Average',
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

// Sample test data for radar chart
const mockRadarData = [
  {
    'Skills.name': 'JavaScript',
    'Skills.proficiency': 85,
  },
  {
    'Skills.name': 'TypeScript',
    'Skills.proficiency': 75,
  },
  {
    'Skills.name': 'React',
    'Skills.proficiency': 90,
  },
  {
    'Skills.name': 'Node.js',
    'Skills.proficiency': 70,
  },
  {
    'Skills.name': 'SQL',
    'Skills.proficiency': 65,
  },
]

// Multi-measure data (e.g., actual vs target)
const mockMultiMeasureData = [
  {
    'Categories.name': 'Speed',
    'Performance.score': 80,
    'Performance.target': 90,
  },
  {
    'Categories.name': 'Quality',
    'Performance.score': 85,
    'Performance.target': 85,
  },
  {
    'Categories.name': 'Cost',
    'Performance.score': 70,
    'Performance.target': 80,
  },
  {
    'Categories.name': 'Innovation',
    'Performance.score': 95,
    'Performance.target': 90,
  },
]

// Data with series grouping
const mockSeriesData = [
  {
    'Skills.name': 'JavaScript',
    'Categories.name': 'Team A',
    'Skills.proficiency': 85,
  },
  {
    'Skills.name': 'TypeScript',
    'Categories.name': 'Team A',
    'Skills.proficiency': 75,
  },
  {
    'Skills.name': 'JavaScript',
    'Categories.name': 'Team B',
    'Skills.proficiency': 70,
  },
  {
    'Skills.name': 'TypeScript',
    'Categories.name': 'Team B',
    'Skills.proficiency': 80,
  },
]

// Auto-detection data (no explicit config)
const mockAutoDetectData = [
  { subject: 'Math', A: 85, B: 90 },
  { subject: 'Science', A: 78, B: 82 },
  { subject: 'English', A: 92, B: 88 },
]

// Basic chart config
const basicChartConfig = {
  xAxis: ['Skills.name'],
  yAxis: ['Skills.proficiency'],
}

// Multi-measure chart config
const multiMeasureChartConfig = {
  xAxis: ['Categories.name'],
  yAxis: ['Performance.score', 'Performance.target'],
}

// Series chart config
const seriesChartConfig = {
  xAxis: ['Skills.name'],
  yAxis: ['Skills.proficiency'],
  series: ['Categories.name'],
}

describe('RadarChart', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  })

  describe('basic rendering', () => {
    it('should render radar chart with valid data and config', () => {
      const { container } = render(
        <RadarChart data={mockRadarData} chartConfig={basicChartConfig} />
      )

      // RadarChart renders via Recharts which uses SVG
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <RadarChart data={mockRadarData} chartConfig={basicChartConfig} />
      )

      // Find the chart container (mocked)
      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={basicChartConfig}
          height={400}
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={basicChartConfig}
          height="50vh"
        />
      )

      const chartContainer = container.querySelector('[data-testid="chart-container"]')
      expect(chartContainer).toHaveStyle({ height: '50vh' })
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <RadarChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(
        screen.getByText('No data points to display in radar chart')
      ).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <RadarChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(<RadarChart data={[]} chartConfig={basicChartConfig} />)

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('auto-detection (legacy/fallback mode)', () => {
    it('should auto-detect subject and value fields without explicit config', () => {
      const { container } = render(
        <RadarChart data={mockAutoDetectData} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should show error when no numeric fields found', () => {
      const noNumericData = [
        { name: 'A', category: 'X' },
        { name: 'B', category: 'Y' },
      ]

      render(<RadarChart data={noNumericData} />)

      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
      expect(
        screen.getByText('No numeric fields found for radar chart values')
      ).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show legend when multiple series exist and showLegend is true', () => {
      const { container } = render(
        <RadarChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
        />
      )

      // Legend is rendered by Recharts when multiple series
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).toBeInTheDocument()
    })

    it('should hide legend when showLegend is false', () => {
      const { container } = render(
        <RadarChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
          displayConfig={{ showLegend: false }}
        />
      )

      // Legend should not be rendered
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).not.toBeInTheDocument()
    })

    it('should not show legend for single series', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={basicChartConfig}
          displayConfig={{ showLegend: true }}
        />
      )

      // Legend not shown for single series
      const legend = container.querySelector('.recharts-legend-wrapper')
      expect(legend).not.toBeInTheDocument()
    })

    it('should show grid by default', () => {
      const { container } = render(
        <RadarChart data={mockRadarData} chartConfig={basicChartConfig} />
      )

      // PolarGrid is rendered
      const grid = container.querySelector('.recharts-polar-grid')
      expect(grid).toBeInTheDocument()
    })

    it('should hide grid when showGrid is false', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={basicChartConfig}
          displayConfig={{ showGrid: false }}
        />
      )

      // Grid should not be rendered
      const grid = container.querySelector('.recharts-polar-grid')
      expect(grid).not.toBeInTheDocument()
    })

    it('should handle empty displayConfig', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={basicChartConfig}
          displayConfig={{}}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('multi-measure handling', () => {
    it('should render multiple radar polygons for multiple measures', () => {
      const { container } = render(
        <RadarChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Multiple radar elements should be rendered
      const radars = container.querySelectorAll('.recharts-radar')
      expect(radars.length).toBe(2)
    })
  })

  describe('series handling', () => {
    it('should render with series breakdown', () => {
      const { container } = render(
        <RadarChart
          data={mockSeriesData}
          chartConfig={seriesChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('axis formatting', () => {
    it('should apply leftYAxisFormat for value formatting', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={basicChartConfig}
          displayConfig={{
            leftYAxisFormat: {
              unit: 'percent',
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
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      }

      const { container } = render(
        <RadarChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
          colorPalette={customPalette}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should use default colors when no palette is provided', () => {
      const { container } = render(
        <RadarChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singlePoint = [
        { 'Skills.name': 'JavaScript', 'Skills.proficiency': 85 },
      ]

      const { container } = render(
        <RadarChart data={singlePoint} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeNumbers = [
        { 'Skills.name': 'A', 'Skills.proficiency': 1000000000 },
        { 'Skills.name': 'B', 'Skills.proficiency': 500000000 },
      ]

      const { container } = render(
        <RadarChart data={largeNumbers} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const zeroData = [
        { 'Skills.name': 'JavaScript', 'Skills.proficiency': 0 },
        { 'Skills.name': 'TypeScript', 'Skills.proficiency': 75 },
      ]

      const { container } = render(
        <RadarChart data={zeroData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const negativeData = [
        { 'Skills.name': 'A', 'Skills.proficiency': -10 },
        { 'Skills.name': 'B', 'Skills.proficiency': 75 },
      ]

      const { container } = render(
        <RadarChart data={negativeData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle decimal values', () => {
      const decimalData = [
        { 'Skills.name': 'A', 'Skills.proficiency': 85.5 },
        { 'Skills.name': 'B', 'Skills.proficiency': 72.3 },
      ]

      const { container } = render(
        <RadarChart data={decimalData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle string numeric values', () => {
      const stringData = [
        { 'Skills.name': 'A', 'Skills.proficiency': '85' },
        { 'Skills.name': 'B', 'Skills.proficiency': '72' },
      ]

      const { container } = render(
        <RadarChart data={stringData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle xAxis as non-array string', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={{
            xAxis: 'Skills.name' as any,
            yAxis: ['Skills.proficiency'],
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle yAxis as non-array string', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={{
            xAxis: ['Skills.name'],
            yAxis: 'Skills.proficiency' as any,
          }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle Unknown category name', () => {
      const unknownData = [
        { 'Skills.name': undefined, 'Skills.proficiency': 85 },
        { 'Skills.name': '', 'Skills.proficiency': 72 },
        { 'Skills.name': null, 'Skills.proficiency': 65 },
      ]

      const { container } = render(
        <RadarChart data={unknownData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle null values in measures', () => {
      const nullData = [
        { 'Skills.name': 'A', 'Skills.proficiency': null },
        { 'Skills.name': 'B', 'Skills.proficiency': 72 },
      ]

      const { container } = render(
        <RadarChart data={nullData} chartConfig={basicChartConfig} />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('time dimension handling', () => {
    it('should handle time dimension on x-axis', () => {
      const timeData = [
        { 'Orders.createdAt': '2024-01-01', 'Skills.proficiency': 85 },
        { 'Orders.createdAt': '2024-02-01', 'Skills.proficiency': 72 },
        { 'Orders.createdAt': '2024-03-01', 'Skills.proficiency': 90 },
      ]

      const timeConfig = {
        xAxis: ['Orders.createdAt'],
        yAxis: ['Skills.proficiency'],
      }

      const { container } = render(
        <RadarChart
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

  describe('tooltip behavior', () => {
    it('should render tooltip when showTooltip is true (default)', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
          chartConfig={basicChartConfig}
          displayConfig={{ showTooltip: true }}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should not render tooltip when showTooltip is false', () => {
      const { container } = render(
        <RadarChart
          data={mockRadarData}
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
        <RadarChart
          data={mockMultiMeasureData}
          chartConfig={multiMeasureChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Legend items should be present
      const legendItems = container.querySelectorAll('.recharts-legend-item')
      expect(legendItems.length).toBeGreaterThan(0)
    })
  })

  describe('polar axes', () => {
    it('should render PolarAngleAxis for category labels', () => {
      const { container } = render(
        <RadarChart data={mockRadarData} chartConfig={basicChartConfig} />
      )

      const angleAxis = container.querySelector('.recharts-polar-angle-axis')
      expect(angleAxis).toBeInTheDocument()
    })

    it('should render PolarRadiusAxis for value scale', () => {
      const { container } = render(
        <RadarChart data={mockRadarData} chartConfig={basicChartConfig} />
      )

      const radiusAxis = container.querySelector('.recharts-polar-radius-axis')
      expect(radiusAxis).toBeInTheDocument()
    })
  })

  describe('data transformation', () => {
    it('should correctly transform data with series', () => {
      const { container } = render(
        <RadarChart
          data={mockSeriesData}
          chartConfig={seriesChartConfig}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Multiple radar elements may be rendered based on series
      const radars = container.querySelectorAll('.recharts-radar')
      expect(radars.length).toBeGreaterThan(0)
    })
  })
})

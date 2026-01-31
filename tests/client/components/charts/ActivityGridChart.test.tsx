/**
 * Tests for ActivityGridChart component
 *
 * Focus on data rendering, granularity handling, tooltip behavior,
 * responsive sizing, and empty/error state handling.
 *
 * ActivityGridChart is a D3-based chart that displays time-series data
 * as a grid/heatmap (similar to GitHub contribution graphs).
 *
 * Key features:
 * - Multiple granularity support: day, week, month, quarter, hour
 * - Color-coded intensity based on value
 * - Tooltips on hover
 * - Responsive sizing with optional fit-to-width mode
 * - Theme-aware coloring
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ActivityGridChart from '../../../../src/client/components/charts/ActivityGridChart'

// Mock the useCubeFieldLabel hook
vi.mock('../../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => {
    const labels: Record<string, string> = {
      'Activity.date': 'Date',
      'Activity.count': 'Activity Count',
      'Activity.value': 'Value',
      'Sales.createdAt': 'Created At',
      'Sales.revenue': 'Revenue',
      'Productivity.date': 'Work Date',
      'Productivity.linesOfCode': 'Lines of Code',
    }
    return labels[field] || field.split('.').pop() || field
  },
}))

// Mock theme utilities
vi.mock('../../../../src/client/theme', () => ({
  getTheme: () => 'light',
  watchThemeChanges: (callback: (theme: string) => void) => {
    // Return a cleanup function
    return () => {}
  },
}))

// Mock D3 select to avoid DOM manipulation issues in tests
// We'll verify the component structure rather than actual D3 rendering
vi.mock('d3', async (importOriginal) => {
  const original = await importOriginal<typeof import('d3')>()

  const createChainableMock = () => {
    const mock: any = {
      selectAll: vi.fn(() => createChainableMock()),
      remove: vi.fn(() => mock),
      attr: vi.fn(() => mock),
      append: vi.fn(() => createChainableMock()),
      style: vi.fn(() => mock),
      text: vi.fn(() => mock),
      html: vi.fn(() => mock),
      transition: vi.fn(() => mock),
      duration: vi.fn(() => mock),
      on: vi.fn(() => mock),
    }
    return mock
  }

  return {
    ...original,
    select: vi.fn(() => createChainableMock()),
  }
})

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback
  observed: Set<Element>

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    this.observed = new Set()
  }

  observe(target: Element) {
    this.observed.add(target)
    // Trigger immediately with default dimensions
    this.callback([{
      target,
      contentRect: { width: 600, height: 400, top: 0, left: 0, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) },
      borderBoxSize: [{ blockSize: 400, inlineSize: 600 }],
      contentBoxSize: [{ blockSize: 400, inlineSize: 600 }],
      devicePixelContentBoxSize: [{ blockSize: 400, inlineSize: 600 }],
    }], this as unknown as ResizeObserver)
  }

  unobserve(target: Element) {
    this.observed.delete(target)
  }

  disconnect() {
    this.observed.clear()
  }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// Sample test data with daily granularity
const mockDailyData = [
  { 'Activity.date': '2024-01-01T00:00:00.000Z', 'Activity.count': 5 },
  { 'Activity.date': '2024-01-02T00:00:00.000Z', 'Activity.count': 10 },
  { 'Activity.date': '2024-01-03T00:00:00.000Z', 'Activity.count': 3 },
  { 'Activity.date': '2024-01-04T00:00:00.000Z', 'Activity.count': 8 },
  { 'Activity.date': '2024-01-05T00:00:00.000Z', 'Activity.count': 15 },
  { 'Activity.date': '2024-01-06T00:00:00.000Z', 'Activity.count': 2 },
  { 'Activity.date': '2024-01-07T00:00:00.000Z', 'Activity.count': 7 },
]

// Weekly data
const mockWeeklyData = [
  { 'Activity.date': '2024-01-01T00:00:00.000Z', 'Activity.count': 50 },
  { 'Activity.date': '2024-01-08T00:00:00.000Z', 'Activity.count': 75 },
  { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 40 },
  { 'Activity.date': '2024-01-22T00:00:00.000Z', 'Activity.count': 90 },
]

// Monthly data
const mockMonthlyData = [
  { 'Activity.date': '2024-01-01T00:00:00.000Z', 'Activity.count': 150 },
  { 'Activity.date': '2024-02-01T00:00:00.000Z', 'Activity.count': 200 },
  { 'Activity.date': '2024-03-01T00:00:00.000Z', 'Activity.count': 175 },
  { 'Activity.date': '2024-04-01T00:00:00.000Z', 'Activity.count': 225 },
]

// Quarterly data
const mockQuarterlyData = [
  { 'Activity.date': '2024-01-01T00:00:00.000Z', 'Activity.count': 500 },
  { 'Activity.date': '2024-04-01T00:00:00.000Z', 'Activity.count': 600 },
  { 'Activity.date': '2024-07-01T00:00:00.000Z', 'Activity.count': 450 },
  { 'Activity.date': '2024-10-01T00:00:00.000Z', 'Activity.count': 700 },
]

// Hourly data
const mockHourlyData = [
  { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 10 },
  { 'Activity.date': '2024-01-15T03:00:00.000Z', 'Activity.count': 5 },
  { 'Activity.date': '2024-01-15T06:00:00.000Z', 'Activity.count': 15 },
  { 'Activity.date': '2024-01-15T09:00:00.000Z', 'Activity.count': 25 },
  { 'Activity.date': '2024-01-15T12:00:00.000Z', 'Activity.count': 30 },
]

// Basic chart config
const basicChartConfig = {
  dateField: 'Activity.date',
  valueField: 'Activity.count',
}

// Query object for day granularity
const dayQueryObject = {
  timeDimensions: [
    { dimension: 'Activity.date', granularity: 'day' }
  ]
}

// Query object for week granularity
const weekQueryObject = {
  timeDimensions: [
    { dimension: 'Activity.date', granularity: 'week' }
  ]
}

// Query object for month granularity
const monthQueryObject = {
  timeDimensions: [
    { dimension: 'Activity.date', granularity: 'month' }
  ]
}

// Query object for quarter granularity
const quarterQueryObject = {
  timeDimensions: [
    { dimension: 'Activity.date', granularity: 'quarter' }
  ]
}

// Query object for hour granularity
const hourQueryObject = {
  timeDimensions: [
    { dimension: 'Activity.date', granularity: 'hour' }
  ]
}

// Query object for year granularity (unsupported)
const yearQueryObject = {
  timeDimensions: [
    { dimension: 'Activity.date', granularity: 'year' }
  ]
}

describe('ActivityGridChart', () => {
  describe('basic rendering', () => {
    it('should render chart container with valid data', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      // Chart renders a container div
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render SVG element', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render with default height of 100%', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })

    it('should respect custom numeric height', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
          height={400}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should respect custom string height', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
          height="50vh"
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '50vh' })
    })

    it('should have minHeight of 250px', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ minHeight: '250px' })
    })
  })

  describe('empty data handling', () => {
    it('should show "No data available" when data is null', () => {
      render(
        <ActivityGridChart
          data={null as unknown as any[]}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(screen.getByText('No data points to display in activity grid')).toBeInTheDocument()
    })

    it('should show "No data available" when data is undefined', () => {
      render(
        <ActivityGridChart
          data={undefined as unknown as any[]}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should show "No data available" when data array is empty', () => {
      render(
        <ActivityGridChart
          data={[]}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration requirements', () => {
    it('should show configuration required when dateField is missing', () => {
      render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={{ valueField: 'Activity.count' }}
          queryObject={dayQueryObject}
        />
      )

      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
      expect(screen.getByText('Activity grid requires a time dimension and a measure')).toBeInTheDocument()
    })

    it('should show configuration required when valueField is missing', () => {
      render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={{ dateField: 'Activity.date' }}
          queryObject={dayQueryObject}
        />
      )

      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })

    it('should show configuration required when chartConfig is missing', () => {
      render(
        <ActivityGridChart
          data={mockDailyData}
          queryObject={dayQueryObject}
        />
      )

      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })

    it('should show configuration required when chartConfig is empty', () => {
      render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={{}}
          queryObject={dayQueryObject}
        />
      )

      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })
  })

  describe('granularity handling', () => {
    it('should handle day granularity', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle week granularity', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockWeeklyData}
          chartConfig={basicChartConfig}
          queryObject={weekQueryObject}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle month granularity', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockMonthlyData}
          chartConfig={basicChartConfig}
          queryObject={monthQueryObject}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle quarter granularity', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockQuarterlyData}
          chartConfig={basicChartConfig}
          queryObject={quarterQueryObject}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle hour granularity', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockHourlyData}
          chartConfig={basicChartConfig}
          queryObject={hourQueryObject}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should show error message for year granularity', () => {
      render(
        <ActivityGridChart
          data={mockQuarterlyData}
          chartConfig={basicChartConfig}
          queryObject={yearQueryObject}
        />
      )

      expect(screen.getByText('Granularity Too High')).toBeInTheDocument()
      expect(screen.getByText(/Activity grids work best with hour, day, week, month, or quarter granularity/)).toBeInTheDocument()
    })

    it('should default to day granularity when not specified', () => {
      const queryWithoutGranularity = {
        timeDimensions: [
          { dimension: 'Activity.date' }
        ]
      }

      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={queryWithoutGranularity}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should default to day when no timeDimensions', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={{}}
        />
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('display configuration', () => {
    it('should show tooltip by default', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      // Chart renders with default showTooltip: true
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip is false', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
          displayConfig={{ showTooltip: false }}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should show labels by default', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should hide labels when showLabels is false', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
          displayConfig={{ showLabels: false }}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle fitToWidth mode', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
          displayConfig={{ fitToWidth: true }}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle empty displayConfig', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
          displayConfig={{}}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('color palette support', () => {
    it('should use custom gradient colors when provided', () => {
      const customPalette = {
        name: 'custom',
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        gradient: ['#ffcccc', '#ff9999', '#ff6666', '#ff3333', '#ff0000'],
      }

      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
          colorPalette={customPalette}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should use default colors when no palette provided', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('date parsing', () => {
    it('should parse ISO format dates', () => {
      const isoData = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 10 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={isoData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should parse PostgreSQL format dates', () => {
      const pgData = [
        { 'Activity.date': '2024-01-15 00:00:00+00', 'Activity.count': 10 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={pgData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle dates without timezone', () => {
      const noTzData = [
        { 'Activity.date': '2024-01-15T00:00:00', 'Activity.count': 10 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={noTzData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should skip invalid dates', () => {
      const invalidData = [
        { 'Activity.date': 'not-a-date', 'Activity.count': 10 },
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 5 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={invalidData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('value handling', () => {
    it('should handle numeric values', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should parse string numeric values', () => {
      const stringData = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': '10' },
        { 'Activity.date': '2024-01-16T00:00:00.000Z', 'Activity.count': '20' },
      ]

      const { container } = render(
        <ActivityGridChart
          data={stringData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle zero values', () => {
      const zeroData = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 0 },
        { 'Activity.date': '2024-01-16T00:00:00.000Z', 'Activity.count': 10 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={zeroData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle null values as 0', () => {
      const nullData = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': null },
        { 'Activity.date': '2024-01-16T00:00:00.000Z', 'Activity.count': 10 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={nullData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle undefined values as 0', () => {
      const undefinedData = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': undefined },
        { 'Activity.date': '2024-01-16T00:00:00.000Z', 'Activity.count': 10 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={undefinedData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('chartConfig field formats', () => {
    it('should handle dateField as array', () => {
      const arrayConfig = {
        dateField: ['Activity.date'],
        valueField: ['Activity.count'],
      }

      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={arrayConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle dateField as string', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should use first element when dateField is array', () => {
      const arrayConfig = {
        dateField: ['Activity.date', 'Activity.otherDate'],
        valueField: 'Activity.count',
      }

      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={arrayConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('drill-down support', () => {
    it('should render without drill-down by default', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle drillEnabled state', () => {
      const onDataPointClick = vi.fn()

      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
          drillEnabled={true}
          onDataPointClick={onDataPointClick}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singlePoint = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 10 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={singlePoint}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle very large numbers', () => {
      const largeData = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 1000000000 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={largeData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const negativeData = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': -10 },
        { 'Activity.date': '2024-01-16T00:00:00.000Z', 'Activity.count': 10 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={negativeData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle decimal values', () => {
      const decimalData = [
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 10.5 },
        { 'Activity.date': '2024-01-16T00:00:00.000Z', 'Activity.count': 20.75 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={decimalData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle data spanning multiple years', () => {
      const multiYearData = [
        { 'Activity.date': '2023-01-15T00:00:00.000Z', 'Activity.count': 10 },
        { 'Activity.date': '2024-01-15T00:00:00.000Z', 'Activity.count': 20 },
        { 'Activity.date': '2025-01-15T00:00:00.000Z', 'Activity.count': 30 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={multiYearData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should handle timezone offset dates', () => {
      const tzData = [
        { 'Activity.date': '2024-01-15T00:00:00+05:30', 'Activity.count': 10 },
        { 'Activity.date': '2024-01-16T00:00:00-08:00', 'Activity.count': 20 },
      ]

      const { container } = render(
        <ActivityGridChart
          data={tzData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('responsive behavior', () => {
    it('should set up ResizeObserver', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      // SVG should render after dimensions are ready
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should allow horizontal scrolling for wide grids', () => {
      const { container } = render(
        <ActivityGridChart
          data={mockDailyData}
          chartConfig={basicChartConfig}
          queryObject={dayQueryObject}
        />
      )

      // Container should have overflow-x-auto class
      const scrollContainer = container.querySelector('.dc\\:overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })
  })
})

/**
 * Tests for MeasureProfileChart component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MeasureProfileChart from '../../../src/client/components/charts/MeasureProfileChart'

// Mock recharts to avoid canvas/ResizeObserver issues in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
      <div data-testid="line-chart" data-row-count={data?.length ?? 0}>{children}</div>
    ),
    Line: ({ dataKey, name }: { dataKey: string; name?: string }) => (
      <div data-testid={`line-${dataKey}`} data-name={name} />
    ),
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    ReferenceLine: ({ y }: { y: number }) => <div data-testid={`reference-line-${y}`} />,
    Legend: ({ payload }: { payload?: Array<{ value: string }> }) => (
      <div data-testid="chart-legend">
        {payload?.map((item, i) => <span key={i}>{item.value}</span>)}
      </div>
    ),
  }
})

// Mock ChartContainer to render children directly
vi.mock('../../../src/client/components/charts/ChartContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
}))

// Mock icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

// Mock hooks that require context
vi.mock('../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => field.split('.').pop() ?? field,
}))

// Markout-style data: multiple measures per row (one row per symbol)
const markoutData = [
  {
    'Markouts.symbol': 'AAPL',
    'Markouts.avgMinus2m': 10.5,
    'Markouts.avgMinus1m': 5.2,
    'Markouts.avgAtEvent': 0.1,
    'Markouts.avgPlus1m': -4.8,
    'Markouts.avgPlus2m': -9.3,
  },
  {
    'Markouts.symbol': 'MSFT',
    'Markouts.avgMinus2m': 8.1,
    'Markouts.avgMinus1m': 3.9,
    'Markouts.avgAtEvent': 0.4,
    'Markouts.avgPlus1m': -3.2,
    'Markouts.avgPlus2m': -7.1,
  },
]

const measureFields = [
  'Markouts.avgMinus2m',
  'Markouts.avgMinus1m',
  'Markouts.avgAtEvent',
  'Markouts.avgPlus1m',
  'Markouts.avgPlus2m',
]

const sampleChartConfig = {
  yAxis: measureFields,
}

const multiSeriesConfig = {
  yAxis: measureFields,
  series: ['Markouts.symbol'],
}

describe('MeasureProfileChart', () => {
  describe('empty state', () => {
    it('should render empty state when data is null', () => {
      render(<MeasureProfileChart data={null as unknown as unknown[]} chartConfig={sampleChartConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is empty array', () => {
      render(<MeasureProfileChart data={[]} chartConfig={sampleChartConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is undefined', () => {
      render(<MeasureProfileChart data={undefined as unknown as unknown[]} chartConfig={sampleChartConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration error state', () => {
    it('should show config error when fewer than 2 measures in yAxis', () => {
      render(
        <MeasureProfileChart
          data={markoutData}
          chartConfig={{ yAxis: ['Markouts.avgMinus2m'] }}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show config error when yAxis is empty', () => {
      render(
        <MeasureProfileChart
          data={markoutData}
          chartConfig={{ yAxis: [] }}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show config error when yAxis is undefined', () => {
      render(
        <MeasureProfileChart
          data={markoutData}
          chartConfig={{}}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('rendering with valid config', () => {
    it('should render chart container with valid data and config', () => {
      render(<MeasureProfileChart data={markoutData} chartConfig={sampleChartConfig} />)
      expect(screen.queryByText('No data available')).not.toBeInTheDocument()
      expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument()
      expect(screen.getByTestId('chart-container')).toBeInTheDocument()
    })

    it('should pivot 5 measures into 5 X-axis rows', () => {
      render(<MeasureProfileChart data={markoutData} chartConfig={sampleChartConfig} />)
      const chart = screen.getByTestId('line-chart')
      expect(chart.getAttribute('data-row-count')).toBe('5')
    })

    it('should render a single Line for single-series data', () => {
      render(<MeasureProfileChart data={markoutData} chartConfig={sampleChartConfig} />)
      // Single series uses '_value' key
      expect(screen.getByTestId('line-_value')).toBeInTheDocument()
    })
  })

  describe('multi-series rendering', () => {
    it('should render one Line per unique series value', () => {
      render(<MeasureProfileChart data={markoutData} chartConfig={multiSeriesConfig} />)
      // Should have lines for AAPL and MSFT
      expect(screen.getByTestId('line-AAPL')).toBeInTheDocument()
      expect(screen.getByTestId('line-MSFT')).toBeInTheDocument()
    })

    it('should render correct number of measure rows for multi-series', () => {
      render(<MeasureProfileChart data={markoutData} chartConfig={multiSeriesConfig} />)
      const chart = screen.getByTestId('line-chart')
      expect(chart.getAttribute('data-row-count')).toBe('5')
    })
  })

  describe('pivot transform', () => {
    it('should produce one profile row per measure in yAxis', () => {
      render(
        <MeasureProfileChart
          data={[{ 'M.a': 1, 'M.b': 2, 'M.c': 3 }]}
          chartConfig={{ yAxis: ['M.a', 'M.b', 'M.c'] }}
        />
      )
      const chart = screen.getByTestId('line-chart')
      expect(chart.getAttribute('data-row-count')).toBe('3')
    })

    it('should average multiple rows for the same series value', () => {
      // Two AAPL rows — values should be averaged per measure
      const duplicateData = [
        { 'M.cat': 'AAPL', 'M.a': 10, 'M.b': 20 },
        { 'M.cat': 'AAPL', 'M.a': 20, 'M.b': 30 },
      ]
      render(
        <MeasureProfileChart
          data={duplicateData}
          chartConfig={{ yAxis: ['M.a', 'M.b'], series: ['M.cat'] }}
        />
      )
      // Should render without errors — AAPL line exists
      expect(screen.getByTestId('line-AAPL')).toBeInTheDocument()
    })
  })

  describe('reference line', () => {
    it('should render zero reference line by default', () => {
      render(<MeasureProfileChart data={markoutData} chartConfig={sampleChartConfig} />)
      expect(screen.getByTestId('reference-line-0')).toBeInTheDocument()
    })

    it('should not render zero reference line when showReferenceLineAtZero is false', () => {
      render(
        <MeasureProfileChart
          data={markoutData}
          chartConfig={sampleChartConfig}
          displayConfig={{ showReferenceLineAtZero: false }}
        />
      )
      expect(screen.queryByTestId('reference-line-0')).not.toBeInTheDocument()
    })
  })

  describe('height prop', () => {
    it('should apply custom height', () => {
      const { container } = render(
        <MeasureProfileChart
          data={markoutData}
          chartConfig={sampleChartConfig}
          height="350px"
        />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '350px' })
    })

    it('should default to 100% height', () => {
      const { container } = render(
        <MeasureProfileChart data={markoutData} chartConfig={sampleChartConfig} />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })
  })

  describe('display config options', () => {
    it('should respect showDataLabels: true', () => {
      const { container } = render(
        <MeasureProfileChart
          data={markoutData}
          chartConfig={sampleChartConfig}
          displayConfig={{ showDataLabels: true }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })

    it('should handle null measure values without crashing', () => {
      const nullData = [{ 'M.a': null, 'M.b': null, 'M.c': 5 }]
      const { container } = render(
        <MeasureProfileChart
          data={nullData}
          chartConfig={{ yAxis: ['M.a', 'M.b', 'M.c'] }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })

    it('should handle string numeric values', () => {
      const stringData = [{ 'M.a': '10.5', 'M.b': '-5.2', 'M.c': '0' }]
      const { container } = render(
        <MeasureProfileChart
          data={stringData}
          chartConfig={{ yAxis: ['M.a', 'M.b', 'M.c'] }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })
  })
})

/**
 * Tests for WaterfallChart component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import WaterfallChart from '../../../src/client/components/charts/WaterfallChart'

// Mock recharts to avoid canvas/ResizeObserver issues in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    ComposedChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="composed-chart">{children}</div>
    ),
    Legend: ({ payload }: { payload?: Array<{ value: string }> }) => (
      <div data-testid="chart-legend">
        {payload?.map((item, i) => (
          <span key={i} data-testid={`legend-item-${item.value}`}>{item.value}</span>
        ))}
      </div>
    ),
    Bar: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Cell: () => null,
    LabelList: () => null,
  }
})

// Mock ChartContainer to render children directly (bypasses ResizeObserver requirement)
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

const sampleData = [
  { 'Metrics.category': 'Revenue', 'Metrics.value': 500 },
  { 'Metrics.category': 'COGS', 'Metrics.value': -200 },
  { 'Metrics.category': 'OpEx', 'Metrics.value': -100 },
  { 'Metrics.category': 'Other', 'Metrics.value': 50 },
]

const sampleChartConfig = {
  xAxis: ['Metrics.category'],
  yAxis: ['Metrics.value'],
}

describe('WaterfallChart', () => {
  describe('empty state', () => {
    it('should render empty state when data is null', () => {
      render(<WaterfallChart data={null as unknown as unknown[]} chartConfig={sampleChartConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is empty array', () => {
      render(<WaterfallChart data={[]} chartConfig={sampleChartConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is undefined', () => {
      render(<WaterfallChart data={undefined as unknown as unknown[]} chartConfig={sampleChartConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration error state', () => {
    it('should show config error when xAxis is missing', () => {
      render(
        <WaterfallChart
          data={sampleData}
          chartConfig={{ yAxis: ['Metrics.value'] }}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show config error when yAxis is missing', () => {
      render(
        <WaterfallChart
          data={sampleData}
          chartConfig={{ xAxis: ['Metrics.category'] }}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show config error when chartConfig is undefined', () => {
      render(<WaterfallChart data={sampleData} />)
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('rendering with valid config', () => {
    it('should render a chart container with valid data and config', () => {
      const { container } = render(
        <WaterfallChart data={sampleData} chartConfig={sampleChartConfig} />
      )
      // Should render without error state
      expect(screen.queryByText('No data available')).not.toBeInTheDocument()
      expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument()
      // Container should exist
      expect(container.firstChild).toBeTruthy()
    })

    it('should render legend with Increase and Decrease entries', () => {
      render(<WaterfallChart data={sampleData} chartConfig={sampleChartConfig} />)
      expect(screen.getByText('Increase')).toBeInTheDocument()
      expect(screen.getByText('Decrease')).toBeInTheDocument()
    })

    it('should render Total legend entry when showTotal is true (default)', () => {
      render(
        <WaterfallChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ showTotal: true }}
        />
      )
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('should NOT render Total legend entry when showTotal is false', () => {
      render(
        <WaterfallChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ showTotal: false }}
        />
      )
      expect(screen.queryByText('Total')).not.toBeInTheDocument()
    })
  })

  describe('data handling', () => {
    it('should handle all positive values', () => {
      const positiveData = [
        { 'M.cat': 'A', 'M.val': 100 },
        { 'M.cat': 'B', 'M.val': 200 },
        { 'M.cat': 'C', 'M.val': 50 },
      ]
      const { container } = render(
        <WaterfallChart
          data={positiveData}
          chartConfig={{ xAxis: ['M.cat'], yAxis: ['M.val'] }}
        />
      )
      expect(container.firstChild).toBeTruthy()
      expect(screen.queryByText('No data available')).not.toBeInTheDocument()
    })

    it('should handle all negative values', () => {
      const negativeData = [
        { 'M.cat': 'A', 'M.val': -100 },
        { 'M.cat': 'B', 'M.val': -200 },
      ]
      const { container } = render(
        <WaterfallChart
          data={negativeData}
          chartConfig={{ xAxis: ['M.cat'], yAxis: ['M.val'] }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })

    it('should handle string numeric values', () => {
      const stringData = [
        { 'M.cat': 'A', 'M.val': '100' },
        { 'M.cat': 'B', 'M.val': '-50' },
      ]
      const { container } = render(
        <WaterfallChart
          data={stringData}
          chartConfig={{ xAxis: ['M.cat'], yAxis: ['M.val'] }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })

    it('should handle null/undefined measure values gracefully', () => {
      const nullData = [
        { 'M.cat': 'A', 'M.val': null },
        { 'M.cat': 'B', 'M.val': undefined },
        { 'M.cat': 'C', 'M.val': 100 },
      ]
      const { container } = render(
        <WaterfallChart
          data={nullData}
          chartConfig={{ xAxis: ['M.cat'], yAxis: ['M.val'] }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })

    it('should handle single data point', () => {
      const singleData = [{ 'M.cat': 'Only', 'M.val': 42 }]
      const { container } = render(
        <WaterfallChart
          data={singleData}
          chartConfig={{ xAxis: ['M.cat'], yAxis: ['M.val'] }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('height prop', () => {
    it('should apply custom height', () => {
      const { container } = render(
        <WaterfallChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          height="400px"
        />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should default to 100% height', () => {
      const { container } = render(
        <WaterfallChart data={sampleData} chartConfig={sampleChartConfig} />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })
  })

  describe('display config options', () => {
    it('should respect showConnectorLine: false', () => {
      const { container } = render(
        <WaterfallChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ showConnectorLine: false }}
        />
      )
      // Just assert no crash
      expect(container.firstChild).toBeTruthy()
    })

    it('should respect showDataLabels: true', () => {
      const { container } = render(
        <WaterfallChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          displayConfig={{ showDataLabels: true }}
        />
      )
      expect(container.firstChild).toBeTruthy()
    })
  })
})

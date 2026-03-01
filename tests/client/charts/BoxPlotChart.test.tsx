/**
 * Tests for BoxPlotChart component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BoxPlotChart from '../../../src/client/components/charts/BoxPlotChart'

// Mock icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

// Sample data: pre-aggregated stats per symbol
const fiveMeasureData = [
  {
    'Trades.symbol': 'AAPL',
    'Trades.minPnl': -150,
    'Trades.q1Pnl': -20,
    'Trades.medianPnl': 10,
    'Trades.q3Pnl': 45,
    'Trades.maxPnl': 200,
  },
  {
    'Trades.symbol': 'MSFT',
    'Trades.minPnl': -80,
    'Trades.q1Pnl': -10,
    'Trades.medianPnl': 5,
    'Trades.q3Pnl': 30,
    'Trades.maxPnl': 120,
  },
]

const threeMeasureData = [
  { 'Trades.symbol': 'AAPL', 'Trades.avgPnl': 15, 'Trades.stddevPnl': 40, 'Trades.medianPnl': 10 },
  { 'Trades.symbol': 'MSFT', 'Trades.avgPnl': 8, 'Trades.stddevPnl': 25, 'Trades.medianPnl': 5 },
]

const autoData = [
  { 'Trades.symbol': 'AAPL', 'Trades.avgPnl': 15 },
  { 'Trades.symbol': 'MSFT', 'Trades.avgPnl': 8 },
]

const fiveMeasureConfig = {
  xAxis: ['Trades.symbol'],
  yAxis: ['Trades.minPnl', 'Trades.q1Pnl', 'Trades.medianPnl', 'Trades.q3Pnl', 'Trades.maxPnl'],
}

const threeMeasureConfig = {
  xAxis: ['Trades.symbol'],
  yAxis: ['Trades.avgPnl', 'Trades.stddevPnl', 'Trades.medianPnl'],
}

const autoConfig = {
  xAxis: ['Trades.symbol'],
  yAxis: ['Trades.avgPnl'],
}

describe('BoxPlotChart', () => {
  describe('empty state', () => {
    it('should render empty state when data is null', () => {
      render(<BoxPlotChart data={null as unknown as unknown[]} chartConfig={autoConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is empty array', () => {
      render(<BoxPlotChart data={[]} chartConfig={autoConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is undefined', () => {
      render(<BoxPlotChart data={undefined as unknown as unknown[]} chartConfig={autoConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration error state', () => {
    it('should show config error when no xAxis and no measures configured', () => {
      render(
        <BoxPlotChart
          data={autoData}
          chartConfig={{}}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('5-measure mode', () => {
    it('should render SVG with valid 5-measure config', () => {
      render(
        <BoxPlotChart
          data={fiveMeasureData}
          chartConfig={fiveMeasureConfig}
        />
      )
      expect(screen.queryByText('No data available')).not.toBeInTheDocument()
      expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument()
      expect(screen.getByTestId('boxplot-svg')).toBeInTheDocument()
    })

    it('should render one box per data row', () => {
      render(
        <BoxPlotChart
          data={fiveMeasureData}
          chartConfig={fiveMeasureConfig}
        />
      )
      expect(screen.getByTestId('box-AAPL')).toBeInTheDocument()
      expect(screen.getByTestId('box-MSFT')).toBeInTheDocument()
    })

    it('should render X-axis labels for each box', () => {
      render(
        <BoxPlotChart
          data={fiveMeasureData}
          chartConfig={fiveMeasureConfig}
        />
      )
      expect(screen.getByTestId('x-label-AAPL')).toBeInTheDocument()
      expect(screen.getByTestId('x-label-MSFT')).toBeInTheDocument()
    })

    it('should render median lines for each box', () => {
      render(
        <BoxPlotChart
          data={fiveMeasureData}
          chartConfig={fiveMeasureConfig}
        />
      )
      expect(screen.getByTestId('median-AAPL')).toBeInTheDocument()
      expect(screen.getByTestId('median-MSFT')).toBeInTheDocument()
    })
  })

  describe('3-measure mode', () => {
    it('should render SVG with valid 3-measure config', () => {
      render(
        <BoxPlotChart
          data={threeMeasureData}
          chartConfig={threeMeasureConfig}
        />
      )
      expect(screen.getByTestId('boxplot-svg')).toBeInTheDocument()
    })

    it('should render boxes in 3-measure mode', () => {
      render(
        <BoxPlotChart
          data={threeMeasureData}
          chartConfig={threeMeasureConfig}
        />
      )
      expect(screen.getByTestId('box-AAPL')).toBeInTheDocument()
      expect(screen.getByTestId('box-MSFT')).toBeInTheDocument()
    })
  })

  describe('auto mode', () => {
    it('should render SVG with auto-mode config', () => {
      render(
        <BoxPlotChart data={autoData} chartConfig={autoConfig} />
      )
      expect(screen.getByTestId('boxplot-svg')).toBeInTheDocument()
    })

    it('should render boxes in auto mode', () => {
      render(
        <BoxPlotChart data={autoData} chartConfig={autoConfig} />
      )
      expect(screen.getByTestId('box-AAPL')).toBeInTheDocument()
    })
  })

  describe('data truncation', () => {
    it('should truncate and show warning when more than 50 data points', () => {
      const largeData = Array.from({ length: 60 }, (_, i) => ({
        'Trades.symbol': `Symbol${i}`,
        'Trades.avgPnl': i * 10,
      }))
      render(
        <BoxPlotChart
          data={largeData}
          chartConfig={{ xAxis: ['Trades.symbol'], yAxis: ['Trades.avgPnl'] }}
        />
      )
      expect(screen.getByText(/Data truncated to 50 groups/)).toBeInTheDocument()
    })

    it('should NOT show truncation warning for <= 50 data points', () => {
      render(
        <BoxPlotChart data={autoData} chartConfig={autoConfig} />
      )
      expect(screen.queryByText(/Data truncated/)).not.toBeInTheDocument()
    })
  })

  describe('height prop', () => {
    it('should apply custom height', () => {
      const { container } = render(
        <BoxPlotChart
          data={autoData}
          chartConfig={autoConfig}
          height="400px"
        />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should default to 100% height', () => {
      const { container } = render(
        <BoxPlotChart data={autoData} chartConfig={autoConfig} />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singleRow = [{ 'M.cat': 'Only', 'M.val': 42 }]
      render(
        <BoxPlotChart
          data={singleRow}
          chartConfig={{ xAxis: ['M.cat'], yAxis: ['M.val'] }}
        />
      )
      expect(screen.getByTestId('box-Only')).toBeInTheDocument()
    })

    it('should show no valid data when all measure values are null', () => {
      const nullData = [
        { 'Trades.symbol': 'AAPL', 'Trades.avgPnl': null },
        { 'Trades.symbol': 'MSFT', 'Trades.avgPnl': undefined },
      ]
      render(
        <BoxPlotChart
          data={nullData}
          chartConfig={{ xAxis: ['Trades.symbol'], yAxis: ['Trades.avgPnl'] }}
        />
      )
      expect(screen.getByText('No valid data')).toBeInTheDocument()
    })

    it('should skip rows with null fields and render valid ones', () => {
      const mixedData = [
        { 'M.cat': 'Valid', 'M.val': 42 },
        { 'M.cat': 'Invalid', 'M.val': null },
      ]
      render(
        <BoxPlotChart
          data={mixedData}
          chartConfig={{ xAxis: ['M.cat'], yAxis: ['M.val'] }}
        />
      )
      expect(screen.getByTestId('box-Valid')).toBeInTheDocument()
      expect(screen.queryByTestId('box-Invalid')).not.toBeInTheDocument()
    })

    it('should show no valid data when 5-measure fields are missing from data', () => {
      const wrongFieldData = [
        { 'Trades.symbol': 'AAPL', 'Wrong.field': 100 },
      ]
      render(
        <BoxPlotChart
          data={wrongFieldData}
          chartConfig={{
            xAxis: ['Trades.symbol'],
            yAxis: ['Trades.minPnl', 'Trades.q1Pnl', 'Trades.medianPnl', 'Trades.q3Pnl', 'Trades.maxPnl'],
          }}
        />
      )
      expect(screen.getByText('No valid data')).toBeInTheDocument()
    })

    it('should handle negative values', () => {
      const negData = [{ 'M.cat': 'Loss', 'M.val': -100 }]
      render(
        <BoxPlotChart
          data={negData}
          chartConfig={{ xAxis: ['M.cat'], yAxis: ['M.val'] }}
        />
      )
      expect(screen.getByTestId('box-Loss')).toBeInTheDocument()
    })
  })
})

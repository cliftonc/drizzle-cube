/**
 * Tests for CandlestickChart component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CandlestickChart from '../../../src/client/components/charts/CandlestickChart'

// Mock icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
  getChartTypeIcon: () => null,
}))

// Mock hooks that require context
vi.mock('../../../src/client/hooks/useCubeFieldLabel', () => ({
  useCubeFieldLabel: () => (field: string) => field.split('.').pop() ?? field,
}))

const ohlcData = [
  { 'Quotes.date': '2026-01-01', 'Quotes.open': 100, 'Quotes.close': 110, 'Quotes.high': 115, 'Quotes.low': 95 },
  { 'Quotes.date': '2026-01-02', 'Quotes.open': 110, 'Quotes.close': 105, 'Quotes.high': 112, 'Quotes.low': 103 },
  { 'Quotes.date': '2026-01-03', 'Quotes.open': 105, 'Quotes.close': 120, 'Quotes.high': 122, 'Quotes.low': 104 },
]

const rangeData = [
  { 'Quotes.symbol': 'AAPL', 'Quotes.bid': 99.5, 'Quotes.ask': 100.5 },
  { 'Quotes.symbol': 'MSFT', 'Quotes.bid': 200.0, 'Quotes.ask': 201.0 },
]

const ohlcConfig = {
  xAxis: ['Quotes.date'],
  yAxis: ['Quotes.open', 'Quotes.close', 'Quotes.high', 'Quotes.low'],
}

const rangeConfig = {
  xAxis: ['Quotes.symbol'],
  yAxis: ['Quotes.ask', 'Quotes.bid'],
}

describe('CandlestickChart', () => {
  describe('empty state', () => {
    it('should render empty state when data is null', () => {
      render(<CandlestickChart data={null as unknown as unknown[]} chartConfig={ohlcConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is empty array', () => {
      render(<CandlestickChart data={[]} chartConfig={ohlcConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state when data is undefined', () => {
      render(<CandlestickChart data={undefined as unknown as unknown[]} chartConfig={ohlcConfig} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration error state', () => {
    it('should show config error when xAxis is missing', () => {
      render(
        <CandlestickChart
          data={ohlcData}
          chartConfig={{ yAxis: ['Quotes.open', 'Quotes.close'] }}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show config error when OHLC mode has fewer than 2 measures', () => {
      render(
        <CandlestickChart
          data={ohlcData}
          chartConfig={{ xAxis: ['Quotes.date'], yAxis: ['Quotes.open'] }}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })

    it('should show config error when range mode has fewer than 2 measures', () => {
      render(
        <CandlestickChart
          data={rangeData}
          chartConfig={{ xAxis: ['Quotes.symbol'], yAxis: ['Quotes.ask'] }}
          displayConfig={{ rangeMode: 'range' }}
        />
      )
      expect(screen.getByText('Configuration Error')).toBeInTheDocument()
    })
  })

  describe('OHLC mode rendering', () => {
    it('should render SVG with valid OHLC data', () => {
      render(<CandlestickChart data={ohlcData} chartConfig={ohlcConfig} />)
      expect(screen.queryByText('No data available')).not.toBeInTheDocument()
      expect(screen.queryByText('Configuration Error')).not.toBeInTheDocument()
      expect(screen.getByTestId('candlestick-svg')).toBeInTheDocument()
    })

    it('should render one candle per data row', () => {
      render(<CandlestickChart data={ohlcData} chartConfig={ohlcConfig} />)
      expect(screen.getByTestId('candle-2026-01-01')).toBeInTheDocument()
      expect(screen.getByTestId('candle-2026-01-02')).toBeInTheDocument()
      expect(screen.getByTestId('candle-2026-01-03')).toBeInTheDocument()
    })

    it('should assign bullish color when close > open', () => {
      render(<CandlestickChart data={ohlcData} chartConfig={ohlcConfig} />)
      // Row 0: open=100, close=110 → bullish
      const body = screen.getByTestId('candle-body-2026-01-01')
      expect(body.getAttribute('data-bullish')).toBe('true')
    })

    it('should assign bearish color when close < open', () => {
      render(<CandlestickChart data={ohlcData} chartConfig={ohlcConfig} />)
      // Row 1: open=110, close=105 → bearish
      const body = screen.getByTestId('candle-body-2026-01-02')
      expect(body.getAttribute('data-bullish')).toBe('false')
    })

    it('should render wicks by default', () => {
      render(<CandlestickChart data={ohlcData} chartConfig={ohlcConfig} />)
      expect(screen.getByTestId('wick-high-2026-01-01')).toBeInTheDocument()
      expect(screen.getByTestId('wick-low-2026-01-01')).toBeInTheDocument()
    })

    it('should not render wicks when showWicks is false', () => {
      render(
        <CandlestickChart
          data={ohlcData}
          chartConfig={ohlcConfig}
          displayConfig={{ showWicks: false }}
        />
      )
      expect(screen.queryByTestId('wick-high-2026-01-01')).not.toBeInTheDocument()
    })
  })

  describe('range mode rendering', () => {
    it('should render in range mode', () => {
      render(
        <CandlestickChart
          data={rangeData}
          chartConfig={rangeConfig}
          displayConfig={{ rangeMode: 'range' }}
        />
      )
      expect(screen.getByTestId('candlestick-svg')).toBeInTheDocument()
      expect(screen.getByTestId('candle-AAPL')).toBeInTheDocument()
      expect(screen.getByTestId('candle-MSFT')).toBeInTheDocument()
    })

    it('should set open=low and close=high in range mode (always bullish)', () => {
      const data = [
        { 'Q.sym': 'X', 'Q.hi': 200, 'Q.lo': 100 },
      ]
      render(
        <CandlestickChart
          data={data}
          chartConfig={{ xAxis: ['Q.sym'], yAxis: ['Q.hi', 'Q.lo'] }}
          displayConfig={{ rangeMode: 'range' }}
        />
      )
      const body = screen.getByTestId('candle-body-X')
      // In range mode: open = low (100), close = high (200), so close >= open → bullish
      expect(body.getAttribute('data-bullish')).toBe('true')
    })
  })

  describe('data handling', () => {
    it('should handle equal open and close (doji candle) — shows bullish', () => {
      const dojiData = [
        { 'Q.date': '2026-01-01', 'Q.open': 100, 'Q.close': 100, 'Q.high': 105, 'Q.low': 95 },
      ]
      render(
        <CandlestickChart
          data={dojiData}
          chartConfig={{ xAxis: ['Q.date'], yAxis: ['Q.open', 'Q.close', 'Q.high', 'Q.low'] }}
        />
      )
      const body = screen.getByTestId('candle-body-2026-01-01')
      // close === open → isBullish = true (closes >= open)
      expect(body.getAttribute('data-bullish')).toBe('true')
    })

    it('should skip rows with null open/close values', () => {
      const nullData = [
        { 'Q.date': '2026-01-01', 'Q.open': null, 'Q.close': null, 'Q.high': null, 'Q.low': null },
      ]
      render(
        <CandlestickChart
          data={nullData}
          chartConfig={{ xAxis: ['Q.date'], yAxis: ['Q.open', 'Q.close', 'Q.high', 'Q.low'] }}
        />
      )
      expect(screen.queryByTestId('candle-2026-01-01')).not.toBeInTheDocument()
    })

    it('should render valid rows and skip null rows', () => {
      const mixedData = [
        { 'Q.date': '2026-01-01', 'Q.open': 100, 'Q.close': 110, 'Q.high': 115, 'Q.low': 95 },
        { 'Q.date': '2026-01-02', 'Q.open': null, 'Q.close': null, 'Q.high': null, 'Q.low': null },
      ]
      render(
        <CandlestickChart
          data={mixedData}
          chartConfig={{ xAxis: ['Q.date'], yAxis: ['Q.open', 'Q.close', 'Q.high', 'Q.low'] }}
        />
      )
      expect(screen.getByTestId('candle-2026-01-01')).toBeInTheDocument()
      expect(screen.queryByTestId('candle-2026-01-02')).not.toBeInTheDocument()
    })

    it('should handle string numeric values', () => {
      const strData = [
        { 'Q.date': '2026-01-01', 'Q.open': '100', 'Q.close': '110', 'Q.high': '115', 'Q.low': '95' },
      ]
      render(
        <CandlestickChart
          data={strData}
          chartConfig={{ xAxis: ['Q.date'], yAxis: ['Q.open', 'Q.close', 'Q.high', 'Q.low'] }}
        />
      )
      expect(screen.getByTestId('candle-2026-01-01')).toBeInTheDocument()
    })
  })

  describe('data truncation', () => {
    it('should truncate and show warning when more than 200 candles', () => {
      const largeData = Array.from({ length: 210 }, (_, i) => ({
        'Q.date': `Day${i}`,
        'Q.open': 100,
        'Q.close': 110,
        'Q.high': 115,
        'Q.low': 95,
      }))
      render(
        <CandlestickChart
          data={largeData}
          chartConfig={{ xAxis: ['Q.date'], yAxis: ['Q.open', 'Q.close', 'Q.high', 'Q.low'] }}
        />
      )
      expect(screen.getByText(/Showing first 200 candles/)).toBeInTheDocument()
    })
  })

  describe('display config options', () => {
    it('should apply custom bull/bear colors', () => {
      render(
        <CandlestickChart
          data={ohlcData}
          chartConfig={ohlcConfig}
          displayConfig={{ bullColor: '#00ff00', bearColor: '#ff0000' }}
        />
      )
      // Row 0: bullish (close > open) — should use custom bull color
      const bullBody = screen.getByTestId('candle-body-2026-01-01')
      expect(bullBody.getAttribute('fill')).toBe('#00ff00')
      // Row 1: bearish (close < open) — should use custom bear color
      const bearBody = screen.getByTestId('candle-body-2026-01-02')
      expect(bearBody.getAttribute('fill')).toBe('#ff0000')
    })
  })

  describe('height prop', () => {
    it('should apply custom height', () => {
      const { container } = render(
        <CandlestickChart data={ohlcData} chartConfig={ohlcConfig} height="500px" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '500px' })
    })

    it('should default to 100% height', () => {
      const { container } = render(
        <CandlestickChart data={ohlcData} chartConfig={ohlcConfig} />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '100%' })
    })
  })
})

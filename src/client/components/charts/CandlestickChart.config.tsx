import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the candlestick chart type.
 * Renders financial candlestick bars with open/close body and high/low wicks.
 * Supports both OHLC mode and simplified range (bid/ask spread) mode.
 */
export const candlestickChartConfig: ChartTypeConfig = {
  label: 'Candlestick Chart',
  icon: getChartTypeIcon('bar'),
  description: 'Financial candlestick chart showing open/close body and high/low wicks',
  useCase:
    'Best for EOD quotes (bid/ask spread per date/symbol), markout distribution bands, or OHLC price data',
  clickableElements: { bar: true },
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Time / Category)',
      description: 'Time dimension or category for each candle (e.g. date, symbol)',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['timeDimension', 'dimension'],
      emptyText: 'Drop a time or dimension here',
    },
    {
      key: 'yAxis',
      label: 'OHLC Measures (open, close, high, low)',
      description:
        'Drop 2–4 measures in order: open, close, high, low (OHLC mode). For range mode drop 2: high, low.',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop 2+ measures here',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'rangeMode',
      label: 'Chart Mode',
      type: 'select',
      defaultValue: 'ohlc',
      options: [
        { value: 'ohlc', label: 'OHLC (open, close, high, low)' },
        { value: 'range', label: 'Range (high, low / bid, ask)' },
      ],
      description: 'OHLC: 4 measures. Range: 2 measures (high + low).',
    },
    {
      key: 'bullColor',
      label: 'Bullish Colour',
      type: 'color',
      defaultValue: '#22c55e',
      description: 'Candle colour when close ≥ open',
    },
    {
      key: 'bearColor',
      label: 'Bearish Colour',
      type: 'color',
      defaultValue: '#ef4444',
      description: 'Candle colour when close < open',
    },
    {
      key: 'showWicks',
      label: 'Show Wicks',
      type: 'boolean',
      defaultValue: true,
      description: 'Draw high/low wicks above and below the body',
    },
    {
      key: 'leftYAxisFormat',
      label: 'Y-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for the price axis',
    },
  ],
}

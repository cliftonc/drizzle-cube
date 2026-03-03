import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the box plot chart type.
 * Visualises the statistical distribution of a measure across groupings.
 *
 * Two modes:
 *  - 5-measure: explicit min/q1/median/q3/max fields (displayConfig)
 *  - 3-measure: avg + stddev + median fields (displayConfig), draws mean ± σ whiskers
 *  - Auto: single yAxis measure shown as a point (degenerate box)
 */
export const boxPlotChartConfig: ChartTypeConfig = {
  label: 'Box Plot',
  description: 'Show statistical distribution (median, IQR, whiskers) across categories',
  useCase:
    'Best for P&L spread per symbol, trade size distribution, latency distribution across platforms',
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Groups)',
      description: 'Dimension to group boxes by (e.g. symbol, platform)',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop a dimension here',
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Measures)',
      description:
        'For auto mode: drop 1 measure here. For 3-measure mode set avg/stddev/median fields in Display Options.',
      mandatory: false,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here (or configure 3/5-measure mode below)',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'avgField',
      label: 'Avg Field (3-measure mode)',
      type: 'string',
      placeholder: 'e.g. Trades.avgPnl',
      description: 'Average measure for 3-measure mode (mean ± σ whiskers)',
    },
    {
      key: 'stddevField',
      label: 'Stddev Field (3-measure mode)',
      type: 'string',
      placeholder: 'e.g. Trades.stddevPnl',
      description: 'Standard deviation measure for 3-measure mode',
    },
    {
      key: 'medianField',
      label: 'Median Field (3/5-measure mode)',
      type: 'string',
      placeholder: 'e.g. Trades.medianPnl',
      description: 'Median measure for 3-measure or 5-measure mode',
    },
    {
      key: 'minField',
      label: 'Min Field (5-measure mode)',
      type: 'string',
      placeholder: 'e.g. Trades.minPnl',
      description: 'Minimum measure for 5-measure full box plot',
    },
    {
      key: 'q1Field',
      label: 'Q1 Field (5-measure mode)',
      type: 'string',
      placeholder: 'e.g. Trades.q1Pnl',
      description: 'First quartile measure for 5-measure full box plot',
    },
    {
      key: 'q3Field',
      label: 'Q3 Field (5-measure mode)',
      type: 'string',
      placeholder: 'e.g. Trades.q3Pnl',
      description: 'Third quartile measure for 5-measure full box plot',
    },
    {
      key: 'maxField',
      label: 'Max Field (5-measure mode)',
      type: 'string',
      placeholder: 'e.g. Trades.maxPnl',
      description: 'Maximum measure for 5-measure full box plot',
    },
    {
      key: 'leftYAxisFormat',
      label: 'Y-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for the value axis',
    },
  ],
}

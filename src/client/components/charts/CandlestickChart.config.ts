import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the candlestick chart type
 */
export const candlestickChartConfig: ChartTypeConfig = {
  label: t('chart.candlestick.label'),
  description: t('chart.candlestick.description'),
  useCase: t('chart.candlestick.useCase'),
  clickableElements: { bar: true },
  displayOptions: ['hideHeader'],
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.x_axis_time_category'),
      description: t('chart.configText.time_dimension_or_category_for_each_candle_e_g_date_symbol'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['timeDimension', 'dimension'],
      emptyText: 'Drop a time or dimension here',
    },
    {
      key: 'yAxis',
      label: t('chart.configText.ohlc_measures_open_close_high_low'),
      description: t('chart.configText.drop_2_4_measures_in_order_open_close_high_low_ohlc_mode_for_range_mode_'),
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop 2+ measures here',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'rangeMode',
      label: t('chart.option.rangeMode.label'),
      type: 'select',
      defaultValue: 'ohlc',
      options: [
        { value: 'ohlc', label: t('chart.option.rangeMode.ohlc') },
        { value: 'range', label: t('chart.option.rangeMode.range') },
      ],
      description: t('chart.option.rangeMode.description'),
    },
    {
      key: 'bullColor',
      label: t('chart.option.bullColor.label'),
      type: 'color',
      defaultValue: '#22c55e',
      description: t('chart.option.bullColor.description'),
    },
    {
      key: 'bearColor',
      label: t('chart.option.bearColor.label'),
      type: 'color',
      defaultValue: '#ef4444',
      description: t('chart.option.bearColor.description'),
    },
    {
      key: 'showWicks',
      label: t('chart.option.showWicks.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showWicks.description'),
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.yAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_the_price_axis'),
    },
  ],
}

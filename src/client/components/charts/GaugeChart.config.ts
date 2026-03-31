import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the gauge chart type
 */
export const gaugeChartConfig: ChartTypeConfig = {
  label: t('chart.gauge.label'),
  description: t('chart.gauge.description'),
  useCase: t('chart.gauge.useCase'),
  clickableElements: {},
  displayOptions: ['hideHeader'],
  dropZones: [
    {
      key: 'yAxis',
      label: t('chart.configText.value_measure'),
      description: t('chart.configText.current_value_to_display_on_the_gauge_e_g_current_equity_margin_used'),
      mandatory: true,
      maxItems: 2,
      acceptTypes: ['measure'],
      emptyText: 'Drop 1 measure here (optional 2nd for dynamic max)',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'minValue',
      label: t('chart.option.minValue.label'),
      type: 'number',
      defaultValue: 0,
      description: t('chart.option.minValue.description'),
    },
    {
      key: 'maxValue',
      label: t('chart.option.maxValue.label'),
      type: 'number',
      description: t('chart.option.maxValue.description'),
    },
    {
      key: 'thresholds',
      label: t('chart.configText.threshold_bands'),
      type: 'string',
      placeholder: '[{"value":0.33,"color":"#22c55e"},{"value":0.66,"color":"#f59e0b"},{"value":1,"color":"#ef4444"}]',
      description: t('chart.configText.array_of_value_0_1_fraction_color_bands_shown_as_outer_arc_markers'),
    },
    {
      key: 'showCenterLabel',
      label: t('chart.option.showCentreLabel.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showCentreLabel.description'),
    },
    {
      key: 'showPercentage',
      label: t('chart.option.showPercentage.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.showPercentage.description'),
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.valueFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_the_displayed_value_and_axis_labels'),
    },
  ],
}

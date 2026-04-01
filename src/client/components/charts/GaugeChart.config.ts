import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the gauge chart type
 */
export const gaugeChartConfig: ChartTypeConfig = {
  label: 'chart.gauge.label',
  description: 'chart.gauge.description',
  useCase: 'chart.gauge.useCase',
  clickableElements: {},
  displayOptions: ['hideHeader'],
  dropZones: [
    {
      key: 'yAxis',
      label: 'chart.configText.value_measure',
      description: 'chart.configText.current_value_to_display_on_the_gauge_e_g_current_equity_margin_used',
      mandatory: true,
      maxItems: 2,
      acceptTypes: ['measure'],
      emptyText: 'chart.gauge.dropZone.yAxis.empty',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'minValue',
      label: 'chart.option.minValue.label',
      type: 'number',
      defaultValue: 0,
      description: 'chart.option.minValue.description',
    },
    {
      key: 'maxValue',
      label: 'chart.option.maxValue.label',
      type: 'number',
      description: 'chart.option.maxValue.description',
    },
    {
      key: 'thresholds',
      label: 'chart.configText.threshold_bands',
      type: 'string',
      placeholder: '[{"value":0.33,"color":"#22c55e"},{"value":0.66,"color":"#f59e0b"},{"value":1,"color":"#ef4444"}]',
      description: 'chart.configText.array_of_value_0_1_fraction_color_bands_shown_as_outer_arc_markers',
    },
    {
      key: 'showCenterLabel',
      label: 'chart.option.showCentreLabel.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showCentreLabel.description',
    },
    {
      key: 'showPercentage',
      label: 'chart.option.showPercentage.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.showPercentage.description',
    },
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.valueFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_the_displayed_value_and_axis_labels',
    },
  ],
}

import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the measure profile chart type
 */
export const measureProfileChartConfig: ChartTypeConfig = {
  label: 'chart.measureProfile.label',
  description: 'chart.measureProfile.description',
  useCase: 'chart.measureProfile.useCase',
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  dropZones: [
    {
      key: 'yAxis',
      label: 'chart.configText.measures_x_axis_order',
      description: 'chart.configText.add_2_or_more_measures_they_become_the_x_axis_categories_in_the_order_li',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.measureProfile.dropZone.yAxis.empty',
    },
    {
      key: 'series',
      label: 'chart.configText.series_split_into_multiple_lines',
      description: 'chart.configText.dimension_to_split_data_into_separate_profile_lines_e_g_symbol_platform',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.measureProfile.dropZone.series.empty',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'showReferenceLineAtZero',
      label: 'chart.option.showReferenceLineAtZero.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showReferenceLineAtZero.description',
    },
    {
      key: 'showDataLabels',
      label: 'chart.option.showDataLabels.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.configText.display_value_at_each_data_point',
    },
    {
      key: 'showLegend',
      label: 'chart.option.showLegend.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.configText.show_series_legend_only_visible_with_a_series_dimension',
    },
    {
      key: 'lineType',
      label: 'chart.option.lineType.label',
      type: 'select',
      defaultValue: 'monotone',
      options: [
        { value: 'monotone', label: 'chart.option.lineType.smooth' },
        { value: 'linear', label: 'chart.option.lineType.linear' },
        { value: 'step', label: 'chart.option.lineType.step' },
      ],
      description: 'chart.option.lineType.description',
    },
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.yAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_the_y_axis',
    },
  ],
}

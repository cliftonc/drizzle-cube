import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the measure profile chart type
 */
export const measureProfileChartConfig: ChartTypeConfig = {
  label: t('chart.measureProfile.label'),
  description: t('chart.measureProfile.description'),
  useCase: t('chart.measureProfile.useCase'),
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  dropZones: [
    {
      key: 'yAxis',
      label: t('chart.configText.measures_x_axis_order'),
      description: t('chart.configText.add_2_or_more_measures_they_become_the_x_axis_categories_in_the_order_li'),
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop 2+ measures here (displayed left → right)',
    },
    {
      key: 'series',
      label: t('chart.configText.series_split_into_multiple_lines'),
      description: t('chart.configText.dimension_to_split_data_into_separate_profile_lines_e_g_symbol_platform'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension here to create multiple lines',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'showReferenceLineAtZero',
      label: t('chart.option.showReferenceLineAtZero.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showReferenceLineAtZero.description'),
    },
    {
      key: 'showDataLabels',
      label: t('chart.option.showDataLabels.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.configText.display_value_at_each_data_point'),
    },
    {
      key: 'showLegend',
      label: t('chart.option.showLegend.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.configText.show_series_legend_only_visible_with_a_series_dimension'),
    },
    {
      key: 'lineType',
      label: t('chart.option.lineType.label'),
      type: 'select',
      defaultValue: 'monotone',
      options: [
        { value: 'monotone', label: t('chart.option.lineType.smooth') },
        { value: 'linear', label: t('chart.option.lineType.linear') },
        { value: 'step', label: t('chart.option.lineType.step') },
      ],
      description: t('chart.option.lineType.description'),
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.yAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_the_y_axis'),
    },
  ],
}

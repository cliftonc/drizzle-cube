import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the heatmap chart type
 *
 * Heatmap charts visualize intensity across two dimensions as a color matrix.
 * Best for showing patterns in matrix data like correlations, schedules, or category comparisons.
 */
export const heatmapChartConfig: ChartTypeConfig = {
  label: t('chart.heatmap.label'),
  description: t('chart.heatmap.description'),
  useCase: t('chart.heatmap.useCase'),
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.columns_x_axis'),
      description: t('chart.configText.dimension_for_column_categories'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop one dimension here',
    },
    {
      key: 'yAxis',
      label: t('chart.configText.rows_y_axis'),
      description: t('chart.configText.dimension_for_row_categories'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop one dimension here',
    },
    {
      key: 'valueField',
      label: t('chart.configText.value_color_intensity'),
      description: t('chart.configText.measure_that_determines_cell_color'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop one measure here',
    },
  ],
  displayOptions: ['showLegend', 'showTooltip'],
  displayOptionsConfig: [
    {
      key: 'showLabels',
      label: t('chart.option.showLabels.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.showLabels.description'),
    },
    {
      key: 'cellShape',
      label: t('chart.option.cellShape.label'),
      type: 'select',
      defaultValue: 'rect',
      options: [
        { value: 'rect', label: t('chart.option.cellShape.rectangle') },
        { value: 'circle', label: t('chart.option.cellShape.circle') },
      ],
    },
    {
      key: 'xAxisFormat',
      label: t('chart.option.xAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_x_axis_labels'),
    },
    {
      key: 'yAxisFormat',
      label: t('chart.option.yAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_y_axis_labels'),
    },
    {
      key: 'valueFormat',
      label: t('chart.option.valueFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_cell_values_and_legend'),
    },
  ],
  validate: (config) => {
    if (!config.xAxis?.length) return { isValid: false, message: 'X-axis dimension required' }
    if (!config.yAxis?.length) return { isValid: false, message: 'Y-axis dimension required' }
    if (!config.valueField?.length) return { isValid: false, message: 'Value measure required' }
    return { isValid: true }
  },
}

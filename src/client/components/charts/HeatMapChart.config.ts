import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the heatmap chart type
 *
 * Heatmap charts visualize intensity across two dimensions as a color matrix.
 * Best for showing patterns in matrix data like correlations, schedules, or category comparisons.
 */
export const heatmapChartConfig: ChartTypeConfig = {
  label: 'chart.heatmap.label',
  description: 'chart.heatmap.description',
  useCase: 'chart.heatmap.useCase',
  isAvailable: ({ measureCount, dimensionCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    if (dimensionCount < 2) return { available: false, reason: 'chart.availability.requiresTwoDimensions' }
    return { available: true }
  },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.columns_x_axis',
      description: 'chart.configText.dimension_for_column_categories',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.heatmap.dropZone.xAxis.empty',
    },
    {
      key: 'yAxis',
      label: 'chart.configText.rows_y_axis',
      description: 'chart.configText.dimension_for_row_categories',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.heatmap.dropZone.yAxis.empty',
    },
    {
      key: 'valueField',
      label: 'chart.configText.value_color_intensity',
      description: 'chart.configText.measure_that_determines_cell_color',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.heatmap.dropZone.valueField.empty',
    },
  ],
  displayOptions: ['showLegend', 'showTooltip'],
  displayOptionsConfig: [
    {
      key: 'showLabels',
      label: 'chart.option.showLabels.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.showLabels.description',
    },
    {
      key: 'cellShape',
      label: 'chart.option.cellShape.label',
      type: 'select',
      defaultValue: 'rect',
      options: [
        { value: 'rect', label: 'chart.option.cellShape.rectangle' },
        { value: 'circle', label: 'chart.option.cellShape.circle' },
      ],
    },
    {
      key: 'xAxisFormat',
      label: 'chart.option.xAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_x_axis_labels',
    },
    {
      key: 'yAxisFormat',
      label: 'chart.option.yAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_y_axis_labels',
    },
    {
      key: 'valueFormat',
      label: 'chart.option.valueFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_cell_values_and_legend',
    },
  ],
  validate: (config) => {
    if (!config.xAxis?.length) return { isValid: false, message: 'chart.heatmap.validation.xAxisRequired' }
    if (!config.yAxis?.length) return { isValid: false, message: 'chart.heatmap.validation.yAxisRequired' }
    if (!config.valueField?.length) return { isValid: false, message: 'chart.heatmap.validation.valueRequired' }
    return { isValid: true }
  },
}

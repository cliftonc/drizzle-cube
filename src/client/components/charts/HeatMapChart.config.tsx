import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the heatmap chart type
 *
 * Heatmap charts visualize intensity across two dimensions as a color matrix.
 * Best for showing patterns in matrix data like correlations, schedules, or category comparisons.
 */
export const heatmapChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('heatmap'),
  description: 'Visualize intensity across two dimensions',
  useCase: 'Best for showing patterns in matrix data like correlations, schedules, or category comparisons',
  dropZones: [
    {
      key: 'xAxis',
      label: 'Columns (X-Axis)',
      description: 'Dimension for column categories',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop one dimension here',
    },
    {
      key: 'yAxis',
      label: 'Rows (Y-Axis)',
      description: 'Dimension for row categories',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop one dimension here',
    },
    {
      key: 'valueField',
      label: 'Value (Color Intensity)',
      description: 'Measure that determines cell color',
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
      label: 'Show Cell Values',
      type: 'boolean',
      defaultValue: false,
      description: 'Display values inside each cell',
    },
    {
      key: 'cellShape',
      label: 'Cell Shape',
      type: 'select',
      defaultValue: 'rect',
      options: [
        { value: 'rect', label: 'Rectangle' },
        { value: 'circle', label: 'Circle' },
      ],
    },
    {
      key: 'xAxisFormat',
      label: 'X-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for X-axis labels',
    },
    {
      key: 'yAxisFormat',
      label: 'Y-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for Y-axis labels',
    },
    {
      key: 'valueFormat',
      label: 'Value Format',
      type: 'axisFormat',
      description: 'Number formatting for cell values and legend',
    },
  ],
  validate: (config) => {
    if (!config.xAxis?.length) return { isValid: false, message: 'X-axis dimension required' }
    if (!config.yAxis?.length) return { isValid: false, message: 'Y-axis dimension required' }
    if (!config.valueField?.length) return { isValid: false, message: 'Value measure required' }
    return { isValid: true }
  },
}

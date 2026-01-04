import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the line chart type
 */
export const lineChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('line'),
  description: 'Show trends and changes over time',
  useCase: 'Best for continuous data, trends, time series, and showing relationships between multiple series',
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Time/Categories)',
      description: 'Time dimensions or dimensions for X-axis',
      mandatory: true,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop time dimensions or dimensions here'
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Values)',
      description: 'Measures for line values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: 'Series (Multiple Lines)',
      description: 'Dimensions to create separate lines',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here for multiple lines'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'connectNulls',
      label: 'Connect Nulls',
      type: 'boolean',
      defaultValue: false,
      description: 'Draw continuous line through missing data points'
    },
    {
      key: 'target',
      label: 'Target Values',
      type: 'string',
      placeholder: 'e.g., 100 or 50,75 for spread',
      description: 'Single value or comma-separated values to spread across X-axis'
    },
    {
      key: 'priorPeriodStyle',
      label: 'Prior Period Line Style',
      type: 'select',
      defaultValue: 'dashed',
      options: [
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' },
        { value: 'solid', label: 'Solid' }
      ],
      description: 'Line style for prior period in comparison mode'
    },
    {
      key: 'priorPeriodOpacity',
      label: 'Prior Period Opacity',
      type: 'number',
      defaultValue: 0.5,
      min: 0.1,
      max: 1,
      step: 0.1,
      description: 'Opacity for prior period lines (0.1 to 1)'
    },
    {
      key: 'leftYAxisFormat',
      label: 'Left Y-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for left Y-axis'
    },
    {
      key: 'rightYAxisFormat',
      label: 'Right Y-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for right Y-axis'
    }
  ]
}
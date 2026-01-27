import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the bar chart type
 */
export const barChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('bar'),
  description: 'Compare values across categories',
  useCase: 'Best for comparing discrete categories, showing rankings, or displaying changes over time',
  clickableElements: { bar: true },
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Categories)',
      description: 'Dimensions and time dimensions for grouping',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop dimensions & time dimensions here'
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Values)',
      description: 'Measures for bar heights',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: 'Series (Split into Multiple Series)',
      description: 'Dimensions to create separate data series',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here to split data into series'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'stackType',
      label: 'Stacking',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'normal', label: 'Stacked' },
        { value: 'percent', label: 'Stacked 100%' }
      ],
      description: 'How to stack multiple bar series'
    },
    {
      key: 'target',
      label: 'Target Values',
      type: 'string',
      placeholder: 'e.g., 100 or 50,75 for spread',
      description: 'Single value or comma-separated values to spread across X-axis'
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
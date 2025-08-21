import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the line chart type
 */
export const lineChartConfig: ChartTypeConfig = {
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
      emptyText: 'Drop measures here'
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
  displayOptions: ['showLegend', 'showGrid', 'showTooltip']
}
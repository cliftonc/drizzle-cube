import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the bar chart type
 */
export const barChartConfig: ChartTypeConfig = {
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
      emptyText: 'Drop measures here'
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
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'stacked']
}
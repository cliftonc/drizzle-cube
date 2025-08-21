import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the area chart type
 */
export const areaChartConfig: ChartTypeConfig = {
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
      description: 'Measures for area values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here'
    },
    {
      key: 'series',
      label: 'Series (Stack Areas)',
      description: 'Dimensions to create stacked areas',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here for stacked areas'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'stacked']
}
import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the radar chart type
 */
export const radarChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'Axes (Categories)',
      description: 'Dimensions for radar axes',
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions for radar axes'
    },
    {
      key: 'yAxis',
      label: 'Values',
      description: 'Measures for radar values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures for values'
    },
    {
      key: 'series',
      label: 'Series (Multiple Shapes)',
      description: 'Dimensions to create multiple radar shapes',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions for multiple shapes'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip']
}
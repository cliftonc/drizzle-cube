import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the radial bar chart type
 */
export const radialBarChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'Categories',
      description: 'Dimensions for radial segments',
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions for categories'
    },
    {
      key: 'yAxis',
      label: 'Values',
      description: 'Measures for radial bar lengths',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for values'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip']
}
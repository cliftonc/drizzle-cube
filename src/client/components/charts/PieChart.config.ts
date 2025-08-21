import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the pie chart type
 */
export const pieChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'Categories',
      description: 'Dimension for pie slices',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension for categories'
    },
    {
      key: 'yAxis',
      label: 'Values',
      description: 'Measure for slice sizes',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for values'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip']
}
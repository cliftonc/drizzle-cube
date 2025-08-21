import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the treemap chart type
 */
export const treemapChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'Categories',
      description: 'Dimensions for treemap rectangles',
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions for categories'
    },
    {
      key: 'yAxis',
      label: 'Size',
      description: 'Measure for rectangle sizes',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for size'
    },
    {
      key: 'series',
      label: 'Color Groups',
      description: 'Dimension to color rectangles by category',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension for color grouping'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip']
}
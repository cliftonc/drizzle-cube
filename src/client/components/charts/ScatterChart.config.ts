import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the scatter chart type
 */
export const scatterChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis',
      description: 'Measure or dimension for X position',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'Drop a field for X-axis'
    },
    {
      key: 'yAxis',
      label: 'Y-Axis',
      description: 'Measure for Y position',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for Y-axis'
    },
    {
      key: 'series',
      label: 'Series (Color Groups)',
      description: 'Dimension to color points by category',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension to color points'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip']
}
import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the donut chart type
 */
export const donutChartConfig: ChartTypeConfig = {
  label: 'Donut Chart',
  description: 'Show proportions of a whole with a hollow center',
  useCase: 'Best for showing percentage distribution with a clean, modern look (limit to 5-7 slices)',
  clickableElements: { slice: true },
  dropZones: [
    {
      key: 'xAxis',
      label: 'Categories',
      description: 'Dimension for donut slices',
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
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'Value Format',
      type: 'axisFormat',
      description: 'Number formatting for values'
    }
  ]
}

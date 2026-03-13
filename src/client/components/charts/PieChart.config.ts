import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the pie chart type
 */
export const pieChartConfig: ChartTypeConfig = {
  label: 'Pie Chart',
  description: 'Show proportions of a whole',
  useCase: 'Best for showing percentage distribution or composition of a total (limit to 5-7 slices)',
  clickableElements: { slice: true },
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
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'innerRadius',
      label: 'Inner Radius',
      type: 'select',
      description: 'Hollow center size (0% = solid pie, higher = donut style)',
      defaultValue: '0%',
      options: [
        { value: '0%', label: 'None (Pie)' },
        { value: '20%', label: '20%' },
        { value: '40%', label: '40%' },
        { value: '60%', label: '60%' },
        { value: '80%', label: '80%' },
      ]
    },
    {
      key: 'leftYAxisFormat',
      label: 'Value Format',
      type: 'axisFormat',
      description: 'Number formatting for values'
    }
  ]
}
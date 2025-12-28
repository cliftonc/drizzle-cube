import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the radar chart type
 */
export const radarChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('radar'),
  description: 'Compare multiple metrics across categories',
  useCase: 'Best for multivariate comparisons, performance metrics, strengths/weaknesses analysis',
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
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'Value Format',
      type: 'axisFormat',
      description: 'Number formatting for values'
    }
  ]
}
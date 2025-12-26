import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the radial bar chart type
 */
export const radialBarChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('radialBar'),
  description: 'Circular progress and KPI visualization',
  useCase: 'Best for showing progress toward goals, KPIs, or comparing percentages in a compact form',
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
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader']
}
import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the pie chart type
 */
export const pieChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('pie'),
  description: 'Show proportions of a whole',
  useCase: 'Best for showing percentage distribution or composition of a total (limit to 5-7 slices)',
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
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader']
}
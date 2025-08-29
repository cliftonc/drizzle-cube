import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import chartBarIcon from '@iconify-icons/tabler/chart-bar'

/**
 * Configuration for the bar chart type
 */
export const barChartConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={chartBarIcon} className={className} />,
  description: 'Compare values across categories',
  useCase: 'Best for comparing discrete categories, showing rankings, or displaying changes over time',
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Categories)',
      description: 'Dimensions and time dimensions for grouping',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop dimensions & time dimensions here'
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Values)',
      description: 'Measures for bar heights',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here'
    },
    {
      key: 'series',
      label: 'Series (Split into Multiple Series)',
      description: 'Dimensions to create separate data series',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here to split data into series'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'stacked', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'target',
      label: 'Target Values',
      type: 'string',
      placeholder: 'e.g., 100 or 50,75 for spread',
      description: 'Single value or comma-separated values to spread across X-axis'
    }
  ]
}
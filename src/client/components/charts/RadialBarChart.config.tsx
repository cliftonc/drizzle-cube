import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import chartRadarIcon from '@iconify-icons/tabler/radar-2'

/**
 * Configuration for the radial bar chart type
 */
export const radialBarChartConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={chartRadarIcon} className={className} />,
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
  displayOptions: ['showLegend', 'showTooltip']
}
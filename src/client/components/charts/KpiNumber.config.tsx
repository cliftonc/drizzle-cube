import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import chartAreaIcon from '@iconify-icons/tabler/number'

/**
 * Configuration for the KPI Number chart type
 */
export const kpiNumberConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={chartAreaIcon} className={className} />,
  description: 'Display key performance indicators as large numbers',
  useCase: 'Perfect for showing important metrics like revenue, user count, or other key business metrics in a prominent, easy-to-read format',
  dropZones: [
    {
      key: 'yAxis',
      label: 'Value',
      description: 'Measure to display as KPI number',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here'
    }
  ],
  displayOptions: ['prefix', 'suffix', 'decimals']
}
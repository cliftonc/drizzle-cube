import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import textIcon from '@iconify-icons/tabler/typography'

/**
 * Configuration for the KPI Text chart type
 */
export const kpiTextConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={textIcon} className={className} />,
  description: 'Display key performance indicators as customizable text',
  useCase: 'Perfect for showing metrics with custom formatting, combining multiple values, or displaying contextual KPI information using templates',
  dropZones: [
    {
      key: 'yAxis',
      label: 'Value',
      description: 'Measure to display in the KPI text template',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here'
    }
  ],
  displayOptions: ['template', 'decimals']
}
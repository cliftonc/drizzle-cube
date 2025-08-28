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
  displayOptionsConfig: [
    {
      key: 'template',
      label: 'Text Template',
      type: 'string',
      placeholder: 'e.g., Total Revenue: ${value}',
      description: 'Template for displaying the text. Use ${value} to insert the measure value.'
    },
    {
      key: 'decimals',
      label: 'Decimal Places',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10,
      step: 1,
      description: 'Number of decimal places to display for numeric values'
    },
    {
      key: 'valueColor',
      label: 'Value Color',
      type: 'color',
      defaultValue: '#1f2937',
      description: 'Color for the KPI value text'
    }
  ]
}
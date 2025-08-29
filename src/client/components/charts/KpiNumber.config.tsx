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
  displayOptionsConfig: [
    {
      key: 'target',
      label: 'Target Value',
      type: 'string',
      placeholder: 'e.g., 100',
      description: 'Target value to compare against (first value used if multiple provided)'
    },
    {
      key: 'prefix',
      label: 'Prefix',
      type: 'string',
      placeholder: 'e.g., $, €, #',
      description: 'Text to display before the number'
    },
    {
      key: 'suffix',
      label: 'Suffix',
      type: 'string',
      placeholder: 'e.g., %, units, items',
      description: 'Text to display after the number'
    },
    {
      key: 'decimals',
      label: 'Decimal Places',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 10,
      step: 1,
      description: 'Number of decimal places to display'
    },
    {
      key: 'valueColorIndex',
      label: 'Value Color',
      type: 'paletteColor',
      defaultValue: 0,
      description: 'Color from the dashboard palette for the KPI value text'
    }
  ],
  displayOptions: ['hideHeader']
}
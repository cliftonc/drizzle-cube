import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import chartAreaLineIcon from '@iconify-icons/tabler/chart-area-line'

/**
 * Configuration for the area chart type
 */
export const areaChartConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={chartAreaLineIcon} className={className} />,
  description: 'Emphasize magnitude of change over time',
  useCase: 'Best for showing cumulative totals, volume changes, or stacked comparisons over time',
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Time/Categories)',
      description: 'Time dimensions or dimensions for X-axis',
      mandatory: true,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop time dimensions or dimensions here'
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Values)',
      description: 'Measures for area values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here'
    },
    {
      key: 'series',
      label: 'Series (Stack Areas)',
      description: 'Dimensions to create stacked areas',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here for stacked areas'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'stackType',
      label: 'Stacking',
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: 'None' },
        { value: 'normal', label: 'Stacked' },
        { value: 'percent', label: 'Stacked 100%' }
      ],
      description: 'How to stack multiple area series'
    },
    {
      key: 'connectNulls',
      label: 'Connect Nulls',
      type: 'boolean',
      defaultValue: false,
      description: 'Draw continuous line through missing data points'
    },
    {
      key: 'target',
      label: 'Target Values',
      type: 'string',
      placeholder: 'e.g., 100 or 50,75 for spread',
      description: 'Single value or comma-separated values to spread across X-axis'
    }
  ]
}
import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { Icon } from '@iconify/react'
import chartBubbleIcon from '@iconify-icons/tabler/chart-bubble'

/**
 * Configuration for the bubble chart type
 */
export const bubbleChartConfig: ChartTypeConfig = {
  icon: ({ className }) => <Icon icon={chartBubbleIcon} className={className} />,
  description: 'Compare three dimensions of data',
  useCase: 'Best for showing relationships between three variables (X, Y, and size), market analysis',
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis',
      description: 'Horizontal axis position',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'Drop a field for X-axis position'
    },
    {
      key: 'yAxis',
      label: 'Y-Axis', 
      description: 'Vertical axis position',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for Y-axis position'
    },
    {
      key: 'sizeField',
      label: 'Bubble Radius',
      description: 'Size of bubbles based on this measure',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for bubble size'
    },
    {
      key: 'series',
      label: 'Bubble Labels',
      description: 'Field to use for bubble labels and identification',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension for bubble labels'
    },
    {
      key: 'colorField',
      label: 'Bubble Colour',
      description: 'Color bubbles by this field (optional)',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension', 'measure'],
      emptyText: 'Drop a field for bubble color (optional)'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'minBubbleSize', 'maxBubbleSize', 'bubbleOpacity']
}
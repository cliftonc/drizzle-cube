/**
 * RetentionCombinedChart Configuration
 *
 * The RetentionCombinedChart visualizes retention analysis data with multiple display modes.
 * It auto-configures from retention data and provides display mode selection.
 */

import type { ChartTypeConfig } from '../../charts/chartConfigs'

export const retentionCombinedConfig: ChartTypeConfig = {
  // RetentionCombinedChart auto-configures from the retention data structure
  // No drop zones needed as the chart maps directly to retention result data
  dropZones: [],

  // Display options
  displayOptionsConfig: [
    {
      key: 'retentionDisplayMode',
      label: 'Display Mode',
      type: 'select',
      defaultValue: 'line',
      options: [
        { value: 'line', label: 'Line Chart' },
        { value: 'heatmap', label: 'Heatmap Table' },
        { value: 'combined', label: 'Combined' },
      ],
      description: 'Choose how to visualize retention data',
    },
    {
      key: 'showLegend',
      label: 'Show Legend',
      type: 'boolean',
      defaultValue: true,
      description: 'Show the legend for breakdown segments',
    },
    {
      key: 'showGrid',
      label: 'Show Grid',
      type: 'boolean',
      defaultValue: true,
      description: 'Show grid lines on the chart',
    },
    {
      key: 'showTooltip',
      label: 'Show Tooltip',
      type: 'boolean',
      defaultValue: true,
      description: 'Show tooltip on hover with detailed stats',
    },
  ],

  description: 'Combined retention visualization with line chart and heatmap modes',
  useCase: 'Visualize user retention over time with optional breakdown segmentation',
}

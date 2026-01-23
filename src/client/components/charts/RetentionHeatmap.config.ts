/**
 * RetentionHeatmap Chart Configuration
 *
 * The RetentionHeatmap is a specialized chart for retention analysis.
 * It auto-configures from retention data and doesn't need typical axis configuration.
 */

import type { ChartTypeConfig } from '../../charts/chartConfigs'

export const retentionHeatmapConfig: ChartTypeConfig = {
  // RetentionHeatmap auto-configures from the retention data structure
  // No drop zones needed as the chart maps directly to cohort × period matrix
  dropZones: [],

  // Display options
  displayOptionsConfig: [
    {
      key: 'showLegend',
      label: 'Show Legend',
      type: 'boolean',
      defaultValue: true,
      description: 'Show the color intensity legend',
    },
    {
      key: 'showTooltip',
      label: 'Show Tooltip',
      type: 'boolean',
      defaultValue: true,
      description: 'Show tooltip on hover with detailed stats',
    },
  ],

  description: 'Cohort retention matrix visualization',
  useCase: 'Visualize user retention over time by cohort',
}

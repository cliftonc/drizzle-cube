/**
 * RetentionHeatmap Chart Configuration
 *
 * The RetentionHeatmap is a specialized chart for retention analysis.
 * It auto-configures from retention data and doesn't need typical axis configuration.
 */

import type { ChartTypeConfig } from '../../charts/chartConfigs'

export const retentionHeatmapConfig: ChartTypeConfig = {
  label: 'chart.retentionHeatmap.label',
  // RetentionHeatmap auto-configures from the retention data structure
  // No drop zones needed as the chart maps directly to cohort × period matrix
  dropZones: [],

  // Display options
  displayOptionsConfig: [
    {
      key: 'showLegend',
      label: 'chart.option.showLegend.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.configText.show_the_color_intensity_legend',
    },
    {
      key: 'showTooltip',
      label: 'chart.option.showTooltip.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showTooltip.description',
    },
  ],

  description: 'chart.retentionHeatmap.description',
  useCase: 'chart.retentionHeatmap.useCase',
}

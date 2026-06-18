/**
 * RetentionCombinedChart Configuration
 *
 * The RetentionCombinedChart visualizes retention analysis data with multiple display modes.
 * It auto-configures from retention data and provides display mode selection.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */

import type { ChartTypeConfig } from '../../charts/chartConfigs.js'

export const retentionCombinedConfig: ChartTypeConfig = {
  // RetentionCombinedChart auto-configures from the retention data structure
  // No drop zones needed as the chart maps directly to retention result data
  dropZones: [],

  // Display options
  displayOptionsConfig: [
    {
      key: 'retentionDisplayMode',
      label: 'chart.option.retentionDisplayMode.label',
      type: 'select',
      defaultValue: 'line',
      options: [
        { value: 'line', label: 'chart.option.retentionDisplayMode.lineChart' },
        { value: 'heatmap', label: 'chart.option.retentionDisplayMode.heatmapTable' },
        { value: 'combined', label: 'chart.option.retentionDisplayMode.combined' },
      ],
      description: 'chart.configText.choose_how_to_visualize_retention_data',
    },
    {
      key: 'showLegend',
      label: 'chart.option.showLegend.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.configText.show_the_legend_for_breakdown_segments',
    },
    {
      key: 'showGrid',
      label: 'chart.option.showGrid.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showGrid.description',
    },
    {
      key: 'showTooltip',
      label: 'chart.option.showTooltip.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showTooltip.description',
    },
  ],
}

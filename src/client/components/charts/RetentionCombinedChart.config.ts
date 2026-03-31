/**
 * RetentionCombinedChart Configuration
 *
 * The RetentionCombinedChart visualizes retention analysis data with multiple display modes.
 * It auto-configures from retention data and provides display mode selection.
 */

import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

export const retentionCombinedConfig: ChartTypeConfig = {
  label: t('chart.retentionCombined.label'),
  // RetentionCombinedChart auto-configures from the retention data structure
  // No drop zones needed as the chart maps directly to retention result data
  dropZones: [],

  // Display options
  displayOptionsConfig: [
    {
      key: 'retentionDisplayMode',
      label: t('chart.option.retentionDisplayMode.label'),
      type: 'select',
      defaultValue: 'line',
      options: [
        { value: 'line', label: t('chart.option.retentionDisplayMode.lineChart') },
        { value: 'heatmap', label: t('chart.option.retentionDisplayMode.heatmapTable') },
        { value: 'combined', label: t('chart.option.retentionDisplayMode.combined') },
      ],
      description: t('chart.configText.choose_how_to_visualize_retention_data'),
    },
    {
      key: 'showLegend',
      label: t('chart.option.showLegend.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.configText.show_the_legend_for_breakdown_segments'),
    },
    {
      key: 'showGrid',
      label: t('chart.option.showGrid.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showGrid.description'),
    },
    {
      key: 'showTooltip',
      label: t('chart.option.showTooltip.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showTooltip.description'),
    },
  ],

  description: t('chart.retentionCombined.description'),
  useCase: t('chart.retentionCombined.useCase'),
}

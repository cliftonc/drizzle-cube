/**
 * RetentionHeatmap Chart Configuration
 *
 * The RetentionHeatmap is a specialized chart for retention analysis.
 * It auto-configures from retention data and doesn't need typical axis configuration.
 */

import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

export const retentionHeatmapConfig: ChartTypeConfig = {
  label: t('chart.retentionHeatmap.label'),
  // RetentionHeatmap auto-configures from the retention data structure
  // No drop zones needed as the chart maps directly to cohort × period matrix
  dropZones: [],

  // Display options
  displayOptionsConfig: [
    {
      key: 'showLegend',
      label: t('chart.option.showLegend.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.configText.show_the_color_intensity_legend'),
    },
    {
      key: 'showTooltip',
      label: t('chart.option.showTooltip.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showTooltip.description'),
    },
  ],

  description: t('chart.retentionHeatmap.description'),
  useCase: t('chart.retentionHeatmap.useCase'),
}

import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the sunburst chart type
 *
 * Sunburst charts visualize hierarchical flow data as concentric rings.
 * They work with the same flow data as Sankey but show only "after" steps
 * radiating outward from the central starting step.
 */
export const sunburstChartConfig: ChartTypeConfig = {
  label: t('chart.sunburst.label'),
  description: t('chart.sunburst.description'),
  useCase: t('chart.sunburst.useCase'),
  dropZones: [
    // Sunburst charts work with pre-calculated flow data like Sankey
    {
      key: 'xAxis',
      label: t('chart.configText.event_type'),
      description: t('chart.configText.event_dimension_that_categorizes_flow_nodes'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Auto-populated from flow config',
    },
    {
      key: 'yAxis',
      label: t('chart.configText.flow_count'),
      description: t('chart.configText.count_of_entities_following_each_path'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Calculated from flow execution',
    },
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'innerRadius',
      label: t('chart.option.innerRadius.label'),
      type: 'number',
      defaultValue: 40,
      min: 0,
      max: 100,
      step: 10,
      description: t('chart.configText.size_of_the_center_hole_0_for_full_circle'),
    },
    {
      key: 'hideSummaryFooter',
      label: t('chart.option.hideSummaryFooter.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.configText.hide_the_statistics_footer_below_the_chart'),
    },
  ],
}

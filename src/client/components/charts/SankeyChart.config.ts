import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the sankey chart type
 *
 * Sankey charts visualize flow data between nodes.
 * They work with data from flow queries which provide
 * nodes and links representing user journeys.
 */
export const sankeyChartConfig: ChartTypeConfig = {
  label: t('chart.sankey.label'),
  description: t('chart.sankey.description'),
  useCase: t('chart.sankey.useCase'),
  dropZones: [
    // Sankey charts don't use traditional drop zones since they work with
    // pre-calculated flow data from flow queries. The nodes and links are
    // generated from the flow configuration.
    {
      key: 'xAxis',
      label: t('chart.configText.event_type'),
      description: t('chart.configText.event_dimension_that_categorizes_flow_nodes'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Auto-populated from flow config'
    },
    {
      key: 'yAxis',
      label: t('chart.configText.flow_count'),
      description: t('chart.configText.count_of_entities_following_each_path'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Calculated from flow execution'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'linkOpacity',
      label: t('chart.option.linkOpacity.label'),
      type: 'buttonGroup',
      defaultValue: '0.5',
      options: [
        { value: '0.3', label: t('chart.option.linkOpacity.light') },
        { value: '0.5', label: t('chart.option.fontSize.medium') },
        { value: '0.7', label: t('chart.option.linkOpacity.dark') }
      ],
      description: t('chart.configText.opacity_of_flow_links')
    },
    {
      key: 'showNodeLabels',
      label: t('chart.option.showNodeLabels.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showNodeLabels.description')
    },
    {
      key: 'hideSummaryFooter',
      label: t('chart.option.hideSummaryFooter.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.configText.hide_the_statistics_footer_below_the_chart')
    }
  ]
}

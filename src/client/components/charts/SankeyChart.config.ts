import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the sankey chart type
 *
 * Sankey charts visualize flow data between nodes.
 * They work with data from flow queries which provide
 * nodes and links representing user journeys.
 */
export const sankeyChartConfig: ChartTypeConfig = {
  label: 'chart.sankey.label',
  description: 'chart.sankey.description',
  useCase: 'chart.sankey.useCase',
  dropZones: [
    // Sankey charts don't use traditional drop zones since they work with
    // pre-calculated flow data from flow queries. The nodes and links are
    // generated from the flow configuration.
    {
      key: 'xAxis',
      label: 'chart.configText.event_type',
      description: 'chart.configText.event_dimension_that_categorizes_flow_nodes',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.sankey.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.flow_count',
      description: 'chart.configText.count_of_entities_following_each_path',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.sankey.dropZone.yAxis.empty'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'linkOpacity',
      label: 'chart.option.linkOpacity.label',
      type: 'buttonGroup',
      defaultValue: '0.5',
      options: [
        { value: '0.3', label: 'chart.option.linkOpacity.light' },
        { value: '0.5', label: 'chart.option.fontSize.medium' },
        { value: '0.7', label: 'chart.option.linkOpacity.dark' }
      ],
      description: 'chart.configText.opacity_of_flow_links'
    },
    {
      key: 'showNodeLabels',
      label: 'chart.option.showNodeLabels.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showNodeLabels.description'
    },
    {
      key: 'hideSummaryFooter',
      label: 'chart.option.hideSummaryFooter.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.configText.hide_the_statistics_footer_below_the_chart'
    }
  ]
}

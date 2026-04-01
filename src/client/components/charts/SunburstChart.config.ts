import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the sunburst chart type
 *
 * Sunburst charts visualize hierarchical flow data as concentric rings.
 * They work with the same flow data as Sankey but show only "after" steps
 * radiating outward from the central starting step.
 */
export const sunburstChartConfig: ChartTypeConfig = {
  label: 'chart.sunburst.label',
  description: 'chart.sunburst.description',
  useCase: 'chart.sunburst.useCase',
  dropZones: [
    // Sunburst charts work with pre-calculated flow data like Sankey
    {
      key: 'xAxis',
      label: 'chart.configText.event_type',
      description: 'chart.configText.event_dimension_that_categorizes_flow_nodes',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.sunburst.dropZone.xAxis.empty',
    },
    {
      key: 'yAxis',
      label: 'chart.configText.flow_count',
      description: 'chart.configText.count_of_entities_following_each_path',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.sunburst.dropZone.yAxis.empty',
    },
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'innerRadius',
      label: 'chart.option.innerRadius.label',
      type: 'number',
      defaultValue: 40,
      min: 0,
      max: 100,
      step: 10,
      description: 'chart.configText.size_of_the_center_hole_0_for_full_circle',
    },
    {
      key: 'hideSummaryFooter',
      label: 'chart.option.hideSummaryFooter.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.configText.hide_the_statistics_footer_below_the_chart',
    },
  ],
}

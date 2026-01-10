import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the sunburst chart type
 *
 * Sunburst charts visualize hierarchical flow data as concentric rings.
 * They work with the same flow data as Sankey but show only "after" steps
 * radiating outward from the central starting step.
 */
export const sunburstChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('sunburst'),
  description: 'Show hierarchical flow as radial rings',
  useCase: 'Best for visualizing forward paths from a starting event in a compact radial layout',
  dropZones: [
    // Sunburst charts work with pre-calculated flow data like Sankey
    {
      key: 'xAxis',
      label: 'Event Type',
      description: 'Event dimension that categorizes flow nodes',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Auto-populated from flow config',
    },
    {
      key: 'yAxis',
      label: 'Flow Count',
      description: 'Count of entities following each path',
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
      label: 'Inner Radius',
      type: 'number',
      defaultValue: 40,
      min: 0,
      max: 100,
      step: 10,
      description: 'Size of the center hole (0 for full circle)',
    },
    {
      key: 'hideSummaryFooter',
      label: 'Hide Summary Footer',
      type: 'boolean',
      defaultValue: true,
      description: 'Hide the statistics footer below the chart',
    },
  ],
}

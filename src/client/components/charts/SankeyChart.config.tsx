import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the sankey chart type
 *
 * Sankey charts visualize flow data between nodes.
 * They work with data from flow queries which provide
 * nodes and links representing user journeys.
 */
export const sankeyChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('sankey'),
  description: 'Show flow between states or steps',
  useCase: 'Best for visualizing user journey flows, path analysis, or state transitions',
  dropZones: [
    // Sankey charts don't use traditional drop zones since they work with
    // pre-calculated flow data from flow queries. The nodes and links are
    // generated from the flow configuration.
    {
      key: 'xAxis',
      label: 'Event Type',
      description: 'Event dimension that categorizes flow nodes',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Auto-populated from flow config'
    },
    {
      key: 'yAxis',
      label: 'Flow Count',
      description: 'Count of entities following each path',
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
      label: 'Link Opacity',
      type: 'buttonGroup',
      defaultValue: '0.5',
      options: [
        { value: '0.3', label: 'Light' },
        { value: '0.5', label: 'Medium' },
        { value: '0.7', label: 'Dark' }
      ],
      description: 'Opacity of flow links'
    },
    {
      key: 'showNodeLabels',
      label: 'Show Node Labels',
      type: 'boolean',
      defaultValue: true,
      description: 'Display labels on flow nodes'
    },
    {
      key: 'hideSummaryFooter',
      label: 'Hide Summary Footer',
      type: 'boolean',
      defaultValue: true,
      description: 'Hide the statistics footer below the chart'
    }
  ]
}

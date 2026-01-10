import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the funnel chart type
 *
 * Funnel charts visualize sequential conversion data.
 * They work with data from useFunnelQuery which provides
 * pre-calculated step names, values, and conversion rates.
 */
export const funnelChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('funnel'),
  description: 'Show conversion through sequential steps',
  useCase: 'Best for visualizing user journey funnels, sales pipelines, or multi-step processes',
  dropZones: [
    // Funnel charts don't use traditional drop zones since they work with
    // pre-calculated funnel data from useFunnelQuery. The steps are defined
    // in the funnel configuration, not through drag-and-drop.
    // However, we keep xAxis and yAxis for compatibility with chart system.
    {
      key: 'xAxis',
      label: 'Step Name',
      description: 'Step names (auto-populated from funnel steps)',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Steps defined in funnel config'
    },
    {
      key: 'yAxis',
      label: 'Step Count',
      description: 'Count at each step (auto-calculated)',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Counts calculated from funnel execution'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'funnelStyle',
      label: 'Funnel Style',
      type: 'buttonGroup',
      defaultValue: 'bars',
      options: [
        { value: 'bars', label: 'Bars' },
        { value: 'funnel', label: 'Funnel' }
      ],
      description: 'Visualization style'
    },
    {
      key: 'funnelOrientation',
      label: 'Orientation',
      type: 'buttonGroup',
      defaultValue: 'horizontal',
      options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' }
      ]
    },
    {
      key: 'hideSummaryFooter',
      label: 'Hide Summary Footer',
      type: 'boolean',
      defaultValue: false,
      description: 'Hide the summary footer showing steps count and overall conversion'
    },
    {
      key: 'showFunnelConversion',
      label: 'Show Conversion Rate',
      type: 'boolean',
      defaultValue: true,
      description: 'Display step-to-step conversion percentage'
    },
    {
      key: 'showFunnelAvgTime',
      label: 'Show Avg Time',
      type: 'boolean',
      defaultValue: false,
      description: 'Display average time to convert'
    },
    {
      key: 'showFunnelMedianTime',
      label: 'Show Median Time',
      type: 'boolean',
      defaultValue: false,
      description: 'Display median time to convert'
    },
    {
      key: 'showFunnelP90Time',
      label: 'Show P90 Time',
      type: 'boolean',
      defaultValue: false,
      description: 'Display 90th percentile time to convert'
    }
  ]
}

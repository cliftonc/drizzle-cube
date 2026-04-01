import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the funnel chart type
 *
 * Funnel charts visualize sequential conversion data.
 * They work with data from useFunnelQuery which provides
 * pre-calculated step names, values, and conversion rates.
 */
export const funnelChartConfig: ChartTypeConfig = {
  label: 'chart.funnel.label',
  description: 'chart.funnel.description',
  useCase: 'chart.funnel.useCase',
  dropZones: [
    // Funnel charts don't use traditional drop zones since they work with
    // pre-calculated funnel data from useFunnelQuery. The steps are defined
    // in the funnel configuration, not through drag-and-drop.
    // However, we keep xAxis and yAxis for compatibility with chart system.
    {
      key: 'xAxis',
      label: 'chart.configText.step_name',
      description: 'chart.configText.step_names_auto_populated_from_funnel_steps',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.funnel.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.step_count',
      description: 'chart.configText.count_at_each_step_auto_calculated',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.funnel.dropZone.yAxis.empty'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'funnelStyle',
      label: 'chart.option.funnelStyle.label',
      type: 'buttonGroup',
      defaultValue: 'bars',
      options: [
        { value: 'bars', label: 'chart.option.funnelStyle.bars' },
        { value: 'funnel', label: 'chart.option.funnelStyle.funnel' }
      ],
      description: 'chart.configText.visualization_style'
    },
    {
      key: 'funnelOrientation',
      label: 'chart.option.funnelOrientation.label',
      type: 'buttonGroup',
      defaultValue: 'horizontal',
      options: [
        { value: 'horizontal', label: 'chart.option.funnelOrientation.horizontal' },
        { value: 'vertical', label: 'chart.option.funnelOrientation.vertical' }
      ]
    },
    {
      key: 'hideSummaryFooter',
      label: 'chart.option.hideSummaryFooter.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.hideSummaryFooter.description'
    },
    {
      key: 'showFunnelConversion',
      label: 'chart.option.showConversion.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showConversion.description'
    },
    {
      key: 'showFunnelAvgTime',
      label: 'chart.option.showAvgTime.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.showAvgTime.description'
    },
    {
      key: 'showFunnelMedianTime',
      label: 'chart.option.showMedianTime.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.showMedianTime.description'
    },
    {
      key: 'showFunnelP90Time',
      label: 'chart.option.showP90Time.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.showP90Time.description'
    }
  ]
}

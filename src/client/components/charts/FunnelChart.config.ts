import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the funnel chart type
 *
 * Funnel charts visualize sequential conversion data.
 * They work with data from useFunnelQuery which provides
 * pre-calculated step names, values, and conversion rates.
 */
export const funnelChartConfig: ChartTypeConfig = {
  label: t('chart.funnel.label'),
  description: t('chart.funnel.description'),
  useCase: t('chart.funnel.useCase'),
  dropZones: [
    // Funnel charts don't use traditional drop zones since they work with
    // pre-calculated funnel data from useFunnelQuery. The steps are defined
    // in the funnel configuration, not through drag-and-drop.
    // However, we keep xAxis and yAxis for compatibility with chart system.
    {
      key: 'xAxis',
      label: t('chart.configText.step_name'),
      description: t('chart.configText.step_names_auto_populated_from_funnel_steps'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Steps defined in funnel config'
    },
    {
      key: 'yAxis',
      label: t('chart.configText.step_count'),
      description: t('chart.configText.count_at_each_step_auto_calculated'),
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
      label: t('chart.option.funnelStyle.label'),
      type: 'buttonGroup',
      defaultValue: 'bars',
      options: [
        { value: 'bars', label: t('chart.option.funnelStyle.bars') },
        { value: 'funnel', label: t('chart.option.funnelStyle.funnel') }
      ],
      description: t('chart.configText.visualization_style')
    },
    {
      key: 'funnelOrientation',
      label: t('chart.option.funnelOrientation.label'),
      type: 'buttonGroup',
      defaultValue: 'horizontal',
      options: [
        { value: 'horizontal', label: t('chart.option.funnelOrientation.horizontal') },
        { value: 'vertical', label: t('chart.option.funnelOrientation.vertical') }
      ]
    },
    {
      key: 'hideSummaryFooter',
      label: t('chart.option.hideSummaryFooter.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.hideSummaryFooter.description')
    },
    {
      key: 'showFunnelConversion',
      label: t('chart.option.showConversion.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showConversion.description')
    },
    {
      key: 'showFunnelAvgTime',
      label: t('chart.option.showAvgTime.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.showAvgTime.description')
    },
    {
      key: 'showFunnelMedianTime',
      label: t('chart.option.showMedianTime.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.showMedianTime.description')
    },
    {
      key: 'showFunnelP90Time',
      label: t('chart.option.showP90Time.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.showP90Time.description')
    }
  ]
}

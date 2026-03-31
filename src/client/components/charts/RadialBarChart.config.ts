import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the radial bar chart type
 */
export const radialBarChartConfig: ChartTypeConfig = {
  label: t('chart.radialBar.label'),
  description: t('chart.radialBar.description'),
  useCase: t('chart.radialBar.useCase'),
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.categories'),
      description: t('chart.configText.dimensions_for_radial_segments'),
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions for categories'
    },
    {
      key: 'yAxis',
      label: t('chart.configText.values'),
      description: t('chart.configText.measures_for_radial_bar_lengths'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for values'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.valueFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.valueFormat.description')
    }
  ]
}
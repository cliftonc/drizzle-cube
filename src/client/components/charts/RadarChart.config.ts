import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the radar chart type
 */
export const radarChartConfig: ChartTypeConfig = {
  label: t('chart.radar.label'),
  description: t('chart.radar.description'),
  useCase: t('chart.radar.useCase'),
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.axes_categories'),
      description: t('chart.configText.dimensions_for_radar_axes'),
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions for radar axes'
    },
    {
      key: 'yAxis',
      label: t('chart.configText.values'),
      description: t('chart.configText.measures_for_radar_values'),
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures for values'
    },
    {
      key: 'series',
      label: t('chart.configText.series_multiple_shapes'),
      description: t('chart.configText.dimensions_to_create_multiple_radar_shapes'),
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions for multiple shapes'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.valueFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.valueFormat.description')
    }
  ]
}
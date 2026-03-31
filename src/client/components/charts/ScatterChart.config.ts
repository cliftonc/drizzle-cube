import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the scatter chart type
 */
export const scatterChartConfig: ChartTypeConfig = {
  label: t('chart.scatter.label'),
  description: t('chart.scatter.description'),
  useCase: t('chart.scatter.useCase'),
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.runtime.axisFormat.xAxis'),
      description: t('chart.configText.measure_or_dimension_for_x_position'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'Drop a field for X-axis'
    },
    {
      key: 'yAxis',
      label: t('chart.configText.y_axis'),
      description: t('chart.configText.measure_for_y_position'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for Y-axis'
    },
    {
      key: 'series',
      label: t('chart.configText.series_color_groups'),
      description: t('chart.configText.dimension_to_color_points_by_category'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension to color points'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'xAxisFormat',
      label: t('chart.option.xAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.xAxisFormat.description')
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.yAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.yAxisFormat.description')
    }
  ]
}
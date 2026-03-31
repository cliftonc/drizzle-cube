import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the area chart type
 */
export const areaChartConfig: ChartTypeConfig = {
  label: t('chart.area.label'),
  description: t('chart.area.description'),
  useCase: t('chart.area.useCase'),
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.x_axis_time_categories'),
      description: t('chart.configText.time_dimensions_or_dimensions_for_x_axis'),
      mandatory: true,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop time dimensions or dimensions here'
    },
    {
      key: 'yAxis',
      label: t('chart.dropZone.yAxis.label'),
      description: t('chart.configText.measures_for_area_values'),
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: t('chart.configText.series_stack_areas'),
      description: t('chart.configText.dimensions_to_create_stacked_areas'),
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here for stacked areas'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'stackType',
      label: t('chart.option.stacking.label'),
      type: 'select',
      defaultValue: 'none',
      options: [
        { value: 'none', label: t('chart.option.accentBorder.none') },
        { value: 'normal', label: t('chart.option.stacking.stacked') },
        { value: 'percent', label: t('chart.option.stacking.percent') }
      ],
      description: t('chart.configText.how_to_stack_multiple_area_series')
    },
    {
      key: 'connectNulls',
      label: t('chart.option.connectNulls.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.option.connectNulls.description')
    },
    {
      key: 'target',
      label: t('chart.option.target.label'),
      type: 'string',
      placeholder: 'e.g., 100 or 50,75 for spread',
      description: t('chart.option.target.description')
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.leftYAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.leftYAxisFormat.description')
    },
    {
      key: 'rightYAxisFormat',
      label: t('chart.option.rightYAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.rightYAxisFormat.description')
    }
  ]
}
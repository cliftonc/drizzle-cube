import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the bar chart type
 */
export const barChartConfig: ChartTypeConfig = {
  label: t('chart.bar.label'),
  description: t('chart.bar.description'),
  useCase: t('chart.bar.useCase'),
  clickableElements: { bar: true },
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.dropZone.xAxis.label'),
      description: t('chart.dropZone.xAxis.description'),
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop dimensions & time dimensions here'
    },
    {
      key: 'yAxis',
      label: t('chart.dropZone.yAxis.label'),
      description: t('chart.configText.measures_for_bar_heights'),
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'Drop measures here',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: t('chart.dropZone.series.label'),
      description: t('chart.dropZone.series.description'),
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimensions here to split data into series'
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
      description: t('chart.configText.how_to_stack_multiple_bar_series')
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
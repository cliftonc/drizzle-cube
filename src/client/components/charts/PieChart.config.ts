import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the pie chart type
 */
export const pieChartConfig: ChartTypeConfig = {
  label: t('chart.pie.label'),
  description: t('chart.pie.description'),
  useCase: t('chart.pie.useCase'),
  clickableElements: { slice: true },
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.categories'),
      description: t('chart.configText.dimension_for_pie_slices'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension for categories'
    },
    {
      key: 'yAxis',
      label: t('chart.configText.values'),
      description: t('chart.configText.measure_for_slice_sizes'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for values'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'innerRadius',
      label: t('chart.option.innerRadius.label'),
      type: 'select',
      description: t('chart.configText.hollow_center_size_0_percent_solid_pie_higher_donut_style'),
      defaultValue: '0%',
      options: [
        { value: '0%', label: t('chart.configText.none_pie') },
        { value: '20%', label: t('chart.configText.20_percent') },
        { value: '40%', label: t('chart.configText.40_percent') },
        { value: '60%', label: t('chart.configText.60_percent') },
        { value: '80%', label: t('chart.configText.80_percent') },
      ]
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.valueFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.valueFormat.description')
    }
  ]
}
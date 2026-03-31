import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the waterfall chart type
 */
export const waterfallChartConfig: ChartTypeConfig = {
  label: t('chart.waterfall.label'),
  description: t('chart.waterfall.description'),
  useCase: t('chart.waterfall.useCase'),
  clickableElements: { bar: true },
  displayOptions: ['showTooltip', 'hideHeader'],
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.dropZone.xAxis.label'),
      description: t('chart.configText.dimension_labels_for_each_bar_segment_e_g_symbol_transaction_type'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop a dimension here',
    },
    {
      key: 'yAxis',
      label: t('chart.configText.y_axis_value'),
      description: t('chart.configText.single_measure_whose_values_are_summed_cumulatively'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure here',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'showTotal',
      label: t('chart.option.showTotal.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showTotal.description'),
    },
    {
      key: 'showConnectorLine',
      label: t('chart.option.showConnectorLine.label'),
      type: 'boolean',
      defaultValue: true,
      description: t('chart.option.showConnectorLine.description'),
    },
    {
      key: 'showDataLabels',
      label: t('chart.option.showDataLabels.label'),
      type: 'boolean',
      defaultValue: false,
      description: t('chart.configText.display_the_value_above_each_bar_segment'),
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.yAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_the_y_axis'),
    },
  ],
}

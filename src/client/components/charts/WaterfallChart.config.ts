import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the waterfall chart type
 */
export const waterfallChartConfig: ChartTypeConfig = {
  label: 'chart.waterfall.label',
  description: 'chart.waterfall.description',
  useCase: 'chart.waterfall.useCase',
  clickableElements: { bar: true },
  isAvailable: ({ measureCount, dimensionCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
    return { available: true }
  },
  displayOptions: ['showTooltip', 'hideHeader'],
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.dropZone.xAxis.label',
      description: 'chart.configText.dimension_labels_for_each_bar_segment_e_g_symbol_transaction_type',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.waterfall.dropZone.xAxis.empty',
    },
    {
      key: 'yAxis',
      label: 'chart.configText.y_axis_value',
      description: 'chart.configText.single_measure_whose_values_are_summed_cumulatively',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.waterfall.dropZone.yAxis.empty',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'showTotal',
      label: 'chart.option.showTotal.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showTotal.description',
    },
    {
      key: 'showConnectorLine',
      label: 'chart.option.showConnectorLine.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showConnectorLine.description',
    },
    {
      key: 'showDataLabels',
      label: 'chart.option.showDataLabels.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.configText.display_the_value_above_each_bar_segment',
    },
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.yAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_the_y_axis',
    },
  ],
}

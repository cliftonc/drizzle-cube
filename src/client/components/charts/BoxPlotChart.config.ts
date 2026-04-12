import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the box plot chart type
 */
export const boxPlotChartConfig: ChartTypeConfig = {
  label: 'chart.boxPlot.label',
  description: 'chart.boxPlot.description',
  useCase: 'chart.boxPlot.useCase',
  isAvailable: ({ measureCount, dimensionCount }) => {
    if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
    if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
    return { available: true }
  },
  displayOptions: ['hideHeader'],
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.x_axis_groups',
      description: 'chart.configText.dimension_to_group_boxes_by_e_g_symbol_platform',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.boxPlot.dropZone.xAxis.empty',
    },
    {
      key: 'yAxis',
      label: 'chart.configText.y_axis_measures',
      description: 'chart.configText.drop_1_measure_for_auto_mode_3_for_avg_stddev_median_mode_or_5_for_min_q',
      mandatory: true,
      maxItems: 5,
      acceptTypes: ['measure'],
      emptyText: 'chart.boxPlot.dropZone.yAxis.empty',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.yAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_the_value_axis',
    },
  ],
}

import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the box plot chart type
 */
export const boxPlotChartConfig: ChartTypeConfig = {
  label: t('chart.boxPlot.label'),
  description: t('chart.boxPlot.description'),
  useCase: t('chart.boxPlot.useCase'),
  displayOptions: ['hideHeader'],
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.configText.x_axis_groups'),
      description: t('chart.configText.dimension_to_group_boxes_by_e_g_symbol_platform'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop a dimension here',
    },
    {
      key: 'yAxis',
      label: t('chart.configText.y_axis_measures'),
      description: t('chart.configText.drop_1_measure_for_auto_mode_3_for_avg_stddev_median_mode_or_5_for_min_q'),
      mandatory: true,
      maxItems: 5,
      acceptTypes: ['measure'],
      emptyText: 'Drop 1, 3, or 5 measures here',
    },
  ],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.yAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_the_value_axis'),
    },
  ],
}

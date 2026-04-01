import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the scatter chart type
 */
export const scatterChartConfig: ChartTypeConfig = {
  label: 'chart.scatter.label',
  description: 'chart.scatter.description',
  useCase: 'chart.scatter.useCase',
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.runtime.axisFormat.xAxis',
      description: 'chart.configText.measure_or_dimension_for_x_position',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'chart.scatter.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.y_axis',
      description: 'chart.configText.measure_for_y_position',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.scatter.dropZone.yAxis.empty'
    },
    {
      key: 'series',
      label: 'chart.configText.series_color_groups',
      description: 'chart.configText.dimension_to_color_points_by_category',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.scatter.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'xAxisFormat',
      label: 'chart.option.xAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.option.xAxisFormat.description'
    },
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.yAxisFormat.label',
      type: 'axisFormat',
      description: 'chart.option.yAxisFormat.description'
    }
  ]
}
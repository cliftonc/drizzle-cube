import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the treemap chart type
 */
export const treemapChartConfig: ChartTypeConfig = {
  label: 'chart.treemap.label',
  description: 'chart.treemap.description',
  useCase: 'chart.treemap.useCase',
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.categories',
      description: 'chart.configText.dimensions_for_treemap_rectangles',
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'chart.treemap.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.size',
      description: 'chart.configText.measure_for_rectangle_sizes',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.treemap.dropZone.yAxis.empty'
    },
    {
      key: 'series',
      label: 'chart.configText.color_groups',
      description: 'chart.configText.dimension_to_color_rectangles_by_category',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.treemap.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.valueFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_size_values'
    }
  ],
  clickableElements: { cell: true }
}
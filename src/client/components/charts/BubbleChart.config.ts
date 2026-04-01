import type { ChartTypeConfig } from '../../charts/chartConfigs'

/**
 * Configuration for the bubble chart type
 */
export const bubbleChartConfig: ChartTypeConfig = {
  label: 'chart.bubble.label',
  description: 'chart.bubble.description',
  useCase: 'chart.bubble.useCase',
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.runtime.axisFormat.xAxis',
      description: 'chart.configText.horizontal_axis_position',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'chart.bubble.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.y_axis', 
      description: 'chart.configText.vertical_axis_position',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.bubble.dropZone.yAxis.empty'
    },
    {
      key: 'sizeField',
      label: 'chart.configText.bubble_radius',
      description: 'chart.configText.size_of_bubbles_based_on_this_measure',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.bubble.dropZone.sizeField.empty'
    },
    {
      key: 'series',
      label: 'chart.configText.bubble_labels',
      description: 'chart.configText.field_to_use_for_bubble_labels_and_identification',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.bubble.dropZone.series.empty'
    },
    {
      key: 'colorField',
      label: 'chart.configText.bubble_colour',
      description: 'chart.configText.color_bubbles_by_this_field_optional',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension', 'measure'],
      emptyText: 'chart.bubble.dropZone.colorField.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'minBubbleSize', 'maxBubbleSize', 'bubbleOpacity', 'hideHeader'],
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
      description: 'chart.configText.number_formatting_for_y_axis_and_values'
    }
  ]
}
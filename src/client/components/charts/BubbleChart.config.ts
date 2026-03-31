import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { t } from '../../../i18n/runtime'

/**
 * Configuration for the bubble chart type
 */
export const bubbleChartConfig: ChartTypeConfig = {
  label: t('chart.bubble.label'),
  description: t('chart.bubble.description'),
  useCase: t('chart.bubble.useCase'),
  dropZones: [
    {
      key: 'xAxis',
      label: t('chart.runtime.axisFormat.xAxis'),
      description: t('chart.configText.horizontal_axis_position'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'Drop a field for X-axis position'
    },
    {
      key: 'yAxis',
      label: t('chart.configText.y_axis'), 
      description: t('chart.configText.vertical_axis_position'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for Y-axis position'
    },
    {
      key: 'sizeField',
      label: t('chart.configText.bubble_radius'),
      description: t('chart.configText.size_of_bubbles_based_on_this_measure'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop a measure for bubble size'
    },
    {
      key: 'series',
      label: t('chart.configText.bubble_labels'),
      description: t('chart.configText.field_to_use_for_bubble_labels_and_identification'),
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop a dimension for bubble labels'
    },
    {
      key: 'colorField',
      label: t('chart.configText.bubble_colour'),
      description: t('chart.configText.color_bubbles_by_this_field_optional'),
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension', 'measure'],
      emptyText: 'Drop a field for bubble color (optional)'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'minBubbleSize', 'maxBubbleSize', 'bubbleOpacity', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'xAxisFormat',
      label: t('chart.option.xAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.option.xAxisFormat.description')
    },
    {
      key: 'leftYAxisFormat',
      label: t('chart.option.yAxisFormat.label'),
      type: 'axisFormat',
      description: t('chart.configText.number_formatting_for_y_axis_and_values')
    }
  ]
}
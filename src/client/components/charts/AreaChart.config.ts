import type { ChartTypeConfig } from '../../charts/chartConfigs'
import {
  requiresMeasureAndDimension,
  stackTypeDisplayOption,
  connectNullsDisplayOption,
  targetDisplayOption,
  leftYAxisFormatDisplayOption,
  rightYAxisFormatDisplayOption
} from '../../charts/chartConfigHelpers'

/**
 * Configuration for the area chart type
 */
export const areaChartConfig: ChartTypeConfig = {
  label: 'chart.area.label',
  description: 'chart.area.description',
  useCase: 'chart.area.useCase',
  isAvailable: requiresMeasureAndDimension,
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.x_axis_time_categories',
      description: 'chart.configText.time_dimensions_or_dimensions_for_x_axis',
      mandatory: true,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.area.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.dropZone.yAxis.label',
      description: 'chart.configText.measures_for_area_values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.area.dropZone.yAxis.empty',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: 'chart.configText.series_stack_areas',
      description: 'chart.configText.dimensions_to_create_stacked_areas',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.area.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'showAllXLabels', 'hideHeader'],
  displayOptionsConfig: [
    stackTypeDisplayOption('chart.configText.how_to_stack_multiple_area_series'),
    connectNullsDisplayOption,
    targetDisplayOption,
    leftYAxisFormatDisplayOption,
    rightYAxisFormatDisplayOption
  ]
}
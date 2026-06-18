import type { ChartTypeConfig } from '../../charts/chartConfigs.js'
import {
  stackTypeDisplayOption,
  connectNullsDisplayOption,
  targetDisplayOption,
  leftYAxisFormatDisplayOption,
  rightYAxisFormatDisplayOption
} from '../../charts/chartConfigHelpers.js'

/**
 * Configuration for the area chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const areaChartConfig: ChartTypeConfig = {
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
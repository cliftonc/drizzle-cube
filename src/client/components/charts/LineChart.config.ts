import type { ChartTypeConfig } from '../../charts/chartConfigs.js'
import {
  connectNullsDisplayOption,
  targetDisplayOption,
  leftYAxisFormatDisplayOption,
  rightYAxisFormatDisplayOption
} from '../../charts/chartConfigHelpers.js'

/**
 * Configuration for the line chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const lineChartConfig: ChartTypeConfig = {
  clickableElements: { point: true },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.x_axis_time_categories',
      description: 'chart.configText.time_dimensions_or_dimensions_for_x_axis',
      mandatory: true,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.line.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.dropZone.yAxis.label',
      description: 'chart.configText.measures_for_line_values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.line.dropZone.yAxis.empty',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: 'chart.configText.series_multiple_lines',
      description: 'chart.configText.dimensions_to_create_separate_lines',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.line.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'showAllXLabels', 'hideHeader'],
  displayOptionsConfig: [
    connectNullsDisplayOption,
    targetDisplayOption,
    {
      key: 'priorPeriodStyle',
      label: 'chart.option.priorPeriodStyle.label',
      type: 'select',
      defaultValue: 'dashed',
      options: [
        { value: 'dashed', label: 'chart.option.priorPeriodStyle.dashed' },
        { value: 'dotted', label: 'chart.option.priorPeriodStyle.dotted' },
        { value: 'solid', label: 'chart.option.priorPeriodStyle.solid' }
      ],
      description: 'chart.option.priorPeriodStyle.description'
    },
    {
      key: 'priorPeriodOpacity',
      label: 'chart.option.priorPeriodOpacity.label',
      type: 'number',
      defaultValue: 0.5,
      min: 0.1,
      max: 1,
      step: 0.1,
      description: 'chart.option.priorPeriodOpacity.description'
    },
    leftYAxisFormatDisplayOption,
    rightYAxisFormatDisplayOption
  ]
}
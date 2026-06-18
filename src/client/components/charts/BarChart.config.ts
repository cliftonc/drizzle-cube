import type { ChartTypeConfig } from '../../charts/chartConfigs.js'
import {
  stackTypeDisplayOption,
  targetDisplayOption,
  leftYAxisFormatDisplayOption,
  rightYAxisFormatDisplayOption
} from '../../charts/chartConfigHelpers.js'

/**
 * Configuration for the bar chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const barChartConfig: ChartTypeConfig = {
  clickableElements: { bar: true },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.dropZone.xAxis.label',
      description: 'chart.dropZone.xAxis.description',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.bar.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.dropZone.yAxis.label',
      description: 'chart.configText.measures_for_bar_heights',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.bar.dropZone.yAxis.empty',
      enableDualAxis: true
    },
    {
      key: 'series',
      label: 'chart.dropZone.series.label',
      description: 'chart.dropZone.series.description',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.bar.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'showAllXLabels', 'hideHeader'],
  displayOptionsConfig: [
    stackTypeDisplayOption('chart.configText.how_to_stack_multiple_bar_series'),
    targetDisplayOption,
    leftYAxisFormatDisplayOption,
    rightYAxisFormatDisplayOption
  ]
}
import type { ChartTypeConfig } from '../../charts/chartConfigs.js'
import { valueFormatDisplayOption } from '../../charts/chartConfigHelpers.js'

/**
 * Configuration for the radial bar chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const radialBarChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.categories',
      description: 'chart.configText.dimensions_for_radial_segments',
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'chart.radialBar.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.values',
      description: 'chart.configText.measures_for_radial_bar_lengths',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.radialBar.dropZone.yAxis.empty'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    valueFormatDisplayOption()
  ]
}
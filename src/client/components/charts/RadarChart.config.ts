import type { ChartTypeConfig } from '../../charts/chartConfigs.js'
import { valueFormatDisplayOption } from '../../charts/chartConfigHelpers.js'

/**
 * Configuration for the radar chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const radarChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.axes_categories',
      description: 'chart.configText.dimensions_for_radar_axes',
      mandatory: true,
      acceptTypes: ['dimension'],
      emptyText: 'chart.radar.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.values',
      description: 'chart.configText.measures_for_radar_values',
      mandatory: true,
      acceptTypes: ['measure'],
      emptyText: 'chart.radar.dropZone.yAxis.empty'
    },
    {
      key: 'series',
      label: 'chart.configText.series_multiple_shapes',
      description: 'chart.configText.dimensions_to_create_multiple_radar_shapes',
      mandatory: false,
      acceptTypes: ['dimension'],
      emptyText: 'chart.radar.dropZone.series.empty'
    }
  ],
  displayOptions: ['showLegend', 'showGrid', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    valueFormatDisplayOption()
  ]
}
import type { ChartTypeConfig } from '../../charts/chartConfigs.js'
import { valueFormatDisplayOption } from '../../charts/chartConfigHelpers.js'

/**
 * Configuration for the treemap chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const treemapChartConfig: ChartTypeConfig = {
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
    valueFormatDisplayOption('chart.configText.number_formatting_for_size_values')
  ],
  clickableElements: { cell: true }
}
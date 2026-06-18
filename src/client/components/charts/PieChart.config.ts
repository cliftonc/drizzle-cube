import type { ChartTypeConfig } from '../../charts/chartConfigs.js'
import { valueFormatDisplayOption } from '../../charts/chartConfigHelpers.js'

/**
 * Configuration for the pie chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const pieChartConfig: ChartTypeConfig = {
  clickableElements: { slice: true },
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.categories',
      description: 'chart.configText.dimension_for_pie_slices',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'chart.pie.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.values',
      description: 'chart.configText.measure_for_slice_sizes',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.pie.dropZone.yAxis.empty'
    }
  ],
  displayOptions: ['showLegend', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'innerRadius',
      label: 'chart.option.innerRadius.label',
      type: 'select',
      description: 'chart.configText.hollow_center_size_0_percent_solid_pie_higher_donut_style',
      defaultValue: '0%',
      options: [
        { value: '0%', label: 'chart.configText.none_pie' },
        { value: '20%', label: 'chart.configText.20_percent' },
        { value: '40%', label: 'chart.configText.40_percent' },
        { value: '60%', label: 'chart.configText.60_percent' },
        { value: '80%', label: 'chart.configText.80_percent' },
      ]
    },
    valueFormatDisplayOption()
  ]
}
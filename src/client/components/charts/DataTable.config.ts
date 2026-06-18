import type { ChartTypeConfig } from '../../charts/chartConfigs.js'

/**
 * Configuration for the data table type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const dataTableConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.columns',
      description: 'chart.configText.all_fields_to_display_as_columns',
      mandatory: false,
      acceptTypes: ['dimension', 'timeDimension', 'measure'],
      emptyText: 'chart.table.dropZone.xAxis.empty'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'leftYAxisFormat',
      label: 'chart.option.valueFormat.label',
      type: 'axisFormat',
      description: 'chart.configText.number_formatting_for_numeric_values'
    }
  ]
}
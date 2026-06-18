import type { ChartTypeConfig } from '../../charts/chartConfigs.js'

/**
 * Configuration for the activity grid chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const activityGridChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'dateField',
      label: 'chart.configText.time_dimension',
      description: 'chart.configText.time_field_that_determines_grid_structure_granularity_affects_layout',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['timeDimension'],
      emptyText: 'chart.activityGrid.dropZone.dateField.empty'
    },
    {
      key: 'valueField',
      label: 'chart.configText.activity_measure',
      description: 'chart.configText.measure_used_for_activity_intensity_color_coding',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.activityGrid.dropZone.valueField.empty'
    }
  ],
  displayOptions: ['showLabels', 'showTooltip', 'hideHeader'],
  displayOptionsConfig: [
    {
      key: 'fitToWidth',
      label: 'chart.option.fitToWidth.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.fitToWidth.description'
    }
  ],
  validate: (config) => {
    const { dateField, valueField } = config

    if (!dateField || (Array.isArray(dateField) && dateField.length === 0)) {
      return {
        isValid: false,
        message: 'chart.activityGrid.validation.timeDimensionRequired'
      }
    }

    if (!valueField || (Array.isArray(valueField) && valueField.length === 0)) {
      return {
        isValid: false,
        message: 'chart.activityGrid.validation.measureRequired'
      }
    }

    return { isValid: true }
  },
  clickableElements: { cell: true }
}
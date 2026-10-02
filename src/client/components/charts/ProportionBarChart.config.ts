import type { ChartTypeConfig } from '../../charts/chartConfigs.js'

/**
 * Configuration for the proportion bar chart type.
 *
 * Eager metadata (`label`, `description`, `useCase`, `isAvailable`) lives in the
 * unified `chartRegistry` entry (the single source of truth) — see
 * `src/client/charts/chartRegistry.ts`. This file owns the lazy-loaded shape:
 * drop zones, display options, clickable elements, validation.
 */
export const proportionBarChartConfig: ChartTypeConfig = {
  dropZones: [
    {
      key: 'xAxis',
      label: 'chart.configText.category',
      description: 'chart.configText.dimension_to_split_the_bar_into_segments',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'chart.proportionBar.dropZone.xAxis.empty'
    },
    {
      key: 'yAxis',
      label: 'chart.configText.value',
      description: 'chart.configText.measure_that_determines_each_segments_share',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'chart.proportionBar.dropZone.yAxis.empty'
    }
  ],
  displayOptions: ['hideHeader'],
  displayOptionsConfig: [
    {
      key: 'showLabels',
      label: 'chart.option.proportionBarLabels.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.proportionBarLabels.description'
    },
    {
      key: 'showPercentages',
      label: 'chart.option.showPercentages.label',
      type: 'boolean',
      defaultValue: true,
      description: 'chart.option.showPercentages.description'
    },
    {
      key: 'sortSegments',
      label: 'chart.option.sortSegments.label',
      type: 'boolean',
      defaultValue: false,
      description: 'chart.option.sortSegments.description'
    },
    {
      key: 'decimals',
      label: 'chart.option.decimals.label',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 2,
      description: 'chart.option.proportionBarDecimals.description'
    }
  ],
  validate: (config: any) => {
    if (!config?.xAxis || (Array.isArray(config.xAxis) && config.xAxis.length === 0)) {
      return { isValid: false, message: 'chart.proportionBar.validation.dimensionRequired' }
    }
    if (!config?.yAxis || (Array.isArray(config.yAxis) && config.yAxis.length === 0)) {
      return { isValid: false, message: 'chart.proportionBar.validation.measureRequired' }
    }
    return { isValid: true }
  }
}

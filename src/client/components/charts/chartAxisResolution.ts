import type { ChartAxisConfig } from '../../types.js'

/**
 * Discriminated error code returned by {@link resolveChartAxisFields} when the
 * chart configuration is invalid. Each chart maps these codes to its own i18n
 * hint key (e.g. pie charts surface a pie-specific message for `axisInvalid`).
 */
export type ChartAxisErrorCode = 'axisInvalid' | 'axisFields'

/**
 * Result of resolving X/Y/series fields from a {@link ChartAxisConfig}.
 * When `errorCode` is non-null the field values are not usable and the chart
 * should render a configuration-error state instead.
 */
export interface ResolvedChartAxisFields {
  /** Resolved X-axis field (category), or undefined when the config is invalid */
  xAxisField?: string
  /** Resolved Y-axis (value/measure) fields */
  yAxisFields: string[]
  /** Optional series/grouping fields (only present in the new config format) */
  seriesFields: string[]
  /** Non-null when the configuration cannot produce a renderable axis setup */
  errorCode: ChartAxisErrorCode | null
}

/**
 * Pure resolver for the X/Y/series field extraction that Cartesian charts
 * (bar, line, area, pie) all duplicated inline.
 *
 * Supports both the new format (`xAxis` / `yAxis` / `series` arrays) and the
 * legacy format (`x` / `y`). Returns a discriminated `errorCode` rather than
 * JSX so each chart can map it to its own i18n hint key and render its own
 * guard component.
 */
export function resolveChartAxisFields(chartConfig?: ChartAxisConfig): ResolvedChartAxisFields {
  let xAxisField: string | undefined
  let yAxisFields: string[] = []
  let seriesFields: string[] = []
  let errorCode: ChartAxisErrorCode | null = null

  if (chartConfig?.xAxis && chartConfig?.yAxis) {
    // New format
    xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
    yAxisFields = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis : [chartConfig.yAxis]
    seriesFields = chartConfig.series || []
  } else if (chartConfig?.x && chartConfig?.y) {
    // Legacy format
    xAxisField = chartConfig.x
    yAxisFields = Array.isArray(chartConfig.y) ? chartConfig.y : [chartConfig.y]
  } else {
    errorCode = 'axisInvalid'
  }

  if (!errorCode && (!xAxisField || yAxisFields.length === 0)) {
    errorCode = 'axisFields'
  }

  return { xAxisField, yAxisFields, seriesFields, errorCode }
}

/**
 * Per-chart-type availability rules for the MCP App chart switcher.
 *
 * Each rule receives a small description of the query shape and returns whether
 * the chart type can render that shape. Extracted from chartAutoSelect's
 * `isChartAvailable` switch to keep the public function flat.
 */

import type { McpChartType } from './chartAutoSelect.js'

export interface ChartShape {
  hasMeasure: boolean
  hasDimension: boolean
  hasTimeDim: boolean
  dimensionCount: number
  rowCount: number
  /** True when the payload is flow data ({ nodes, links }) rather than tabular rows. */
  hasFlowData: boolean
}

type ChartRule = (shape: ChartShape) => boolean

const alwaysAvailable: ChartRule = () => true
const requiresMeasure: ChartRule = ({ hasMeasure }) => hasMeasure
const measureWithDimensionOrTime: ChartRule = ({ hasMeasure, hasDimension, hasTimeDim }) =>
  hasMeasure && (hasDimension || hasTimeDim)
const measureWithDimension: ChartRule = ({ hasMeasure, hasDimension }) => hasMeasure && hasDimension
const smallShare: ChartRule = ({ hasMeasure, hasDimension, rowCount }) =>
  hasMeasure && hasDimension && rowCount <= 20

/**
 * Availability predicate per chart type. Chart types not listed fall back to
 * the default (always available) rule, matching the original switch's `default`.
 */
const CHART_RULES: Partial<Record<McpChartType, ChartRule>> = {
  table: alwaysAvailable,
  markdown: alwaysAvailable,
  kpiNumber: requiresMeasure,
  kpiDelta: requiresMeasure,
  kpiText: requiresMeasure,
  gauge: requiresMeasure,
  measureProfile: requiresMeasure,
  bar: measureWithDimensionOrTime,
  line: measureWithDimensionOrTime,
  area: measureWithDimensionOrTime,
  waterfall: measureWithDimensionOrTime,
  boxPlot: measureWithDimensionOrTime,
  candlestick: measureWithDimensionOrTime,
  scatter: measureWithDimensionOrTime,
  bubble: measureWithDimensionOrTime,
  pie: smallShare,
  radialBar: smallShare,
  treemap: measureWithDimension,
  funnel: measureWithDimension,
  radar: measureWithDimension,
  // Heatmap needs two categorical dimensions (x, y) plus a measure for cell intensity.
  heatmap: ({ hasMeasure, dimensionCount }) => hasMeasure && dimensionCount >= 2,
  // Sankey/Sunburst only render flow ({ nodes, links }) payloads, never tabular rows.
  sankey: (shape) => shape.hasFlowData,
  sunburst: (shape) => shape.hasFlowData,
  activityGrid: ({ hasMeasure, hasTimeDim }) => hasMeasure && hasTimeDim,
}

/** Resolve whether a chart type can render the given query shape. */
export function isChartAvailableForShape(chartType: McpChartType, shape: ChartShape): boolean {
  const rule = CHART_RULES[chartType] ?? alwaysAvailable
  return rule(shape)
}

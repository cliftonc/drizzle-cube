/**
 * Per-chart-type availability rules for the MCP App chart switcher.
 *
 * Each rule receives a small description of the query shape and returns whether
 * the chart type can render that shape. Extracted from chartAutoSelect's
 * `isChartAvailable` switch to keep the public function flat.
 *
 * Why these are not `chartRegistry`'s `isAvailable`: that predicate only sees the
 * *query* shape (`{ measureCount, dimensionCount, timeDimensionCount }`), while
 * the MCP App also has the resolved payload in hand and gates on it — `pie` and
 * `radialBar` need a small enough row count to be legible, and `sankey`/`sunburst`
 * only render a flow payload (`{ nodes, links }`), never tabular rows. The two
 * also read time dimensions differently: `requiresMeasureAndDimension` counts
 * plain dimensions only, whereas here a time dimension satisfies the requirement,
 * so a time series stays offered in the switcher. Deriving from the registry
 * would silently change what the picker offers.
 *
 * `CHART_RULES` is exhaustive over `McpAppChartType`, so adding a chart to
 * `MCP_APP_CHART_TYPES` forces a decision here rather than defaulting silently.
 */

import type { McpAppChartType } from './chartTypes.js'

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

/** Availability predicate per chart type — one entry per renderable type. */
const CHART_RULES: Record<McpAppChartType, ChartRule> = {
  table: alwaysAvailable,
  // Record listings render whatever columns come back, so any shape works.
  recordsTable: alwaysAvailable,
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
export function isChartAvailableForShape(chartType: McpAppChartType, shape: ChartShape): boolean {
  return CHART_RULES[chartType](shape)
}

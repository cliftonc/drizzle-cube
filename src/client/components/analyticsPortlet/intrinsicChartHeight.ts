import type { ChartDisplayConfig, ChartType } from '../../types.js'

/**
 * Chart types that size themselves to their content rather than filling the
 * portlet. Everything else gets a 200px floor so a chart cannot collapse.
 */
const INTRINSIC_HEIGHT_CHART_TYPES: ChartType[] = ['markdown', 'proportionBar']

/**
 * Chart types on which `layout: 'compact'` is meaningful.
 *
 * The pairing matters: `setChartType` carries the whole `displayConfig` across
 * a change of chart type, so a portlet that was a compact KPI still holds
 * `layout: 'compact'` after becoming a bar or line chart. Reading the option
 * without checking the type would strip those charts of their floor and
 * collapse them in exactly the short rows this exemption exists to fix.
 */
const COMPACT_LAYOUT_CHART_TYPES: ChartType[] = ['kpiNumber', 'kpiDelta']

/**
 * Should this chart be exempt from the portlet's minimum height?
 *
 * The floor overflows a card shorter than 200px, and content centred inside the
 * oversized box then renders near the bottom and clips — so charts that are
 * short by design opt out of it.
 */
export function hasIntrinsicChartHeight(
  chartType: ChartType,
  displayConfig?: ChartDisplayConfig
): boolean {
  if (INTRINSIC_HEIGHT_CHART_TYPES.includes(chartType)) return true
  return (
    COMPACT_LAYOUT_CHART_TYPES.includes(chartType) &&
    displayConfig?.layout === 'compact'
  )
}

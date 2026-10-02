/**
 * The chart types the MCP App can render — the app's own list, deliberately
 * NOT derived from `chartRegistry`.
 *
 * Why a separate list: the MCP App is bundled by `vite-plugin-singlefile` into
 * one inlined HTML document (`vite.config.mcp-app.ts` → `generated-html.ts`), so
 * it cannot use `ChartLoader`'s dynamic-import map — code splitting has nowhere
 * to put the chunks. Every chart it can render must be statically imported by
 * `mcp-app.tsx`, which makes the renderable set a strictly smaller, hand-chosen
 * subset of `BuiltInChartType` rather than something derivable from the registry.
 *
 * The duplication is contained to this one array. Everything downstream derives
 * from it, and `chartComponentMap` is typed as an exhaustive
 * `Record<McpAppChartType, …>`, so a type listed here without a static import
 * fails `npm run typecheck`:
 *
 *   - `mcp-app.tsx`        → `chartComponentMap` (the static components)
 *   - `McpChartSwitcher`   → the picker's options, in this array's order
 *   - `chartAvailability`  → `CHART_RULES`, exhaustive over this list
 *   - `mcp-transport.ts`   → the `chart` tool's description + schema enum, so the
 *                            model is only ever offered types the app can render
 *
 * This module is value-import-free from the client graph (type-only import of
 * `BuiltInChartType`) so the adapters build can import it without pulling React
 * or the chart components into server code.
 */

import type { BuiltInChartType } from '../client/types.js'

/** Renderable chart types, in MCP App switcher display order. */
export const MCP_APP_CHART_TYPES = [
  'bar', 'line', 'area', 'pie', 'scatter', 'treemap',
  'kpiNumber', 'kpiDelta', 'kpiText', 'table', 'recordsTable',
  'radar', 'radialBar', 'bubble', 'funnel', 'waterfall', 'gauge',
  'boxPlot', 'candlestick', 'activityGrid', 'measureProfile',
  'sankey', 'sunburst', 'heatmap', 'markdown',
] as const satisfies readonly BuiltInChartType[]

/** A chart type the MCP App has a component for. */
export type McpAppChartType = (typeof MCP_APP_CHART_TYPES)[number]

const MCP_APP_CHART_TYPE_SET: ReadonlySet<string> = new Set(MCP_APP_CHART_TYPES)

/**
 * Runtime narrowing for chart types arriving from outside the app (the `chart`
 * tool hint), which are strings until proven otherwise.
 */
export function isMcpAppChartType(value: unknown): value is McpAppChartType {
  return typeof value === 'string' && MCP_APP_CHART_TYPE_SET.has(value)
}

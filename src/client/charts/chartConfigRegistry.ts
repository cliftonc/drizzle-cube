import { barChartConfig } from '../components/charts/BarChart.config.js'
import { lineChartConfig } from '../components/charts/LineChart.config.js'
import { areaChartConfig } from '../components/charts/AreaChart.config.js'
import { pieChartConfig } from '../components/charts/PieChart.config.js'
import { scatterChartConfig } from '../components/charts/ScatterChart.config.js'
import { bubbleChartConfig } from '../components/charts/BubbleChart.config.js'
import { radarChartConfig } from '../components/charts/RadarChart.config.js'
import { radialBarChartConfig } from '../components/charts/RadialBarChart.config.js'
import { treemapChartConfig } from '../components/charts/TreeMapChart.config.js'
import { dataTableConfig } from '../components/charts/DataTable.config.js'
import { activityGridChartConfig } from '../components/charts/ActivityGridChart.config.js'
import { kpiNumberConfig } from '../components/charts/KpiNumber.config.js'
import { kpiDeltaConfig } from '../components/charts/KpiDelta.config.js'
import { kpiTextConfig } from '../components/charts/KpiText.config.js'
import { markdownConfig } from '../components/charts/MarkdownChart.config.js'
import { funnelChartConfig } from '../components/charts/FunnelChart.config.js'
import { sankeyChartConfig } from '../components/charts/SankeyChart.config.js'
import { sunburstChartConfig } from '../components/charts/SunburstChart.config.js'
import { heatmapChartConfig } from '../components/charts/HeatMapChart.config.js'
import { retentionHeatmapConfig } from '../components/charts/RetentionHeatmap.config.js'
import { retentionCombinedConfig } from '../components/charts/RetentionCombinedChart.config.js'
import { boxPlotChartConfig } from '../components/charts/BoxPlotChart.config.js'
import { waterfallChartConfig } from '../components/charts/WaterfallChart.config.js'
import { candlestickChartConfig } from '../components/charts/CandlestickChart.config.js'
import { measureProfileChartConfig } from '../components/charts/MeasureProfileChart.config.js'
import { gaugeChartConfig } from '../components/charts/GaugeChart.config.js'
import type { BuiltInChartType } from '../types.js'
import type { ChartTypeConfig, ChartConfigRegistry } from './chartConfigs.js'
import { chartRegistry, composeChartConfig } from './chartRegistry.js'

/**
 * Statically-imported full config shapes (drop zones, display options, clickable
 * elements, validation) for every built-in chart. These are the lazy-loaded
 * side of a chart, but the eager registry below needs them synchronously because
 * the server agent reads drop zones for mandatory-zone validation and tool
 * guidance. Eager metadata (label/description/useCase/isAvailable) is NOT here —
 * it lives on the `chartRegistry` entry, its single source of truth.
 */
const baseConfigs: Record<BuiltInChartType, ChartTypeConfig> = {
  bar: barChartConfig,
  line: lineChartConfig,
  area: areaChartConfig,
  pie: pieChartConfig,
  scatter: scatterChartConfig,
  bubble: bubbleChartConfig,
  radar: radarChartConfig,
  radialBar: radialBarChartConfig,
  treemap: treemapChartConfig,
  table: dataTableConfig,
  activityGrid: activityGridChartConfig,
  kpiNumber: kpiNumberConfig,
  kpiDelta: kpiDeltaConfig,
  kpiText: kpiTextConfig,
  markdown: markdownConfig,
  funnel: funnelChartConfig,
  sankey: sankeyChartConfig,
  sunburst: sunburstChartConfig,
  heatmap: heatmapChartConfig,
  retentionHeatmap: retentionHeatmapConfig,
  retentionCombined: retentionCombinedConfig,
  boxPlot: boxPlotChartConfig,
  waterfall: waterfallChartConfig,
  candlestick: candlestickChartConfig,
  measureProfile: measureProfileChartConfig,
  gauge: gaugeChartConfig,
}

/**
 * Registry of all chart type configurations (the eager / full / server source).
 *
 * Every built-in is composed from its `chartRegistry` entry's metadata (single
 * source of truth) laid over its full config shape. Drop zones / display options
 * stay here in full because the server agent reads them synchronously.
 */
export const chartConfigRegistry: ChartConfigRegistry = Object.fromEntries(
  (Object.keys(chartRegistry) as BuiltInChartType[]).map((type) => [
    type,
    composeChartConfig(chartRegistry[type], baseConfigs[type]),
  ])
)

/**
 * Register a custom chart config into the registry.
 * Used by the chart plugin system.
 */
export function registerChartConfig(type: string, config: ChartTypeConfig): void {
  chartConfigRegistry[type] = config
}

/**
 * Unregister a chart config from the registry.
 * Used by the chart plugin system.
 */
export function unregisterChartConfig(type: string): void {
  delete chartConfigRegistry[type]
}

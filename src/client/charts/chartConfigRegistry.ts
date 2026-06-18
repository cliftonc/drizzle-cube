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
import type { ChartTypeConfig, ChartConfigRegistry } from './chartConfigs.js'
import { chartRegistry, composeChartConfig } from './chartRegistry.js'

/**
 * Registry of all chart type configurations (the eager / full / server source).
 *
 * Migrated charts compose their entry's metadata (single source of truth) over
 * their full config shape via `toEagerConfig`; the rest read their full
 * `*.config.ts` directly. Drop zones / display options stay here in full because
 * the server agent reads them synchronously for validation and tool guidance.
 */
export const chartConfigRegistry: ChartConfigRegistry = {
  bar: composeChartConfig(chartRegistry.bar!, barChartConfig),
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

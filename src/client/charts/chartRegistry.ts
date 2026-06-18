/**
 * Unified Chart Registry — the single source of truth for a chart type.
 *
 * Historically, adding a chart required coordinated edits across four central
 * registries (eager config, lazy config, the loader, the icon map) plus the
 * per-chart component/config/helper/icon files, with the same dynamic-import
 * path repeated three times. A typo in one failed silently.
 *
 * `chartRegistry` collapses that into one entry per chart. The eager config
 * registry, the lazy config registry, the icon lookup, and the dependency lookup
 * are all **derived** from this map — each chart's import path is declared once.
 * Custom (plugin) charts register through the same `ChartRegistryEntry` shape
 * (see `getChartEntry` / `registerCustomChartEntry`), so built-in and custom
 * charts flow through one path.
 *
 * Client/server boundary: this module is DOM-free so the server agent and the
 * eager config registry can import it. The React **component** thunk (which
 * pulls recharts / ChartContainer / DOM globals) is a client-only concern and
 * lives in the loader's component map — NOT here. Lazy loading is purely a
 * client optimisation; server/MCP/agent code reads the eager config directly.
 */

import type { ComponentType } from 'react'
import type { BuiltInChartType } from '../types.js'
import type { IconName, IconProps } from '../icons/types.js'
import type {
  ChartTypeConfig,
  ChartAvailabilityContext,
  ChartAvailability,
} from './chartConfigs.js'
import { requiresMeasureAndDimension, requiresMeasure } from './chartConfigHelpers.js'
import { setRegistryIconResolver } from '../icons/registry.js'

const RECHARTS_DEP = { packageName: 'recharts', installCommand: 'npm install recharts' }

/**
 * The single source of truth for one chart type's DOM-free metadata: the eager
 * picker fields, the lazy config thunk, the icon name, and dependency info.
 *
 * The React component thunk is deliberately NOT part of the entry — it is the
 * one DOM-bearing piece and is owned by the client loader, keeping this entry
 * (and its consumers, incl. the server agent) free of the chart component graph.
 */
export interface ChartRegistryEntry {
  /** Display label for the picker — an i18n key, resolved at render time. */
  label: string
  /**
   * The chart's icon. Built-ins use an `IconName` resolved via the icon registry
   * (override-able via registerIcons/setIcon). Plugins may instead supply a
   * ready-made icon component — both flow through the same entry field so custom
   * and built-in charts resolve their icon along one path.
   */
  icon: IconName | ComponentType<IconProps>
  /** Brief description — i18n key. */
  description?: string
  /** When to use this chart — i18n key. */
  useCase?: string
  /** Whether the chart can render with the current query shape. */
  isAvailable?: (ctx: ChartAvailabilityContext) => ChartAvailability
  /** Optional peer dependency — shows install instructions if the import fails. */
  dependencies?: { packageName: string; installCommand: string }
  /** Lazy config import — resolves the config OBJECT directly (client lazy path). */
  config: () => Promise<ChartTypeConfig>
}

/**
 * The unified registry — one entry per built-in chart type, the single source of
 * truth for its DOM-free metadata. The eager config registry, the lazy config
 * registry, the icon lookup, and the dependency lookup all derive from this map.
 *
 * Adding a chart is now one entry here plus its component/config files.
 */
export const chartRegistry: Record<BuiltInChartType, ChartRegistryEntry> = {
  bar: {
    label: 'chart.bar.label',
    icon: 'chartBar',
    description: 'chart.bar.description',
    useCase: 'chart.bar.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/BarChart.config.js')).barChartConfig,
  },
  line: {
    label: 'chart.line.label',
    icon: 'chartLine',
    description: 'chart.line.description',
    useCase: 'chart.line.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/LineChart.config.js')).lineChartConfig,
  },
  area: {
    label: 'chart.area.label',
    icon: 'chartArea',
    description: 'chart.area.description',
    useCase: 'chart.area.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/AreaChart.config.js')).areaChartConfig,
  },
  pie: {
    label: 'chart.pie.label',
    icon: 'chartPie',
    description: 'chart.pie.description',
    useCase: 'chart.pie.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/PieChart.config.js')).pieChartConfig,
  },
  scatter: {
    label: 'chart.scatter.label',
    icon: 'chartScatter',
    description: 'chart.scatter.description',
    useCase: 'chart.scatter.useCase',
    isAvailable: ({ measureCount, dimensionCount }) => {
      if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
      // Scatter needs either 2 measures, or 1 measure + 1 dimension
      if (measureCount < 2 && dimensionCount < 1) {
        return { available: false, reason: 'chart.availability.scatter' }
      }
      return { available: true }
    },
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/ScatterChart.config.js')).scatterChartConfig,
  },
  bubble: {
    label: 'chart.bubble.label',
    icon: 'chartBubble',
    description: 'chart.bubble.description',
    useCase: 'chart.bubble.useCase',
    isAvailable: ({ measureCount, dimensionCount }) => {
      if (measureCount < 2) return { available: false, reason: 'chart.availability.requiresTwoMeasures' }
      if (dimensionCount < 1) return { available: false, reason: 'chart.availability.bubble' }
      return { available: true }
    },
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/BubbleChart.config.js')).bubbleChartConfig,
  },
  radar: {
    label: 'chart.radar.label',
    icon: 'chartRadar',
    description: 'chart.radar.description',
    useCase: 'chart.radar.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/RadarChart.config.js')).radarChartConfig,
  },
  radialBar: {
    label: 'chart.radialBar.label',
    icon: 'chartRadialBar',
    description: 'chart.radialBar.description',
    useCase: 'chart.radialBar.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/RadialBarChart.config.js')).radialBarChartConfig,
  },
  treemap: {
    label: 'chart.treemap.label',
    icon: 'chartTreemap',
    description: 'chart.treemap.description',
    useCase: 'chart.treemap.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/TreeMapChart.config.js')).treemapChartConfig,
  },
  table: {
    label: 'chart.table.label',
    icon: 'chartTable',
    description: 'chart.table.description',
    useCase: 'chart.table.useCase',
    config: async () => (await import('../components/charts/DataTable.config.js')).dataTableConfig,
  },
  activityGrid: {
    label: 'chart.activityGrid.label',
    icon: 'chartActivityGrid',
    description: 'chart.activityGrid.description',
    useCase: 'chart.activityGrid.useCase',
    isAvailable: ({ measureCount, timeDimensionCount }) => {
      if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
      if (timeDimensionCount < 1) return { available: false, reason: 'chart.availability.requiresTimeDimension' }
      return { available: true }
    },
    config: async () => (await import('../components/charts/ActivityGridChart.config.js')).activityGridChartConfig,
  },
  kpiNumber: {
    label: 'chart.kpiNumber.label',
    icon: 'chartKpiNumber',
    description: 'chart.kpiNumber.description',
    useCase: 'chart.kpiNumber.useCase',
    isAvailable: requiresMeasure,
    config: async () => (await import('../components/charts/KpiNumber.config.js')).kpiNumberConfig,
  },
  kpiDelta: {
    label: 'chart.kpiDelta.label',
    icon: 'chartKpiDelta',
    description: 'chart.kpiDelta.description',
    useCase: 'chart.kpiDelta.useCase',
    isAvailable: requiresMeasureAndDimension,
    config: async () => (await import('../components/charts/KpiDelta.config.js')).kpiDeltaConfig,
  },
  kpiText: {
    label: 'chart.kpiText.label',
    icon: 'chartKpiText',
    description: 'chart.kpiText.description',
    useCase: 'chart.kpiText.useCase',
    isAvailable: requiresMeasure,
    config: async () => (await import('../components/charts/KpiText.config.js')).kpiTextConfig,
  },
  markdown: {
    label: 'chart.markdown.label',
    icon: 'chartMarkdown',
    description: 'chart.markdown.description',
    useCase: 'chart.markdown.useCase',
    config: async () => (await import('../components/charts/MarkdownChart.config.js')).markdownConfig,
  },
  funnel: {
    label: 'chart.funnel.label',
    icon: 'chartFunnel',
    description: 'chart.funnel.description',
    useCase: 'chart.funnel.useCase',
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/FunnelChart.config.js')).funnelChartConfig,
  },
  sankey: {
    label: 'chart.sankey.label',
    icon: 'chartSankey',
    description: 'chart.sankey.description',
    useCase: 'chart.sankey.useCase',
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/SankeyChart.config.js')).sankeyChartConfig,
  },
  sunburst: {
    label: 'chart.sunburst.label',
    icon: 'chartSunburst',
    description: 'chart.sunburst.description',
    useCase: 'chart.sunburst.useCase',
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/SunburstChart.config.js')).sunburstChartConfig,
  },
  heatmap: {
    label: 'chart.heatmap.label',
    icon: 'chartHeatmap',
    description: 'chart.heatmap.description',
    useCase: 'chart.heatmap.useCase',
    isAvailable: ({ measureCount, dimensionCount }) => {
      if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
      if (dimensionCount < 2) return { available: false, reason: 'chart.availability.requiresTwoDimensions' }
      return { available: true }
    },
    dependencies: { packageName: '@nivo/heatmap', installCommand: 'npm install @nivo/heatmap' },
    config: async () => (await import('../components/charts/HeatMapChart.config.js')).heatmapChartConfig,
  },
  retentionHeatmap: {
    label: 'chart.retentionHeatmap.label',
    icon: 'chartRetention',
    description: 'chart.retentionHeatmap.description',
    useCase: 'chart.retentionHeatmap.useCase',
    config: async () => (await import('../components/charts/RetentionHeatmap.config.js')).retentionHeatmapConfig,
  },
  retentionCombined: {
    label: 'chart.retentionCombined.label',
    icon: 'chartRetention',
    description: 'chart.retentionCombined.description',
    useCase: 'chart.retentionCombined.useCase',
    config: async () => (await import('../components/charts/RetentionCombinedChart.config.js')).retentionCombinedConfig,
  },
  boxPlot: {
    label: 'chart.boxPlot.label',
    icon: 'chartBoxPlot',
    description: 'chart.boxPlot.description',
    useCase: 'chart.boxPlot.useCase',
    isAvailable: requiresMeasureAndDimension,
    config: async () => (await import('../components/charts/BoxPlotChart.config.js')).boxPlotChartConfig,
  },
  waterfall: {
    label: 'chart.waterfall.label',
    icon: 'chartWaterfall',
    description: 'chart.waterfall.description',
    useCase: 'chart.waterfall.useCase',
    isAvailable: requiresMeasureAndDimension,
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/WaterfallChart.config.js')).waterfallChartConfig,
  },
  candlestick: {
    label: 'chart.candlestick.label',
    icon: 'chartCandlestick',
    description: 'chart.candlestick.description',
    useCase: 'chart.candlestick.useCase',
    isAvailable: ({ measureCount, dimensionCount }) => {
      if (measureCount < 2) return { available: false, reason: 'chart.availability.requiresTwoMeasures' }
      if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
      return { available: true }
    },
    config: async () => (await import('../components/charts/CandlestickChart.config.js')).candlestickChartConfig,
  },
  measureProfile: {
    label: 'chart.measureProfile.label',
    icon: 'chartMeasureProfile',
    description: 'chart.measureProfile.description',
    useCase: 'chart.measureProfile.useCase',
    isAvailable: ({ measureCount }) => {
      if (measureCount < 2) return { available: false, reason: 'chart.availability.requiresTwoMeasures' }
      return { available: true }
    },
    dependencies: RECHARTS_DEP,
    config: async () => (await import('../components/charts/MeasureProfileChart.config.js')).measureProfileChartConfig,
  },
  gauge: {
    label: 'chart.gauge.label',
    icon: 'chartGauge',
    description: 'chart.gauge.description',
    useCase: 'chart.gauge.useCase',
    isAvailable: requiresMeasure,
    dependencies: { packageName: 'd3-shape', installCommand: 'npm install d3-shape' },
    config: async () => (await import('../components/charts/GaugeChart.config.js')).gaugeChartConfig,
  },
}

/**
 * Custom (plugin) chart entries, keyed by chart type. Populated by the chart
 * plugin system via {@link registerCustomChartEntry}. Looked up *ahead* of the
 * built-in `chartRegistry` so a plugin overriding a built-in (e.g. `bar`) wins.
 */
const customChartEntries = new Map<string, ChartRegistryEntry>()

/**
 * The single, unified chart-entry lookup. Custom plugin entries take precedence
 * over built-ins, so a plugin override of a built-in type resolves through the
 * same path. Returns `undefined` for unknown types.
 *
 * Every entry-shaped consumer (icon resolution, dependency fallback, plugin
 * icon API) reads through this so built-in and custom charts flow as one.
 */
export function getChartEntry(chartType: string): ChartRegistryEntry | undefined {
  return customChartEntries.get(chartType) ?? chartRegistry[chartType as BuiltInChartType]
}

/** Register a custom chart's entry (plugin system). */
export function registerCustomChartEntry(chartType: string, entry: ChartRegistryEntry): void {
  customChartEntries.set(chartType, entry)
}

/** Remove a custom chart's entry, falling back to the built-in if one exists. */
export function unregisterCustomChartEntry(chartType: string): void {
  customChartEntries.delete(chartType)
}

/** The custom entry for a type, if one is registered (no built-in fallback). */
export function getCustomChartEntry(chartType: string): ChartRegistryEntry | undefined {
  return customChartEntries.get(chartType)
}

// Wire the icon resolver so getChartTypeIcon() derives every chart's icon from
// its unified entry (custom-first), without the icon module statically depending
// on this one. The entry's `icon` is an IconName for built-ins or a component
// for plugins — the icon helper handles both.
setRegistryIconResolver((chartType) => getChartEntry(chartType)?.icon)

/**
 * Composes a migrated chart's full `ChartTypeConfig` from its entry: the entry's
 * metadata (its single declaration site) laid over the chart's config shape
 * (`base` — drop zones, display options, clickable elements, validation).
 *
 * Used by BOTH derivation paths so they return the same full shape as a
 * non-migrated chart's `*.config.ts`:
 * - eager `chartConfigRegistry` (server/full source — read synchronously for the
 *   picker AND by the server agent's chart validation + tool guidance), with
 *   `base` = the statically-imported config;
 * - lazy `getChartConfigAsync` (client code-split path), with `base` = the
 *   config resolved from the entry's `config` thunk.
 */
export function composeChartConfig(entry: ChartRegistryEntry, base: ChartTypeConfig): ChartTypeConfig {
  return {
    ...base,
    label: entry.label,
    description: entry.description,
    useCase: entry.useCase,
    isAvailable: entry.isAvailable,
  }
}

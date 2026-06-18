/**
 * Lazy Chart Config Registry
 *
 * Provides async loading for chart configurations.
 * This enables code splitting - each chart config loads only when needed.
 */

import { useState, useEffect } from 'react'
import type { BuiltInChartType, ChartType } from '../types.js'
import type { ChartTypeConfig, ChartConfigRegistry } from './chartConfigs.js'
import { defaultChartConfig } from './chartConfigs.js'
import { chartRegistry, composeChartConfig } from './chartRegistry.js'

// Config import map - lazy imports for built-in chart configs.
// Migrated charts (e.g. bar) resolve via their `chartRegistry` entry's `config`
// thunk instead — their import path is defined once, in the entry.
const configImportMap: Partial<Record<BuiltInChartType, () => Promise<{ [key: string]: ChartTypeConfig }>>> = {
  line: () => import('../components/charts/LineChart.config.js'),
  area: () => import('../components/charts/AreaChart.config.js'),
  pie: () => import('../components/charts/PieChart.config.js'),
  scatter: () => import('../components/charts/ScatterChart.config.js'),
  radar: () => import('../components/charts/RadarChart.config.js'),
  radialBar: () => import('../components/charts/RadialBarChart.config.js'),
  treemap: () => import('../components/charts/TreeMapChart.config.js'),
  bubble: () => import('../components/charts/BubbleChart.config.js'),
  table: () => import('../components/charts/DataTable.config.js'),
  activityGrid: () => import('../components/charts/ActivityGridChart.config.js'),
  kpiNumber: () => import('../components/charts/KpiNumber.config.js'),
  kpiDelta: () => import('../components/charts/KpiDelta.config.js'),
  kpiText: () => import('../components/charts/KpiText.config.js'),
  markdown: () => import('../components/charts/MarkdownChart.config.js'),
  funnel: () => import('../components/charts/FunnelChart.config.js'),
  sankey: () => import('../components/charts/SankeyChart.config.js'),
  sunburst: () => import('../components/charts/SunburstChart.config.js'),
  heatmap: () => import('../components/charts/HeatMapChart.config.js'),
  retentionHeatmap: () => import('../components/charts/RetentionHeatmap.config.js'),
  retentionCombined: () => import('../components/charts/RetentionCombinedChart.config.js'),
  boxPlot: () => import('../components/charts/BoxPlotChart.config.js'),
  waterfall: () => import('../components/charts/WaterfallChart.config.js'),
  candlestick: () => import('../components/charts/CandlestickChart.config.js'),
  measureProfile: () => import('../components/charts/MeasureProfileChart.config.js'),
  gauge: () => import('../components/charts/GaugeChart.config.js'),
}

// Map from built-in chart type to expected export name.
// Migrated charts are absent — they resolve the config object directly via their entry.
const configExportNames: Partial<Record<BuiltInChartType, string>> = {
  line: 'lineChartConfig',
  area: 'areaChartConfig',
  pie: 'pieChartConfig',
  scatter: 'scatterChartConfig',
  radar: 'radarChartConfig',
  radialBar: 'radialBarChartConfig',
  treemap: 'treemapChartConfig',
  bubble: 'bubbleChartConfig',
  table: 'dataTableConfig',
  activityGrid: 'activityGridChartConfig',
  kpiNumber: 'kpiNumberConfig',
  kpiDelta: 'kpiDeltaConfig',
  kpiText: 'kpiTextConfig',
  markdown: 'markdownConfig',
  funnel: 'funnelChartConfig',
  sankey: 'sankeyChartConfig',
  sunburst: 'sunburstChartConfig',
  heatmap: 'heatmapChartConfig',
  retentionHeatmap: 'retentionHeatmapConfig',
  retentionCombined: 'retentionCombinedConfig',
  boxPlot: 'boxPlotChartConfig',
  waterfall: 'waterfallChartConfig',
  candlestick: 'candlestickChartConfig',
  measureProfile: 'measureProfileChartConfig',
  gauge: 'gaugeChartConfig',
}

// Cache for loaded configs
const configCache = new Map<ChartType, ChartTypeConfig>()

/**
 * Get a chart config asynchronously
 *
 * @param chartType The chart type to load config for
 * @returns The chart type config, or null if not found
 *
 * @example
 * ```typescript
 * const config = await getChartConfigAsync('bar')
 * console.log(config?.dropZones)
 * ```
 */
export async function getChartConfigAsync(chartType: ChartType): Promise<ChartTypeConfig | null> {
  // Check cache first (plugin overrides land here via registerConfigToCache —
  // their precedence stays ahead of the unified/legacy lookups below).
  if (configCache.has(chartType)) {
    return configCache.get(chartType)!
  }

  // Unified registry: migrated charts resolve the config object directly, then
  // compose the entry metadata over it so the lazy public API returns the same
  // full shape (label/description/useCase/isAvailable) as non-migrated charts.
  const entry = chartRegistry[chartType as BuiltInChartType]
  if (entry) {
    try {
      const base = await entry.config()
      if (base) {
        const config = composeChartConfig(entry, base)
        configCache.set(chartType, config)
        return config
      }
      return null
    } catch (error) {
      console.error(`Failed to load config for chart type: ${chartType}`, error)
      return null
    }
  }

  // Legacy registry fallback for charts not yet migrated.
  const importFn = configImportMap[chartType as BuiltInChartType]
  if (!importFn) {
    return null
  }

  try {
    const module = await importFn()
    const exportName = configExportNames[chartType as BuiltInChartType]
    const config = exportName ? module[exportName] : undefined

    if (config) {
      configCache.set(chartType, config)
      return config
    }
    return null
  } catch (error) {
    console.error(`Failed to load config for chart type: ${chartType}`, error)
    return null
  }
}

/**
 * Get a chart config synchronously from cache
 *
 * Returns the cached config if available, otherwise returns the default config.
 * Use this when you need sync access and have already preloaded the config.
 *
 * @param chartType The chart type to get config for
 * @returns The chart type config (from cache or default)
 */
export function getChartConfigSync(chartType: ChartType): ChartTypeConfig {
  return configCache.get(chartType) || defaultChartConfig
}

/**
 * Check if a chart config is already loaded
 */
export function isChartConfigLoaded(chartType: ChartType): boolean {
  return configCache.has(chartType)
}

/**
 * React hook for using chart config
 *
 * Loads the chart config asynchronously and caches it.
 * Returns the default config while loading.
 *
 * @param chartType The chart type to load config for
 * @returns Object with config, loading state, and loaded flag
 *
 * @example
 * ```tsx
 * function ChartSetup({ chartType }) {
 *   const { config, loading } = useChartConfig(chartType)
 *
 *   if (loading) return <Spinner />
 *   return <ConfigForm config={config} />
 * }
 * ```
 */
export function useChartConfig(chartType: ChartType | undefined): {
  config: ChartTypeConfig
  loading: boolean
  loaded: boolean
} {
  const [config, setConfig] = useState<ChartTypeConfig>(
    chartType ? getChartConfigSync(chartType) : defaultChartConfig
  )
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!chartType) {
      setConfig(defaultChartConfig)
      setLoaded(false)
      return
    }

    // Check cache synchronously first
    if (configCache.has(chartType)) {
      setConfig(configCache.get(chartType)!)
      setLoaded(true)
      return
    }

    // Load async
    setLoading(true)
    getChartConfigAsync(chartType)
      .then((loadedConfig) => {
        if (loadedConfig) {
          setConfig(loadedConfig)
          setLoaded(true)
        } else {
          setConfig(defaultChartConfig)
          setLoaded(true)
        }
      })
      .finally(() => setLoading(false))
  }, [chartType])

  return { config, loading, loaded }
}

/**
 * Preload a chart config
 *
 * Triggers the async import without needing to use the config immediately.
 * Useful for prefetching configs that will likely be needed.
 *
 * @param chartType The chart type to preload config for
 */
export async function preloadChartConfig(chartType: ChartType): Promise<void> {
  if (!configCache.has(chartType)) {
    await getChartConfigAsync(chartType)
  }
}

/**
 * Preload multiple chart configs
 *
 * @param chartTypes Array of chart types to preload
 */
export async function preloadChartConfigs(chartTypes: ChartType[]): Promise<void> {
  await Promise.all(chartTypes.map(preloadChartConfig))
}

/**
 * Load all chart configs and return as a registry
 *
 * Useful for SSR or when you need all configs upfront.
 * After calling this, all configs are cached and available synchronously.
 *
 * @returns Complete chart config registry
 *
 * @example
 * ```typescript
 * // On server or during initialization
 * const registry = await loadAllChartConfigs()
 * // Now all configs are cached and getChartConfigSync works for all types
 * ```
 */
export async function loadAllChartConfigs(): Promise<ChartConfigRegistry> {
  // Union legacy import map with migrated entries so every built-in is covered.
  const chartTypes = [
    ...new Set([...Object.keys(configImportMap), ...Object.keys(chartRegistry)]),
  ] as ChartType[]
  await Promise.all(chartTypes.map(getChartConfigAsync))

  const registry: ChartConfigRegistry = {}
  for (const chartType of chartTypes) {
    const config = configCache.get(chartType)
    if (config) {
      registry[chartType] = config
    }
  }
  return registry
}

/**
 * Clear the config cache
 *
 * Useful for testing or when configs need to be reloaded.
 */
export function clearChartConfigCache(): void {
  configCache.clear()
}

/**
 * Register a custom chart config directly into the cache.
 * Used by the chart plugin system.
 */
export function registerConfigToCache(type: string, config: ChartTypeConfig): void {
  configCache.set(type as ChartType, config)
}

/**
 * Remove a custom chart config from the cache.
 * Used by the chart plugin system.
 */
export function unregisterConfigFromCache(type: string): void {
  configCache.delete(type as ChartType)
}

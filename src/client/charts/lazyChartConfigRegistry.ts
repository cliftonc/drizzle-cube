/**
 * Lazy Chart Config Registry
 *
 * Provides async loading for chart configurations.
 * This enables code splitting - each chart config loads only when needed.
 */

import { useState, useEffect } from 'react'
import type { ChartType } from '../types'
import type { ChartTypeConfig, ChartConfigRegistry } from './chartConfigs'
import { defaultChartConfig } from './chartConfigs'

// Config import map - lazy imports for each chart config
const configImportMap: Record<ChartType, () => Promise<{ [key: string]: ChartTypeConfig }>> = {
  bar: () => import('../components/charts/BarChart.config'),
  line: () => import('../components/charts/LineChart.config'),
  area: () => import('../components/charts/AreaChart.config'),
  pie: () => import('../components/charts/PieChart.config'),
  scatter: () => import('../components/charts/ScatterChart.config'),
  radar: () => import('../components/charts/RadarChart.config'),
  radialBar: () => import('../components/charts/RadialBarChart.config'),
  treemap: () => import('../components/charts/TreeMapChart.config'),
  bubble: () => import('../components/charts/BubbleChart.config'),
  table: () => import('../components/charts/DataTable.config'),
  activityGrid: () => import('../components/charts/ActivityGridChart.config'),
  kpiNumber: () => import('../components/charts/KpiNumber.config'),
  kpiDelta: () => import('../components/charts/KpiDelta.config'),
  kpiText: () => import('../components/charts/KpiText.config'),
  markdown: () => import('../components/charts/MarkdownChart.config'),
  funnel: () => import('../components/charts/FunnelChart.config'),
  sankey: () => import('../components/charts/SankeyChart.config'),
  sunburst: () => import('../components/charts/SunburstChart.config'),
  heatmap: () => import('../components/charts/HeatMapChart.config'),
}

// Map from chart type to expected export name
const configExportNames: Record<ChartType, string> = {
  bar: 'barChartConfig',
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
  // Check cache first
  if (configCache.has(chartType)) {
    return configCache.get(chartType)!
  }

  const importFn = configImportMap[chartType]
  if (!importFn) {
    return null
  }

  try {
    const module = await importFn()
    const exportName = configExportNames[chartType]
    const config = module[exportName]

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
  const chartTypes = Object.keys(configImportMap) as ChartType[]
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

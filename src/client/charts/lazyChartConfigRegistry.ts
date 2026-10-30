/**
 * Lazy Chart Config Registry
 *
 * Provides async loading for chart configurations.
 * This enables code splitting - each chart config loads only when needed.
 */

import { useState, useEffect, useSyncExternalStore } from 'react'
import type { ChartType } from '../types.js'
import type { ChartTypeConfig, ChartConfigRegistry } from './chartConfigs.js'
import { defaultChartConfig } from './chartConfigs.js'
import { chartRegistry, getChartEntry, composeChartConfig } from './chartRegistry.js'

// Cache for loaded configs
const configCache = new Map<ChartType, ChartTypeConfig>()

// Version of the plugin configs in the cache, for useSyncExternalStore. Only
// the plugin system changes it; a lazy load fills the cache for the hook that
// asked for it, so no other hook needs to know.
let pluginConfigVersion = 0
const pluginConfigListeners = new Set<() => void>()

function subscribeToPluginConfigs(listener: () => void): () => void {
  pluginConfigListeners.add(listener)
  return () => {
    pluginConfigListeners.delete(listener)
  }
}

function getPluginConfigVersion(): number {
  return pluginConfigVersion
}

function notifyPluginConfigChange(): void {
  pluginConfigVersion++
  for (const listener of pluginConfigListeners) {
    listener()
  }
}

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

  // Unified registry (custom-first): resolve the chart's config object via its
  // entry's `config` thunk, then compose the entry metadata over it so the lazy
  // public API returns the same full shape (label/description/useCase/isAvailable)
  // as the eager one. Using getChartEntry() means a registered plugin chart still
  // rehydrates here after the public clearChartConfigCache() drops its cache slot.
  const entry = getChartEntry(chartType)
  if (!entry) {
    return null
  }

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

  // Custom charts can register after mount (CubeProvider registers them in an
  // effect, after its children's effects), and a type can register again with
  // a new config. Resolve the config again when a plugin config changes.
  const pluginVersion = useSyncExternalStore(
    subscribeToPluginConfigs,
    getPluginConfigVersion,
    getPluginConfigVersion
  )

  useEffect(() => {
    if (!chartType) {
      setConfig(defaultChartConfig)
      setLoading(false)
      setLoaded(false)
      return
    }

    // Check cache synchronously first
    if (configCache.has(chartType)) {
      setConfig(configCache.get(chartType)!)
      setLoading(false)
      setLoaded(true)
      return
    }

    // Load async. Ignore a load that ends after chartType or a plugin config changed.
    let stale = false
    setLoading(true)
    getChartConfigAsync(chartType)
      .then((loadedConfig) => {
        if (stale) return
        if (loadedConfig) {
          setConfig(loadedConfig)
          setLoaded(true)
        } else {
          setConfig(defaultChartConfig)
          setLoaded(true)
        }
      })
      .finally(() => {
        if (!stale) setLoading(false)
      })

    return () => {
      stale = true
    }
  }, [chartType, pluginVersion])

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
  // Every built-in resolves through its chartRegistry entry.
  const chartTypes = Object.keys(chartRegistry) as ChartType[]
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
 * Used by the chart plugin system. Mounted `useChartConfig` hooks update.
 */
export function registerConfigToCache(type: string, config: ChartTypeConfig): void {
  configCache.set(type as ChartType, config)
  notifyPluginConfigChange()
}

/**
 * Remove a custom chart config from the cache.
 * Used by the chart plugin system. Mounted `useChartConfig` hooks update.
 */
export function unregisterConfigFromCache(type: string): void {
  configCache.delete(type as ChartType)
  notifyPluginConfigChange()
}

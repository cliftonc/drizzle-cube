import { ChartType } from '../types.js';
import { ChartTypeConfig, ChartConfigRegistry } from './chartConfigs.js';
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
export declare function getChartConfigAsync(chartType: ChartType): Promise<ChartTypeConfig | null>;
/**
 * Get a chart config synchronously from cache
 *
 * Returns the cached config if available, otherwise returns the default config.
 * Use this when you need sync access and have already preloaded the config.
 *
 * @param chartType The chart type to get config for
 * @returns The chart type config (from cache or default)
 */
export declare function getChartConfigSync(chartType: ChartType): ChartTypeConfig;
/**
 * Check if a chart config is already loaded
 */
export declare function isChartConfigLoaded(chartType: ChartType): boolean;
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
export declare function useChartConfig(chartType: ChartType | undefined): {
    config: ChartTypeConfig;
    loading: boolean;
    loaded: boolean;
};
/**
 * Preload a chart config
 *
 * Triggers the async import without needing to use the config immediately.
 * Useful for prefetching configs that will likely be needed.
 *
 * @param chartType The chart type to preload config for
 */
export declare function preloadChartConfig(chartType: ChartType): Promise<void>;
/**
 * Preload multiple chart configs
 *
 * @param chartTypes Array of chart types to preload
 */
export declare function preloadChartConfigs(chartTypes: ChartType[]): Promise<void>;
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
export declare function loadAllChartConfigs(): Promise<ChartConfigRegistry>;
/**
 * Clear the config cache
 *
 * Useful for testing or when configs need to be reloaded.
 */
export declare function clearChartConfigCache(): void;
/**
 * Register a custom chart config directly into the cache.
 * Used by the chart plugin system.
 */
export declare function registerConfigToCache(type: string, config: ChartTypeConfig): void;
/**
 * Remove a custom chart config from the cache.
 * Used by the chart plugin system.
 */
export declare function unregisterConfigFromCache(type: string): void;

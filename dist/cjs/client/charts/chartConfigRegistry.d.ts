import { ChartTypeConfig, ChartConfigRegistry } from './chartConfigs.js';
/**
 * Registry of all chart type configurations (the eager / full / server source).
 *
 * Every built-in is composed from its `chartRegistry` entry's metadata (single
 * source of truth) laid over its full config shape. Drop zones / display options
 * stay here in full because the server agent reads them synchronously.
 */
export declare const chartConfigRegistry: ChartConfigRegistry;
/**
 * Whether a chart lists records rather than aggregates, and so needs an
 * `ungrouped` query.
 *
 * Reads the eager registry so the query builders need no chart-type switch.
 */
export declare function isRecordGrainChart(chartType: string): boolean;
/**
 * Register a custom chart config into the registry.
 * Used by the chart plugin system.
 */
export declare function registerChartConfig(type: string, config: ChartTypeConfig): void;
/**
 * Unregister a chart config from the registry.
 * Used by the chart plugin system.
 */
export declare function unregisterChartConfig(type: string): void;

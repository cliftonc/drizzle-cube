import { ChartType, ChartAxisConfig } from '../types.js';
import { MetricItem, BreakdownItem } from '../components/AnalysisBuilder/types.js';
import { ChartAvailability } from '../charts/chartConfigs.js';
/**
 * Result of smart chart defaults calculation
 */
export interface SmartChartDefaults {
    /** The recommended chart type */
    chartType: ChartType;
    /** The auto-configured chart axis settings */
    chartConfig: ChartAxisConfig;
}
export type { ChartAvailability } from '../charts/chartConfigs.js';
/**
 * Map of chart type availability statuses
 */
export type ChartAvailabilityMap = Record<ChartType, ChartAvailability>;
/**
 * Check if a specific chart type is available given current selections.
 * Delegates to each chart's own `isAvailable` declared in its .config.ts —
 * availability requirements live next to the chart they describe, not here.
 */
export declare function getChartAvailability(chartType: ChartType, metrics: MetricItem[], breakdowns: BreakdownItem[]): ChartAvailability;
/**
 * Get availability for all chart types
 */
export declare function getAllChartAvailability(metrics: MetricItem[], breakdowns: BreakdownItem[]): ChartAvailabilityMap;
/**
 * Select the best chart type based on current metrics and breakdowns
 *
 * Priority order:
 * 1. If current chart type is still valid, keep it (preserve user intent)
 * 2. If current chart becomes invalid, switch to best alternative:
 *    - Has time dimension → line
 *    - Has dimension + measure → bar
 *    - Has measures only → bar (or kpiNumber if single measure + no breakdowns)
 *    - No fields → keep current
 */
export declare function selectBestChartType(metrics: MetricItem[], breakdowns: BreakdownItem[], currentChartType: ChartType): ChartType;
/**
 * Get smart default chart configuration based on chart type and selections
 */
export declare function getSmartChartDefaults(metrics: MetricItem[], breakdowns: BreakdownItem[], currentChartType: ChartType): SmartChartDefaults;
/**
 * Determine if chart type should be auto-switched based on selections change
 *
 * Returns the new chart type if a switch is recommended, or null if no change needed.
 *
 * @param metrics - Current metrics selection
 * @param breakdowns - Current breakdowns selection
 * @param currentChartType - Current chart type
 * @param userManuallySelected - Whether user manually selected the current chart type
 */
export declare function shouldAutoSwitchChartType(metrics: MetricItem[], breakdowns: BreakdownItem[], currentChartType: ChartType, userManuallySelected: boolean): ChartType | null;
/**
 * Merge existing chart config with smart defaults
 * Only fills in missing or invalid fields, preserves valid existing config
 */
export declare function mergeChartConfigWithDefaults(existingConfig: ChartAxisConfig, smartDefaults: ChartAxisConfig, metrics: MetricItem[], breakdowns: BreakdownItem[]): ChartAxisConfig;

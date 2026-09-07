import { ReactNode } from 'react';
import { ChartType, ChartProps } from '../types.js';
export { registerChartComponent, unregisterChartComponent } from './chartComponentRegistry.js';
/**
 * Check if a chart type is supported (built-in or custom plugin)
 */
export declare function isValidChartType(chartType: string): chartType is ChartType;
export interface LazyChartProps extends ChartProps {
    chartType: ChartType;
    fallback?: ReactNode;
}
/**
 * Lazy Chart Component
 *
 * Renders a chart component with React.lazy dynamic loading.
 * The chart type determines which chart component is loaded.
 *
 * @example
 * ```tsx
 * <LazyChart
 *   chartType="bar"
 *   data={chartData}
 *   chartConfig={{ yAxis: ['value'] }}
 *   height={300}
 * />
 * ```
 */
export declare function LazyChart({ chartType, fallback, height, ...chartProps }: LazyChartProps): import("react").JSX.Element;
/**
 * Preload a chart type
 *
 * Triggers the dynamic import without rendering.
 * Useful for prefetching charts that will likely be needed.
 *
 * @example
 * ```tsx
 * // Preload bar chart on hover
 * onMouseEnter={() => preloadChart('bar')}
 * ```
 */
export declare function preloadChart(chartType: ChartType): void;
/**
 * Preload multiple chart types
 *
 * @example
 * ```tsx
 * // Preload common charts on app init
 * useEffect(() => {
 *   preloadCharts(['bar', 'line', 'pie'])
 * }, [])
 * ```
 */
export declare function preloadCharts(chartTypes: ChartType[]): void;
/**
 * Get all available chart types (built-in + custom plugins)
 */
export declare function getAvailableChartTypes(): ChartType[];
/**
 * Check if a chart type has loaded successfully.
 * Returns false if the chart failed to load due to missing dependencies.
 *
 * Note: This only returns accurate results after the chart has been attempted to load.
 * Use this for conditional UI logic (e.g., hiding unavailable chart types).
 */
export declare function isChartTypeAvailable(chartType: ChartType): boolean;
/**
 * Get list of chart types that failed to load due to missing dependencies.
 */
export declare function getUnavailableChartTypes(): ChartType[];

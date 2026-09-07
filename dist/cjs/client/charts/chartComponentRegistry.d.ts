import { ComponentType, LazyExoticComponent } from 'react';
import { ChartType, ChartProps } from '../types.js';
export type LazyChartComponent = ComponentType<ChartProps>;
export declare const chartLoaderCache: Map<ChartType, LazyExoticComponent<LazyChartComponent>>;
export declare const failedChartTypes: Set<ChartType>;
export declare const customChartMap: Map<string, LazyExoticComponent<LazyChartComponent>>;
/**
 * Creates a fallback component for an unknown/unregistered chart type.
 */
export declare function createUnknownChartFallback(chartType: string): LazyChartComponent;
/**
 * Creates a fallback component for a chart type with missing dependencies.
 */
export declare function createFallbackComponent(chartType: ChartType): LazyChartComponent;
/**
 * Wraps a chart import function with error handling.
 * If the import fails (e.g., missing dependency), returns a fallback component.
 */
export declare function createSafeImport(chartType: ChartType, importFn: () => Promise<{
    default: LazyChartComponent;
}>): () => Promise<{
    default: LazyChartComponent;
}>;
/**
 * Register a custom chart component.
 * Used by the chart plugin system.
 */
export declare function registerChartComponent(type: string, component?: ComponentType<ChartProps>, lazyComponent?: () => Promise<{
    default: ComponentType<ChartProps>;
}>, dependencies?: {
    packageName: string;
    installCommand: string;
}): void;
/**
 * Unregister a custom chart component.
 * Used by the chart plugin system.
 */
export declare function unregisterChartComponent(type: string): void;

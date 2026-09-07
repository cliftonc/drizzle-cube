import { Cube } from './types/index.js';
/**
 * Measure types that are window functions. Window functions require special
 * handling: no GROUP BY in the CTE, no re-aggregation in the outer query, and
 * they return individual rows rather than grouped results.
 */
export declare const WINDOW_FUNCTION_TYPES: readonly ["lag", "lead", "rank", "denseRank", "rowNumber", "ntile", "firstValue", "lastValue", "movingAvg", "movingSum"];
/** Check if a measure type is a window function. */
export declare function isWindowFunction(measureType: string): boolean;
/**
 * Check if a measure is a post-aggregation window function.
 * Post-aggregation windows reference a base `measure` in their windowConfig,
 * indicating they operate on aggregated data rather than raw rows.
 */
export declare function isPostAggregationWindow(measure: any): boolean;
/**
 * Resolve the base-measure reference for a post-aggregation window function to a
 * fully qualified name (e.g. 'totalRevenue' -> 'Sales.totalRevenue').
 * Returns null when the measure is not a post-aggregation window.
 */
export declare function getWindowBaseMeasure(measure: any, cubeName: string): string | null;
/**
 * Default operation for a window function type.
 * - lag/lead default to 'difference' (compare current vs previous/next)
 * - all others default to 'raw'
 */
export declare function getDefaultWindowOperation(windowType: string): 'raw' | 'difference' | 'ratio' | 'percentChange';
/**
 * Categorize measures for post-aggregation window-function handling.
 * - aggregateMeasures: regular aggregates (count, sum, avg, etc.)
 * - postAggWindowMeasures: window functions referencing a base measure
 * - requiredBaseMeasures: base measures those windows depend on (auto-added)
 */
export declare function categorizeForPostAggregation(measureNames: string[], cubeMap: Map<string, Cube>): {
    aggregateMeasures: string[];
    postAggWindowMeasures: string[];
    requiredBaseMeasures: Set<string>;
};
/** Whether any measure in the list is a post-aggregation window function. */
export declare function hasPostAggregationWindows(measureNames: string[], cubeMap: Map<string, Cube>): boolean;

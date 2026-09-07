import { ChartAxisConfig, ChartDisplayConfig } from '../../types.js';
/** Extract the value field list from chart config (string | array | undefined). */
export declare function getKpiValueFields(yAxis: ChartAxisConfig['yAxis']): string[];
/** Sort rows ascending by the time-dimension field (stable when absent). */
export declare function sortKpiData<T extends Record<string, any>>(data: T[] | undefined, timeDimensionField: string | undefined): T[];
/**
 * Extract numeric values for the configured field, falling back to the first
 * numeric field on each row when the configured field is absent.
 */
export declare function extractKpiValues(dataToUse: Record<string, any>[], valueField: string): number[];
/** Compute avg/min/max over a numeric series (0s when empty). */
export declare function computeKpiStats(values: number[]): {
    avg: number;
    min: number;
    max: number;
};
/**
 * Format a numeric KPI value with thousands/millions/billions suffixes,
 * honouring a custom `formatValue`, `decimals` and `prefix` from displayConfig.
 */
export declare function formatKpiNumber(value: number | null | undefined, displayConfig: ChartDisplayConfig): string;
/**
 * Resolve the label to display for a KPI field: prefer the resolved field label,
 * but fall back to the raw field name when the label looks empty/too short.
 */
export declare function resolveDisplayLabel(label: string | undefined, fieldName: string): string;
/** Resolve the main value colour from the palette / displayConfig overrides. */
export declare function resolveValueColor(valueColorIndex: number | undefined, colors: string[] | undefined): string;
/** Resolve the variance colour (green/red based on sign), with palette overrides. */
export declare function resolveVarianceColor(variance: number | null, positiveColorIndex: number | undefined, negativeColorIndex: number | undefined, colors: string[] | undefined): string;

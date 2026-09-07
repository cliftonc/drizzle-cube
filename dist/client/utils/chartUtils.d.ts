import { FieldLabelMap, AxisFormatConfig } from '../types.js';
export declare function isValidNumericValue(value: any): boolean;
export declare function parseNumericValue(value: any): number | null;
export declare function formatNumericValue(value: any): string;
/**
 * Format a numeric value for axis/tooltip display with configurable formatting
 *
 * @param value - The numeric value to format
 * @param config - Optional formatting configuration
 * @param locale - Optional locale string (defaults to browser locale)
 * @returns Formatted string representation of the value
 *
 * @example
 * formatAxisValue(1250000, { unit: 'currency', abbreviate: true }) // "$1.25M"
 * formatAxisValue(0.75, { unit: 'percent', decimals: 1 }) // "75.0%"
 * formatAxisValue(1234567, { abbreviate: true, decimals: 2 }) // "1.23M"
 */
export declare function formatAxisValue(value: number | null | undefined, config?: AxisFormatConfig, locale?: string): string;
/**
 * Create a tick formatter function for Recharts axes
 * Returns a function that can be used as tickFormatter prop
 */
export declare function createAxisTickFormatter(config?: AxisFormatConfig): (value: any) => string;
export declare function getFieldLabel(fieldName: string, labelMap: FieldLabelMap): string;
export declare function transformSeriesKeysWithLabels(seriesKeys: string[], labelMap: FieldLabelMap): string[];
export declare function formatTimeValue(value: any, granularity?: string): string;
export declare function getFieldGranularity(queryObject: any, fieldName: string): string | undefined;
export declare function transformChartData(data: any[], xAxisField: string, yAxisFields: string[], queryObject: any, getFieldLabelFn?: (fieldName: string) => string): any[];
export interface ChartSeriesResult {
    data: any[];
    seriesKeys: string[];
    hasDimensions: boolean;
}
export declare function transformChartDataWithSeries(data: any[], xAxisField: string, yAxisFields: string[], queryObject: any, seriesFields?: string[], // New optional parameter for explicit series fields
getFieldLabelFn?: (fieldName: string) => string): ChartSeriesResult;

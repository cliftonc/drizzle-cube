import { AxisFormatConfig, ChartDisplayConfig } from '../../types.js';
/**
 * Maximum dimensions for heatmap to prevent browser lockup. 50x50 = 2500 cells.
 */
export declare const MAX_HEATMAP_ROWS = 50;
export declare const MAX_HEATMAP_COLS = 50;
/** Parse color string (hex or rgb) to RGB values. */
export declare function parseColor(color: string): {
    r: number;
    g: number;
    b: number;
} | null;
/** Relative luminance of a color (0 black .. 1 white) per WCAG. */
export declare function getLuminance(color: string): number;
/** Contrasting text color (white or dark) based on a background color. */
export declare function getContrastingTextColor(bgColor: string): string;
interface HeatMapDatum {
    x: string;
    y: number | null;
}
interface HeatMapSerie {
    id: string;
    data: HeatMapDatum[];
}
export interface HeatMapTransformResult {
    data: HeatMapSerie[];
    truncated: boolean;
    originalRows: number;
    originalCols: number;
}
/**
 * Transform drizzle-cube flat query results to nivo heatmap format.
 *
 * Groups rows by the Y dimension, sorts X chronologically when possible, and
 * truncates to MAX_HEATMAP_ROWS x MAX_HEATMAP_COLS to prevent browser lockup.
 */
export declare function transformToHeatMapFormat(data: Record<string, unknown>[], xAxisField: string | undefined, yAxisField: string | undefined, valueField: string | undefined, xGranularity?: string, yGranularity?: string): HeatMapTransformResult;
/** Coerce an axis config value (string | array | undefined) to a single field. */
export declare function firstField(value: string | string[] | undefined): string | undefined;
export interface HeatMapDisplayOptions {
    showLabels: boolean;
    cellShape: 'rect' | 'circle';
    showLegend: boolean;
    xAxisFormat?: AxisFormatConfig;
    yAxisFormat?: AxisFormatConfig;
    valueFormat?: AxisFormatConfig;
}
/** Resolve heatmap display options from the (loosely-typed) display config. */
export declare function resolveHeatMapDisplayOptions(displayConfig: ChartDisplayConfig | undefined): HeatMapDisplayOptions;
/** Build an axis `format` fn that applies the given axis format config (or none). */
export declare function makeAxisFormatter(format: AxisFormatConfig | undefined): ((v: string | number) => string) | undefined;
/** Resolve the heatmap value formatter (custom format or nivo default). */
export declare function makeValueFormatter(valueFormat: AxisFormatConfig | undefined): ((v: number) => string) | string;
/** Sequential colours config for nivo; falls back to a built-in scheme. */
export declare function resolveHeatMapColors(colors: string[]): {
    type: 'sequential';
    colors: [string, string];
} | {
    type: 'sequential';
    scheme: 'greens';
};
/** Default sequential blue gradient when no palette gradient is supplied. */
export declare const DEFAULT_HEATMAP_COLORS: string[];
export {};

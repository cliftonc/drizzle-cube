import { AxisFormatConfig, ChartAxisConfig, ColorPalette, CubeQuery } from '../../types.js';
export interface TreemapDatum {
    name: string;
    size: number;
    fill?: string;
    series?: string;
    [key: string]: unknown;
}
export interface TreemapBuildResult {
    treemapData: TreemapDatum[];
    isNumericSeries: boolean;
    seriesField?: string;
}
/**
 * Build treemap data (config or auto-detect), then drop non-positive sizes.
 * Returns `null` when the legacy path can't find a usable size field.
 */
export declare function buildTreemapData(data: Record<string, any>[], chartConfig: ChartAxisConfig | undefined, queryObject: CubeQuery | undefined, colorPalette: ColorPalette | undefined): TreemapBuildResult | null;
/** Min/max of the (numeric) series field across the raw rows. */
export declare function seriesMinMax(data: Record<string, any>[], seriesField: string): {
    min: number;
    max: number;
};
/** Format a numeric value with the optional axis format (or `.toFixed(2)`). */
export declare function formatSeriesValue(value: number, format: AxisFormatConfig | undefined): string;
export interface LegendEntry {
    value: string;
    type: 'rect';
    color: string;
}
/**
 * Build the legend entries for the treemap: a gradient ramp for numeric series,
 * or discrete swatches for categorical series. Empty when not applicable.
 */
export declare function buildTreemapLegend(data: Record<string, any>[], treemapData: TreemapDatum[], showLegend: boolean, seriesField: string | undefined, isNumericSeries: boolean, leftYAxisFormat: AxisFormatConfig | undefined): LegendEntry[];
/** Adjust the outer container height to make room for a legend, if present. */
export declare function adjustHeightForLegend(height: string | number, hasLegend: boolean): string | number;

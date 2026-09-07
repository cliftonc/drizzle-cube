import { AxisFormatConfig, ChartAxisConfig, ChartDisplayConfig, CubeQuery } from '../../types.js';
export interface BubbleData {
    x: number;
    xLabel?: string;
    y: number;
    size: number;
    color?: string | number;
    label: string;
    series?: string;
}
export interface BubbleDisplayOptions {
    showLegend: boolean;
    showGrid: boolean;
    showTooltip: boolean;
    minBubbleSize: number;
    maxBubbleSize: number;
    bubbleOpacity: number;
    xAxisFormat?: AxisFormatConfig;
    leftYAxisFormat?: AxisFormatConfig;
}
/** Resolve bubble display options with defaults from the display config. */
export declare function resolveBubbleDisplayOptions(displayConfig: ChartDisplayConfig | undefined): BubbleDisplayOptions;
export interface BubbleFields {
    xAxisField: string;
    yAxisField: string;
    seriesField: string;
    sizeFieldName: string;
    colorFieldName?: string;
}
/** Resolve the bubble chart field names; returns null when required fields missing. */
export declare function resolveBubbleFields(chartConfig: ChartAxisConfig | undefined): BubbleFields | null;
/**
 * Transform query rows into bubble data, filtering out points with invalid
 * x/y coordinates or non-positive size. Mirrors the original inline map+filter.
 */
export declare function transformBubbleData(data: Record<string, any>[], fields: BubbleFields, queryObject: CubeQuery | undefined): BubbleData[];
/** Read a CSS custom property from the document root with a fallback. */
export declare function getThemeColor(varName: string, fallback: string): string;
/** Resolve text + grid colours for the current theme. */
export declare function resolveThemeColors(isDark: boolean): {
    textColor: string;
    gridColor: string;
};

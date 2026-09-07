import { CHART_MARGINS } from '../../utils/chartConstants.js';
import { AxisFormatConfig, ChartAxisConfig, ChartDisplayConfig, CubeQuery } from '../../types.js';
export interface ScatterRenderState {
    showLegend: boolean;
    showGrid: boolean;
    showTooltip: boolean;
    /** Whether to render one Scatter per series group vs a single series. */
    hasSeries: boolean;
    xAxisFormat?: AxisFormatConfig;
    /** For scatter charts the y-axis uses the left-axis format config. */
    yAxisFormat?: AxisFormatConfig;
    chartMargins: typeof CHART_MARGINS;
}
/**
 * Resolve all render-time display flags, axis formats and margins for the
 * scatter chart from the display config and the transformed series keys.
 */
export declare function resolveScatterRenderState(displayConfig: ChartDisplayConfig | undefined, seriesKeys: string[]): ScatterRenderState;
export interface ScatterAxisFields {
    xAxisField: string;
    yAxisField: string;
    seriesFields: string[];
    /** Set when the config is invalid (no usable axis fields). */
    errorCode?: 'axisInvalid' | 'axisFields';
}
/** Resolve x/y/series fields supporting both the new and legacy config shapes. */
export declare function resolveScatterAxisFields(chartConfig: ChartAxisConfig | undefined): ScatterAxisFields;
export interface ScatterPoint {
    x: number;
    y: number;
    name: string;
    timeValues: Record<string, string>;
    originalItem: Record<string, any>;
}
export interface ScatterTransform {
    scatterData: ScatterPoint[];
    seriesGroups: Record<string, ScatterPoint[]>;
}
/**
 * Transform rows into scatter points, grouping by series when configured.
 * Null x/y coordinates are filtered out. Mirrors the original two-branch logic.
 */
export declare function transformScatterData(data: Record<string, any>[], xAxisField: string, yAxisField: string, seriesFields: string[], timeDimensionFields: string[], queryObject: CubeQuery | undefined): ScatterTransform;

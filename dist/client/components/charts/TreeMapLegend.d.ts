import { AxisFormatConfig } from '../../types.js';
import { LegendEntry } from './TreeMapChart.helpers.js';
interface TreeMapLegendProps {
    isNumericSeries: boolean;
    seriesField?: string;
    seriesLabel: string;
    legendPayload: LegendEntry[];
    data: Record<string, any>[];
    leftYAxisFormat?: AxisFormatConfig;
}
/** Treemap legend wrapper — gradient for numeric series, swatches otherwise. */
export declare function TreeMapLegend({ isNumericSeries, seriesField, seriesLabel, legendPayload, data, leftYAxisFormat, }: TreeMapLegendProps): import("react").JSX.Element;
export {};

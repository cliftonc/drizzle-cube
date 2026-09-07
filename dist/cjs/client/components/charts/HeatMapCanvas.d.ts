import { HeatMapDisplayOptions } from './HeatMapChart.helpers.js';
interface HeatMapDatum {
    x: string;
    y: number | null;
}
interface HeatMapSerie {
    id: string;
    data: HeatMapDatum[];
}
interface HeatMapCanvasProps {
    data: HeatMapSerie[];
    truncated: boolean;
    colors: string[];
    options: HeatMapDisplayOptions;
    xAxisField: string;
    yAxisField: string;
    valueField: string;
}
/**
 * The nivo `<ResponsiveHeatMap>` for HeatMapChart, with all axis/legend/colour
 * config resolved from helpers. Extracted so the chart component stays a thin
 * orchestrator. Behaviour matches the original inline JSX.
 */
export declare function HeatMapCanvas({ data, truncated, colors, options, xAxisField, yAxisField, valueField, }: HeatMapCanvasProps): import("react").JSX.Element;
export {};

import { ColorPalette } from '../../types.js';
import { ScatterPoint } from './ScatterChart.helpers.js';
interface ScatterSeriesProps {
    hasSeries: boolean;
    seriesKeys: string[];
    seriesGroups: Record<string, ScatterPoint[]>;
    scatterData: ScatterPoint[];
    colorPalette?: ColorPalette;
    hoveredLegend: string | null;
}
/**
 * Renders the `<Scatter>` series for ScatterChart — one per series group when
 * `hasSeries`, otherwise a single series. Returned as a fragment so it composes
 * inside the Recharts chart children. Behaviour matches the original inline JSX.
 */
export declare function ScatterSeries({ hasSeries, seriesKeys, seriesGroups, scatterData, colorPalette, hoveredLegend }: ScatterSeriesProps): import("react").JSX.Element;
export {};

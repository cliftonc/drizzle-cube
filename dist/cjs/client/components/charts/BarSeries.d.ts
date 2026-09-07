import { default as React } from 'react';
import { ColorPalette } from '../../types.js';
import { ChartDataPointClickEvent } from '../../types/drill.js';
interface BarSeriesProps {
    seriesKey: string;
    index: number;
    /** Original field name backing this series key (for axis assignment + drill). */
    originalField: string | undefined;
    axisId: 'left' | 'right';
    stackId: string | undefined;
    chartData: Record<string, any>[];
    enhancedChartData: Record<string, any>[];
    colorPalette?: ColorPalette;
    hoveredLegend: string | null;
    usePositiveNegativeColoring: boolean;
    useColorByCategory: boolean;
    drillEnabled?: boolean;
    onDataPointClick?: (event: ChartDataPointClickEvent) => void;
}
/**
 * Single `<Bar>` for a series key.
 *
 * Encapsulates the per-bar colouring modes (positive/negative, colour-by-category)
 * and the drill click handler that were previously inlined in BarChart's render.
 * Returned as a fragment-bearing component so it can be used directly inside the
 * Recharts `<ComposedChart>` children list. Behaviour is identical to the original.
 */
export declare function BarSeries({ seriesKey, index, originalField, axisId, stackId, chartData, enhancedChartData, colorPalette, hoveredLegend, usePositiveNegativeColoring, useColorByCategory, drillEnabled, onDataPointClick }: BarSeriesProps): React.JSX.Element;
export {};

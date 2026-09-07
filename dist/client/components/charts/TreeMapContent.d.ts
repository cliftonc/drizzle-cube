import { default as React } from 'react';
import { AxisFormatConfig, ChartAxisConfig, ColorPalette, CubeQuery } from '../../types.js';
import { ChartDataPointClickEvent } from '../../types/drill.js';
import { TreemapDatum } from './TreeMapChart.helpers.js';
interface TreeMapContentOptions {
    treemapData: TreemapDatum[];
    colorPalette?: ColorPalette;
    hoveredIndex: number | null;
    setHoveredIndex: (index: number | null) => void;
    leftYAxisFormat?: AxisFormatConfig;
    drillEnabled?: boolean;
    onDataPointClick?: (event: ChartDataPointClickEvent) => void;
    queryObject?: CubeQuery;
    chartConfig?: ChartAxisConfig;
}
/**
 * Build the Recharts `content` renderer for treemap cells.
 *
 * Encapsulates the per-cell rect + foreignObject overlay, hover state and drill
 * click handler that previously lived inline in TreeMapChart (the highest-
 * complexity hot spots). Behaviour is identical to the original.
 */
export declare function makeTreeMapContent({ treemapData, colorPalette, hoveredIndex, setHoveredIndex, leftYAxisFormat, drillEnabled, onDataPointClick, queryObject, chartConfig, }: TreeMapContentOptions): (props: any) => React.JSX.Element | null;
export {};

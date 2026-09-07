import { GridCell, GridMapping } from './ActivityGridChart.helpers.js';
import { ColorPalette } from '../../types.js';
import { ChartDataPointClickEvent } from '../../types/drill.js';
export interface ActivityGridSafeConfig {
    showTooltip: boolean;
    showLabels: boolean;
    fitToWidth: boolean;
}
export interface ActivityGridRenderContext {
    svgEl: SVGSVGElement;
    gridData: GridCell[];
    gridMapping: GridMapping;
    granularity: string;
    dimensions: {
        width: number;
        height: number;
    };
    safeDisplayConfig: ActivityGridSafeConfig;
    colorPalette?: ColorPalette;
    isDark: boolean;
    valueField: string;
    dateField: string;
    getFieldLabel: (field: string) => string;
    drillEnabled?: boolean;
    onDataPointClick?: (event: ChartDataPointClickEvent) => void;
}
/**
 * Render the activity grid into the given SVG element. Returns a cleanup
 * function removing the tooltip, or undefined when there is nothing to draw.
 */
export declare function renderActivityGrid(ctx: ActivityGridRenderContext): (() => void) | undefined;

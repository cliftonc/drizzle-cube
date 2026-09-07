import { BubbleData, BubbleDisplayOptions, BubbleFields } from './BubbleChart.helpers.js';
import { ColorPalette, CubeQuery } from '../../types.js';
export interface BubbleRenderContext {
    svgEl: SVGSVGElement;
    bubbleData: BubbleData[];
    fields: BubbleFields;
    options: BubbleDisplayOptions;
    dimensions: {
        width: number;
        height: number;
    };
    queryObject: CubeQuery | undefined;
    colorPalette?: ColorPalette;
    isDark: boolean;
    getFieldLabel: (field: string) => string;
}
/**
 * Render the bubble chart into the given SVG element. Returns a cleanup function
 * that removes the floating tooltip. Returns undefined when there is nothing to draw.
 */
export declare function renderBubbleChart(ctx: BubbleRenderContext): (() => void) | undefined;

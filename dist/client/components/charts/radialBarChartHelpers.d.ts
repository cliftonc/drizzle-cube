import { ColorPalette } from '../../types.js';
/**
 * Co-located data-shaping helpers for RadialBarChart. The component supports a
 * config-driven format and a legacy auto-detection format; both branches are
 * isolated here so the component body stays focused on rendering. Pure
 * extraction — no behaviour change.
 */
export interface RadialDatum {
    name: string;
    value: number;
    fill?: string;
}
export interface RadialShape {
    radialData: RadialDatum[];
    /** True when the legacy auto-detect found no usable value field. */
    noValueField?: boolean;
}
/**
 * Shape rows for the radial bar chart (config-driven or legacy auto-detect),
 * filtering out null/zero values.
 */
export declare function buildRadialData(data: any[], chartConfig: any, queryObject: any, colorPalette: ColorPalette | undefined): RadialShape;

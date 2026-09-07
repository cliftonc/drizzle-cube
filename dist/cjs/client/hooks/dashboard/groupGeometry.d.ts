import { PortletGroup } from '../../types.js';
/** Edge of a card a drag can be dropped against. Lives here, not in
 *  `groupUtils`, so `layoutUtils` can name it without importing back. */
export type SnapEdge = 'top' | 'right' | 'bottom' | 'left';
/**
 * Split `total` integer units across `weights` using largest-remainder, never
 * handing out less than 1. When `total < weights.length` every entry still gets
 * 1 and the result overflows - callers accept that rather than dropping a
 * portlet to zero size.
 */
export declare function partitionUnits(total: number, weights: number[]): number[];
/**
 * Grid-unit rectangle for every portlet in a group, given the rectangle the
 * group itself occupies. Written back onto the portlets so grid mode, the
 * mobile stack and thumbnails keep working without knowing groups exist.
 */
export declare function deriveGroupGeometry(group: PortletGroup, x: number, y: number, w: number, h: number): Array<{
    portletId: string;
    x: number;
    y: number;
    w: number;
    h: number;
}>;

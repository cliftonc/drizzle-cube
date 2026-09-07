/**
 * Layout maths for the dot strip (beeswarm) chart.
 *
 * Kept out of the component — like `ScatterChart.helpers.ts` and
 * `BubbleChart.render.ts` — so the swarm packing can be unit-tested without a
 * DOM. Everything here is pure: same input, same output, every time.
 */
/** Hard caps so one pathological band cannot blow up the layout. */
export declare const MAX_BANDS = 50;
export declare const MAX_DOTS_PER_BAND = 500;
export declare const MAX_LANES = 8;
export declare const MIN_ROW_HEIGHT = 44;
export declare const MAX_ROW_HEIGHT = 220;
/** Vertical breathing room added above and below the outermost lanes. */
export declare const ROW_VERTICAL_PADDING = 12;
export declare const DOT_RADIUS: Record<'small' | 'medium' | 'large', number>;
/** Gap between the edges of two adjacent dots in the same lane. */
export declare const DOT_GAP = 1.5;
export interface DotDatum {
    /** Raw numeric value of the measure. */
    value: number;
    /** Identity label for the dot (from the optional series dimension). */
    label: string;
    /** The source row, handed back on click. */
    row: Record<string, unknown>;
}
export interface PlacedDot extends DotDatum {
    /** Pixel x within the plot area. */
    x: number;
    /** Lane index: 0 is the centre line, then +1, -1, +2, -2, … */
    lane: number;
    /** Pixel y offset from the band's centre line. */
    y: number;
}
export interface BandStats {
    /** The band's own label (the value of the band dimension). */
    label: string;
    dots: PlacedDot[];
    count: number;
    median: number | null;
    min: number | null;
    max: number | null;
    /**
     * max / min. `null` when it cannot be stated meaningfully — fewer than two
     * dots, or a non-positive minimum (the ratio is infinite or sign-flipped).
     */
    spread: number | null;
    /** True when the band has rows but not one usable numeric value. */
    noData: boolean;
    /** Rendered height of this band's row, in px. */
    height: number;
    /** True when the band's dots were truncated at MAX_DOTS_PER_BAND. */
    truncated: boolean;
}
export declare function parseNumeric(v: unknown): number | null;
export declare function median(sortedValues: number[]): number | null;
/**
 * Greedy deterministic beeswarm packing.
 *
 * Dots are sorted by x (ties broken by label, so the output is stable for a
 * given input rather than dependent on row order) and each is dropped into the
 * first lane — searched outward from the centre — where it clears every dot
 * already in that lane by at least `2r + gap`. Beyond `MAX_LANES` the dot is
 * forced onto the outermost lane and simply overlaps; the surface-coloured
 * stroke keeps that readable.
 *
 * A force simulation would do this too, but it settles asynchronously and
 * non-deterministically, which makes it untestable and jittery on re-render.
 */
export declare function packSwarm(dots: DotDatum[], scale: (v: number) => number, radius: number): PlacedDot[];
/** Row height needed to show every lane the swarm used. */
export declare function swarmHeight(placed: PlacedDot[], radius: number): number;
/** max / min, or null when the ratio would be meaningless. */
export declare function computeSpread(min: number | null, max: number | null, count: number): number | null;
export type BandSort = 'none' | 'valueDesc' | 'valueAsc' | 'count';
/**
 * Group rows into bands, in the order requested. Sorting happens before the
 * swarm is packed so row heights follow the rows the user actually sees.
 */
export declare function groupIntoBands(rows: Record<string, unknown>[], bandField: string, valueField: string, labelField: string | undefined, sort: BandSort): Array<{
    label: string;
    values: DotDatum[];
    truncated: boolean;
}>;
/** Nicely padded numeric domain across every dot in every band. */
export declare function computeDomain(values: number[]): {
    min: number;
    max: number;
};
/** Evenly spaced axis ticks across the domain. */
export declare function computeTicks(min: number, max: number, count?: number): number[];

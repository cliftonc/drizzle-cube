import { ChartAxisConfig } from '../../types.js';
/** Coerce a config axis value (string | array | undefined) to a field list. */
export declare function toFieldList(axis: ChartAxisConfig['yAxis']): string[];
/** Sort rows ascending by the dimension field (stable when absent). */
export declare function sortByDimension<T extends Record<string, any>>(data: T[], dimensionField: string | undefined): T[];
/** Extract finite numeric values for a field. */
export declare function extractNumericValues(rows: Record<string, any>[], valueField: string): number[];
export interface DeltaStats {
    lastValue: number;
    /** The value the delta is measured against — the baseline in `prev → current`. */
    previousValue: number;
    absoluteChange: number;
    percentageChange: number;
    isPositiveChange: boolean;
}
/** Compute last value + delta vs the previous value. Requires >= 2 values. */
export declare function computeDelta(values: number[]): DeltaStats;
/**
 * Resolve a palette colour by index, falling back to a default. Used for both
 * the positive and negative delta colours.
 */
export declare function resolvePaletteColor(colorIndex: number | undefined, colors: string[] | undefined, fallback: string): string;

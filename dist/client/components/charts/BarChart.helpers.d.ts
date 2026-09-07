import { ChartDisplayConfig } from '../../types.js';
export interface StackMode {
    shouldStack: boolean;
    isPercentStack: boolean;
}
/** Derive stacking flags from `stackType` (new) or `stacked` (legacy). */
export declare function resolveStackMode(displayConfig: ChartDisplayConfig | undefined): StackMode;
/**
 * Filter out rows where every series value is null, returning the kept rows and
 * the number skipped (used to render the "N hidden" footer note).
 */
export declare function filterEmptyRows(transformedData: Record<string, any>[], seriesKeys: string[]): {
    chartData: Record<string, any>[];
    skippedCount: number;
};
export interface BarColoringMode {
    /** Single series with mixed positive/negative values → green/red bars. */
    usePositiveNegativeColoring: boolean;
    /** Single measure, no series dimension, multiple categories → colour per category. */
    useColorByCategory: boolean;
}
/** Decide which special per-bar colouring mode (if any) applies. */
export declare function resolveBarColoringMode(seriesKeys: string[], chartData: Record<string, any>[], seriesFieldsLength: number): BarColoringMode;

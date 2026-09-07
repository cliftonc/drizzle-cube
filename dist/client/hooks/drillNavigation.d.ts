import { DrillOption, DrillPathEntry } from '../types/drill.js';
import { ChartAxisConfig, CubeQuery } from '../types.js';
/**
 * Find an existing drill-path level for the given option and compute the
 * "navigate back" descriptor (the truncated path + the query/chartConfig to
 * restore). Returns null when there is no matching existing level.
 *
 * Used for both time-granularity drilling (matched by `granularity`) and
 * hierarchy-dimension drilling (matched by `dimension`).
 */
export declare function findNavigateBackToExistingLevel(drillPath: DrillPathEntry[], matches: (entry: DrillPathEntry) => boolean): {
    newPath: DrillPathEntry[];
    query: CubeQuery;
    chartConfig: ChartAxisConfig | null;
} | null;
/**
 * Whether selecting this option means returning all the way to the root via the
 * original time granularity.
 */
export declare function isDrillBackToRootGranularity(option: DrillOption, originalGranularity: string | null): boolean;
/**
 * Compute the granularity to remember as the "original" when first drilling via
 * a time-granularity option. Returns null when nothing should be stored.
 */
export declare function computeOriginalGranularity(option: DrillOption, query: CubeQuery): string | null;

import { Filter } from '../../../types.js';
import { findDateFilterForField } from '../../../shared/filters/index.js';
export { findDateFilterForField };
/**
 * Build compareDateRange for a time dimension based on its date filter
 * When comparison is enabled, returns [[currentStart, currentEnd], [priorStart, priorEnd]]
 */
export declare function buildCompareDateRangeFromFilter(timeDimensionField: string, filters: Filter[]): [string, string][] | undefined;
/**
 * Remove the inDateRange filter for a specific field from a filters array.
 * Returns a new array with the filter removed (immutable).
 */
export declare function removeComparisonDateFilter(filters: Filter[], field: string): Filter[];

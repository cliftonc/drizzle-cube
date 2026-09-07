import { CubeQuery, Filter, SimpleFilter, GroupFilter, CubeMeta } from '../../types.js';
/**
 * Check if a filter is a simple filter.
 *
 * Discriminates against GroupFilter (which has `type`/`filters`, never
 * `member`/`operator`). `values` is intentionally NOT required: valueless
 * filters such as an `inDateRange` carrying only a `dateRange` are still simple.
 */
export declare function isSimpleFilter(filter: Filter): filter is SimpleFilter;
/**
 * Check if a filter is a group filter
 */
export declare function isGroupFilter(filter: Filter): filter is GroupFilter;
/**
 * Check if a filter is an AND filter
 */
export declare function isAndFilter(filter: Filter): filter is GroupFilter;
/**
 * Check if a filter is an OR filter
 */
export declare function isOrFilter(filter: Filter): filter is GroupFilter;
/**
 * Create a new simple filter
 */
export declare function createSimpleFilter(member: string, operator?: string, values?: any[]): SimpleFilter;
/**
 * Create a new AND filter group
 */
export declare function createAndFilter(filters?: Filter[]): GroupFilter;
/**
 * Create a new OR filter group
 */
export declare function createOrFilter(filters?: Filter[]): GroupFilter;
/**
 * Clean up filters - backward compatible (returns filters unchanged)
 * @deprecated This function is no longer used as we now support filtering on any schema field
 */
export declare function cleanupFilters(filters: Filter[], _query?: CubeQuery): Filter[];
/**
 * Flatten all simple filters from a hierarchical filter structure
 */
export declare function flattenFilters(filters: Filter[]): SimpleFilter[];
/**
 * Count total simple filters in a hierarchical structure
 */
export declare function countFilters(filters: Filter[]): number;
/**
 * Extract all member names from a filter tree (handles nested group filters).
 * Returns names in traversal order, including duplicates; callers that need
 * unique fields should de-duplicate.
 */
export declare function extractFilterMembers(filters: Filter[]): string[];
/**
 * Add a simple filter at a specific path in the filter tree.
 * Path is an array of indices, e.g. [0, 2] means filters[0].filters[2].
 * An empty path adds at the root, wrapping bare filters in an AND group as needed.
 */
export declare function addFilterAtPath(filters: Filter[], path: number[], newFilter: SimpleFilter): Filter[];
/**
 * Remove a top-level filter by index, unwrapping a sole remaining single-filter
 * group back to a bare filter (keeps the tree as shallow as possible).
 */
export declare function removeFilterAtIndex(filters: Filter[], index: number): Filter[];
/**
 * Return a copy of a group with its type toggled between AND and OR
 */
export declare function toggleGroupType(group: GroupFilter): GroupFilter;
/**
 * Find the first inDateRange filter for a given member, searching nested
 * groups. Returns its dateRange (preferring the dateRange property).
 */
export declare function findDateFilterForField(filters: Filter[], field: string): {
    dateRange: string | string[];
} | undefined;
/**
 * Remove every simple filter matching a member (optionally restricted to an
 * operator) from a filter tree, pruning groups that become empty. Immutable.
 */
export declare function removeFilterForMember(filters: Filter[], member: string, operator?: string): Filter[];
/**
 * Transform filters from the UI GroupFilter format to the legacy server format.
 * Server expects { and: [...] } / { or: [...] } instead of { type, filters }.
 */
export declare function transformFiltersForServer(filters: Filter[]): any[];
/**
 * Transform filters from server/API format to UI format.
 * Converts { and: [...] } / { or: [...] } to { type, filters } GroupFilters.
 */
export declare function transformFiltersFromServer(filters: any[]): Filter[];
/**
 * Check if a filter's field(s) exist in the cube metadata. Helps identify
 * filters that may not apply to a specific portlet's data. Fails open when no
 * metadata is available.
 */
export declare function validateFilterForCube(filter: Filter, cubeMeta: CubeMeta | null): boolean;

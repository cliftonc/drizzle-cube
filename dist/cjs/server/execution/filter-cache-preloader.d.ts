import { Cube, SemanticQuery, QueryContext } from '../types/index.js';
import { FilterCacheManager } from '../filter-cache.js';
import { DrizzleSqlBuilder } from '../physical-plan/drizzle-sql-builder.js';
export declare class FilterCachePreloader {
    private readonly queryBuilder;
    constructor(queryBuilder: DrizzleSqlBuilder);
    /**
     * Pre-build filter SQL and store in cache for reuse across CTEs and main query
     * This enables parameter deduplication - the same filter values are shared
     * rather than appearing as separate parameters in different parts of the query
     */
    preload(query: SemanticQuery, filterCache: FilterCacheManager, cubes: Map<string, Cube>, context: QueryContext): void;
    /** Resolve the dimension a filter/time-dimension member refers to, or null. */
    private resolveMemberDimension;
    /** Pre-build and cache the SQL for a single simple (non-logical) filter. */
    private preloadRegularFilter;
    /** Pre-build and cache the date-range SQL for a single time dimension. */
    private preloadTimeDimensionFilter;
}

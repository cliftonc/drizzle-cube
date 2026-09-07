import { SQL } from 'drizzle-orm';
import { Filter, FilterCondition, FilterCache } from './types/index.js';
/**
 * Generates a deterministic cache key for a filter
 * Keys are based on filter content (member, operator, values) not object identity
 */
export declare function getFilterKey(filter: Filter): string;
/**
 * Generates a cache key for time dimension date range filters
 */
export declare function getTimeDimensionFilterKey(dimension: string, dateRange: string | string[]): string;
/**
 * Cache statistics for debugging and monitoring
 */
export interface FilterCacheStats {
    hits: number;
    misses: number;
    cacheSize: number;
}
/**
 * Manages filter SQL caching for a single query execution
 *
 * Design principles:
 * - Immutable SQL: Once cached, SQL objects are never modified
 * - Cache lifetime: Created at query start, discarded after query execution
 * - Key by content: Filters with same member/operator/values share SQL
 * - Thread-safe: No shared mutable state between queries
 */
export declare class FilterCacheManager implements FilterCache {
    private cache;
    private stats;
    /**
     * Get cached SQL or build and cache it
     *
     * @param key - The cache key (use getFilterKey or getTimeDimensionFilterKey)
     * @param builder - Function to build the SQL if not cached
     * @returns The cached or freshly built SQL, or null if builder returns null
     */
    getOrBuild(key: string, builder: () => SQL | null): SQL | null;
    /**
     * Check if a key exists in the cache without affecting stats
     */
    has(key: string): boolean;
    /**
     * Get cached SQL without building (returns undefined if not cached)
     */
    get(key: string): SQL | undefined;
    /**
     * Pre-populate cache with multiple filters
     * Useful for batch initialization at query start
     */
    preload(entries: Array<{
        key: string;
        sql: SQL;
    }>): void;
    /**
     * Store a single entry in the cache
     */
    set(key: string, sql: SQL): void;
    /**
     * Get cache statistics for debugging
     */
    getStats(): FilterCacheStats;
    /**
     * Clear the cache (normally not needed as cache is per-query)
     */
    clear(): void;
}
/**
 * Flatten nested AND/OR filters into individual filter conditions
 * Useful for pre-building all filters at query start
 */
export declare function flattenFilters(filters: Filter[]): FilterCondition[];

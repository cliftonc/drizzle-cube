import { SecurityContext, SemanticQuery, QueryResult, CacheConfig } from '../types/index.js';
export declare class QueryResultCache {
    private readonly cacheConfig?;
    constructor(cacheConfig?: CacheConfig | undefined);
    /**
     * Returns the cache key when caching is enabled and a provider is configured,
     * otherwise undefined (which disables lookup and store).
     */
    generateKey(query: SemanticQuery, securityContext: SecurityContext, cubeSetKey?: string): string | undefined;
    /**
     * Look up a cached result. Returns the cached value (with cache metadata
     * attached) on a hit, or undefined on miss / bypass / no-cache. Emits
     * hit/miss events; lookup errors are non-fatal.
     */
    lookup(cacheKey: string | undefined, skipCache: boolean): Promise<QueryResult | undefined>;
    /**
     * Store a fresh result under the given key. No-ops when caching is disabled
     * or the key is undefined. Store errors are non-fatal.
     */
    store(cacheKey: string | undefined, result: QueryResult): Promise<void>;
}

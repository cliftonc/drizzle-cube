import { CacheProvider, CacheGetResult } from '../types/index.js';
/**
 * Options for MemoryCacheProvider
 */
export interface MemoryCacheProviderOptions {
    /**
     * Default TTL in milliseconds
     * @default 300000 (5 minutes)
     */
    defaultTtlMs?: number;
    /**
     * Maximum number of entries in the cache
     * When exceeded, oldest entries are evicted (LRU)
     * @default undefined (unlimited)
     */
    maxEntries?: number;
    /**
     * Interval in milliseconds to run automatic cleanup
     * Set to 0 to disable automatic cleanup
     * @default 60000 (1 minute)
     */
    cleanupIntervalMs?: number;
}
/**
 * Simple in-memory cache provider implementing the CacheProvider interface
 *
 * Features:
 * - TTL support with automatic expiration on read
 * - Optional automatic cleanup of expired entries
 * - Optional max entries limit with LRU eviction
 * - Full metadata support for TTL tracking
 *
 * Limitations:
 * - Not shared across processes/instances
 * - Data lost on process restart
 * - Not suitable for distributed deployments
 */
export declare class MemoryCacheProvider implements CacheProvider {
    private cache;
    private defaultTtlMs;
    private maxEntries?;
    private cleanupIntervalId?;
    private accessOrder;
    constructor(options?: MemoryCacheProviderOptions);
    /**
     * Get a cached value by key
     * Returns null if not found or expired
     * Automatically removes expired entries on access
     */
    get<T>(key: string): Promise<CacheGetResult<T> | null>;
    /**
     * Set a value in the cache
     * Respects maxEntries limit with LRU eviction
     */
    set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
    /**
     * Delete a specific key from the cache
     * Returns true if key existed and was deleted
     */
    delete(key: string): Promise<boolean>;
    /**
     * Delete all keys matching a pattern
     * Supports glob-style patterns with trailing '*'
     * Returns number of keys deleted
     */
    deletePattern(pattern: string): Promise<number>;
    /**
     * Check if a key exists in the cache
     * Returns false for expired entries
     */
    has(key: string): Promise<boolean>;
    /**
     * Stop automatic cleanup and clear the cache
     * Call this when the cache provider is no longer needed
     */
    close(): Promise<void>;
    /**
     * Remove all expired entries from the cache
     * Called automatically by cleanup interval
     * Can also be called manually
     *
     * @returns Number of entries removed
     */
    cleanup(): number;
    /**
     * Get current cache size (number of entries)
     * Note: May include expired entries that haven't been cleaned up yet
     */
    size(): number;
    /**
     * Clear all entries from the cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    stats(): {
        size: number;
        maxEntries?: number;
        defaultTtlMs: number;
    };
    private touchAccessOrder;
    private removeFromAccessOrder;
    private evictOldest;
}

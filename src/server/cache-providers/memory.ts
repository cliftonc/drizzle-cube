/**
 * In-memory cache provider for Drizzle Cube
 * Suitable for development, testing, or single-instance deployments
 */

import type { CacheProvider, CacheGetResult } from '../types'

/**
 * Internal cache entry structure with TTL tracking
 */
interface CacheEntry<T> {
  value: T
  cachedAt: number
  ttlMs: number
  expiresAt: number
}

/**
 * Options for MemoryCacheProvider
 */
export interface MemoryCacheProviderOptions {
  /**
   * Default TTL in milliseconds
   * @default 300000 (5 minutes)
   */
  defaultTtlMs?: number

  /**
   * Maximum number of entries in the cache
   * When exceeded, oldest entries are evicted (LRU)
   * @default undefined (unlimited)
   */
  maxEntries?: number

  /**
   * Interval in milliseconds to run automatic cleanup
   * Set to 0 to disable automatic cleanup
   * @default 60000 (1 minute)
   */
  cleanupIntervalMs?: number
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
export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTtlMs: number
  private maxEntries?: number
  private cleanupIntervalId?: ReturnType<typeof setInterval>
  private accessOrder: string[] = [] // For LRU tracking

  constructor(options: MemoryCacheProviderOptions = {}) {
    this.defaultTtlMs = options.defaultTtlMs ?? 300000 // 5 minutes
    this.maxEntries = options.maxEntries

    // Start automatic cleanup if enabled
    const cleanupInterval = options.cleanupIntervalMs ?? 60000
    if (cleanupInterval > 0) {
      this.cleanupIntervalId = setInterval(() => {
        this.cleanup()
      }, cleanupInterval)

      // Unref the interval so it doesn't prevent process exit
      if (typeof this.cleanupIntervalId === 'object' && 'unref' in this.cleanupIntervalId) {
        this.cleanupIntervalId.unref()
      }
    }
  }

  /**
   * Get a cached value by key
   * Returns null if not found or expired
   * Automatically removes expired entries on access
   */
  async get<T>(key: string): Promise<CacheGetResult<T> | null> {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      return null
    }

    // Update LRU order
    this.touchAccessOrder(key)

    return {
      value: entry.value as T,
      metadata: {
        cachedAt: entry.cachedAt,
        ttlMs: entry.ttlMs,
        ttlRemainingMs: entry.expiresAt - now
      }
    }
  }

  /**
   * Set a value in the cache
   * Respects maxEntries limit with LRU eviction
   */
  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const ttl = ttlMs ?? this.defaultTtlMs
    const now = Date.now()

    // Check if we need to evict entries for maxEntries
    if (this.maxEntries && this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evictOldest()
    }

    this.cache.set(key, {
      value,
      cachedAt: now,
      ttlMs: ttl,
      expiresAt: now + ttl
    })

    this.touchAccessOrder(key)
  }

  /**
   * Delete a specific key from the cache
   * Returns true if key existed and was deleted
   */
  async delete(key: string): Promise<boolean> {
    const existed = this.cache.delete(key)
    if (existed) {
      this.removeFromAccessOrder(key)
    }
    return existed
  }

  /**
   * Delete all keys matching a pattern
   * Supports glob-style patterns with trailing '*'
   * Returns number of keys deleted
   */
  async deletePattern(pattern: string): Promise<number> {
    let deleted = 0

    // Simple glob matching - only supports trailing *
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key)
          this.removeFromAccessOrder(key)
          deleted++
        }
      }
    } else if (pattern.startsWith('*')) {
      const suffix = pattern.slice(1)
      for (const key of this.cache.keys()) {
        if (key.endsWith(suffix)) {
          this.cache.delete(key)
          this.removeFromAccessOrder(key)
          deleted++
        }
      }
    } else if (pattern.includes('*')) {
      // Handle middle wildcard: prefix*suffix
      const [prefix, suffix] = pattern.split('*')
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix) && key.endsWith(suffix)) {
          this.cache.delete(key)
          this.removeFromAccessOrder(key)
          deleted++
        }
      }
    } else {
      // No wildcard - exact match
      if (this.cache.delete(pattern)) {
        this.removeFromAccessOrder(pattern)
        deleted++
      }
    }

    return deleted
  }

  /**
   * Check if a key exists in the cache
   * Returns false for expired entries
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      return false
    }

    return true
  }

  /**
   * Stop automatic cleanup and clear the cache
   * Call this when the cache provider is no longer needed
   */
  async close(): Promise<void> {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = undefined
    }
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Remove all expired entries from the cache
   * Called automatically by cleanup interval
   * Can also be called manually
   *
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        this.removeFromAccessOrder(key)
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Get current cache size (number of entries)
   * Note: May include expired entries that haven't been cleaned up yet
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Get cache statistics
   */
  stats(): {
    size: number
    maxEntries?: number
    defaultTtlMs: number
  } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      defaultTtlMs: this.defaultTtlMs
    }
  }

  // LRU tracking helpers

  private touchAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  private evictOldest(): void {
    // Evict the least recently used entry
    while (this.accessOrder.length > 0 && this.maxEntries && this.cache.size >= this.maxEntries) {
      const oldestKey = this.accessOrder.shift()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }
}

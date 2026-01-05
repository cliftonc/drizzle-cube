/**
 * Cache types for Drizzle Cube semantic layer
 * Provides pluggable caching for query results
 */

import type { SecurityContext } from './core'

/**
 * Return type for cache get operations
 * Includes value and optional metadata for TTL tracking
 */
export interface CacheGetResult<T> {
  value: T
  metadata?: CacheEntryMetadata
}

/**
 * Metadata about a cached entry
 * Used to provide cache information in query responses
 */
export interface CacheEntryMetadata {
  /** Unix timestamp (ms) when the entry was cached */
  cachedAt: number
  /** Original TTL in milliseconds */
  ttlMs: number
  /** Remaining TTL in milliseconds */
  ttlRemainingMs: number
}

/**
 * Cache provider interface that users implement for their preferred backend
 * All methods use async/Promise to support network-based caches (Redis, etc.)
 */
export interface CacheProvider {
  /**
   * Get a cached value by key
   * @returns The cached value with metadata, or null/undefined if not found or expired
   */
  get<T = unknown>(key: string): Promise<CacheGetResult<T> | null | undefined>

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache (must be JSON-serializable)
   * @param ttlMs - Time-to-live in milliseconds (optional, uses default if not provided)
   */
  set<T = unknown>(key: string, value: T, ttlMs?: number): Promise<void>

  /**
   * Delete a specific key from the cache
   * @returns true if key existed and was deleted, false otherwise
   */
  delete(key: string): Promise<boolean>

  /**
   * Delete all keys matching a pattern (for cache invalidation)
   * Pattern uses glob-style matching: 'prefix:*' matches all keys starting with 'prefix:'
   * @returns Number of keys deleted
   */
  deletePattern(pattern: string): Promise<number>

  /**
   * Check if a key exists in the cache
   */
  has(key: string): Promise<boolean>

  /**
   * Optional: Called when the cache provider is no longer needed
   * Use for cleanup (e.g., closing Redis connections)
   */
  close?(): Promise<void>
}

/**
 * Cache event for monitoring and debugging
 */
export interface CacheEvent {
  /** Type of cache event */
  type: 'hit' | 'miss' | 'set' | 'error'
  /** Cache key involved */
  key: string
  /** Duration of the cache operation in milliseconds */
  durationMs: number
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Cache provider implementation
   * Required if caching is enabled
   */
  provider: CacheProvider

  /**
   * Default TTL in milliseconds
   * @default 300000 (5 minutes)
   */
  defaultTtlMs?: number

  /**
   * Prefix for all cache keys
   * Useful for multi-environment setups (e.g., 'prod:', 'dev:')
   * @default 'drizzle-cube:'
   */
  keyPrefix?: string

  /**
   * Enable/disable caching globally
   * Allows disabling without removing configuration
   * @default true
   */
  enabled?: boolean

  /**
   * Whether to include security context in cache key
   * CRITICAL for multi-tenant applications - should almost always be true
   * @default true
   */
  includeSecurityContext?: boolean

  /**
   * Custom function to extract cacheable parts of security context
   * Use when security context contains non-serializable values
   * @default Uses JSON.stringify on entire security context
   */
  securityContextSerializer?: (ctx: SecurityContext) => string

  /**
   * Callback for cache errors (get/set failures)
   * Cache errors are non-fatal by default - queries still execute
   */
  onError?: (error: Error, operation: 'get' | 'set' | 'delete') => void

  /**
   * Callback for cache events (hits, misses, sets)
   * Useful for monitoring and debugging
   */
  onCacheEvent?: (event: CacheEvent) => void
}

/**
 * Cache metadata included in QueryResult when served from cache
 */
export interface QueryCacheMetadata {
  /** Always true when this object is present */
  hit: true
  /** ISO timestamp when the result was cached */
  cachedAt: string
  /** Original TTL in milliseconds */
  ttlMs: number
  /** Remaining TTL in milliseconds */
  ttlRemainingMs: number
}

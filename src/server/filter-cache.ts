/**
 * Filter Cache Manager
 * Provides per-query filter SQL caching for parameter deduplication
 *
 * When building queries with multiple CTEs, the same filter values can appear
 * multiple times as separate SQL parameters. This cache ensures each unique
 * filter is built once and reused, reducing parameter array size and improving
 * query debugging.
 */

import type { SQL } from 'drizzle-orm'
import type { Filter, FilterCondition } from './types'

/**
 * Generates a deterministic cache key for a filter
 * Keys are based on filter content (member, operator, values) not object identity
 */
export function getFilterKey(filter: Filter): string {
  // Handle logical filters recursively
  if ('and' in filter) {
    const subKeys = (filter.and as Filter[]).map(getFilterKey).sort()
    return `and:[${subKeys.join(',')}]`
  }
  if ('or' in filter) {
    const subKeys = (filter.or as Filter[]).map(getFilterKey).sort()
    return `or:[${subKeys.join(',')}]`
  }

  // Simple filter: member + operator + sorted values
  const fc = filter as FilterCondition
  const valuesKey = JSON.stringify(
    Array.isArray(fc.values) ? [...fc.values].sort() : fc.values
  )
  const dateRangeKey = fc.dateRange
    ? `:dr:${JSON.stringify(fc.dateRange)}`
    : ''

  return `${fc.member}:${fc.operator}:${valuesKey}${dateRangeKey}`
}

/**
 * Generates a cache key for time dimension date range filters
 */
export function getTimeDimensionFilterKey(dimension: string, dateRange: string | string[]): string {
  return `timeDim:${dimension}:${JSON.stringify(dateRange)}`
}

/**
 * Cache statistics for debugging and monitoring
 */
export interface FilterCacheStats {
  hits: number
  misses: number
  cacheSize: number
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
export class FilterCacheManager {
  private cache = new Map<string, SQL>()
  private stats = { hits: 0, misses: 0 }

  /**
   * Get cached SQL or build and cache it
   *
   * @param key - The cache key (use getFilterKey or getTimeDimensionFilterKey)
   * @param builder - Function to build the SQL if not cached
   * @returns The cached or freshly built SQL, or null if builder returns null
   */
  getOrBuild(key: string, builder: () => SQL | null): SQL | null {
    const cached = this.cache.get(key)
    if (cached !== undefined) {
      this.stats.hits++
      return cached
    }

    const sql = builder()
    if (sql) {
      this.cache.set(key, sql)
    }
    this.stats.misses++
    return sql
  }

  /**
   * Check if a key exists in the cache without affecting stats
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Get cached SQL without building (returns undefined if not cached)
   */
  get(key: string): SQL | undefined {
    const cached = this.cache.get(key)
    if (cached !== undefined) {
      this.stats.hits++
    }
    return cached
  }

  /**
   * Pre-populate cache with multiple filters
   * Useful for batch initialization at query start
   */
  preload(entries: Array<{ key: string; sql: SQL }>): void {
    for (const { key, sql } of entries) {
      if (!this.cache.has(key)) {
        this.cache.set(key, sql)
      }
    }
  }

  /**
   * Store a single entry in the cache
   */
  set(key: string, sql: SQL): void {
    this.cache.set(key, sql)
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): FilterCacheStats {
    return { ...this.stats, cacheSize: this.cache.size }
  }

  /**
   * Clear the cache (normally not needed as cache is per-query)
   */
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0 }
  }
}

/**
 * Flatten nested AND/OR filters into individual filter conditions
 * Useful for pre-building all filters at query start
 */
export function flattenFilters(filters: Filter[]): FilterCondition[] {
  const result: FilterCondition[] = []

  for (const filter of filters) {
    if ('and' in filter && filter.and) {
      result.push(...flattenFilters(filter.and))
    } else if ('or' in filter && filter.or) {
      result.push(...flattenFilters(filter.or))
    } else if ('member' in filter) {
      result.push(filter as FilterCondition)
    }
  }

  return result
}

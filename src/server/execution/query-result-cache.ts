/**
 * QueryResultCache — wraps the optional result-cache provider: key generation,
 * lookup (with hit/miss/bypass events and cache metadata assembly), and store.
 *
 * Extracted from QueryExecutor. All failures are non-fatal (swallowed and
 * reported via onError) so caching never blocks query execution.
 */

import type { SecurityContext, SemanticQuery, QueryResult, CacheConfig, ExecutionOptions } from '../types/index.js'
import { generateCacheKey } from '../cache-utils.js'

/**
 * Resolve the effective max-age (ms) for a lookup. `skipCache: true` is an
 * alias for max-age 0; when both are set the smaller wins. A `maxAgeMs` that
 * is not a finite non-negative number is ignored. Undefined means any
 * unexpired entry is acceptable.
 */
export function resolveMaxAgeMs(
  options?: Pick<ExecutionOptions, 'skipCache' | 'maxAgeMs'>
): number | undefined {
  // skipCache is max-age 0, which is always the smaller value
  if (options?.skipCache) {
    return 0
  }
  const maxAgeMs = options?.maxAgeMs
  return maxAgeMs !== undefined && Number.isFinite(maxAgeMs) && maxAgeMs >= 0 ? maxAgeMs : undefined
}

export class QueryResultCache {
  constructor(private readonly cacheConfig?: CacheConfig) {}

  /**
   * Returns the cache key when caching is enabled and a provider is configured,
   * otherwise undefined (which disables lookup and store).
   */
  generateKey(
    query: SemanticQuery,
    securityContext: SecurityContext,
    cubeSetKey?: string
  ): string | undefined {
    if (this.cacheConfig?.enabled !== false && this.cacheConfig?.provider) {
      return generateCacheKey(query, securityContext, this.cacheConfig, cubeSetKey)
    }
    return undefined
  }

  /**
   * Look up a cached result. Returns the cached value (with cache metadata
   * attached) on a hit, or undefined on miss / bypass / no-cache. Emits
   * hit/miss events; lookup errors are non-fatal.
   *
   * `maxAgeMs` is the oldest entry the caller accepts: an older entry (or one
   * whose age is unknown) counts as a miss. `0` skips the read entirely.
   * Callers still store the fresh result in every case.
   */
  async lookup(cacheKey: string | undefined, maxAgeMs?: number): Promise<QueryResult | undefined> {
    if (!cacheKey || !this.cacheConfig?.provider) {
      return undefined
    }

    // max-age 0 requested - emit a bypass event (miss) and skip the lookup
    if (maxAgeMs === 0) {
      this.cacheConfig.onCacheEvent?.({
        type: 'miss',
        key: cacheKey,
        durationMs: 0
      })
      return undefined
    }

    try {
      const startTime = Date.now()
      const cacheResult = await this.cacheConfig.provider.get<QueryResult>(cacheKey)
      const tooOld = maxAgeMs !== undefined && (
        !cacheResult?.metadata || Date.now() - cacheResult.metadata.cachedAt > maxAgeMs
      )
      if (cacheResult && !tooOld) {
        this.cacheConfig.onCacheEvent?.({
          type: 'hit',
          key: cacheKey,
          durationMs: Date.now() - startTime
        })

        // Return cached result WITH cache metadata
        return {
          ...cacheResult.value,
          cache: cacheResult.metadata
            ? {
                hit: true,
                cachedAt: new Date(cacheResult.metadata.cachedAt).toISOString(),
                ttlMs: cacheResult.metadata.ttlMs,
                ttlRemainingMs: cacheResult.metadata.ttlRemainingMs
              }
            : {
                hit: true,
                cachedAt: new Date().toISOString(),
                ttlMs: 0,
                ttlRemainingMs: 0
              }
        }
      }
      this.cacheConfig.onCacheEvent?.({
        type: 'miss',
        key: cacheKey,
        durationMs: Date.now() - startTime
      })
    } catch (error) {
      this.cacheConfig.onError?.(error as Error, 'get')
      // Continue without cache - failures are non-fatal
    }
    return undefined
  }

  /**
   * Store a fresh result under the given key. No-ops when caching is disabled
   * or the key is undefined. Store errors are non-fatal.
   */
  async store(cacheKey: string | undefined, result: QueryResult): Promise<void> {
    if (!cacheKey || !this.cacheConfig?.provider) {
      return
    }

    try {
      const startTime = Date.now()
      await this.cacheConfig.provider.set(
        cacheKey,
        result,
        this.cacheConfig.defaultTtlMs ?? 300000
      )
      this.cacheConfig.onCacheEvent?.({
        type: 'set',
        key: cacheKey,
        durationMs: Date.now() - startTime
      })
    } catch (error) {
      this.cacheConfig.onError?.(error as Error, 'set')
      // Continue without caching - failures are non-fatal
    }
  }
}

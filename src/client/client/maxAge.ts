/**
 * Max-age: how old a cached server result a request accepts.
 *
 * One freshness mechanism serves the refresh button, a cache bust and interval
 * refresh. `maxAgeSeconds: 30` lets the server answer from a result cached in
 * the last 30 seconds; `maxAgeSeconds: 0` (or `bustCache: true`) skips the
 * cache read. With no max-age the server applies its own cache TTL.
 */

/** Options accepted by every load/refetch that reaches the server. */
export interface MaxAgeOptions {
  /** Oldest cached result, in seconds, the server may return. 0 skips the cache read. */
  maxAgeSeconds?: number
  /** Shorthand for `maxAgeSeconds: 0` (shift+click on refresh). */
  bustCache?: boolean
}

/**
 * Resolve options to one max-age in whole seconds, or undefined for "server
 * default". `bustCache` wins over any `maxAgeSeconds`. Negative and non-finite
 * values are ignored, as the server ignores them.
 */
export function resolveMaxAgeSeconds(options?: MaxAgeOptions): number | undefined {
  if (options?.bustCache) return 0
  const value = options?.maxAgeSeconds
  if (value === undefined || !Number.isFinite(value) || value < 0) return undefined
  return Math.floor(value)
}

/**
 * The stricter of two max-ages (undefined means no constraint), for requests
 * that coalesce into one fetch.
 */
export function stricterMaxAge(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined) return b
  if (b === undefined) return a
  return Math.min(a, b)
}

/**
 * Request headers for a max-age. Max-age 0 also sends `X-Cache-Control:
 * no-cache` so a server that predates `x-cache-max-age` still bypasses its
 * cache.
 */
export function maxAgeHeaders(maxAgeSeconds: number | undefined): Record<string, string> {
  if (maxAgeSeconds === undefined) return {}
  if (maxAgeSeconds === 0) {
    return { 'X-Cache-Max-Age': '0', 'X-Cache-Control': 'no-cache' }
  }
  return { 'X-Cache-Max-Age': String(maxAgeSeconds) }
}

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

/**
 * Keep the stricter of two max-ages; `bustCache` resolves to max-age 0. Returns
 * `current` itself (same identity) unless `incoming` resolves to a stricter one.
 */
export function retainStricterMaxAge(current?: MaxAgeOptions, incoming?: MaxAgeOptions): MaxAgeOptions | undefined {
  const requested = resolveMaxAgeSeconds(incoming)
  if (requested === undefined) return current
  const held = resolveMaxAgeSeconds(current)
  if (held !== undefined && held <= requested) return current
  return { maxAgeSeconds: requested }
}

/** A refetch's max-age, tracked per hook until a fetch with it succeeds. */
export interface RefetchMaxAgeTracker {
  /** Retain the stricter resolved max-age; an absent or invalid max-age adds nothing. Does not fetch. */
  recordMaxAge: (options?: MaxAgeOptions) => void
  /** Whether a max-age is waiting for a successful fetch, including while one is in flight. */
  hasPendingMaxAge: () => boolean
  /**
   * Run one fetch attempt with the pending max-age. Success clears it unless a
   * stricter one was recorded meanwhile; failure keeps it for the retry.
   */
  runFetch: <T>(fetch: (options?: MaxAgeOptions) => Promise<T>) => Promise<T>
}

/**
 * Per-hook tracker for a refetch's max-age.
 *
 * A TanStack query function takes no per-call arguments, so a query hook's
 * refetch records its max-age here and then refetches through the hook's own
 * observer, which runs this hook's query function (even while the query is
 * disabled). Going through `queryClient.invalidateQueries` instead would run
 * the query function of whichever observer of the query rendered last, such
 * as a dashboard card's expand modal.
 *
 * A skipped hook (an off-screen portlet) only records the max-age; its query
 * function picks it up when the hook is enabled and fetches. The max-age stays
 * pending through retries and clears when a fetch with it succeeds. It is held
 * as an object so a success clears only the max-age it fetched with, by identity.
 */
export function createRefetchMaxAgeTracker(): RefetchMaxAgeTracker {
  let pending: MaxAgeOptions | undefined
  return {
    recordMaxAge(options) {
      pending = retainStricterMaxAge(pending, options)
    },
    hasPendingMaxAge() {
      return pending !== undefined
    },
    async runFetch(fetch) {
      const options = pending
      const result = await fetch(options)
      // Retries keep the max-age; a stricter one recorded meanwhile survives
      if (pending === options) pending = undefined
      return result
    }
  }
}

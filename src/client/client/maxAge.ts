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
 * Merge a refetch request into the pending options: the stricter max-age wins
 * and `bustCache` resolves to max-age 0. Returns `current` itself when the
 * request asks for nothing stricter.
 */
export function mergeLoadOptions(current?: MaxAgeOptions, request?: MaxAgeOptions): MaxAgeOptions | undefined {
  const requested = resolveMaxAgeSeconds(request)
  if (requested === undefined) return current
  const held = resolveMaxAgeSeconds(current)
  if (held !== undefined && held <= requested) return current
  return { maxAgeSeconds: requested }
}

/** Load options a refetch asked for, kept until a fetch with them succeeds. */
export interface PendingLoadOptions {
  /** Remember options for the next fetch, merged with any already pending. */
  request: (options?: MaxAgeOptions) => void
  /** Whether a request is waiting for a successful fetch. */
  hasRequest: () => boolean
  /**
   * Run one fetch attempt with the pending options. Success clears them unless
   * a request made meanwhile replaced them; failure keeps them for the retry.
   */
  load: <T>(fetch: (options?: MaxAgeOptions) => Promise<T>) => Promise<T>
}

/**
 * Per-hook carrier for a refetch's load options.
 *
 * A TanStack query function takes no per-call arguments, so a query hook's
 * refetch records its options here and then refetches through the hook's own
 * observer, which runs this hook's query function (even while the query is
 * disabled). Going through `queryClient.invalidateQueries` instead would run
 * the query function of whichever observer of the query rendered last, such
 * as a dashboard card's expand modal.
 *
 * A skipped hook (an off-screen portlet) only records the request; its query
 * function picks it up when the hook is enabled and fetches. Options stay
 * pending through retries and clear when a fetch with them succeeds.
 */
export function createPendingLoadOptions(): PendingLoadOptions {
  let pending: MaxAgeOptions | undefined
  return {
    request(options) {
      pending = mergeLoadOptions(pending, options)
    },
    hasRequest() {
      return pending !== undefined
    },
    async load(fetch) {
      const options = pending
      const result = await fetch(options)
      // Retries keep the options; a stricter request made meanwhile survives
      if (pending === options) pending = undefined
      return result
    }
  }
}

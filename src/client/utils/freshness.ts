/**
 * Refresh and freshness helpers for dashboards and portlets.
 *
 * - Computed-at: when the rows a portlet shows were computed on the server.
 *   For a cached result that is earlier than when the browser received them.
 */

import type { CubeResultSet } from '../types.js'

/**
 * When a result's rows were computed: the cache's computed time on a hit,
 * otherwise the server's response time.
 */
export function resultSetComputedAt(resultSet: CubeResultSet | null | undefined): string | undefined {
  if (!resultSet) return undefined
  return resultSet.cacheInfo?.()?.cachedAt ?? resultSet.lastRefreshTime?.()
}

/** The oldest of several computed-at times (a multi-query portlet is as old as its oldest result). */
export function oldestComputedAt(times: Array<string | undefined>): string | undefined {
  let oldest: string | undefined
  let oldestMs = Infinity
  for (const time of times) {
    if (!time) continue
    const ms = Date.parse(time)
    if (Number.isFinite(ms) && ms < oldestMs) {
      oldest = time
      oldestMs = ms
    }
  }
  return oldest
}

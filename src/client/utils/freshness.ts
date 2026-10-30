/**
 * Refresh and freshness helpers for dashboards and portlets.
 *
 * - Refresh: keeping a portlet current by refetching on an interval, accepting
 *   a server result no older than that interval.
 * - Computed-at: when the rows a portlet shows were computed on the server.
 *   For a cached result that is earlier than when the browser received them.
 */

import type {
  CubeResultSet,
  DashboardRefreshConfig,
  FeaturesConfig,
  PortletRefreshConfig
} from '../types.js'

/** Floor for any refresh interval when `features.refresh.minIntervalSeconds` is not set. */
export const DEFAULT_MIN_REFRESH_INTERVAL_SECONDS = 5

/** A portlet's resolved refresh settings. */
export interface EffectiveRefresh {
  intervalSeconds: number
  pauseWhenHidden: boolean
}

/** Whether interval refresh is switched on for dashboards (the opt-in gate). */
export function isRefreshFeatureEnabled(features: FeaturesConfig): boolean {
  return features.refresh?.enabled === true && features.manualRefresh !== true
}

/**
 * A portlet's effective refresh: its own setting overrides the dashboard
 * default, and the interval is floored by `minIntervalSeconds`. Undefined when
 * the feature is off, `manualRefresh` is on, or no interval applies.
 */
export function resolveEffectiveRefresh(
  portletRefresh: PortletRefreshConfig | undefined,
  dashboardRefresh: DashboardRefreshConfig | undefined,
  features: FeaturesConfig
): EffectiveRefresh | undefined {
  if (!isRefreshFeatureEnabled(features)) return undefined

  const interval = portletRefresh?.intervalSeconds ?? dashboardRefresh?.intervalSeconds
  if (interval === undefined || !Number.isFinite(interval) || interval <= 0) return undefined

  const floor = features.refresh?.minIntervalSeconds ?? DEFAULT_MIN_REFRESH_INTERVAL_SECONDS
  return {
    intervalSeconds: Math.max(Math.ceil(interval), floor),
    pauseWhenHidden: portletRefresh?.pauseWhenHidden ?? dashboardRefresh?.pauseWhenHidden ?? false
  }
}

/**
 * When a result's rows were computed: the cache's computed time on a hit,
 * otherwise the server's response time.
 */
export function resultSetComputedAt(resultSet: CubeResultSet | null | undefined): string | undefined {
  if (!resultSet) return undefined
  return resultSet.cacheInfo?.()?.cachedAt ?? resultSet.lastRefreshTime?.()
}

/**
 * How old a result's rows were when the server sent them: its response time
 * minus the cache's computed time, both on the server's clock, as in the
 * server's own max-age check. 0 for a fresh execution.
 */
export function resultSetServedAgeMs(resultSet: CubeResultSet | null | undefined): number | undefined {
  const sentMs = Date.parse(resultSet?.lastRefreshTime?.() ?? '')
  const computedMs = Date.parse(resultSetComputedAt(resultSet) ?? '')
  if (!Number.isFinite(sentMs) || !Number.isFinite(computedMs)) return undefined
  return Math.max(0, sentMs - computedMs)
}

/**
 * The age of rows a query shows now: their age when served plus the time
 * since they arrived (`receivedAtMs`, TanStack's `dataUpdatedAt`). Mixing no
 * server and browser times keeps clock skew out.
 */
export function shownRowsAgeMs(servedAgeMs: number | undefined, receivedAtMs: number, nowMs = Date.now()): number | undefined {
  if (servedAgeMs === undefined || receivedAtMs === 0) return undefined
  return servedAgeMs + Math.max(0, nowMs - receivedAtMs)
}

/** Stale: the rows are older than two refresh intervals. */
export function isComputedAtStale(computedAt: string | undefined, intervalSeconds: number | undefined, nowMs: number): boolean {
  if (!computedAt || intervalSeconds === undefined) return false
  const computedMs = Date.parse(computedAt)
  if (!Number.isFinite(computedMs)) return false
  return nowMs - computedMs > intervalSeconds * 2 * 1000
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

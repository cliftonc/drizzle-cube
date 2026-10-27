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

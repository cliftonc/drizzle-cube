/**
 * Subscription scheduling: when a subscribed query refetches.
 *
 * A subscription (`useCubeQuery(query, { subscribe: true })` or
 * `CubeClient.subscribe`) keeps a query current. In Phase 0 it refetches on a
 * fixed interval with max-age equal to that interval, so subscribers in one
 * security context share one server execution per interval.
 *
 * This module is the one place both subscribers ask "when do I refetch?".
 * Swapping the interval for change detection (refresh keys) replaces
 * `scheduleSubscription` and leaves the hook and client APIs alone.
 */

/** Cube.js's default refresh cadence for a subscription, in seconds. */
export const SUBSCRIBE_INTERVAL_SECONDS = 10

/**
 * A subscription's refetch interval in whole seconds: the default 10, raised
 * to `minIntervalSeconds` when that is larger.
 */
export function resolveSubscribeIntervalSeconds(minIntervalSeconds?: number): number {
  if (minIntervalSeconds === undefined || !Number.isFinite(minIntervalSeconds)) {
    return SUBSCRIBE_INTERVAL_SECONDS
  }
  return Math.max(SUBSCRIBE_INTERVAL_SECONDS, Math.ceil(minIntervalSeconds))
}

/** What a subscription does when it should refetch. */
export type SubscriptionRefetch = (options: { maxAgeSeconds: number }) => void

/**
 * Call `refetch` whenever the subscribed query may have new data. Returns a
 * function that stops it.
 */
export function scheduleSubscription(intervalSeconds: number, refetch: SubscriptionRefetch): () => void {
  const timer = setInterval(() => refetch({ maxAgeSeconds: intervalSeconds }), intervalSeconds * 1000)
  return () => clearInterval(timer)
}

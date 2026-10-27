/**
 * Refresh interval resolution and computed-at helpers (issue #271, Phase 0b).
 */

import { describe, it, expect } from 'vitest'
import {
  isComputedAtStale,
  oldestComputedAt,
  resolveEffectiveRefresh,
  resultSetComputedAt
} from '../../../src/client/utils/freshness'
import type { CubeResultSet } from '../../../src/client/types'

function resultSet(cachedAt: string | undefined, lastRefreshTime: string | undefined): CubeResultSet {
  return {
    rawData: () => [],
    tablePivot: () => [],
    series: () => [],
    annotation: () => ({}),
    cacheInfo: () => (cachedAt ? { hit: true, cachedAt, ttlMs: 1, ttlRemainingMs: 1 } : undefined),
    lastRefreshTime: () => lastRefreshTime
  }
}

describe('resolveEffectiveRefresh', () => {
  const on = { refresh: { enabled: true } }

  it('is off unless the feature flag is on', () => {
    expect(resolveEffectiveRefresh({ intervalSeconds: 30 }, undefined, {})).toBeUndefined()
    expect(resolveEffectiveRefresh({ intervalSeconds: 30 }, undefined, { refresh: { enabled: false } })).toBeUndefined()
  })

  it('is off when manualRefresh is on', () => {
    expect(resolveEffectiveRefresh({ intervalSeconds: 30 }, undefined, { ...on, manualRefresh: true })).toBeUndefined()
  })

  it('lets the portlet override the dashboard default', () => {
    expect(resolveEffectiveRefresh(undefined, { intervalSeconds: 60, pauseWhenHidden: true }, on))
      .toEqual({ intervalSeconds: 60, pauseWhenHidden: true })
    expect(resolveEffectiveRefresh({ intervalSeconds: 20 }, { intervalSeconds: 60, pauseWhenHidden: true }, on))
      .toEqual({ intervalSeconds: 20, pauseWhenHidden: true })
    expect(resolveEffectiveRefresh({ intervalSeconds: 20, pauseWhenHidden: false }, { pauseWhenHidden: true }, on))
      .toEqual({ intervalSeconds: 20, pauseWhenHidden: false })
  })

  it('floors the interval at 5 s by default, or at minIntervalSeconds', () => {
    expect(resolveEffectiveRefresh({ intervalSeconds: 1 }, undefined, on)?.intervalSeconds).toBe(5)
    expect(resolveEffectiveRefresh({ intervalSeconds: 1 }, undefined, { refresh: { enabled: true, minIntervalSeconds: 30 } })?.intervalSeconds).toBe(30)
  })

  it('is off without a positive interval', () => {
    expect(resolveEffectiveRefresh(undefined, { pauseWhenHidden: true }, on)).toBeUndefined()
    expect(resolveEffectiveRefresh({ intervalSeconds: 0 }, undefined, on)).toBeUndefined()
  })
})

describe('computed-at', () => {
  it('uses the cache time on a hit, otherwise the response time', () => {
    expect(resultSetComputedAt(resultSet('2026-10-23T10:00:00Z', '2026-10-23T10:00:30Z'))).toBe('2026-10-23T10:00:00Z')
    expect(resultSetComputedAt(resultSet(undefined, '2026-10-23T10:00:30Z'))).toBe('2026-10-23T10:00:30Z')
    expect(resultSetComputedAt(null)).toBeUndefined()
  })

  it('takes the oldest time for a multi-query portlet', () => {
    expect(oldestComputedAt(['2026-10-23T10:00:30Z', undefined, '2026-10-23T10:00:00Z'])).toBe('2026-10-23T10:00:00Z')
    expect(oldestComputedAt([undefined])).toBeUndefined()
  })
})

describe('isComputedAtStale', () => {
  it('is stale only past two intervals', () => {
    const computedAt = '2026-10-23T10:00:00Z'
    const base = Date.parse(computedAt)
    expect(isComputedAtStale(computedAt, 30, base + 60_000)).toBe(false)
    expect(isComputedAtStale(computedAt, 30, base + 60_001)).toBe(true)
    expect(isComputedAtStale(computedAt, undefined, base + 1e9)).toBe(false)
  })
})

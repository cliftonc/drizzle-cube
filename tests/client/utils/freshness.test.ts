/**
 * Freshness helpers (issue #271, Phase 0b).
 */

import { describe, it, expect } from 'vitest'
import {
  oldestComputedAt,
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

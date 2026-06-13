/**
 * Cache key isolation tests (issue #849, item 2)
 *
 * Tenant cache isolation previously rested on a truncated 32-bit FNV-1a hash
 * that also capped its input at 64 KB. That allowed two failure modes:
 *   1. cross-tenant cache leaks when two security contexts collided on the
 *      32-bit context hash; and
 *   2. same-tenant wrong results when two large query JSONs shared their first
 *      64 KB.
 * The fix uses a 128-bit hash over the full input.
 */

import { describe, it, expect } from 'vitest'
import { strongHash, generateCacheKey, fnv1aHash } from '../src/server/cache-utils'
import { MemoryCacheProvider } from '../src/server/cache-providers/memory'
import type { SemanticQuery, SecurityContext } from '../src/server/types'

describe('strongHash', () => {
  it('produces a 128-bit (32 hex char) digest', () => {
    expect(strongHash('hello')).toHaveLength(32)
    expect(strongHash('')).toHaveLength(32)
    expect(strongHash('a'.repeat(100000))).toHaveLength(32)
  })

  it('is deterministic', () => {
    expect(strongHash('drizzle-cube')).toBe(strongHash('drizzle-cube'))
  })

  it('does NOT truncate input at 64 KB (distinguishes strings differing only past 64 KB)', () => {
    const prefix = 'x'.repeat(65536)
    const a = prefix + 'A'
    const b = prefix + 'B'
    expect(strongHash(a)).not.toBe(strongHash(b))
  })

  it('distinguishes strings that share a long prefix', () => {
    expect(strongHash('tenant-1:dashboard')).not.toBe(strongHash('tenant-2:dashboard'))
  })

  it('is sensitive to character transposition (length mixing + per-position lanes)', () => {
    expect(strongHash('ab')).not.toBe(strongHash('ba'))
  })
})

describe('fnv1aHash (legacy)', () => {
  it('no longer truncates input at 64 KB', () => {
    // Regression guard for the removed 64 KB cap on the legacy helper too.
    const prefix = 'y'.repeat(70000)
    expect(fnv1aHash(prefix + '1')).not.toBe(fnv1aHash(prefix + '2'))
  })
})

describe('generateCacheKey', () => {
  const query: SemanticQuery = {
    measures: ['Sales.count'],
    dimensions: ['Sales.region']
  }

  it('isolates different security contexts into different keys', () => {
    const ctxA: SecurityContext = { organisationId: 'org-a' }
    const ctxB: SecurityContext = { organisationId: 'org-b' }
    const keyA = generateCacheKey(query, ctxA)
    const keyB = generateCacheKey(query, ctxB)
    expect(keyA).not.toBe(keyB)
  })

  it('produces the same key for the same query + context', () => {
    const ctx: SecurityContext = { organisationId: 'org-a' }
    expect(generateCacheKey(query, ctx)).toBe(generateCacheKey(query, ctx))
  })

  it('uses a 128-bit hash for both query and context segments', () => {
    const ctx: SecurityContext = { organisationId: 'org-a' }
    const key = generateCacheKey(query, ctx)
    const match = key.match(/query:([0-9a-f]+):ctx:([0-9a-f]+)$/)
    expect(match).not.toBeNull()
    expect(match![1]).toHaveLength(32)
    expect(match![2]).toHaveLength(32)
  })

  it('does not collide for large queries that differ only in a late filter value', () => {
    // Two 5k-UUID IN lists identical except for the final element. Their JSON
    // exceeds 64 KB and shares the same first 64 KB — the old hash collided.
    const base = Array.from({ length: 5000 }, (_, i) =>
      `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`
    )
    const listA = [...base]
    const listB = [...base]
    listB[listB.length - 1] = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

    const ctx: SecurityContext = { organisationId: 'org-a' }
    const queryA: SemanticQuery = { measures: ['Sales.count'], filters: [{ member: 'Sales.id', operator: 'equals', values: listA }] }
    const queryB: SemanticQuery = { measures: ['Sales.count'], filters: [{ member: 'Sales.id', operator: 'equals', values: listB }] }

    expect(generateCacheKey(queryA, ctx)).not.toBe(generateCacheKey(queryB, ctx))
  })
})

describe('MemoryCacheProvider isolation (issue #849)', () => {
  it('does not let a consumer mutating a returned result corrupt the cache', async () => {
    const cache = new MemoryCacheProvider({ cleanupIntervalMs: 0 })
    await cache.set('k', { data: [{ count: 1 }] })

    const first = await cache.get<{ data: { count: number }[] }>('k')
    expect(first!.value.data[0].count).toBe(1)

    // Consumer mutates the returned object
    first!.value.data[0].count = 999
    first!.value.data.push({ count: 2 })

    const second = await cache.get<{ data: { count: number }[] }>('k')
    expect(second!.value.data).toHaveLength(1)
    expect(second!.value.data[0].count).toBe(1)

    await cache.close()
  })

  it('does not let the caller mutating the original after set corrupt the cache', async () => {
    const cache = new MemoryCacheProvider({ cleanupIntervalMs: 0 })
    const original = { data: [{ count: 1 }] }
    await cache.set('k', original)

    // Caller mutates the object it passed in
    original.data[0].count = 999

    const got = await cache.get<{ data: { count: number }[] }>('k')
    expect(got!.value.data[0].count).toBe(1)

    await cache.close()
  })
})

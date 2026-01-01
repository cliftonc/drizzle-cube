/**
 * Filter Cache Tests
 * Tests for the FilterCacheManager and parameter deduplication functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  FilterCacheManager,
  getFilterKey,
  getTimeDimensionFilterKey,
  flattenFilters
} from '../src/server/filter-cache'
import type { Filter, FilterCondition } from '../src/server/types'
import { sql } from 'drizzle-orm'

describe('FilterCacheManager', () => {
  let cache: FilterCacheManager

  beforeEach(() => {
    cache = new FilterCacheManager()
  })

  describe('getOrBuild', () => {
    it('should cache SQL on first build and return cached on second call', () => {
      const testSQL = sql`test = 1`
      let buildCount = 0

      const result1 = cache.getOrBuild('key1', () => {
        buildCount++
        return testSQL
      })

      const result2 = cache.getOrBuild('key1', () => {
        buildCount++
        return sql`should not be built`
      })

      expect(buildCount).toBe(1) // Builder should only be called once
      expect(result1).toBe(result2) // Same SQL object should be returned
    })

    it('should return null if builder returns null', () => {
      const result = cache.getOrBuild('key1', () => null)
      expect(result).toBeNull()
    })

    it('should build different SQL for different keys', () => {
      const sql1 = sql`test = 1`
      const sql2 = sql`test = 2`

      const result1 = cache.getOrBuild('key1', () => sql1)
      const result2 = cache.getOrBuild('key2', () => sql2)

      expect(result1).toBe(sql1)
      expect(result2).toBe(sql2)
    })
  })

  describe('preload', () => {
    it('should preload entries into cache', () => {
      const testSQL = sql`preloaded = true`
      let buildCount = 0

      cache.preload([{ key: 'preloadKey', sql: testSQL }])

      // This should use preloaded value, not call builder
      const result = cache.getOrBuild('preloadKey', () => {
        buildCount++
        return sql`should not be built`
      })

      expect(buildCount).toBe(0)
      expect(result).toBe(testSQL)
    })

    it('should not override existing entries', () => {
      const sql1 = sql`first`
      const sql2 = sql`second`

      cache.set('key', sql1)
      cache.preload([{ key: 'key', sql: sql2 }])

      expect(cache.get('key')).toBe(sql1)
    })
  })

  describe('getStats', () => {
    it('should track hits and misses', () => {
      const testSQL = sql`test`

      // First call - miss
      cache.getOrBuild('key1', () => testSQL)

      // Second call - hit
      cache.getOrBuild('key1', () => testSQL)

      // Third call to different key - miss
      cache.getOrBuild('key2', () => testSQL)

      const stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(2)
      expect(stats.cacheSize).toBe(2)
    })
  })

  describe('clear', () => {
    it('should clear cache and reset stats', () => {
      cache.set('key', sql`test`)
      cache.getOrBuild('key', () => sql`test`) // One hit

      cache.clear()

      const stats = cache.getStats()
      expect(stats.cacheSize).toBe(0)
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(cache.has('key')).toBe(false)
    })
  })
})

describe('getFilterKey', () => {
  it('should generate consistent key for simple filter', () => {
    const filter: FilterCondition = {
      member: 'Employees.name',
      operator: 'equals',
      values: ['John', 'Jane']
    }

    const key = getFilterKey(filter)
    expect(key).toContain('Employees.name')
    expect(key).toContain('equals')
  })

  it('should generate same key regardless of value order', () => {
    const filter1: FilterCondition = {
      member: 'Employees.name',
      operator: 'equals',
      values: ['John', 'Jane']
    }

    const filter2: FilterCondition = {
      member: 'Employees.name',
      operator: 'equals',
      values: ['Jane', 'John']
    }

    expect(getFilterKey(filter1)).toBe(getFilterKey(filter2))
  })

  it('should include dateRange in key when present', () => {
    const filter: FilterCondition = {
      member: 'Employees.createdAt',
      operator: 'inDateRange',
      values: [],
      dateRange: ['2024-01-01', '2024-12-31']
    }

    const key = getFilterKey(filter)
    expect(key).toContain('dr:')
    expect(key).toContain('2024-01-01')
  })

  it('should generate unique keys for AND/OR filters', () => {
    const andFilter: Filter = {
      and: [
        { member: 'Employees.name', operator: 'equals', values: ['John'] },
        { member: 'Employees.active', operator: 'equals', values: [true] }
      ]
    }

    const orFilter: Filter = {
      or: [
        { member: 'Employees.name', operator: 'equals', values: ['John'] },
        { member: 'Employees.active', operator: 'equals', values: [true] }
      ]
    }

    const andKey = getFilterKey(andFilter)
    const orKey = getFilterKey(orFilter)

    expect(andKey).toContain('and:')
    expect(orKey).toContain('or:')
    expect(andKey).not.toBe(orKey)
  })

  it('should handle nested AND/OR filters', () => {
    const nestedFilter: Filter = {
      and: [
        { member: 'Employees.name', operator: 'equals', values: ['John'] },
        {
          or: [
            { member: 'Employees.active', operator: 'equals', values: [true] },
            { member: 'Employees.salary', operator: 'gt', values: [50000] }
          ]
        }
      ]
    }

    const key = getFilterKey(nestedFilter)
    expect(key).toContain('and:')
    expect(key).toContain('or:')
  })
})

describe('getTimeDimensionFilterKey', () => {
  it('should generate key for time dimension with array dateRange', () => {
    const key = getTimeDimensionFilterKey('Employees.createdAt', ['2024-01-01', '2024-12-31'])
    expect(key).toContain('timeDim:')
    expect(key).toContain('Employees.createdAt')
  })

  it('should generate key for time dimension with string dateRange', () => {
    const key = getTimeDimensionFilterKey('Employees.createdAt', 'last 7 days')
    expect(key).toContain('timeDim:')
    expect(key).toContain('last 7 days')
  })
})

describe('flattenFilters', () => {
  it('should return simple filters as-is', () => {
    const filters: Filter[] = [
      { member: 'Employees.name', operator: 'equals', values: ['John'] },
      { member: 'Employees.active', operator: 'equals', values: [true] }
    ]

    const flattened = flattenFilters(filters)
    expect(flattened).toHaveLength(2)
  })

  it('should flatten AND filters', () => {
    const filters: Filter[] = [
      {
        and: [
          { member: 'Employees.name', operator: 'equals', values: ['John'] },
          { member: 'Employees.active', operator: 'equals', values: [true] }
        ]
      }
    ]

    const flattened = flattenFilters(filters)
    expect(flattened).toHaveLength(2)
    expect(flattened[0].member).toBe('Employees.name')
    expect(flattened[1].member).toBe('Employees.active')
  })

  it('should flatten OR filters', () => {
    const filters: Filter[] = [
      {
        or: [
          { member: 'Employees.name', operator: 'equals', values: ['John'] },
          { member: 'Employees.name', operator: 'equals', values: ['Jane'] }
        ]
      }
    ]

    const flattened = flattenFilters(filters)
    expect(flattened).toHaveLength(2)
  })

  it('should flatten nested AND/OR filters', () => {
    const filters: Filter[] = [
      {
        and: [
          { member: 'Employees.name', operator: 'equals', values: ['John'] },
          {
            or: [
              { member: 'Employees.active', operator: 'equals', values: [true] },
              { member: 'Employees.salary', operator: 'gt', values: [50000] }
            ]
          }
        ]
      }
    ]

    const flattened = flattenFilters(filters)
    expect(flattened).toHaveLength(3)
  })
})

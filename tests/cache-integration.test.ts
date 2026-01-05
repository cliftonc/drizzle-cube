/**
 * Cache Integration Tests
 * Tests the caching layer for query results
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  SemanticLayerCompiler,
  MemoryCacheProvider,
  generateCacheKey,
  normalizeQuery,
  fnv1aHash
} from '../src/server'
import type { CacheConfig, CacheEvent, SemanticQuery } from '../src/server/types'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'

describe('Cache Integration', () => {
  let semanticLayer: SemanticLayerCompiler
  let cacheProvider: MemoryCacheProvider
  let cacheEvents: CacheEvent[]
  let cleanup: () => void

  beforeEach(async () => {
    const { executor: dbExecutor, close } = await createTestDatabaseExecutor()
    cleanup = close
    const { testEmployeesCube, testDepartmentsCube, testProductivityCube } =
      await createTestCubesForCurrentDatabase()

    cacheEvents = []
    cacheProvider = new MemoryCacheProvider({ defaultTtlMs: 60000 })

    const cacheConfig: CacheConfig = {
      provider: cacheProvider,
      defaultTtlMs: 60000,
      keyPrefix: 'test:',
      onCacheEvent: (event) => cacheEvents.push(event)
    }

    semanticLayer = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      cache: cacheConfig
    })

    semanticLayer.registerCube(testEmployeesCube)
    semanticLayer.registerCube(testDepartmentsCube)
    semanticLayer.registerCube(testProductivityCube)
  })

  afterEach(async () => {
    await cacheProvider.close()
    cleanup?.()
  })

  describe('Cache Hit/Miss Flow', () => {
    it('should miss on first query and hit on second identical query', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
      const securityContext = { organisationId: 1 }

      // First execution - should be a miss
      const result1 = await semanticLayer.execute(query, securityContext)
      expect(result1.data).toBeDefined()
      expect(result1.cache).toBeUndefined() // Fresh result has no cache metadata

      // Check we had a miss and a set
      expect(cacheEvents).toHaveLength(2)
      expect(cacheEvents[0].type).toBe('miss')
      expect(cacheEvents[1].type).toBe('set')

      // Clear events for next assertion
      cacheEvents.length = 0

      // Second execution - should be a hit
      const result2 = await semanticLayer.execute(query, securityContext)
      expect(result2.data).toBeDefined()
      expect(result2.cache).toBeDefined()
      expect(result2.cache?.hit).toBe(true)
      expect(result2.cache?.ttlRemainingMs).toBeGreaterThan(0)

      // Check we had a hit
      expect(cacheEvents).toHaveLength(1)
      expect(cacheEvents[0].type).toBe('hit')

      // Data should be identical
      expect(result1.data).toEqual(result2.data)
    })

    it('should return cache metadata with TTL information', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count']
      }
      const securityContext = { organisationId: 1 }

      // First execution
      await semanticLayer.execute(query, securityContext)

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Second execution - should be cached
      const result = await semanticLayer.execute(query, securityContext)

      expect(result.cache).toBeDefined()
      expect(result.cache?.hit).toBe(true)
      expect(result.cache?.cachedAt).toBeDefined()
      expect(result.cache?.ttlMs).toBe(60000)
      expect(result.cache?.ttlRemainingMs).toBeLessThan(60000)
      expect(result.cache?.ttlRemainingMs).toBeGreaterThan(59000) // Should be close to full TTL
    })
  })

  describe('Security Context Isolation', () => {
    it('should cache separately for different security contexts', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count']
      }

      // Execute for org-1
      const _result1 = await semanticLayer.execute(query, { organisationId: 1 })

      // Execute for org-2 - should be a cache miss (different security context)
      const _result2 = await semanticLayer.execute(query, { organisationId: 2 })

      // Both should execute (not be served from cache)
      // First org-1: miss + set
      // Then org-2: miss + set (different cache key)
      expect(cacheEvents.filter((e) => e.type === 'miss')).toHaveLength(2)
      expect(cacheEvents.filter((e) => e.type === 'set')).toHaveLength(2)

      // Clear events
      cacheEvents.length = 0

      // Execute for org-1 again - should be a cache hit
      const result3 = await semanticLayer.execute(query, { organisationId: 1 })
      expect(result3.cache?.hit).toBe(true)

      // Execute for org-2 again - should also be a cache hit
      const result4 = await semanticLayer.execute(query, { organisationId: 2 })
      expect(result4.cache?.hit).toBe(true)

      expect(cacheEvents.filter((e) => e.type === 'hit')).toHaveLength(2)
    })

    it('should generate different cache keys for different security contexts', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count']
      }

      const key1 = generateCacheKey(query, { organisationId: 1 }, { keyPrefix: 'test:' })
      const key2 = generateCacheKey(query, { organisationId: 2 }, { keyPrefix: 'test:' })

      expect(key1).not.toBe(key2)
      expect(key1).toContain('test:')
      expect(key2).toContain('test:')
    })
  })

  describe('Query Normalization', () => {
    it('should normalize queries for consistent cache keys', () => {
      const query1: SemanticQuery = {
        measures: ['Employees.count', 'Employees.avgSalary'],
        dimensions: ['Employees.name', 'Departments.name']
      }

      const query2: SemanticQuery = {
        measures: ['Employees.avgSalary', 'Employees.count'], // Different order
        dimensions: ['Departments.name', 'Employees.name'] // Different order
      }

      const normalized1 = normalizeQuery(query1)
      const normalized2 = normalizeQuery(query2)

      // After normalization, should be identical
      expect(JSON.stringify(normalized1)).toBe(JSON.stringify(normalized2))

      // Cache keys should be identical
      const key1 = generateCacheKey(query1, { org: '1' }, {})
      const key2 = generateCacheKey(query2, { org: '1' }, {})
      expect(key1).toBe(key2)
    })

    it('should generate same cache key regardless of measure/dimension order', async () => {
      const query1: SemanticQuery = {
        measures: ['Employees.count', 'Employees.avgSalary']
      }
      const query2: SemanticQuery = {
        measures: ['Employees.avgSalary', 'Employees.count']
      }
      const securityContext = { organisationId: 1 }

      // Execute query1
      await semanticLayer.execute(query1, securityContext)

      // Clear events
      cacheEvents.length = 0

      // Execute query2 - should hit cache since normalized form is same
      const result = await semanticLayer.execute(query2, securityContext)
      expect(result.cache?.hit).toBe(true)
      expect(cacheEvents[0].type).toBe('hit')
    })
  })

  describe('Cache TTL Expiration', () => {
    it('should expire entries after TTL', async () => {
      // Create a cache with very short TTL
      const shortTtlProvider = new MemoryCacheProvider({ defaultTtlMs: 100 })
      const shortTtlEvents: CacheEvent[] = []

      const { executor: dbExecutor, close: closeDb } = await createTestDatabaseExecutor()
      const { testEmployeesCube } = await createTestCubesForCurrentDatabase()

      const shortTtlLayer = new SemanticLayerCompiler({
        databaseExecutor: dbExecutor,
        cache: {
          provider: shortTtlProvider,
          defaultTtlMs: 100,
          onCacheEvent: (e) => shortTtlEvents.push(e)
        }
      })
      shortTtlLayer.registerCube(testEmployeesCube)

      const query: SemanticQuery = {
        measures: ['Employees.count']
      }
      const securityContext = { organisationId: 1 }

      // First execution
      await shortTtlLayer.execute(query, securityContext)
      expect(shortTtlEvents[0].type).toBe('miss')

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Clear events
      shortTtlEvents.length = 0

      // Should be a miss again (entry expired)
      const result = await shortTtlLayer.execute(query, securityContext)
      expect(result.cache).toBeUndefined() // Fresh result
      expect(shortTtlEvents[0].type).toBe('miss')

      await shortTtlProvider.close()
      closeDb()
    })
  })

  describe('Cache Error Resilience', () => {
    it('should continue query execution if cache get fails', async () => {
      const failingProvider: any = {
        get: async () => {
          throw new Error('Cache get failed')
        },
        set: async () => {},
        delete: async () => false,
        deletePattern: async () => 0,
        has: async () => false
      }

      const errors: Error[] = []

      const { executor: dbExecutor, close: closeDb } = await createTestDatabaseExecutor()
      const { testEmployeesCube } = await createTestCubesForCurrentDatabase()

      const failingCacheLayer = new SemanticLayerCompiler({
        databaseExecutor: dbExecutor,
        cache: {
          provider: failingProvider,
          onError: (err) => errors.push(err)
        }
      })
      failingCacheLayer.registerCube(testEmployeesCube)

      const query: SemanticQuery = {
        measures: ['Employees.count']
      }

      // Should still execute successfully
      const result = await failingCacheLayer.execute(query, { organisationId: 1 })
      expect(result.data).toBeDefined()
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('Cache get failed')
      closeDb()
    })

    it('should continue if cache set fails', async () => {
      const failingProvider: any = {
        get: async () => null,
        set: async () => {
          throw new Error('Cache set failed')
        },
        delete: async () => false,
        deletePattern: async () => 0,
        has: async () => false
      }

      const errors: Error[] = []

      const { executor: dbExecutor, close: closeDb } = await createTestDatabaseExecutor()
      const { testEmployeesCube } = await createTestCubesForCurrentDatabase()

      const failingCacheLayer = new SemanticLayerCompiler({
        databaseExecutor: dbExecutor,
        cache: {
          provider: failingProvider,
          onError: (err) => errors.push(err)
        }
      })
      failingCacheLayer.registerCube(testEmployeesCube)

      const query: SemanticQuery = {
        measures: ['Employees.count']
      }

      // Should still execute successfully
      const result = await failingCacheLayer.execute(query, { organisationId: 1 })
      expect(result.data).toBeDefined()
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toBe('Cache set failed')
      closeDb()
    })
  })

  describe('Cache Disabled', () => {
    it('should bypass cache when enabled is false', async () => {
      const { executor: dbExecutor, close: closeDb } = await createTestDatabaseExecutor()
      const { testEmployeesCube } = await createTestCubesForCurrentDatabase()

      const disabledCacheEvents: CacheEvent[] = []
      const disabledCacheProvider = new MemoryCacheProvider()

      const disabledCacheLayer = new SemanticLayerCompiler({
        databaseExecutor: dbExecutor,
        cache: {
          provider: disabledCacheProvider,
          enabled: false,
          onCacheEvent: (e) => disabledCacheEvents.push(e)
        }
      })
      disabledCacheLayer.registerCube(testEmployeesCube)

      const query: SemanticQuery = {
        measures: ['Employees.count']
      }
      const securityContext = { organisationId: 1 }

      // Execute twice
      await disabledCacheLayer.execute(query, securityContext)
      await disabledCacheLayer.execute(query, securityContext)

      // No cache events should be recorded
      expect(disabledCacheEvents).toHaveLength(0)

      await disabledCacheProvider.close()
      closeDb()
    })
  })

  describe('MemoryCacheProvider', () => {
    it('should support pattern-based deletion', async () => {
      const provider = new MemoryCacheProvider()

      await provider.set('test:query:abc:ctx:123', { data: 1 })
      await provider.set('test:query:def:ctx:123', { data: 2 })
      await provider.set('other:query:ghi:ctx:456', { data: 3 })

      // Delete all test: prefixed keys
      const deleted = await provider.deletePattern('test:*')
      expect(deleted).toBe(2)

      // test: keys should be gone
      expect(await provider.has('test:query:abc:ctx:123')).toBe(false)
      expect(await provider.has('test:query:def:ctx:123')).toBe(false)

      // other: key should remain
      expect(await provider.has('other:query:ghi:ctx:456')).toBe(true)

      await provider.close()
    })

    it('should track size and stats', async () => {
      const provider = new MemoryCacheProvider()

      expect(provider.size()).toBe(0)

      await provider.set('key1', { data: 1 })
      await provider.set('key2', { data: 2 })

      expect(provider.size()).toBe(2)

      const stats = provider.stats()
      expect(stats.size).toBe(2)
      expect(stats.defaultTtlMs).toBe(300000)

      await provider.close()
    })

    it('should cleanup expired entries', async () => {
      const provider = new MemoryCacheProvider({
        defaultTtlMs: 50,
        cleanupIntervalMs: 0 // Disable auto cleanup
      })

      await provider.set('key1', { data: 1 })
      await provider.set('key2', { data: 2 })

      expect(provider.size()).toBe(2)

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Manual cleanup
      const cleaned = provider.cleanup()
      expect(cleaned).toBe(2)
      expect(provider.size()).toBe(0)

      await provider.close()
    })
  })

  describe('Hash Function', () => {
    it('should produce consistent hashes', () => {
      const input = 'test string'
      const hash1 = fnv1aHash(input)
      const hash2 = fnv1aHash(input)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(8) // 8 hex characters
    })

    it('should produce different hashes for different inputs', () => {
      const hash1 = fnv1aHash('input1')
      const hash2 = fnv1aHash('input2')

      expect(hash1).not.toBe(hash2)
    })
  })
})

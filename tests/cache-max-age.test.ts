/**
 * Cache max-age tests
 * A request's max-age is the oldest cached result it will accept. Older hits
 * count as a miss: the query runs and the fresh result is written back.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SemanticLayerCompiler, MemoryCacheProvider } from '../src/server'
import type { CacheEvent, CacheGetResult, SemanticQuery } from '../src/server/types'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'

/** Memory provider whose entries report a `cachedAt` pushed back by `ageMs`. */
class AgedMemoryCacheProvider extends MemoryCacheProvider {
  ageMs = 0

  async get<T = unknown>(key: string): Promise<CacheGetResult<T> | null> {
    const result = await super.get<T>(key)
    if (!result?.metadata) return result
    return { ...result, metadata: { ...result.metadata, cachedAt: result.metadata.cachedAt - this.ageMs } }
  }
}

describe('Cache max-age', () => {
  const query: SemanticQuery = { measures: ['Employees.count'] }
  const securityContext = { organisationId: 1 }

  let semanticLayer: SemanticLayerCompiler
  let cacheProvider: AgedMemoryCacheProvider
  let cacheEvents: CacheEvent[]
  let cleanup: () => void

  beforeEach(async () => {
    const { executor: dbExecutor, close } = await createTestDatabaseExecutor()
    cleanup = close
    const { testEmployeesCube } = await createTestCubesForCurrentDatabase()

    cacheEvents = []
    cacheProvider = new AgedMemoryCacheProvider({ defaultTtlMs: 60000 })
    semanticLayer = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      cache: {
        provider: cacheProvider,
        defaultTtlMs: 60000,
        onCacheEvent: (event) => cacheEvents.push(event)
      }
    })
    semanticLayer.registerCube(testEmployeesCube)

    // Prime the cache, then start each test with a clean event log
    await semanticLayer.execute(query, securityContext)
    cacheEvents.length = 0
  })

  afterEach(async () => {
    await cacheProvider.close()
    cleanup?.()
  })

  const eventTypes = () => cacheEvents.map((e) => e.type)

  it('serves a hit younger than max-age', async () => {
    cacheProvider.ageMs = 5000

    const result = await semanticLayer.execute(query, securityContext, { maxAgeMs: 10000 })

    expect(result.cache?.hit).toBe(true)
    expect(eventTypes()).toEqual(['hit'])
  })

  it('treats a hit older than max-age as a miss, runs the query and writes the fresh result', async () => {
    cacheProvider.ageMs = 20000

    const result = await semanticLayer.execute(query, securityContext, { maxAgeMs: 10000 })

    expect(result.cache).toBeUndefined()
    expect(eventTypes()).toEqual(['miss', 'set'])

    // The fresh write is now young enough to be served
    cacheProvider.ageMs = 0
    cacheEvents.length = 0
    const again = await semanticLayer.execute(query, securityContext, { maxAgeMs: 10000 })
    expect(again.cache?.hit).toBe(true)
    expect(eventTypes()).toEqual(['hit'])
  })

  it('max-age 0 skips the read and still writes', async () => {
    const result = await semanticLayer.execute(query, securityContext, { maxAgeMs: 0 })

    expect(result.cache).toBeUndefined()
    expect(eventTypes()).toEqual(['miss', 'set'])
    expect(cacheEvents[0].durationMs).toBe(0)
  })

  it('skipCache: true behaves as max-age 0', async () => {
    const result = await semanticLayer.execute(query, securityContext, { skipCache: true })

    expect(result.cache).toBeUndefined()
    expect(eventTypes()).toEqual(['miss', 'set'])
    expect(cacheEvents[0].durationMs).toBe(0)
  })

  it('skipCache: true wins over a larger max-age', async () => {
    const result = await semanticLayer.execute(query, securityContext, { skipCache: true, maxAgeMs: 60000 })

    expect(result.cache).toBeUndefined()
    expect(eventTypes()).toEqual(['miss', 'set'])
  })

  it('skipCache: false leaves max-age in charge', async () => {
    cacheProvider.ageMs = 20000

    const result = await semanticLayer.execute(query, securityContext, { skipCache: false, maxAgeMs: 10000 })

    expect(result.cache).toBeUndefined()
    expect(eventTypes()).toEqual(['miss', 'set'])
  })

  it('ignores a negative or non-finite max-age', async () => {
    cacheProvider.ageMs = 20000

    const negative = await semanticLayer.execute(query, securityContext, { maxAgeMs: -1 })
    const notANumber = await semanticLayer.execute(query, securityContext, { maxAgeMs: Number.NaN })

    expect(negative.cache?.hit).toBe(true)
    expect(notANumber.cache?.hit).toBe(true)
  })

  it('has no effect when caching is disabled', async () => {
    const { executor: dbExecutor, close } = await createTestDatabaseExecutor()
    const { testEmployeesCube } = await createTestCubesForCurrentDatabase()
    const disabledEvents: CacheEvent[] = []
    const disabledProvider = new MemoryCacheProvider()
    const disabledLayer = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      cache: { provider: disabledProvider, enabled: false, onCacheEvent: (e) => disabledEvents.push(e) }
    })
    disabledLayer.registerCube(testEmployeesCube)

    const result = await disabledLayer.execute(query, securityContext, { maxAgeMs: 0 })

    expect(result.data).toBeDefined()
    expect(disabledEvents).toHaveLength(0)
    await disabledProvider.close()
    close()
  })
})

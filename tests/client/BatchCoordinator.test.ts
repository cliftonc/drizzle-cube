/**
 * Tests for BatchCoordinator
 * Covers query batching, delayed flush, promise resolution, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BatchCoordinator } from '../../src/client/client/BatchCoordinator'
import type { CubeQuery, CubeResultSet } from '../../src/client/types'

// Mock result factory
function createMockResult(data: Record<string, unknown>[] = []): CubeResultSet {
  return {
    rawData: () => data,
    tablePivot: () => data,
    series: () => [],
    annotation: () => ({
      measures: {},
      dimensions: {},
      timeDimensions: {}
    })
  }
}

// Mock query factory
function createMockQuery(measures: string[] = ['Test.count']): CubeQuery {
  return { measures }
}

describe('BatchCoordinator', () => {
  let mockBatchExecutor: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockBatchExecutor = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('queue management', () => {
    it('should add queries to the queue', () => {
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      coordinator.register(createMockQuery(['A.count']))
      coordinator.register(createMockQuery(['B.count']))

      expect(coordinator.getQueueSize()).toBe(2)
    })

    it('should clear the queue when clear() is called', () => {
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      coordinator.register(createMockQuery(['A.count']))
      coordinator.register(createMockQuery(['B.count']))
      coordinator.clear()

      expect(coordinator.getQueueSize()).toBe(0)
    })

    it('should return a promise from register()', () => {
      const coordinator = new BatchCoordinator(mockBatchExecutor)
      const promise = coordinator.register(createMockQuery())

      expect(promise).toBeInstanceOf(Promise)
    })
  })

  describe('delayed flush', () => {
    it('should not execute immediately after registering a query', () => {
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      coordinator.register(createMockQuery())

      expect(mockBatchExecutor).not.toHaveBeenCalled()
    })

    it('should execute after the default delay (100ms)', async () => {
      mockBatchExecutor.mockResolvedValue([createMockResult()])
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      coordinator.register(createMockQuery())

      // Advance time just before the delay
      await vi.advanceTimersByTimeAsync(99)
      expect(mockBatchExecutor).not.toHaveBeenCalled()

      // Advance past the delay
      await vi.advanceTimersByTimeAsync(1)
      expect(mockBatchExecutor).toHaveBeenCalledTimes(1)
    })

    it('should respect custom delay', async () => {
      mockBatchExecutor.mockResolvedValue([createMockResult()])
      const customDelay = 50
      const coordinator = new BatchCoordinator(mockBatchExecutor, customDelay)

      coordinator.register(createMockQuery())

      await vi.advanceTimersByTimeAsync(49)
      expect(mockBatchExecutor).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      expect(mockBatchExecutor).toHaveBeenCalledTimes(1)
    })

    it('should batch queries registered within the delay window', async () => {
      mockBatchExecutor.mockResolvedValue([
        createMockResult([{ 'A.count': 10 }]),
        createMockResult([{ 'B.count': 20 }]),
        createMockResult([{ 'C.count': 30 }])
      ])
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      // Register queries at different times within the window
      coordinator.register(createMockQuery(['A.count']))
      await vi.advanceTimersByTimeAsync(30)
      coordinator.register(createMockQuery(['B.count']))
      await vi.advanceTimersByTimeAsync(30)
      coordinator.register(createMockQuery(['C.count']))

      // Flush hasn't happened yet
      expect(mockBatchExecutor).not.toHaveBeenCalled()

      // Advance to trigger flush
      await vi.advanceTimersByTimeAsync(50)

      // All queries should be in a single batch
      expect(mockBatchExecutor).toHaveBeenCalledTimes(1)
      expect(mockBatchExecutor).toHaveBeenCalledWith([
        { measures: ['A.count'] },
        { measures: ['B.count'] },
        { measures: ['C.count'] }
      ])
    })

    it('should reset queue after flush', async () => {
      mockBatchExecutor.mockResolvedValue([createMockResult()])
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      coordinator.register(createMockQuery())

      expect(coordinator.getQueueSize()).toBe(1)

      await vi.advanceTimersByTimeAsync(100)

      expect(coordinator.getQueueSize()).toBe(0)
    })
  })

  describe('batch execution', () => {
    it('should send all queued queries to batchExecutor', async () => {
      const queries = [
        createMockQuery(['A.count']),
        createMockQuery(['B.sum']),
        createMockQuery(['C.avg'])
      ]
      mockBatchExecutor.mockResolvedValue(queries.map(() => createMockResult()))
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      queries.forEach(q => coordinator.register(q))
      await vi.advanceTimersByTimeAsync(100)

      expect(mockBatchExecutor).toHaveBeenCalledWith(queries)
    })

    it('should handle single query batch', async () => {
      const query = createMockQuery(['Single.count'])
      mockBatchExecutor.mockResolvedValue([createMockResult([{ 'Single.count': 42 }])])
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      const promise = coordinator.register(query)
      await vi.advanceTimersByTimeAsync(100)

      const result = await promise
      expect(result.rawData()).toEqual([{ 'Single.count': 42 }])
    })

    it('should not call batchExecutor if queue is empty', async () => {
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      // Register and immediately clear
      coordinator.register(createMockQuery())
      coordinator.clear()

      await vi.advanceTimersByTimeAsync(100)

      expect(mockBatchExecutor).not.toHaveBeenCalled()
    })
  })

  describe('promise resolution', () => {
    it('should resolve individual promises with correct results', async () => {
      const results = [
        createMockResult([{ 'A.count': 10 }]),
        createMockResult([{ 'B.count': 20 }]),
        createMockResult([{ 'C.count': 30 }])
      ]
      mockBatchExecutor.mockResolvedValue(results)
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      const promise1 = coordinator.register(createMockQuery(['A.count']))
      const promise2 = coordinator.register(createMockQuery(['B.count']))
      const promise3 = coordinator.register(createMockQuery(['C.count']))

      await vi.advanceTimersByTimeAsync(100)

      const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

      expect(result1.rawData()).toEqual([{ 'A.count': 10 }])
      expect(result2.rawData()).toEqual([{ 'B.count': 20 }])
      expect(result3.rawData()).toEqual([{ 'C.count': 30 }])
    })

    it('should maintain order of results matching order of registration', async () => {
      const coordinator = new BatchCoordinator(mockBatchExecutor)
      const expectedOrder = ['first', 'second', 'third']

      mockBatchExecutor.mockResolvedValue(
        expectedOrder.map(name => createMockResult([{ name }]))
      )

      const promises = expectedOrder.map(name =>
        coordinator.register(createMockQuery([`${name}.count`]))
      )

      await vi.advanceTimersByTimeAsync(100)

      const results = await Promise.all(promises)

      results.forEach((result, index) => {
        expect(result.rawData()).toEqual([{ name: expectedOrder[index] }])
      })
    })
  })

  describe('error handling', () => {
    it('should reject all promises when batch fails', async () => {
      const batchError = new Error('Batch execution failed')
      mockBatchExecutor.mockRejectedValue(batchError)
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      const promise1 = coordinator.register(createMockQuery(['A.count']))
      const promise2 = coordinator.register(createMockQuery(['B.count']))

      // Add catch handlers to prevent unhandled rejections
      const catchHandler = vi.fn()
      promise1.catch(catchHandler)
      promise2.catch(catchHandler)

      await vi.advanceTimersByTimeAsync(100)

      // Wait for all rejection handlers to complete
      await vi.waitFor(() => {
        expect(catchHandler).toHaveBeenCalledTimes(2)
      })

      await expect(promise1).rejects.toThrow('Batch execution failed')
      await expect(promise2).rejects.toThrow('Batch execution failed')
    })

    it('should reject individual promise when result contains error', async () => {
      const results = [
        createMockResult([{ 'A.count': 10 }]),
        { error: 'Query B failed', rawData: () => [], tablePivot: () => [], series: () => [], annotation: () => ({}) },
        createMockResult([{ 'C.count': 30 }])
      ]
      mockBatchExecutor.mockResolvedValue(results)
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      const promise1 = coordinator.register(createMockQuery(['A.count']))
      const promise2 = coordinator.register(createMockQuery(['B.count']))
      const promise3 = coordinator.register(createMockQuery(['C.count']))

      // Add catch handler for the rejecting promise
      const catchHandler = vi.fn()
      promise2.catch(catchHandler)

      await vi.advanceTimersByTimeAsync(100)

      // Wait for rejection handler to complete
      await vi.waitFor(() => {
        expect(catchHandler).toHaveBeenCalledTimes(1)
      })

      const result1 = await promise1
      expect(result1.rawData()).toEqual([{ 'A.count': 10 }])

      await expect(promise2).rejects.toThrow('Query B failed')

      const result3 = await promise3
      expect(result3.rawData()).toEqual([{ 'C.count': 30 }])
    })

    it('should handle non-Error thrown values', async () => {
      mockBatchExecutor.mockRejectedValue('string error')
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      const promise = coordinator.register(createMockQuery())

      // Add catch handler to prevent unhandled rejection
      const catchHandler = vi.fn()
      promise.catch(catchHandler)

      await vi.advanceTimersByTimeAsync(100)

      // Wait for rejection handler to complete
      await vi.waitFor(() => {
        expect(catchHandler).toHaveBeenCalledTimes(1)
      })

      await expect(promise).rejects.toThrow('string error')
    })
  })

  describe('multiple batch cycles', () => {
    it('should handle multiple independent batches', async () => {
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      // First batch
      mockBatchExecutor.mockResolvedValueOnce([createMockResult([{ batch: 1 }])])
      const promise1 = coordinator.register(createMockQuery(['First.count']))

      await vi.advanceTimersByTimeAsync(100)
      const result1 = await promise1
      expect(result1.rawData()).toEqual([{ batch: 1 }])
      expect(mockBatchExecutor).toHaveBeenCalledTimes(1)

      // Second batch
      mockBatchExecutor.mockResolvedValueOnce([createMockResult([{ batch: 2 }])])
      const promise2 = coordinator.register(createMockQuery(['Second.count']))

      await vi.advanceTimersByTimeAsync(100)
      const result2 = await promise2
      expect(result2.rawData()).toEqual([{ batch: 2 }])
      expect(mockBatchExecutor).toHaveBeenCalledTimes(2)
    })

    it('should allow queries to be added while a batch is executing', async () => {
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      // First batch starts executing
      mockBatchExecutor.mockImplementationOnce(async () => {
        // While executing, simulate adding another query
        // This happens via the delay of the async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        return [createMockResult([{ batch: 1 }])]
      })

      const promise1 = coordinator.register(createMockQuery(['First.count']))

      // Start executing first batch
      await vi.advanceTimersByTimeAsync(100)

      // Add second query while first batch is executing
      mockBatchExecutor.mockResolvedValueOnce([createMockResult([{ batch: 2 }])])
      const promise2 = coordinator.register(createMockQuery(['Second.count']))

      // Complete the first batch execution
      await vi.advanceTimersByTimeAsync(10)
      const result1 = await promise1
      expect(result1.rawData()).toEqual([{ batch: 1 }])

      // Execute second batch
      await vi.advanceTimersByTimeAsync(100)
      const result2 = await promise2
      expect(result2.rawData()).toEqual([{ batch: 2 }])
    })
  })

  describe('edge cases', () => {
    it('should handle rapid registration of many queries', async () => {
      const queryCount = 50
      const results = Array.from({ length: queryCount }, (_, i) =>
        createMockResult([{ index: i }])
      )
      mockBatchExecutor.mockResolvedValue(results)
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      const promises = Array.from({ length: queryCount }, (_, i) =>
        coordinator.register(createMockQuery([`Query${i}.count`]))
      )

      await vi.advanceTimersByTimeAsync(100)

      const resolvedResults = await Promise.all(promises)

      expect(mockBatchExecutor).toHaveBeenCalledTimes(1)
      expect(mockBatchExecutor.mock.calls[0][0]).toHaveLength(queryCount)
      resolvedResults.forEach((result, index) => {
        expect(result.rawData()).toEqual([{ index }])
      })
    })

    it('should handle empty results array', async () => {
      mockBatchExecutor.mockResolvedValue([])
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      const promise = coordinator.register(createMockQuery())

      await vi.advanceTimersByTimeAsync(100)

      // Result will be undefined since there's no matching result
      const result = await promise
      expect(result).toBeUndefined()
    })

    it('should handle query with complex structure', async () => {
      const complexQuery: CubeQuery = {
        measures: ['Sales.total', 'Sales.count'],
        dimensions: ['Products.name', 'Products.category'],
        timeDimensions: [{
          dimension: 'Orders.createdAt',
          granularity: 'day',
          dateRange: ['2024-01-01', '2024-12-31']
        }],
        filters: [{
          member: 'Products.category',
          operator: 'equals',
          values: ['Electronics']
        }],
        limit: 100,
        offset: 0
      }

      mockBatchExecutor.mockResolvedValue([createMockResult([{ 'Sales.total': 1000 }])])
      const coordinator = new BatchCoordinator(mockBatchExecutor)

      const promise = coordinator.register(complexQuery)
      await vi.advanceTimersByTimeAsync(100)

      expect(mockBatchExecutor).toHaveBeenCalledWith([complexQuery])
      const result = await promise
      expect(result.rawData()).toEqual([{ 'Sales.total': 1000 }])
    })
  })
})

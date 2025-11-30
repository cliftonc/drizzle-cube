import type { CubeQuery, CubeResultSet } from '../types'

/**
 * Represents a queued query with its resolver/rejector
 */
interface QueuedQuery {
  query: CubeQuery
  resolve: (result: CubeResultSet) => void
  reject: (error: Error) => void
}

/**
 * BatchCoordinator collects queries triggered in the same render cycle
 * and sends them as a single batch request to minimize network overhead.
 *
 * Uses a configurable delay (default 100ms) to batch queries from lazy-loaded
 * portlets that become visible during the same scroll action.
 */
export class BatchCoordinator {
  private queue: QueuedQuery[] = []
  private flushScheduled = false
  private batchExecutor: (queries: CubeQuery[]) => Promise<CubeResultSet[]>
  private delayMs: number

  constructor(batchExecutor: (queries: CubeQuery[]) => Promise<CubeResultSet[]>, delayMs: number = 100) {
    this.batchExecutor = batchExecutor
    this.delayMs = delayMs
  }

  /**
   * Register a query to be batched. Returns a promise that resolves
   * when the batch is executed and this specific query's result is available.
   */
  public register(query: CubeQuery): Promise<CubeResultSet> {
    return new Promise<CubeResultSet>((resolve, reject) => {
      // Add query to queue
      this.queue.push({ query, resolve, reject })

      // Schedule flush if not already scheduled
      if (!this.flushScheduled) {
        this.scheduleFlush()
      }
    })
  }

  /**
   * Schedule a flush after a short delay to collect multiple queries.
   * The delay allows queries from lazy-loaded portlets that become visible
   * during the same scroll action to be batched together.
   */
  private scheduleFlush(): void {
    this.flushScheduled = true

    setTimeout(() => {
      this.flush()
    }, this.delayMs)
  }

  /**
   * Execute all queued queries as a batch and resolve individual promises
   */
  private async flush(): Promise<void> {
    // Reset state
    this.flushScheduled = false

    // Take current queue and clear it
    const currentQueue = this.queue.slice()
    this.queue = []

    if (currentQueue.length === 0) {
      return
    }

    try {
      // Extract queries
      const queries = currentQueue.map(item => item.query)

      // Execute batch
      const results = await this.batchExecutor(queries)

      // Resolve individual promises with their corresponding results
      currentQueue.forEach((item, index) => {
        const result = results[index]

        // Check if this specific query had an error
        if (result && 'error' in result && result.error) {
          item.reject(new Error(result.error as string))
        } else {
          item.resolve(result)
        }
      })
    } catch (error) {
      // If entire batch fails, reject all queries
      currentQueue.forEach(item => {
        item.reject(error instanceof Error ? error : new Error(String(error)))
      })
    }
  }

  /**
   * Get current queue size (useful for debugging)
   */
  public getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Clear the queue (useful for testing/cleanup)
   */
  public clear(): void {
    this.queue = []
    this.flushScheduled = false
  }
}

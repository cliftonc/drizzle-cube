import { CubeQuery, CubeResultSet } from '../types.js';
/**
 * BatchCoordinator collects queries triggered in the same render cycle
 * and sends them as a single batch request to minimize network overhead.
 *
 * Uses a configurable delay (default 100ms) to batch queries from lazy-loaded
 * portlets that become visible during the same scroll action.
 */
export declare class BatchCoordinator {
    private queue;
    private flushScheduled;
    private batchExecutor;
    private delayMs;
    constructor(batchExecutor: (queries: CubeQuery[]) => Promise<CubeResultSet[]>, delayMs?: number);
    /**
     * Register a query to be batched. Returns a promise that resolves
     * when the batch is executed and this specific query's result is available.
     */
    register(query: CubeQuery): Promise<CubeResultSet>;
    /**
     * Schedule a flush after a short delay to collect multiple queries.
     * The delay allows queries from lazy-loaded portlets that become visible
     * during the same scroll action to be batched together.
     */
    private scheduleFlush;
    /**
     * Execute all queued queries as a batch and resolve individual promises
     */
    private flush;
    /**
     * Get current queue size (useful for debugging)
     */
    getQueueSize(): number;
    /**
     * Clear the queue (useful for testing/cleanup)
     */
    clear(): void;
}

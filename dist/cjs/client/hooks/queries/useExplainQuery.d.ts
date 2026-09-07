import { CubeQuery, ExplainResult, ExplainOptions } from '../../types.js';
/**
 * Query type that can be explained - includes standard queries, funnel queries, flow queries, and retention queries
 */
export type ExplainableQuery = CubeQuery | {
    funnel: unknown;
} | {
    flow: unknown;
} | {
    retention: unknown;
} | unknown;
/**
 * Create a stable query key for explain
 */
export declare function createExplainQueryKey(query: ExplainableQuery | null, options?: ExplainOptions): readonly unknown[];
export interface UseExplainQueryOptions {
    /**
     * Whether to skip the query (prevent execution even when triggered)
     * @default false
     */
    skip?: boolean;
}
export interface UseExplainQueryResult {
    /** The explain result from the server */
    explainResult: ExplainResult | null;
    /** Whether the explain query is loading */
    isLoading: boolean;
    /** Whether an explain has been triggered */
    hasRun: boolean;
    /** Error if explain failed */
    error: Error | null;
    /**
     * Manually trigger the explain query
     * @param options - Optional explain options (e.g., { analyze: true } for actual timing)
     */
    runExplain: (options?: ExplainOptions) => void;
    /** Clear the explain result */
    clearExplain: () => void;
}
/**
 * TanStack Query hook for EXPLAIN PLAN execution
 *
 * Unlike useDryRunQuery, this hook is manually triggered via `runExplain()`.
 * This is intentional because:
 * 1. EXPLAIN queries have performance overhead
 * 2. EXPLAIN ANALYZE actually executes the query
 * 3. Users should explicitly choose when to run explain
 *
 * Supports standard queries, funnel queries, and flow queries.
 *
 * Usage:
 * ```tsx
 * const { explainResult, isLoading, runExplain } = useExplainQuery(query, { skip: !isValidQuery })
 *
 * // Trigger explain
 * <button onClick={() => runExplain()}>Explain Plan</button>
 *
 * // Trigger explain with timing
 * <button onClick={() => runExplain({ analyze: true })}>Explain with Timing</button>
 * ```
 */
export declare function useExplainQuery(query: ExplainableQuery | null, options?: UseExplainQueryOptions): UseExplainQueryResult;

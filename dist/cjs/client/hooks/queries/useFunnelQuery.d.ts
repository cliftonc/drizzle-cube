import { FunnelConfig, UseFunnelQueryOptions, UseFunnelQueryResult } from '../../types/funnel.js';
/**
 * Hook for server-side funnel query execution
 *
 * Usage:
 * ```tsx
 * const { chartData, isExecuting, error } = useFunnelQuery(config, {
 *   debounceMs: 300,
 *   skip: !hasBindingKey
 * })
 *
 * // Results available after single server request
 * <FunnelChart data={chartData} />
 * ```
 */
export declare function useFunnelQuery(config: FunnelConfig | null, options?: UseFunnelQueryOptions): UseFunnelQueryResult;
/**
 * Create a stable query key for funnel queries
 */
export declare function createFunnelQueryKey(config: FunnelConfig | null): readonly unknown[];

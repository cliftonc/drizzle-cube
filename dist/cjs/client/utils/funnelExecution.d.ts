import { CubeQuery, SimpleFilter } from '../types.js';
import { FunnelBindingKey, FunnelBindingKeyMapping, FunnelConfig, FunnelStep, FunnelStepResult, FunnelExecutionResult, FunnelChartData } from '../types/funnel.js';
/**
 * Default maximum number of binding key values to pass between funnel steps.
 * Limits the size of the IN clause to prevent performance issues.
 */
export declare const DEFAULT_BINDING_KEY_LIMIT = 500;
/**
 * Extract the binding key field name for a specific query/cube.
 *
 * For simple binding keys (string), returns the dimension directly.
 * For cross-cube mappings, finds the mapping for the cube used in the query.
 *
 * @param bindingKey - The funnel binding key configuration
 * @param query - The cube query (used to determine which cube is being queried)
 * @returns The binding key field name (e.g., "Users.userId")
 */
export declare function getBindingKeyField(bindingKey: FunnelBindingKey, query: CubeQuery): string;
/**
 * Extract the cube name from a query by looking at measures/dimensions
 */
export declare function getCubeNameFromQuery(query: CubeQuery): string | null;
/**
 * Result from extracting binding key values
 */
export interface ExtractedBindingKeyValues {
    /** Binding key values (limited to max if specified) */
    values: (string | number)[];
    /** Total count of unique values before limiting */
    totalCount: number;
    /** Whether values were truncated due to limit */
    wasTruncated: boolean;
}
/**
 * Extract unique values for the binding key from query result data
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution is now the default approach.
 *
 * @param data - Raw data from query result
 * @param bindingKeyField - The field name to extract values from
 * @param limit - Maximum number of values to return (default: DEFAULT_BINDING_KEY_LIMIT)
 * @returns Object with values array, total count, and truncation flag
 */
export declare function extractBindingKeyValues(data: unknown[], bindingKeyField: string, limit?: number): ExtractedBindingKeyValues;
/**
 * Build a step query with binding key filter applied.
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution is now the default approach.
 *
 * For the first step (no previous values), returns the original query
 * with the binding key dimension ensured.
 *
 * For subsequent steps, adds an IN filter for the previous step's
 * binding key values.
 *
 * @param step - The funnel step configuration
 * @param bindingKey - The funnel binding key configuration
 * @param previousBindingKeyValues - Binding key values from previous step (null for first step)
 * @returns Modified CubeQuery with binding key filter
 */
export declare function buildStepQuery(step: FunnelStep, bindingKey: FunnelBindingKey, previousBindingKeyValues: (string | number)[] | null): CubeQuery;
/**
 * Calculate conversion metrics for a step
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution now calculates metrics directly.
 */
export declare function calculateStepMetrics(currentCount: number, previousCount: number | null, firstStepCount: number): {
    conversionRate: number | null;
    cumulativeConversionRate: number;
};
/**
 * Build a funnel step result from query execution
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution now returns results directly.
 */
export declare function buildStepResult(step: FunnelStep, stepIndex: number, data: unknown[], bindingKeyField: string, countUnique: boolean, previousCount: number | null, firstStepCount: number, executionTime: number, error?: Error | null, bindingKeyLimit?: number): FunnelStepResult;
/**
 * Convert step results to chart-ready data format
 *
 * @deprecated Use transformServerFunnelResult() instead.
 * Server-side funnel execution returns data in a compatible format.
 */
export declare function buildFunnelChartData(stepResults: FunnelStepResult[]): FunnelChartData[];
/**
 * Build the complete funnel execution result
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution now builds results directly.
 */
export declare function buildFunnelResult(config: FunnelConfig, stepResults: FunnelStepResult[], status: FunnelExecutionResult['status'], error?: Error | null, currentStepIndex?: number | null): FunnelExecutionResult;
/**
 * Create an empty/initial funnel result
 *
 * @deprecated This function was used for client-side funnel execution.
 * Server-side funnel execution manages state differently.
 */
export declare function createEmptyFunnelResult(config: FunnelConfig): FunnelExecutionResult;
/**
 * Build a FunnelConfig from multi-query config state.
 * Used to convert AnalysisBuilder state to funnel configuration.
 *
 * @deprecated Use the dedicated funnel mode (analysisType === 'funnel') instead.
 * This function supports backward compatibility with legacy multi-query funnel mode
 * (mergeStrategy === 'funnel'). For new implementations, use the dedicated funnel
 * state in the store which provides better UX with step-based configuration.
 *
 * @param queries - Array of CubeQuery objects (one per step)
 * @param bindingKey - The binding key configuration
 * @param stepLabels - Optional labels for each step
 * @param stepTimeToConvert - Optional time window for each step
 * @returns FunnelConfig ready for execution
 */
export declare function buildFunnelConfigFromQueries(queries: CubeQuery[], bindingKey: FunnelBindingKey, stepLabels?: string[], stepTimeToConvert?: (string | null)[]): FunnelConfig;
/**
 * Check if funnel execution should stop early
 * (e.g., when no binding key values remain)
 */
export declare function shouldStopFunnelExecution(stepResult: FunnelStepResult): boolean;
/**
 * Metadata fields injected into funnel result data
 * (for compatibility with existing chart/table components)
 */
export interface FunnelMetadata {
    __stepIndex: number;
    __stepName: string;
    __stepId: string;
    __conversionRate: number | null;
    __cumulativeRate: number;
}
/**
 * Check if data contains funnel metadata
 */
export declare function isFunnelData(data: unknown[]): boolean;
/**
 * Server-side funnel step definition (for FunnelQueryConfig)
 */
export interface ServerFunnelStep {
    name: string;
    filter?: SimpleFilter | SimpleFilter[];
    timeToConvert?: string;
}
/**
 * Server-side funnel query configuration
 */
export interface ServerFunnelQueryConfig {
    bindingKey: string | FunnelBindingKeyMapping[];
    timeDimension: string | Array<{
        cube: string;
        dimension: string;
    }>;
    steps: ServerFunnelStep[];
    includeTimeMetrics?: boolean;
    globalTimeWindow?: string;
}
/**
 * Server-side funnel result row
 */
export interface ServerFunnelResultRow {
    step: string;
    stepIndex: number;
    count: number;
    conversionRate: number | null;
    cumulativeConversionRate: number;
    avgSecondsToConvert?: number | null;
    medianSecondsToConvert?: number | null;
    p90SecondsToConvert?: number | null;
    minSecondsToConvert?: number | null;
    maxSecondsToConvert?: number | null;
}
/**
 * Query shape for server-side funnel execution
 */
export interface ServerFunnelQuery {
    funnel: ServerFunnelQueryConfig;
}
/**
 * Build a server-side funnel query from client state.
 *
 * Transforms the client-side FunnelConfig format into a SemanticQuery
 * with `funnel` property that the server can execute.
 *
 * @param queries - Array of CubeQuery objects (one per step)
 * @param bindingKey - The binding key configuration
 * @param stepLabels - Optional labels for each step
 * @param stepTimeToConvert - Optional time window for each step (ISO 8601 duration)
 * @param includeTimeMetrics - Whether to include time-to-convert metrics
 * @returns Query object with funnel configuration for server execution
 */
export declare function buildServerFunnelQuery(queries: CubeQuery[], bindingKey: FunnelBindingKey, stepLabels?: string[], stepTimeToConvert?: (string | null)[], includeTimeMetrics?: boolean): ServerFunnelQuery;
/**
 * Transform server funnel result rows to client FunnelChartData format.
 *
 * Maps the server's FunnelResultRow[] to the client's FunnelChartData[]
 * format expected by FunnelChart component.
 *
 * @param serverResult - Raw data from server (FunnelResultRow[])
 * @param stepNames - Optional step names to override server names
 * @returns FunnelChartData[] ready for FunnelChart component
 */
export declare function transformServerFunnelResult(serverResult: unknown[], stepNames?: string[]): FunnelChartData[];
/**
 * Format a duration in seconds to a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "45s", "2.5m", "1.3h", "3.2d")
 */
export declare function formatDuration(seconds: number | null | undefined): string;

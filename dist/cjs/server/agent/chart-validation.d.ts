/**
 * Chart Config Validation for Agent Tool
 *
 * Validates chartConfig against drop zone requirements defined in the chart config registry.
 * Auto-infers missing fields from the query structure.
 * Builds per-chart-type guidance for the tool description.
 */
interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
/**
 * Validate chartConfig against the chart type's drop zone requirements.
 */
export declare function validateChartConfig(chartType: string, chartConfig: Record<string, unknown> | undefined, query: Record<string, unknown>): ValidationResult;
/**
 * Pick a chart type that can actually render the query.
 *
 * A `bar` over a measures-only query has no category axis: `resolveChartAxisFields`
 * reports `axisInvalid` and the portlet renders a config-error card. Rejecting it
 * instead costs the model a full query+portlet rebuild, so swap to a type that
 * shows the same numbers and tell it what happened.
 *
 * The note is model-facing, not user-facing, so it is deliberately not translated.
 */
export declare function resolveChartTypeFallback(chartType: string, chartConfig: Record<string, unknown> | undefined, query: Record<string, unknown>): {
    chartType: string;
    note?: string;
};
export declare function inferChartConfig(chartType: string, chartConfig: Record<string, unknown> | undefined, query: Record<string, unknown>): Record<string, unknown>;
/**
 * Build per-chart-type requirements text for the agent tool description.
 * Includes description, useCase, and drop zone requirements for each chart type.
 */
export declare function buildChartRequirementsDescription(allowedChartTypes: string[]): string;
export {};

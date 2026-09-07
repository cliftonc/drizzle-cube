import { DatabaseAdapter } from '../adapters/base-adapter.js';
import { FunnelQueryConfig, FunnelResultRow } from '../types/funnel.js';
import { Cube, QueryContext, SemanticQuery, AnalysisConfigValidationResult } from '../types/index.js';
export declare class FunnelQueryBuilder {
    private databaseAdapter;
    private filterBuilder;
    private dateTimeBuilder;
    constructor(databaseAdapter: DatabaseAdapter);
    /**
     * Check if query contains funnel configuration
     */
    hasFunnel(query: SemanticQuery): boolean;
    /**
     * Validate funnel configuration
     */
    validateConfig(config: FunnelQueryConfig, cubes: Map<string, Cube>): AnalysisConfigValidationResult;
    /** Validate the funnel binding key (single member or per-cube mappings). */
    private validateBindingKey;
    /** Validate the funnel time dimension member. */
    private validateTimeDimension;
    /** Validate a single funnel step (name, cube, filters, timeToConvert). */
    private validateStep;
    /** Validate the member filters of a single funnel step. */
    private validateStepFilters;
    /**
     * Build complete funnel query using Drizzle's query builder pattern
     *
     * Uses the industry-standard "sequential CTEs" pattern where each step
     * joins to the previous step CTE. This automatically enforces funnel
     * constraints (monotonically decreasing counts).
     *
     * Returns a Drizzle query builder that supports .toSQL() for dry-run
     * and can be executed directly for results.
     */
    buildFunnelQuery(config: FunnelQueryConfig, cubes: Map<string, Cube>, context: QueryContext): ReturnType<typeof context.db.select>;
    /**
     * Transform raw SQL result to FunnelResultRow[]
     */
    transformResult(rawResult: Record<string, unknown>[], config: FunnelQueryConfig): FunnelResultRow[];
    /** Attach the per-step conversion-time metrics to a funnel result row. */
    private applyTimeMetrics;
    /**
     * Extract cube names referenced in step filters
     */
    private extractFilterCubeNames;
    /**
     * Resolve steps with their cube, SQL expressions, and filter conditions
     */
    private resolveSteps;
    /**
     * Resolve the cube for a step
     */
    private resolveCubeForStep;
    /**
     * Resolve binding key expression for a cube
     */
    private resolveBindingKey;
    /**
     * Resolve time dimension expression for a cube
     */
    private resolveTimeDimension;
    /**
     * Build filter conditions for a step
     * @param step - The funnel step
     * @param baseCube - The step's primary cube
     * @param cubes - All cubes available for cross-cube filtering
     * @param context - Query context with security context
     */
    private buildStepFilters;
    /**
     * Build a single filter condition
     * @param filter - The filter to build
     * @param baseCube - The step's primary cube
     * @param cubes - All cubes available for cross-cube filtering
     * @param context - Query context with security context
     */
    private buildFilterCondition;
    /** Combine a logical/group filter's sub-conditions into a single SQL condition. */
    private buildLogicalFilterCondition;
    /** Build a simple (member) filter condition, validating values and cross-cube join paths. */
    private buildSimpleFilterCondition;
    /**
     * Build CTE for a single step using Drizzle's $with() pattern
     *
     * For step 0 (entry point): queries raw data directly
     * For subsequent steps: joins to the previous step CTE to enforce sequential progression
     *
     * This implements the industry-standard "sequential CTEs" pattern where each step
     * only includes binding_keys that successfully completed the previous step.
     *
     * @param step - The resolved step configuration
     * @param context - Query context with security context
     * @param previousStepCTE - Reference to the previous step's CTE (undefined for step 0)
     */
    private buildStepCTE;
    /**
     * Build CTE for the first step (step 0) - entry point
     *
     * Queries raw data directly with security context and step filters.
     * Gets the first occurrence per binding key.
     */
    private buildFirstStepCTE;
    /**
     * Build CTE for subsequent steps (step 1+) - joins to previous step
     *
     * This is the key to the sequential funnel pattern:
     * - INNER JOINs to the previous step CTE (only includes binding_keys that completed previous step)
     * - Applies temporal constraints (must occur after previous step)
     * - Applies step-specific filters and time-to-convert windows
     *
     * This automatically ensures monotonically decreasing counts.
     */
    private buildSubsequentStepCTE;
    /**
     * Helper to add cross-cube JOINs to a step query
     * Extracted to avoid duplication between first and subsequent step methods
     */
    private addCrossJoinsToQuery;
    /**
     * Build funnel results CTE that joins all step times for time metric calculation
     *
     * With the sequential CTE pattern, each step CTE already contains only the
     * binding_keys that successfully completed that step. This CTE simply joins
     * them together to enable time difference calculations.
     *
     * No CASE expressions needed - the temporal filtering is already done in each step CTE.
     */
    private buildFunnelResultsCTE;
    /**
     * Build aggregation CTE with counts and optional time metrics
     *
     * OPTIMIZATION: Uses single-pass aggregation over funnel_joined CTE instead of
     * multiple scalar subqueries. This reduces table scans from 13+ to 1 for a typical
     * 3-step funnel with time metrics.
     *
     * - Step counts: COUNT(*) for step_0, COUNT(step_N_time) for subsequent steps
     * - Time metrics: Uses database-specific conditional aggregation (FILTER clause for
     *   PostgreSQL, CASE WHEN for MySQL/SQLite)
     * - Percentiles: Still use subqueries since PERCENTILE_CONT with FILTER is non-standard
     *
     * Important: All SQL fields must have explicit aliases via .as() for Drizzle
     * to properly reference them when selecting from the CTE
     */
    private buildAggregationCTE;
}

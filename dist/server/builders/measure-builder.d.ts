import { SQL } from 'drizzle-orm';
import { Cube, QueryContext, PhysicalQueryPlan } from '../types/index.js';
import { DatabaseAdapter } from '../adapters/base-adapter.js';
import { ResolvedMeasures } from '../template-substitution.js';
export declare class MeasureBuilder {
    private databaseAdapter;
    constructor(databaseAdapter: DatabaseAdapter);
    /**
     * Build resolvedMeasures map for a set of measures
     * This centralizes the logic for building both regular and calculated measures
     * in dependency order, avoiding duplication across main queries and CTEs
     *
     * @param measureNames - Array of measure names to resolve (e.g., ["Employees.count", "Employees.activePercentage"])
     * @param cubeMap - Map of all cubes involved in the query
     * @param context - Query context with database and security context
     * @param customMeasureBuilder - Optional function to override how individual measures are built
     * @returns Map of measure names to SQL builder functions
     */
    buildResolvedMeasures(measureNames: string[], cubeMap: Map<string, Cube>, context: QueryContext, customMeasureBuilder?: (measureName: string, measure: any, cube: Cube) => SQL): ResolvedMeasures;
    /**
     * First-pass classification of a user-requested measure: sorts it into the
     * regular/calculated buckets and seeds `allMeasuresToResolve` with its
     * (transitive) dependencies. Post-aggregation windows only contribute their
     * base measure as a dependency.
     */
    private classifyRequestedMeasure;
    /** Seed `allMeasuresToResolve` with the direct + transitive deps of a calculated measure. */
    private collectCalculatedDependencies;
    /** Second-pass classification of a dependency measure into the regular/calculated buckets. */
    private classifyDependencyMeasure;
    /**
     * Build calculated measure expression by substituting {member} references
     * with resolved SQL expressions
     */
    buildCalculatedMeasure(measure: any, cube: Cube, allCubes: Map<string, Cube>, resolvedMeasures: ResolvedMeasures, context: QueryContext): SQL;
    /**
     * Build resolved measures map for a calculated measure from CTE columns
     * This handles re-aggregating pre-aggregated CTE columns for calculated measures
     *
     * IMPORTANT: For calculated measures in CTEs, we cannot sum/avg pre-computed ratios.
     * We must recalculate from the base measures that were pre-aggregated in the CTE.
     *
     * @param measure - The calculated measure to build
     * @param cube - The cube containing this measure
     * @param cteInfo - CTE metadata (alias, measures, cube reference)
     * @param allCubes - Map of all cubes in the query
     * @param context - Query context
     * @returns SQL expression for the calculated measure using CTE column references
     */
    buildCTECalculatedMeasure(measure: any, cube: Cube, cteInfo: {
        cteAlias: string;
        measures: string[];
        cube: Cube;
    }, allCubes: Map<string, Cube>, context: QueryContext): SQL;
    /**
     * Re-aggregate a pre-aggregated CTE column based on the original measure type.
     * For pre-aggregated values in CTEs we re-aggregate properly:
     * - count/sum/number → SUM
     * - avg → AVG (ideally a weighted average, but simple AVG for now)
     * - min/max → MIN/MAX
     * - anything else → SUM
     */
    private reAggregateCteColumn;
    /**
     * Build measure expression for HAVING clause, handling CTE references correctly
     */
    buildHavingMeasureExpression(cubeName: string, fieldKey: string, measure: any, context: QueryContext, queryPlan?: PhysicalQueryPlan): SQL;
    /** Build a HAVING measure expression that references a pre-aggregation CTE column. */
    private buildHavingCteMeasure;
    /**
     * Build measure expression with aggregation and filters
     * Note: This should NOT be called for calculated measures
     *
     * @param measure - The measure definition
     * @param context - Query context with security context and database info
     * @param cube - Optional cube reference for resolving dimension references (window functions)
     */
    buildMeasureExpression(measure: any, context: QueryContext, cube?: Cube): SQL;
    /**
     * Wrap a base expression in a CASE WHEN for measures carrying `filters`,
     * producing conditional aggregation. Returns the original expression when
     * there are no filters.
     */
    private applyMeasureFilters;
    /** Apply the aggregation function implied by `measure.type` to `baseExpr`. */
    private applyAggregation;
    /**
     * Run a statistical-function builder, falling back to MAX(NULL) with a warning
     * when the engine doesn't support it (shared by stddev/variance/percentile).
     */
    private buildStatistical;
    /** Resolve the percentile value implied by a percentile-family measure type. */
    private resolvePercentile;
    /** Build a (per-row) window-function measure expression. */
    private buildWindowMeasure;
    /** Resolve a window function's partitionBy dimension references to SQL expressions. */
    private resolveWindowPartitions;
    /** Resolve a window function's orderBy dimension/measure references to SQL expressions. */
    private resolveWindowOrder;
    /**
     * List of measure types that are window functions
     * Window functions require special handling in CTEs:
     * - No GROUP BY in the CTE
     * - No re-aggregation in outer query
     * - Return individual rows, not grouped results
     */
    static WINDOW_FUNCTION_TYPES: readonly ["lag", "lead", "rank", "denseRank", "rowNumber", "ntile", "firstValue", "lastValue", "movingAvg", "movingSum"];
    /**
     * Check if a measure type is a window function
     * @param measureType - The measure type string
     * @returns true if this is a window function type
     */
    static isWindowFunction(measureType: string): boolean;
    /**
     * Categorize measures into window functions and regular aggregates
     * Used by query planner to create separate CTEs for each category
     *
     * @param measureNames - Array of measure names (e.g., ["Productivity.rank", "Productivity.totalLines"])
     * @param cubeMap - Map of cubes to look up measure definitions
     * @returns Object with windowMeasures and aggregateMeasures arrays
     */
    static categorizeMeasures(measureNames: string[], cubeMap: Map<string, Cube>): {
        windowMeasures: string[];
        aggregateMeasures: string[];
    };
    /**
     * Check if a query contains any window function measures
     * @param measureNames - Array of measure names
     * @param cubeMap - Map of cubes
     * @returns true if any measure is a window function
     */
    static hasWindowFunctions(measureNames: string[], cubeMap: Map<string, Cube>): boolean;
    /**
     * Check if a measure is a post-aggregation window function.
     * Post-aggregation windows have a `measure` reference in their windowConfig,
     * indicating they should operate on aggregated data rather than raw rows.
     *
     * @param measure - The measure definition
     * @returns true if this is a post-aggregation window function
     */
    static isPostAggregationWindow(measure: any): boolean;
    /**
     * Get the base measure reference for a post-aggregation window function.
     * Resolves simple names (e.g., 'totalRevenue') to fully qualified names ('Sales.totalRevenue').
     *
     * @param measure - The measure definition
     * @param cubeName - The name of the cube containing this measure
     * @returns Fully qualified base measure name, or null if not a post-agg window
     */
    static getWindowBaseMeasure(measure: any, cubeName: string): string | null;
    /**
     * Get the default operation for a window function type.
     * - lag/lead default to 'difference' (compare current vs previous/next)
     * - rank/rowNumber/ntile/firstValue/lastValue default to 'raw'
     * - movingAvg/movingSum default to 'raw'
     *
     * @param windowType - The window function type
     * @returns Default operation for the window type
     */
    static getDefaultWindowOperation(windowType: string): 'raw' | 'difference' | 'ratio' | 'percentChange';
    /**
     * Categorize measures for post-aggregation window function handling.
     * Separates measures into:
     * - aggregateMeasures: Regular aggregates (count, sum, avg, etc.)
     * - postAggWindowMeasures: Window functions that reference a base measure
     * - requiredBaseMeasures: Base measures needed by window functions (auto-added to query)
     *
     * @param measureNames - Array of measure names from the query
     * @param cubeMap - Map of cubes to look up measure definitions
     * @returns Categorized measures with base measure dependencies
     */
    static categorizeForPostAggregation(measureNames: string[], cubeMap: Map<string, Cube>): {
        aggregateMeasures: string[];
        postAggWindowMeasures: string[];
        requiredBaseMeasures: Set<string>;
    };
    /**
     * Check if any measures in the query are post-aggregation window functions.
     *
     * @param measureNames - Array of measure names
     * @param cubeMap - Map of cubes
     * @returns true if any measure is a post-aggregation window function
     */
    static hasPostAggregationWindows(measureNames: string[], cubeMap: Map<string, Cube>): boolean;
}

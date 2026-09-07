import { SQL, AnyColumn } from 'drizzle-orm';
import { SemanticQuery, FilterOperator, Filter, Cube, QueryContext, PhysicalQueryPlan } from '../types/index.js';
import { DatabaseAdapter } from '../adapters/base-adapter.js';
import { ResolvedMeasures } from '../template-substitution.js';
export declare class DrizzleSqlBuilder {
    private dateTimeBuilder;
    private filterBuilder;
    private groupByBuilder;
    private measureBuilder;
    constructor(databaseAdapter: DatabaseAdapter);
    /**
     * Build resolvedMeasures map for a set of measures
     * Delegates to MeasureBuilder
     */
    buildResolvedMeasures(measureNames: string[], cubeMap: Map<string, Cube>, context: QueryContext, customMeasureBuilder?: (measureName: string, measure: any, cube: Cube) => SQL): ResolvedMeasures;
    /**
     * Build dynamic selections for measures, dimensions, and time dimensions
     * Works for both single and multi-cube queries
     * Handles calculated measures with dependency resolution
     */
    buildSelections(cubes: Map<string, Cube> | Cube, query: SemanticQuery, context: QueryContext): Record<string, SQL | AnyColumn>;
    /**
     * Build calculated measure expression by substituting {member} references
     * Delegates to MeasureBuilder
     */
    buildCalculatedMeasure(measure: any, cube: Cube, allCubes: Map<string, Cube>, resolvedMeasures: ResolvedMeasures, context: QueryContext): SQL;
    /**
     * Build resolved measures map for a calculated measure from CTE columns
     * Delegates to MeasureBuilder
     */
    buildCTECalculatedMeasure(measure: any, cube: Cube, cteInfo: {
        cteAlias: string;
        measures: string[];
        cube: Cube;
    }, allCubes: Map<string, Cube>, context: QueryContext): SQL;
    /**
     * Build measure expression for HAVING clause, handling CTE references correctly
     * Delegates to MeasureBuilder
     */
    private buildHavingMeasureExpression;
    /**
     * Build measure expression with aggregation and filters
     * Delegates to MeasureBuilder
     */
    buildMeasureExpression(measure: any, context: QueryContext, cube?: Cube): SQL;
    /**
     * Build time dimension expression with granularity using database adapter
     * Delegates to DateTimeBuilder
     */
    buildTimeDimensionExpression(dimensionSql: any, granularity: string | undefined, context: QueryContext): SQL;
    /**
     * Build WHERE conditions from semantic query filters (dimensions only)
     * Works for both single and multi-cube queries
     * @param preBuiltFilters - Optional map of cube name to pre-built filter SQL for parameter deduplication
     */
    buildWhereConditions(cubes: Map<string, Cube> | Cube, query: SemanticQuery, context: QueryContext, queryPlan?: PhysicalQueryPlan, preBuiltFilters?: Map<string, SQL[]>): SQL[];
    /**
     * Append a single regular filter's WHERE condition, preferring pre-built
     * filter SQL (for parameter deduplication) and skipping CTE-handled cubes.
     */
    private appendWhereFilter;
    /** Append a time dimension's date-range WHERE condition (cached when possible). */
    private appendTimeDimensionWhere;
    /** Whether a cube is materialized in a pre-aggregation CTE of the plan. */
    private cubeIsInCTE;
    /**
     * Build HAVING conditions from semantic query filters (measures only)
     * Works for both single and multi-cube queries
     */
    buildHavingConditions(cubes: Map<string, Cube> | Cube, query: SemanticQuery, context: QueryContext, queryPlan?: PhysicalQueryPlan): SQL[];
    /**
     * Process a single filter (basic or logical)
     * @param filterType - 'where' for dimension filters, 'having' for measure filters
     */
    private processFilter;
    /** Build a WHERE condition for a dimension filter, honouring CTE skips and the filter cache. */
    private processWhereDimensionFilter;
    /**
     * Build filter condition using Drizzle operators
     * Delegates to FilterBuilder
     */
    private buildFilterCondition;
    /**
     * Build date range condition for time dimensions
     * Delegates to DateTimeBuilder
     */
    buildDateRangeCondition(fieldExpr: AnyColumn | SQL, dateRange: string | string[]): SQL | null;
    /**
     * Build GROUP BY fields from dimensions and time dimensions
     * Delegates to GroupByBuilder
     */
    buildGroupByFields(cubes: Map<string, Cube> | Cube, query: SemanticQuery, context: QueryContext, queryPlan?: any): (SQL | AnyColumn)[];
    /**
     * Build ORDER BY clause with automatic time dimension sorting
     */
    buildOrderBy(query: SemanticQuery, selectedFields?: string[]): SQL[];
    /**
     * Collect numeric field names (measures + numeric dimensions) for type conversion
     * Works for both single and multi-cube queries
     */
    collectNumericFields(cubes: Map<string, Cube> | Cube, query: SemanticQuery): string[];
    /**
     * Apply LIMIT and OFFSET to a query with validation
     * If offset is provided without limit, add a reasonable default limit
     */
    applyLimitAndOffset<T>(query: T, semanticQuery: SemanticQuery): T;
    /**
     * Public wrapper for buildFilterCondition - used by executor for cache preloading
     * This allows pre-building filter SQL before query construction
     */
    buildFilterConditionPublic(fieldExpr: AnyColumn | SQL, operator: FilterOperator, values: any[], field?: any, dateRange?: string | string[]): SQL | null;
    /**
     * Build a logical filter (AND/OR) - used by executor for cache preloading
     * This handles nested filter structures and builds combined SQL
     * Delegates to FilterBuilder
     */
    buildLogicalFilter(filter: Filter, cubes: Map<string, Cube>, context: QueryContext): SQL | null;
}

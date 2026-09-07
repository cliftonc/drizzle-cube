import { SQL, AnyColumn } from 'drizzle-orm';
import { Cube, SemanticQuery, QueryContext, PhysicalQueryPlan } from '../types/index.js';
import { DateTimeBuilder } from './date-time-builder.js';
export declare class GroupByBuilder {
    private dateTimeBuilder;
    constructor(dateTimeBuilder: DateTimeBuilder);
    /**
     * Check if a measure type is a window function
     */
    isWindowFunctionType(measureType: string): boolean;
    /**
     * Check if a measure type is an aggregate function (requires GROUP BY)
     *
     * Note: 'number' is included because users commonly define measures with raw SQL
     * aggregations (e.g., sql`COUNT(DISTINCT ...)`) and set type: 'number' for the output.
     * These measures still require GROUP BY when used with time dimensions.
     */
    isAggregateFunctionType(measureType: string): boolean;
    /**
     * Build GROUP BY fields from dimensions and time dimensions
     * Works for both single and multi-cube queries
     *
     * NOTE: GROUP BY is only added when there are AGGREGATE measures.
     * Window functions do not require GROUP BY and operate on individual rows.
     */
    buildGroupByFields(cubes: Map<string, Cube> | Cube, query: SemanticQuery, context: QueryContext, queryPlan?: PhysicalQueryPlan): (SQL | AnyColumn)[];
    /**
     * Add the correlation key of any selected dimension that declares one.
     *
     * A dimension built from a correlated subquery (`buildAttributeDimensions`)
     * references the record key inside its SQL. Grouping by the subquery alone is
     * rejected by Postgres ("subquery uses ungrouped column … from outer query")
     * and by MySQL under `only_full_group_by`, so the key it correlates on is
     * grouped too.
     *
     * This only ever fires for queries that are invalid on those engines today, so
     * nothing that currently works changes shape. The key is the record's primary
     * key, so adding it makes the grouping per-record — which is the grain such a
     * dimension can be read at in the first place.
     */
    private addCorrelationKeys;
    /**
     * Determine whether the query contains at least one aggregate (or calculated,
     * or post-aggregation window over an aggregate) measure — which forces GROUP BY.
     */
    private hasAggregateMeasures;
    /** True when `measure` is a post-aggregation window over an aggregate base measure. */
    private isWindowOverAggregate;
    /** Resolve a single dimension into its GROUP BY expression (CTE-aware). */
    private resolveDimensionGroupField;
    /** Resolve a single time dimension into its GROUP BY expression (CTE-aware). */
    private resolveTimeDimensionGroupField;
}

import { SQL } from 'drizzle-orm';
import { SemanticQuery, QueryContext, PhysicalQueryPlan, PropagatingFilter } from '../types/index.js';
import { DrizzleSqlBuilder } from '../physical-plan/drizzle-sql-builder.js';
/**
 * CTE information type extracted from runtime physical plan context
 */
export type CTEInfo = NonNullable<PhysicalQueryPlan['preAggregationCTEs']>[0];
/**
 * CTEBuilder handles the construction of Common Table Expressions
 * for pre-aggregation in hasMany relationship queries.
 *
 * This enables efficient aggregation of "many" side data before joining,
 * preventing the Cartesian product explosion that would occur with direct JOINs.
 */
export declare class CTEBuilder {
    private queryBuilder;
    constructor(queryBuilder: DrizzleSqlBuilder);
    /**
     * Build pre-aggregation CTE for hasMany relationships
     *
     * Creates a CTE that:
     * 1. Selects join keys and aggregated measures
     * 2. Applies security context filtering
     * 3. Groups by join keys and requested dimensions
     * 4. Handles propagating filters from related cubes
     * 5. Handles multi-hop join paths by absorbing intermediate tables (fan-out prevention)
     */
    buildPreAggregationCTE(cteInfo: CTEInfo, query: SemanticQuery, context: QueryContext, queryPlan: PhysicalQueryPlan, preBuiltFilterMap?: Map<string, SQL[]>): any;
    /**
     * Build the SELECT map for a pre-aggregation CTE: join keys (or the
     * intermediate primary-connected column), downstream join keys, aggregated
     * measures, and requested dimensions / time dimensions from this cube.
     */
    private buildCTESelections;
    /** Add join-key columns (or the intermediate primary-connected column) to the CTE SELECT. */
    private addJoinKeySelections;
    /** Add downstream join-key columns so downstream cubes can be joined through this CTE. */
    private addDownstreamKeySelections;
    /** Add aggregated measure expressions to the CTE SELECT. */
    private addMeasureSelections;
    /** Add requested dimensions and time dimensions (from this cube) to the CTE SELECT. */
    private addDimensionSelections;
    /**
     * Add JOINs to intermediate tables inside the CTE (multi-hop fan-out
     * prevention). Joins from CTE-nearest to primary-nearest so each ON clause
     * only references tables already in scope.
     */
    private applyIntermediateJoins;
    /**
     * Assemble the full WHERE condition list for a pre-aggregation CTE: security
     * context, regular dimension filters, time-dimension date filters, and
     * propagating filters from related cubes.
     *
     * IMPORTANT: Only dimension filters are applied here; measure filters belong
     * in the main query's HAVING clause.
     */
    private buildCTEWhereConditions;
    /**
     * Build the time-dimension date filters (from `timeDimensions.dateRange` and
     * `inDateRange` simple filters) plus propagating-filter subqueries for a CTE.
     */
    private buildCTETimeFilters;
    /**
     * Build the GROUP BY fields for a pre-aggregation CTE: join keys (or the
     * intermediate primary-connected column), downstream join keys, and requested
     * dimensions / time dimensions. De-dupes named columns.
     */
    private buildCTEGroupByFields;
    /**
     * Add join keys (and downstream join keys) to the CTE GROUP BY via the de-dupe
     * callback. For multi-hop paths uses the intermediate table's
     * primary-connected column (e.g. employees.department_id).
     */
    private addJoinKeyGroupBy;
    /**
     * Build join condition for CTE
     *
     * Creates the ON clause for joining a CTE to the main query.
     * Uses stored column objects for type-safe joins.
     *
     * For multi-hop paths with intermediate joins:
     * - The CTE includes columns from intermediate tables
     * - The join condition uses the intermediate's primary-connected column
     * - Example: departments.id = employeeteams_agg.department_id (not employee_id!)
     */
    buildCTEJoinCondition(joinCube: PhysicalQueryPlan['joinCubes'][0], cteAlias: string, queryPlan: PhysicalQueryPlan): SQL;
    /**
     * Resolve source-side join expression for CTE joins.
     *
     * When two cubes are both materialized as CTEs in the same query, join keys can
     * still point to the original table column object (e.g. departments.id). In that
     * case the table is no longer present in FROM/JOIN, so rewrite to the upstream CTE
     * alias column (e.g. departments_agg.id).
     */
    private resolveCTEJoinSourceColumn;
    /**
     * Build a subquery filter for propagating filters from related cubes.
     *
     * This generates: cteCube.FK IN (SELECT sourceCube.PK FROM sourceCube WHERE filters...)
     *
     * Example: For Productivity CTE with Employees.createdAt filter:
     * employee_id IN (SELECT id FROM employees WHERE organisation_id = $1 AND created_at >= $date)
     *
     * For composite keys, uses EXISTS instead of IN for better database compatibility:
     * EXISTS (SELECT 1 FROM source WHERE source.pk1 = cte.fk1 AND source.pk2 = cte.fk2 AND <filters>)
     */
    buildPropagatingFilterSubquery(propFilter: PropagatingFilter, context: QueryContext): SQL | null;
}

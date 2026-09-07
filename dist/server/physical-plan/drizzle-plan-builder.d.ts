import { DatabaseAdapter } from '../adapters/base-adapter.js';
import { DrizzleSqlBuilder } from './drizzle-sql-builder.js';
import { CTEBuilder } from '../builders/cte-builder.js';
import { PhysicalQueryPlan, QueryContext, SemanticQuery } from '../types/index.js';
import { QueryNode } from '../logical-plan/index.js';
/**
 * Converts optimised logical plans into runtime physical query plans,
 * then builds executable Drizzle queries.
 */
export declare class DrizzlePlanBuilder {
    private readonly queryBuilder;
    private readonly cteBuilder;
    private readonly databaseAdapter;
    constructor(queryBuilder: DrizzleSqlBuilder, cteBuilder: CTEBuilder, databaseAdapter: DatabaseAdapter);
    /**
     * Build runtime physical context from an optimised logical plan.
     * This is the physical-builder input for SQL generation.
     */
    derivePhysicalPlanContext(plan: QueryNode): PhysicalQueryPlan;
    /**
     * Materialize a symbolic JoinRef into a runtime JoinCubePlanEntry, building
     * the Drizzle join condition(s) from the join definition. This is the seam
     * where the logical plan's symbolic join refs become executable SQL — the
     * planner no longer pre-builds any join SQL.
     *
     * Junction-table security is NOT materialized here: the stored
     * `through.securitySql` function is carried forward and applied (in the WHERE
     * clause) at build time with the request's security context.
     */
    private materializeJoin;
    private derivePhysicalPlanContextFromMultiFact;
    private derivePhysicalPlanContextFromFullKeyAggregate;
    /**
     * Reconstruct a SemanticQuery from a (possibly optimised) QueryNode.
     *
     * This is the materialization seam that makes the logical plan a real IR:
     * the executor derives the query the physical builder consumes from the
     * optimised plan, so optimiser rewrites of measures/filters/limit/etc. take
     * effect in the generated SQL. Must faithfully round-trip every field the
     * physical builder and processors read off a SemanticQuery.
     */
    toSemanticQuery(node: QueryNode): SemanticQuery;
    private resolvePhysicalSimpleSource;
    private resolvePhysicalSimpleSourceFromKeysDedup;
    private resolveKeysDeduplicationMeta;
    /**
     * Build unified query that works for both single and multi-cube queries.
     */
    build(queryPlan: PhysicalQueryPlan, query: SemanticQuery, context: QueryContext): any;
}

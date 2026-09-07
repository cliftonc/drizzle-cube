import { PhysicalQueryPlan, QueryContext, SemanticQuery } from '../../types/index.js';
import { PhysicalBuildDependencies } from './shared.js';
/**
 * Build a function for `build()` so each group CTE can be materialized through
 * the standard physical-plan builder without a class dependency.
 */
export type GroupQueryBuilder = (queryPlan: PhysicalQueryPlan, query: SemanticQuery, context: QueryContext) => any;
/**
 * Build a multi-fact-merge query (joining independent measure groups on shared
 * grain keys), or return null when the plan does not qualify. Falls back to a
 * UNION-of-keys strategy when a FULL OUTER JOIN is requested but unsupported.
 */
export declare function buildMultiFactMergeQuery(queryPlan: PhysicalQueryPlan, query: SemanticQuery, context: QueryContext, deps: PhysicalBuildDependencies, buildGroup: GroupQueryBuilder): any | null;

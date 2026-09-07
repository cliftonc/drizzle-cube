import { PhysicalQueryPlan, QueryContext, SemanticQuery } from '../../types/index.js';
import { PhysicalBuildDependencies } from './shared.js';
/**
 * Build the dual-CTE keys-deduplication query, or return null when the plan
 * does not qualify (caller falls back to the standard build).
 *
 * The query splits into:
 *  - a "keys" CTE that groups by the query grain + multiplied cube primary key
 *    (pre-aggregating regular measures), and
 *  - a "pk_agg" CTE that pre-aggregates the multiplied cube's measures per PK,
 * then re-aggregates both in an outer query joined on the primary key.
 */
export declare function buildKeysDeduplicationQuery(queryPlan: PhysicalQueryPlan, query: SemanticQuery, context: QueryContext, deps: PhysicalBuildDependencies): any | null;

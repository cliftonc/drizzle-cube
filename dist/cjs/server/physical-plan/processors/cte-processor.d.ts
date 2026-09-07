import { PhysicalQueryPlan, QueryContext, SemanticQuery } from '../../types/index.js';
import { PhysicalBuildDependencies, CTEBuildState } from './shared.js';
/**
 * Builds pre-aggregation CTE state used by selection/join/predicate processors.
 */
export declare function buildCTEState(queryPlan: PhysicalQueryPlan, query: SemanticQuery, context: QueryContext, deps: PhysicalBuildDependencies): CTEBuildState;

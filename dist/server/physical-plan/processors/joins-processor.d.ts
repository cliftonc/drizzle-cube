import { Cube, PhysicalQueryPlan, QueryContext } from '../../types/index.js';
import { CTEBuildState, JoinBuildState, PhysicalBuildDependencies, SelectionMap } from './shared.js';
/**
 * Applies CTEs and JOIN graph construction to the query builder.
 */
export declare function applyJoins(queryPlan: PhysicalQueryPlan, context: QueryContext, primaryCubeBase: ReturnType<Cube['sql']>, modifiedSelections: SelectionMap, cteState: CTEBuildState, deps: Pick<PhysicalBuildDependencies, 'cteBuilder'>): JoinBuildState;

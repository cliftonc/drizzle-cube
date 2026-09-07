import { Cube, PhysicalQueryPlan, QueryContext, SemanticQuery } from '../../types/index.js';
import { CTEBuildState, JoinBuildState, PhysicalBuildDependencies } from './shared.js';
/**
 * Applies WHERE/GROUP/HAVING/ORDER/LIMIT phases.
 */
export declare function applyPredicatesAndFinalize(queryPlan: PhysicalQueryPlan, query: SemanticQuery, context: QueryContext, allCubes: Map<string, Cube>, primaryCubeBase: ReturnType<Cube['sql']>, cteState: CTEBuildState, joinState: JoinBuildState, deps: Pick<PhysicalBuildDependencies, 'queryBuilder'>): any;

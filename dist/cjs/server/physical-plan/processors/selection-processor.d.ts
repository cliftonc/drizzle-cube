import { Cube, PhysicalQueryPlan, QueryContext, SemanticQuery } from '../../types/index.js';
import { PhysicalBuildDependencies, SelectionMap } from './shared.js';
/**
 * Builds and rewrites selections (including CTE and window handling).
 */
export declare function buildModifiedSelections(queryPlan: PhysicalQueryPlan, query: SemanticQuery, context: QueryContext, allCubes: Map<string, Cube>, deps: Pick<PhysicalBuildDependencies, 'queryBuilder' | 'databaseAdapter'>): SelectionMap;

import { Cube, PhysicalQueryPlan, QueryContext, SemanticQuery } from '../../types/index.js';
import { PhysicalBuildDependencies, SelectionMap } from './shared.js';
/**
 * Applies post-aggregation window measures to the selection map.
 */
export declare function applyPostAggregationWindows(modifiedSelections: SelectionMap, queryPlan: PhysicalQueryPlan, query: SemanticQuery, context: QueryContext, allCubes: Map<string, Cube>, deps: Pick<PhysicalBuildDependencies, 'queryBuilder' | 'databaseAdapter'>): void;

import { Cube, CubeJoin, SemanticQuery } from '../types/index.js';
/** A resolved CTE join key (column names plus the underlying column objects). */
export interface CTEJoinKey {
    sourceColumn: string;
    targetColumn: string;
    sourceColumnObj: any;
    targetColumnObj: any;
}
/** A join definition located relative to a primary/target cube pair. */
export interface FoundJoinInfo {
    sourceCube: Cube;
    joinDef: CubeJoin;
    reversed?: boolean;
}
/**
 * Derive the CTE join keys for a located join definition, handling
 * belongsToMany junctions and reversed (belongsTo-back-to-primary) joins.
 */
export declare function deriveCTEJoinKeys(joinInfo: FoundJoinInfo, primaryCube: Cube): CTEJoinKey[];
/**
 * Derive the join keys connecting a downstream dimension cube through the CTE
 * cube, handling belongsToMany (via junction sourceKey) and regular joins.
 */
export declare function deriveDownstreamJoinKeys(joinDef: CubeJoin): CTEJoinKey[];
/**
 * Find join information for a target cube, searching (in priority order):
 * 1. The primary cube's direct join to the target.
 * 2. The target cube's join back to the primary (reverse lookup → reversed).
 * 3. Any other registered cube's join to the target.
 */
export declare function findJoinInfoForCube(cubes: Map<string, Cube>, primaryCube: Cube, targetCubeName: string): FoundJoinInfo | null;
/**
 * Collect the names of cubes (other than the CTE cube) that contribute
 * dimensions, time dimensions, or filter members to the query. These are the
 * candidate downstream cubes that may need to join through the CTE.
 */
export declare function collectDimensionCubeNames(query: SemanticQuery, cteCubeName: string): Set<string>;

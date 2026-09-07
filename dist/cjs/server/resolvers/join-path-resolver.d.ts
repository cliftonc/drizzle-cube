import { Cube, CubeJoin } from '../types/index.js';
import { SQL } from 'drizzle-orm';
/**
 * Internal representation of a join path step
 * Used during path finding - simpler than the public JoinPathStep analysis type
 */
export interface InternalJoinPathStep {
    /** Source cube name */
    fromCube: string;
    /** Target cube name */
    toCube: string;
    /** The join definition from the source cube */
    joinDef: CubeJoin;
    /** True when this step was discovered via a reversed edge (target cube defines the join back to source) */
    reversed?: boolean;
}
/**
 * Score breakdown for a candidate preferred path.
 */
export interface PreferredPathScoreBreakdown {
    preferredJoinBonus: number;
    preferredCubeBonus: number;
    lengthPenalty: number;
}
/**
 * A scored candidate path considered by preferred-path selection.
 */
export interface PreferredPathCandidateScore {
    path: InternalJoinPathStep[];
    score: number;
    usesPreferredJoin: boolean;
    preferredCubesInPath: number;
    usesProcessed: boolean;
    scoreBreakdown: PreferredPathScoreBreakdown;
}
/**
 * Detailed preferred-path selection output for analysis/debug UIs.
 */
export interface PreferredPathSelection {
    strategy: 'preferred' | 'fallbackShortest';
    preferredCubes: string[];
    selectedIndex: number;
    candidates: PreferredPathCandidateScore[];
    selectedPath: InternalJoinPathStep[] | null;
}
/**
 * Resolves join paths between cubes and manages connectivity caching.
 * Supports bidirectional path finding: both forward (outgoing) joins and
 * reverse (incoming) joins are traversable. Reversed steps are marked with
 * `reversed: true` so downstream code can adjust join type and analysis.
 */
export declare class JoinPathResolver {
    private cubes;
    private connectivityCache;
    /** Maps cubeName → joins that TARGET that cube (incoming edges) */
    private reverseIndex;
    /**
     * @param cubes Map of cube name to cube definition
     */
    constructor(cubes: Map<string, Cube>);
    /**
     * Build reverse adjacency index: for each cube's outgoing join A→B,
     * store an entry under B pointing back to A.
     *
     * Excludes belongsToMany joins because reversing them requires swapping
     * sourceKey/targetKey in the junction table configuration, which is
     * error-prone. The 2-hop forward path through the junction table handles
     * these relationships correctly.
     */
    private buildReverseIndex;
    /**
     * Find the shortest join path from source cube to target cube
     * Uses BFS algorithm for optimal path discovery
     *
     * @param fromCube Source cube name
     * @param toCube Target cube name
     * @param alreadyProcessed Set of cubes to exclude from path finding
     * @returns Array of join steps or null if no path exists
     */
    findPath(fromCube: string, toCube: string, alreadyProcessed?: Set<string>): InternalJoinPathStep[] | null;
    /**
     * Enumerate the neighbouring cubes reachable from `currentCube` in one hop,
     * yielding the resulting join step. Forward edges (outgoing joins) come first,
     * then reverse edges (incoming joins) unless `forwardOnly` is set.
     */
    private neighbourSteps;
    /**
     * Find path that prefers going through specified cubes when possible
     * Used when certain cubes have measures in the query - ensures joins go through
     * the semantically correct path (e.g., through junction tables when their measures are used)
     *
     * IMPORTANT: This method allows paths to go THROUGH already-processed cubes (as intermediate
     * steps) but won't return them as new cubes to add. This is crucial for preferring paths
     * through cubes that have measures (like junction tables).
     *
     * Path scoring priority (highest to lowest):
     * 1. Paths using joins with `preferredFor` that includes the target cube (score +10)
     * 2. Paths going through cubes with measures in the query (score +1 per cube)
     * 3. Paths reusing already-processed cubes
     * 4. Shorter paths
     *
     * @param fromCube Source cube name
     * @param toCube Target cube name
     * @param preferredCubes Set of cube names to prefer in the path (usually cubes with measures)
     * @param alreadyProcessed Set of cubes already in the join plan (can be used as intermediates)
     * @returns Array of join steps or null if no path exists
     */
    findPathPreferring(fromCube: string, toCube: string, preferredCubes: Set<string>, alreadyProcessed?: Set<string>): InternalJoinPathStep[] | null;
    /**
     * Find preferred path with candidate scoring telemetry.
     * Used by analysis/debug panels to explain planner decisions.
     */
    findPathPreferringDetailed(fromCube: string, toCube: string, preferredCubes: Set<string>, alreadyProcessed?: Set<string>): PreferredPathSelection;
    /**
     * Find all possible paths between two cubes (up to maxDepth)
     * Used by findPathPreferring to evaluate multiple paths
     *
     * @param fromCube Source cube name
     * @param toCube Target cube name
     * @param alreadyProcessed Set of cubes to exclude from path finding
     * @param maxDepth Maximum path length to search (default 4 to avoid explosion)
     * @returns Array of all valid paths
     */
    private findAllPaths;
    /**
     * Check if a cube can reach all other cubes in the list via joins
     *
     * @param fromCube Starting cube name
     * @param allCubes List of all cubes that must be reachable
     * @returns true if all cubes are reachable
     */
    canReachAll(fromCube: string, allCubes: string[]): boolean;
    /**
     * Forward-only path finding (no reverse edges).
     * Used by canReachAll for primary cube selection to preserve join semantics.
     */
    private findForwardOnlyPath;
    /**
     * Build SQL join condition from join definition
     *
     * @param joinDef The cube join definition
     * @param sourceAlias Optional alias for source table (null uses actual column)
     * @param targetAlias Optional alias for target table (null uses actual column)
     * @returns SQL condition for the join
     */
    buildJoinCondition(joinDef: CubeJoin, sourceAlias: string | null, targetAlias: string | null): SQL;
    /**
     * Get all reachable cubes from a starting cube
     * Useful for analyzing cube connectivity
     *
     * @param fromCube Starting cube name
     * @returns Set of all reachable cube names
     */
    getReachableCubes(fromCube: string): Set<string>;
    private getCacheKey;
    private getFromCache;
    private setInCache;
}

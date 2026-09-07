import { Cube, CubeJoin, SemanticQuery } from '../types/index.js';
import { ResolverCache } from './planner-utils.js';
import { JoinRef } from './types.js';
export declare class JoinPlanner {
    private readonly resolverCache;
    constructor(resolverCache: ResolverCache);
    /**
     * Build join plan for multi-cube query
     * Supports both direct joins and transitive joins through intermediate cubes
     *
     * Uses query-aware path selection to prefer joining through cubes that have
     * measures in the query (e.g., joining Teams through EmployeeTeams when
     * EmployeeTeams.count is a measure)
     */
    buildJoinPlan(cubes: Map<string, Cube>, primaryCube: Cube, cubeNames: string[], _ctx: unknown, query: SemanticQuery): JoinRef[];
    /**
     * Build a single symbolic JoinRef for a join-path step. Handles belongsToMany
     * (junction-table) joins and regular (belongsTo/hasOne/hasMany) joins. The join
     * conditions and security WHERE are materialized later by DrizzlePlanBuilder;
     * only the join type is resolved here (it depends on the effective relationship).
     */
    private buildJoinRef;
    /**
     * Find hasMany join definition from primary cube to target cube
     */
    findHasManyJoinDef(primaryCube: Cube, targetCubeName: string, cubes?: Map<string, Cube>): CubeJoin | null;
}

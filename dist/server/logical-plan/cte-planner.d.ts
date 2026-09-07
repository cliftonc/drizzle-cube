import { Cube, QueryContext, PhysicalQueryPlan, SemanticQuery } from '../types/index.js';
import { ResolverCache } from './planner-utils.js';
import { FilterPropagation } from './filter-propagation.js';
import { JoinRef } from './types.js';
export declare class CTEPlanner {
    private readonly resolverCache;
    private readonly filterPropagation;
    constructor(resolverCache: ResolverCache, filterPropagation: FilterPropagation);
    /**
     * Plan pre-aggregation CTEs for hasMany relationships to prevent fan-out
     * Note: belongsToMany relationships handle fan-out differently through their junction table structure
     * and don't require CTEs - the two-hop join with the junction table provides natural grouping
     *
     * CRITICAL FAN-OUT PREVENTION LOGIC:
     * When a query contains ANY hasMany relationship in the join graph, ALL cubes with measures
     * that could be affected by row multiplication need CTEs. This includes:
     *
     * 1. Cubes with direct hasMany FROM primary (existing logic)
     * 2. Cubes with measures that would be multiplied due to hasMany elsewhere in the query
     *    - Example: Query has Departments.totalBudget + Productivity.recordCount
     *    - Employees hasMany → Productivity causes row multiplication
     *    - Departments.totalBudget would be inflated without CTE pre-aggregation
     */
    planPreAggregationCTEs(cubes: Map<string, Cube>, primaryCube: Cube, joinCubes: JoinRef[], query: SemanticQuery, _ctx: QueryContext): PhysicalQueryPlan['preAggregationCTEs'];
    /**
     * Build a single pre-aggregation CTE for one join-cube entry, or return null
     * when the cube contributes no aggregate measures / has no resolvable join.
     */
    private buildCTEForJoinCube;
    /**
     * Resolve the join keys (and any intermediate joins to absorb) for a CTE cube.
     *
     * Analyses the path from primary to the CTE cube: if an intermediate hasMany
     * exists, returns the corrected keys plus intermediate joins; otherwise locates
     * the join definition and derives keys from it.
     */
    private resolveCTEJoinKeys;
    /**
     * Locate the join definition for a CTE cube, preferring the final step of the
     * analysed path and falling back to a primary/reverse/any-cube search.
     */
    private locateJoinInfo;
    /**
     * Analyze the join path from primary cube to a target CTE cube.
     * Detects if there are intermediate hasMany relationships that would cause fan-out.
     *
     * Returns information about:
     * - The full join path
     * - Whether there are hasMany relationships ON the path (not just at the end)
     * - Which intermediate tables need to be absorbed into the CTE
     * - The correct join key to use (from primary cube's connection point)
     *
     * @param cubes Map of all registered cubes
     * @param primaryCube The primary cube (FROM clause)
     * @param targetCubeName The CTE cube we're analyzing the path to
     * @param query The semantic query (drives query-aware path selection)
     */
    private analyzeJoinPathToPrimary;
    /**
     * Compute CTE reasons from the actual join plan entries.
     *
     * Instead of scanning all registered cubes (which causes false positives when
     * unrelated hasMany relationships exist), this walks only the planned joins
     * using the `relationship` field now stored on each JoinCubePlanEntry.
     *
     * Algorithm:
     * 1. Scan join plan entries for hasMany/belongsToMany relationships
     * 2. If none found → return empty map (no CTEs needed)
     * 3. hasMany/belongsToMany targets with measures → 'hasMany'
     * 4. Other join cubes with measures (not hasMany source) → 'fanOutPrevention'
     */
    private computeCTEReasons;
    /**
     * Find downstream cubes that need join keys included in the CTE.
     *
     * When a query has dimensions from a cube (e.g., Teams.name) and measures from
     * a junction cube (e.g., EmployeeTeams.count), the junction CTE needs to include
     * the join key to the dimension cube (team_id) so the dimension cube can be
     * joined through the CTE instead of via an alternative path.
     *
     * @param cteCube The cube being converted to a CTE (e.g., EmployeeTeams)
     * @param query The semantic query with dimensions and measures
     * @param allCubes Map of all registered cubes
     * @returns Array of downstream join key info for cubes needing join through this CTE
     */
    private findDownstreamJoinKeys;
    /**
     * Expand calculated measures to include their dependencies
     */
    private expandCalculatedMeasureDependencies;
    /**
     * Extract measure references from calculatedSql template
     */
    private extractDependenciesFromTemplate;
    /**
     * Extract measures referenced in filters (for CTE inclusion)
     */
    private extractMeasuresFromFilters;
    /**
     * Recursively extract measures from filters for a specific cube
     * Only includes filter members that are actually measures (not dimensions)
     */
    private extractMeasuresFromFilter;
}

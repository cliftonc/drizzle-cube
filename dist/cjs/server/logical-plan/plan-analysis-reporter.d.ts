import { Cube, PhysicalQueryPlan, SemanticQuery, PrimaryCubeAnalysis, JoinPathAnalysis, QueryWarning } from '../types/index.js';
import { ResolverCache } from './planner-utils.js';
export declare class PlanAnalysisReporter {
    private readonly resolverCache;
    constructor(resolverCache: ResolverCache);
    /**
     * Analyze why a particular cube was chosen as primary
     */
    analyzePrimaryCubeSelection(cubeNames: string[], query: SemanticQuery, cubes: Map<string, Cube>): PrimaryCubeAnalysis;
    /**
     * Build the scored candidate list (dimension count, join count, reachability).
     */
    private buildPrimaryCubeCandidates;
    /**
     * Tier 1: select the cube with the most query dimensions that can reach all
     * others. Returns null when no dimension-based winner applies.
     */
    private selectByDimensions;
    /**
     * Tier 2: among cubes that can reach all others, select the most connected.
     * Returns null when no candidate can reach all others.
     */
    private selectByConnectivity;
    /**
     * Analyze the join path between two cubes with detailed step information
     *
     * Uses JoinPathResolver.findPath() for the actual path finding,
     * then converts the result to human-readable analysis format.
     */
    analyzeJoinPath(cubes: Map<string, Cube>, fromCube: string, toCube: string, query?: SemanticQuery): JoinPathAnalysis;
    private convertInternalPathToJoinPathSteps;
    private buildJoinPathSelectionAnalysis;
    private mapPreferredCandidate;
    /**
     * Generate warnings for query edge cases that users should be aware of.
     * Currently detects:
     * - FAN_OUT_NO_DIMENSIONS: Query has hasMany CTEs but no dimensions to group by
     *
     * Note: AVG measures in hasMany CTEs can produce mathematically imprecise results
     * (average of averages vs weighted average), but this warning was removed as it
     * fired too aggressively. The issue only occurs when the outer grouping is coarser
     * than the CTE grouping, which is rare in practice. The limitation is documented
     * in executor.ts comments.
     */
    generateWarnings(query: SemanticQuery, preAggregationCTEs?: PhysicalQueryPlan['preAggregationCTEs']): QueryWarning[];
    /**
     * Detect when a query has measures from multiple cubes with hasMany relationships
     * but no dimensions to provide grouping context.
     *
     * This is an edge case where:
     * - Query has measures from 2+ cubes
     * - At least one CTE exists (indicating hasMany relationship)
     * - Query has NO dimensions AND NO time dimensions with granularity
     *
     * The SQL is technically correct (CTEs with GROUP BY on join keys), but users
     * may be confused by the aggregated results without visible grouping.
     */
    private checkFanOutNoDimensions;
}

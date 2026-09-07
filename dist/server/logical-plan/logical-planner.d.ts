import { Cube, QueryContext, PhysicalQueryPlan, SemanticQuery, PrimaryCubeAnalysis, JoinPathAnalysis, QueryWarning } from '../types/index.js';
import { JoinRef } from './types.js';
export declare class LogicalPlanner {
    private readonly resolverCache;
    private readonly joinPlanner;
    private readonly ctePlanner;
    private readonly reporter;
    /**
     * Analyze a semantic query to determine which cubes are involved
     */
    analyzeCubeUsage(query: SemanticQuery): Set<string>;
    /**
     * Analyze primary cube selection with candidate details.
     * Exposed for LogicalPlanBuilder so dry-run/analyze can report
     * exactly which selection rule was used.
     */
    analyzePrimaryCube(cubeNames: string[], query: SemanticQuery, cubes: Map<string, Cube>): PrimaryCubeAnalysis;
    /**
     * Analyze join path for a specific target cube.
     * Exposed for LogicalPlanBuilder to provide join decision trace.
     */
    analyzeJoinPathForTarget(cubes: Map<string, Cube>, fromCube: string, toCube: string, query?: SemanticQuery): JoinPathAnalysis;
    /**
     * Build join plan for a known primary cube.
     * Exposed for LogicalPlanBuilder so logical planning can compose
     * planner phases directly.
     */
    buildJoinPlanForPrimary(cubes: Map<string, Cube>, primaryCube: Cube, cubeNames: string[], ctx: QueryContext, query: SemanticQuery): JoinRef[];
    /**
     * Build pre-aggregation CTE plan from a primary cube and join plan.
     * Exposed for LogicalPlanBuilder phase composition.
     */
    buildPreAggregationCTEs(cubes: Map<string, Cube>, primaryCube: Cube, joinCubes: JoinRef[], query: SemanticQuery, ctx: QueryContext): PhysicalQueryPlan['preAggregationCTEs'];
    /**
     * Generate query warnings from pre-aggregation analysis.
     * Exposed for LogicalPlanBuilder phase composition.
     */
    buildWarnings(query: SemanticQuery, preAggregationCTEs?: PhysicalQueryPlan['preAggregationCTEs']): QueryWarning[];
}

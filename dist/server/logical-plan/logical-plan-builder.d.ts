import { Cube, QueryContext } from '../types/index.js';
import { QueryAnalysis } from '../types/analysis.js';
import { SemanticQuery } from '../types/query.js';
import { LogicalPlanner } from './logical-planner.js';
import { QueryNode } from './types.js';
export interface LogicalPlanWithAnalysis {
    plan: QueryNode;
    analysis: QueryAnalysis;
}
export declare class LogicalPlanBuilder {
    private readonly queryPlanner;
    constructor(queryPlanner: LogicalPlanner);
    /**
     * Build a logical plan from a semantic query.
     */
    plan(cubes: Map<string, Cube>, query: SemanticQuery, ctx: QueryContext): QueryNode;
    /**
     * Build a logical plan and an explicit decision trace for dry-run/explain.
     * The analysis is produced from the same phase outputs used to build the plan.
     */
    planWithAnalysis(cubes: Map<string, Cube>, query: SemanticQuery, ctx: QueryContext): LogicalPlanWithAnalysis;
    private buildSourceFromPhases;
    private buildSimpleSourceFromPhases;
    /**
     * Detect and build multi-fact merge for star-schema style queries where:
     * - measures come from 2+ cubes
     * - all grouping dimensions/timeDimensions come from one shared dimension cube
     * - each measure cube directly belongsTo/hasOne that shared cube
     */
    private tryBuildMultiFactMergeSource;
    private hasDirectJoinToSharedDimension;
    private buildGroupQueryNode;
    private projectFiltersToAllowedCubes;
    private projectFilterNodeToAllowedCubes;
    private classifyMeasuresForStrategy;
    private selectMeasureStrategy;
    /**
     * Initial execution scope for keys deduplication:
     * - exactly one multiplied cube
     * - all query measures belong to that cube
     * - only additive measure types currently handled by the physical keys path
     * - no measure filters (HAVING) in the query
     */
    private isKeysDeduplicationExecutionSupported;
    private queryHasMeasureFilter;
    private buildKeysDeduplicationSource;
    private isDeduplicationSafeMeasure;
    private getPrimaryKeyColumns;
    private deduplicateColumnRefs;
    private buildQueryNode;
    private buildPreAggregationAnalysis;
    private buildOrderByRefs;
}

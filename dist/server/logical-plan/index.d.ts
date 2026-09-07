/**
 * Logical Plan module — multi-stage query pipeline.
 *
 * Exports:
 * - Types: LogicalNode tree types
 * - LogicalPlanBuilder: SemanticQuery → LogicalNode tree
 * - Optimisers: PlanOptimiser interface and built-in passes
 */
export type { LogicalNode, LogicalNodeType, LogicalNodeBase, QueryNode, SimpleSource, FullKeyAggregate, CTEPreAggregate, KeysDeduplication, MultiFactMerge, CubeRef, MeasureRef, DimensionRef, TimeDimensionRef, ColumnRef, OrderByRef, JoinRef, LogicalSchema } from './types.js';
export { LogicalPlanner } from './logical-planner.js';
export { LogicalPlanBuilder } from './logical-plan-builder.js';
export type { LogicalPlanWithAnalysis } from './logical-plan-builder.js';
export { JoinPlanner } from './join-planner.js';
export { CTEPlanner } from './cte-planner.js';
export { FilterPropagation } from './filter-propagation.js';
export { PlanAnalysisReporter } from './plan-analysis-reporter.js';
export { ResolverCache, analyzeCubeUsage, extractCubeNamesFromFilter } from './planner-utils.js';
export type { PlanOptimiser, OptimiserContext, OptimiserEngineType } from './optimiser.js';
export { IdentityOptimiser, OptimiserPipeline } from './optimiser.js';

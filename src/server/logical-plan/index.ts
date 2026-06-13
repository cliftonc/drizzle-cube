/**
 * Logical Plan module — multi-stage query pipeline.
 *
 * Exports:
 * - Types: LogicalNode tree types
 * - LogicalPlanBuilder: SemanticQuery → LogicalNode tree
 * - Optimisers: PlanOptimiser interface and built-in passes
 */

// Types
export type {
  // Node types
  LogicalNode,
  LogicalNodeType,
  LogicalNodeBase,
  QueryNode,
  SimpleSource,
  FullKeyAggregate,
  CTEPreAggregate,
  KeysDeduplication,
  MultiFactMerge,
  // Reference types
  CubeRef,
  MeasureRef,
  DimensionRef,
  TimeDimensionRef,
  ColumnRef,
  OrderByRef,
  JoinRef,
  LogicalSchema
} from './types'

// Builders
export { LogicalPlanner } from './logical-planner'
export { LogicalPlanBuilder } from './logical-plan-builder'
export type { LogicalPlanWithAnalysis } from './logical-plan-builder'

// Planning phases (composed by LogicalPlanner)
export { JoinPlanner } from './join-planner'
export { CTEPlanner } from './cte-planner'
export { FilterPropagation } from './filter-propagation'
export { PlanAnalysisReporter } from './plan-analysis-reporter'
export { ResolverCache, analyzeCubeUsage, extractCubeNamesFromFilter } from './planner-utils'

// Optimisers
export type { PlanOptimiser, OptimiserContext, OptimiserEngineType } from './optimiser'
export { IdentityOptimiser, OptimiserPipeline } from './optimiser'

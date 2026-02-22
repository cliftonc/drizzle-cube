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

// Optimisers
export type { PlanOptimiser, OptimiserContext } from './optimiser'
export { IdentityOptimiser, OptimiserPipeline } from './optimiser'

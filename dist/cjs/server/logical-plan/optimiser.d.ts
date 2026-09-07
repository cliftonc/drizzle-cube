import { LogicalNode } from './types.js';
/** Database engine the optimiser is targeting (all 7 supported engines). */
export type OptimiserEngineType = 'postgres' | 'mysql' | 'sqlite' | 'singlestore' | 'duckdb' | 'databend' | 'snowflake';
/** Context available to optimiser passes */
export interface OptimiserContext {
    /** Database engine type for engine-specific rewrites */
    engineType: OptimiserEngineType;
}
/** A single optimiser pass that rewrites a logical plan */
export interface PlanOptimiser {
    /** Human-readable name for debugging / explain output */
    readonly name: string;
    /** Rewrite the plan tree. Must return a valid plan (may return the same reference). */
    optimise(plan: LogicalNode, context: OptimiserContext): LogicalNode;
}
/**
 * No-op optimiser — returns the plan unchanged.
 * Used as the default in Phase 1 and as a baseline for testing.
 */
export declare class IdentityOptimiser implements PlanOptimiser {
    readonly name = "identity";
    optimise(plan: LogicalNode): LogicalNode;
}
/**
 * Runs a sequence of optimiser passes in order.
 * Short-circuits if a pass returns a different reference (for future use).
 */
export declare class OptimiserPipeline implements PlanOptimiser {
    readonly name = "pipeline";
    private passes;
    constructor(passes?: PlanOptimiser[]);
    optimise(plan: LogicalNode, context: OptimiserContext): LogicalNode;
    addPass(pass: PlanOptimiser): void;
}

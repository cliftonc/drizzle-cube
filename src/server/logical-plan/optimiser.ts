/**
 * Plan optimiser interface and built-in passes.
 *
 * Optimisers rewrite a LogicalNode tree to improve execution.
 * Phase 1 ships only the IdentityOptimiser (no-op pass-through).
 * Future passes: pre-aggregation matching, plan simplification, etc.
 */

import type { LogicalNode } from './types'

/** Context available to optimiser passes */
export interface OptimiserContext {
  /** Database engine type for engine-specific rewrites */
  engineType: 'postgres' | 'mysql' | 'sqlite' | 'duckdb'
}

/** A single optimiser pass that rewrites a logical plan */
export interface PlanOptimiser {
  /** Human-readable name for debugging / explain output */
  readonly name: string
  /** Rewrite the plan tree. Must return a valid plan (may return the same reference). */
  optimise(plan: LogicalNode, context: OptimiserContext): LogicalNode
}

/**
 * No-op optimiser — returns the plan unchanged.
 * Used as the default in Phase 1 and as a baseline for testing.
 */
export class IdentityOptimiser implements PlanOptimiser {
  readonly name = 'identity'

  optimise(plan: LogicalNode): LogicalNode {
    return plan
  }
}

/**
 * Runs a sequence of optimiser passes in order.
 * Short-circuits if a pass returns a different reference (for future use).
 */
export class OptimiserPipeline implements PlanOptimiser {
  readonly name = 'pipeline'
  private passes: PlanOptimiser[]

  constructor(passes: PlanOptimiser[] = []) {
    this.passes = passes
  }

  optimise(plan: LogicalNode, context: OptimiserContext): LogicalNode {
    let current = plan
    for (const pass of this.passes) {
      current = pass.optimise(current, context)
    }
    return current
  }

  addPass(pass: PlanOptimiser): void {
    this.passes.push(pass)
  }
}

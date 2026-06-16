/**
 * Query Planner for Unified Query Architecture
 *
 * LogicalPlanner is a thin facade over four single-responsibility planning
 * phases. It owns the shared per-cubes resolver cache and delegates each phase:
 *
 *   - JoinPlanner            — join-plan construction
 *   - CTEPlanner             — pre-aggregation CTE decisions (fan-out prevention)
 *   - FilterPropagation      — filter propagation into CTEs (used by CTEPlanner)
 *   - PlanAnalysisReporter   — dry-run/EXPLAIN trace + query warnings
 *
 * All SQL building lives in DrizzleSqlBuilder; the planning phases produce plan
 * data structures only.
 */

import type {
  Cube,
  QueryContext,
  PhysicalQueryPlan,
  SemanticQuery,
  PrimaryCubeAnalysis,
  JoinPathAnalysis,
  QueryWarning
} from '../types/index.js'

import { ResolverCache, analyzeCubeUsage } from './planner-utils.js'
import { JoinPlanner } from './join-planner.js'
import { CTEPlanner } from './cte-planner.js'
import { FilterPropagation } from './filter-propagation.js'
import { PlanAnalysisReporter } from './plan-analysis-reporter.js'
import type { JoinRef } from './types.js'

export class LogicalPlanner {
  // Shared resolver cache, reused across all planning phases for a cubes map.
  private readonly resolverCache = new ResolverCache()

  private readonly joinPlanner = new JoinPlanner(this.resolverCache)
  private readonly ctePlanner = new CTEPlanner(this.resolverCache, new FilterPropagation())
  private readonly reporter = new PlanAnalysisReporter(this.resolverCache)

  /**
   * Analyze a semantic query to determine which cubes are involved
   */
  analyzeCubeUsage(query: SemanticQuery): Set<string> {
    return analyzeCubeUsage(query)
  }

  /**
   * Analyze primary cube selection with candidate details.
   * Exposed for LogicalPlanBuilder so dry-run/analyze can report
   * exactly which selection rule was used.
   */
  analyzePrimaryCube(
    cubeNames: string[],
    query: SemanticQuery,
    cubes: Map<string, Cube>
  ): PrimaryCubeAnalysis {
    return this.reporter.analyzePrimaryCubeSelection(cubeNames, query, cubes)
  }

  /**
   * Analyze join path for a specific target cube.
   * Exposed for LogicalPlanBuilder to provide join decision trace.
   */
  analyzeJoinPathForTarget(
    cubes: Map<string, Cube>,
    fromCube: string,
    toCube: string,
    query?: SemanticQuery
  ): JoinPathAnalysis {
    return this.reporter.analyzeJoinPath(cubes, fromCube, toCube, query)
  }

  /**
   * Build join plan for a known primary cube.
   * Exposed for LogicalPlanBuilder so logical planning can compose
   * planner phases directly.
   */
  buildJoinPlanForPrimary(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    cubeNames: string[],
    ctx: QueryContext,
    query: SemanticQuery
  ): JoinRef[] {
    return this.joinPlanner.buildJoinPlan(cubes, primaryCube, cubeNames, ctx, query)
  }

  /**
   * Build pre-aggregation CTE plan from a primary cube and join plan.
   * Exposed for LogicalPlanBuilder phase composition.
   */
  buildPreAggregationCTEs(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    joinCubes: JoinRef[],
    query: SemanticQuery,
    ctx: QueryContext
  ): PhysicalQueryPlan['preAggregationCTEs'] {
    return this.ctePlanner.planPreAggregationCTEs(cubes, primaryCube, joinCubes, query, ctx)
  }

  /**
   * Generate query warnings from pre-aggregation analysis.
   * Exposed for LogicalPlanBuilder phase composition.
   */
  buildWarnings(
    query: SemanticQuery,
    preAggregationCTEs?: PhysicalQueryPlan['preAggregationCTEs']
  ): QueryWarning[] {
    return this.reporter.generateWarnings(query, preAggregationCTEs)
  }
}

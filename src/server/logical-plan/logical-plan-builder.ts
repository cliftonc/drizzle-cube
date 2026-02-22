/**
 * Logical Plan Builder
 *
 * Converts a SemanticQuery into a LogicalNode tree by composing
 * planner phases directly:
 *   1) cube usage analysis
 *   2) primary cube selection
 *   3) join planning
 *   4) CTE pre-aggregation planning
 *   5) warning generation
 *
 * This avoids legacy flat-plan wrappers and establishes the
 * logical plan as the primary planning representation.
 */

import type { Cube, QueryContext, PhysicalQueryPlan, QueryWarning } from '../types'
import type { QueryAnalysis, PreAggregationAnalysis } from '../types/analysis'
import type { SemanticQuery } from '../types/query'
import type { LogicalPlanner } from './logical-planner'
import { MeasureBuilder } from '../builders/measure-builder'
import type {
  QueryNode,
  SimpleSource,
  CTEPreAggregate,
  MeasureRef,
  DimensionRef,
  TimeDimensionRef,
  OrderByRef,
  CubeRef,
  JoinRef,
  LogicalSchema
} from './types'

export interface LogicalPlanWithAnalysis {
  plan: QueryNode
  analysis: QueryAnalysis
}

export class LogicalPlanBuilder {
  constructor(private readonly queryPlanner: LogicalPlanner) {}

  /**
   * Build a logical plan from a semantic query.
   */
  plan(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    ctx: QueryContext
  ): QueryNode {
    return this.planWithAnalysis(cubes, query, ctx).plan
  }

  /**
   * Build a logical plan and an explicit decision trace for dry-run/explain.
   * The analysis is produced from the same phase outputs used to build the plan.
   */
  planWithAnalysis(
    cubes: Map<string, Cube>,
    query: SemanticQuery,
    ctx: QueryContext
  ): LogicalPlanWithAnalysis {
    const cubeNames = Array.from(this.queryPlanner.analyzeCubeUsage(query))
    if (cubeNames.length === 0) {
      throw new Error('No cubes found in query')
    }

    const primaryCubeSelection = this.queryPlanner.analyzePrimaryCube(cubeNames, query, cubes)
    const primaryCubeName = primaryCubeSelection.selectedCube
    const primaryCube = cubes.get(primaryCubeName)
    if (!primaryCube) {
      throw new Error(`Primary cube '${primaryCubeName}' not found`)
    }

    const cubesToJoin = cubeNames.filter(name => name !== primaryCubeName)
    const joinPaths = cubesToJoin.map(targetCube =>
      this.queryPlanner.analyzeJoinPathForTarget(cubes, primaryCubeName, targetCube)
    )

    const joinCubes =
      cubeNames.length > 1
        ? this.queryPlanner.buildJoinPlanForPrimary(cubes, primaryCube, cubeNames, ctx, query)
        : []

    const preAggregationCTEs: NonNullable<PhysicalQueryPlan['preAggregationCTEs']> =
      cubeNames.length > 1
        ? (this.queryPlanner.buildPreAggregationCTEs(cubes, primaryCube, joinCubes, query, ctx) ?? [])
        : []

    const warnings = this.queryPlanner.buildWarnings(query, preAggregationCTEs)

    const source = this.buildSourceFromPhases(
      primaryCube,
      joinCubes,
      preAggregationCTEs,
      cubes,
      query
    )

    const plan = this.buildQueryNode(source, query, cubes, warnings)
    const preAggregations = this.buildPreAggregationAnalysis(preAggregationCTEs)

    const cubesInQuery = new Map<string, Cube>()
    for (const name of cubeNames) {
      const cube = cubes.get(name)
      if (cube) {
        cubesInQuery.set(name, cube)
      }
    }

    const hasWindowFunctions = MeasureBuilder.hasPostAggregationWindows(
      query.measures ?? [],
      cubesInQuery
    )

    const analysisWarnings = [
      ...joinPaths.filter(path => !path.pathFound && path.error).map(path => path.error!),
      ...warnings.map(warning => warning.message)
    ]

    const analysis: QueryAnalysis = {
      timestamp: new Date().toISOString(),
      cubeCount: cubeNames.length,
      cubesInvolved: [...cubeNames].sort(),
      primaryCube: primaryCubeSelection,
      joinPaths,
      preAggregations,
      querySummary: {
        queryType:
          preAggregationCTEs.length > 0
            ? 'multi_cube_cte'
            : cubeNames.length > 1
              ? 'multi_cube_join'
              : 'single_cube',
        joinCount: joinCubes.length,
        cteCount: preAggregationCTEs.length,
        hasPreAggregation: preAggregationCTEs.length > 0,
        hasWindowFunctions
      },
      warnings: analysisWarnings.length > 0 ? analysisWarnings : undefined,
      planningTrace: {
        steps: [
          {
            phase: 'cube_usage',
            decision: `Identified ${cubeNames.length} cube${cubeNames.length === 1 ? '' : 's'} from query members`,
            details: { cubesInvolved: [...cubeNames].sort() }
          },
          {
            phase: 'primary_cube_selection',
            decision: `Selected '${primaryCubeSelection.selectedCube}' as primary cube (${primaryCubeSelection.reason})`,
            details: {
              selectedCube: primaryCubeSelection.selectedCube,
              reason: primaryCubeSelection.reason,
              candidates: primaryCubeSelection.candidates?.map(candidate => candidate.cubeName)
            }
          },
          {
            phase: 'join_planning',
            decision: `Planned ${joinCubes.length} join${joinCubes.length === 1 ? '' : 's'}`,
            details: {
              joinCount: joinCubes.length,
              joinTargets: joinCubes.map(join => join.cube.name)
            }
          },
          {
            phase: 'cte_planning',
            decision: `Planned ${preAggregationCTEs.length} pre-aggregation CTE${preAggregationCTEs.length === 1 ? '' : 's'}`,
            details: {
              cteCount: preAggregationCTEs.length,
              cubes: preAggregationCTEs.map(cte => cte.cube.name)
            }
          },
          {
            phase: 'warnings',
            decision: warnings.length > 0
              ? `Generated ${warnings.length} planning warning${warnings.length === 1 ? '' : 's'}`
              : 'No planning warnings generated',
            details: {
              warningCodes: warnings.map(warning => warning.code)
            }
          }
        ]
      }
    }

    return { plan, analysis }
  }

  // ---------------------------------------------------------------------------
  // Source node construction
  // ---------------------------------------------------------------------------

  private buildSourceFromPhases(
    primaryCube: Cube,
    joinCubes: PhysicalQueryPlan['joinCubes'],
    preAggregationCTEs: NonNullable<PhysicalQueryPlan['preAggregationCTEs']>,
    cubes: Map<string, Cube>,
    query: SemanticQuery
  ): SimpleSource {
    const measures = this.buildMeasureRefs(query, cubes)
    const dimensions = this.buildDimensionRefs(query, cubes)
    const timeDimensions = this.buildTimeDimensionRefs(query, cubes)

    const primaryCubeRef = this.toCubeRef(primaryCube)

    // Convert join cubes to JoinRefs
    const joins: JoinRef[] = joinCubes.map(jc => ({
      target: this.toCubeRef(jc.cube),
      alias: jc.alias,
      joinType: jc.joinType,
      joinCondition: jc.joinCondition,
      junctionTable: jc.junctionTable
    }))

    // Convert pre-aggregation CTEs
    const ctes: CTEPreAggregate[] = preAggregationCTEs.map(cteInfo => {
      const cubeRef = this.toCubeRef(cteInfo.cube)
      return {
        type: 'ctePreAggregate' as const,
        schema: this.buildCTESchema(cteInfo, cubes),
        cube: cubeRef,
        alias: cteInfo.alias,
        cteAlias: cteInfo.cteAlias,
        joinKeys: cteInfo.joinKeys,
        measures: cteInfo.measures,
        propagatingFilters: cteInfo.propagatingFilters,
        downstreamJoinKeys: cteInfo.downstreamJoinKeys,
        intermediateJoins: cteInfo.intermediateJoins,
        cteType: cteInfo.cteType ?? 'aggregate',
        cteReason: cteInfo.cteReason ?? 'hasMany'
      }
    })

    // Build source schema
    const schema: LogicalSchema = { measures, dimensions, timeDimensions }

    return {
      type: 'simpleSource',
      schema,
      primaryCube: primaryCubeRef,
      joins,
      ctes
    }
  }

  private buildQueryNode(
    source: SimpleSource,
    query: SemanticQuery,
    cubes: Map<string, Cube>,
    warnings: QueryWarning[]
  ): QueryNode {
    const measures = this.buildMeasureRefs(query, cubes)
    const dimensions = this.buildDimensionRefs(query, cubes)
    const timeDimensions = this.buildTimeDimensionRefs(query, cubes)
    const orderBy = this.buildOrderByRefs(query)
    const filters = query.filters ?? []

    const schema: LogicalSchema = {
      measures,
      dimensions,
      timeDimensions
    }

    return {
      type: 'query',
      schema,
      source,
      dimensions,
      measures,
      filters,
      timeDimensions,
      orderBy,
      limit: query.limit,
      offset: query.offset,
      warnings
    }
  }

  private buildPreAggregationAnalysis(
    preAggregationCTEs: NonNullable<PhysicalQueryPlan['preAggregationCTEs']>
  ): PreAggregationAnalysis[] {
    return preAggregationCTEs.map(cte => ({
      cubeName: cte.cube.name,
      cteAlias: cte.cteAlias,
      reason:
        cte.cteReason === 'fanOutPrevention'
          ? `Potential fan-out from hasMany joins - pre-aggregate ${cte.cube.name} to preserve correctness`
          : `hasMany relationship requires pre-aggregation for ${cte.cube.name}`,
      reasonType: cte.cteReason,
      measures: cte.measures,
      joinKeys: cte.joinKeys.map(joinKey => ({
        sourceColumn: joinKey.sourceColumn,
        targetColumn: joinKey.targetColumn
      })),
      cteType: cte.cteType
    }))
  }

  // ---------------------------------------------------------------------------
  // Reference builders
  // ---------------------------------------------------------------------------

  private buildMeasureRefs(query: SemanticQuery, cubes: Map<string, Cube>): MeasureRef[] {
    if (!query.measures) return []

    return query.measures.map(name => {
      const [cubeName, localName] = name.split('.')
      const cube = cubes.get(cubeName)
      if (!cube) throw new Error(`Cube '${cubeName}' not found for measure '${name}'`)
      return {
        name,
        cube: this.toCubeRef(cube),
        localName
      }
    })
  }

  private buildDimensionRefs(query: SemanticQuery, cubes: Map<string, Cube>): DimensionRef[] {
    if (!query.dimensions) return []

    return query.dimensions.map(name => {
      const [cubeName, localName] = name.split('.')
      const cube = cubes.get(cubeName)
      if (!cube) throw new Error(`Cube '${cubeName}' not found for dimension '${name}'`)
      return {
        name,
        cube: this.toCubeRef(cube),
        localName
      }
    })
  }

  private buildTimeDimensionRefs(query: SemanticQuery, cubes: Map<string, Cube>): TimeDimensionRef[] {
    if (!query.timeDimensions) return []

    return query.timeDimensions.map(td => {
      const [cubeName, localName] = td.dimension.split('.')
      const cube = cubes.get(cubeName)
      if (!cube) throw new Error(`Cube '${cubeName}' not found for time dimension '${td.dimension}'`)
      return {
        name: td.dimension,
        cube: this.toCubeRef(cube),
        localName,
        granularity: td.granularity,
        dateRange: td.dateRange,
        fillMissingDates: td.fillMissingDates,
        compareDateRange: td.compareDateRange
      }
    })
  }

  private buildOrderByRefs(query: SemanticQuery): OrderByRef[] {
    if (!query.order) return []

    return Object.entries(query.order).map(([name, direction]) => ({
      name,
      direction
    }))
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private toCubeRef(cube: Cube): CubeRef {
    return { name: cube.name, cube }
  }

  private buildCTESchema(
    cteInfo: NonNullable<PhysicalQueryPlan['preAggregationCTEs']>[number],
    cubes: Map<string, Cube>
  ): LogicalSchema {
    const measures: MeasureRef[] = cteInfo.measures.map(name => {
      const [cubeName, localName] = name.split('.')
      const cube = cubes.get(cubeName)
      return {
        name,
        cube: { name: cubeName, cube: cube! },
        localName
      }
    })

    return {
      measures,
      dimensions: [],
      timeDimensions: []
    }
  }
}

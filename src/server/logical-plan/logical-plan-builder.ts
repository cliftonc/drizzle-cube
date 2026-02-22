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

import type { Cube, QueryContext, PhysicalQueryPlan, QueryWarning, Measure } from '../types'
import type { QueryAnalysis, PreAggregationAnalysis } from '../types/analysis'
import type { SemanticQuery } from '../types/query'
import type { LogicalPlanner } from './logical-planner'
import { MeasureBuilder } from '../builders/measure-builder'
import type {
  LogicalNode,
  QueryNode,
  SimpleSource,
  CTEPreAggregate,
  KeysDeduplication,
  MeasureRef,
  DimensionRef,
  TimeDimensionRef,
  OrderByRef,
  CubeRef,
  JoinRef,
  LogicalSchema,
  ColumnRef
} from './types'

export interface LogicalPlanWithAnalysis {
  plan: QueryNode
  analysis: QueryAnalysis
}

type MeasureStrategy = 'simple' | 'keysDeduplication' | 'ctePreAggregateFallback'

interface MeasureClassification {
  regular: MeasureRef[]
  multiplied: MeasureRef[]
  deduplicationSafe: MeasureRef[]
}

interface SourceBuildResult {
  source: LogicalNode
  strategy: MeasureStrategy
  classification: MeasureClassification
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

    const sourceBuild = this.buildSourceFromPhases(
      primaryCube,
      joinCubes,
      preAggregationCTEs,
      cubes,
      query
    )
    const source = sourceBuild.source

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
        measureStrategy: sourceBuild.strategy,
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
            phase: 'measure_strategy',
            decision: `Selected '${sourceBuild.strategy}' measure strategy`,
            details: {
              strategy: sourceBuild.strategy,
              regularMeasures: sourceBuild.classification.regular.map(measure => measure.name),
              multipliedMeasures: sourceBuild.classification.multiplied.map(measure => measure.name),
              deduplicationSafeMeasures: sourceBuild.classification.deduplicationSafe.map(measure => measure.name),
              sourceType: source.type
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
  ): SourceBuildResult {
    const simpleSource = this.buildSimpleSourceFromPhases(
      primaryCube,
      joinCubes,
      preAggregationCTEs,
      cubes,
      query
    )

    const classification = this.classifyMeasuresForStrategy(
      simpleSource.schema.measures,
      preAggregationCTEs
    )
    const strategy = this.selectMeasureStrategy(classification, query, cubes)

    if (strategy === 'keysDeduplication') {
      return {
        source: this.buildKeysDeduplicationSource(simpleSource, classification),
        strategy,
        classification
      }
    }

    return {
      source: simpleSource,
      strategy,
      classification
    }
  }

  private buildSimpleSourceFromPhases(
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

  private classifyMeasuresForStrategy(
    measures: MeasureRef[],
    preAggregationCTEs: NonNullable<PhysicalQueryPlan['preAggregationCTEs']>
  ): MeasureClassification {
    const classification: MeasureClassification = {
      regular: [],
      multiplied: [],
      deduplicationSafe: []
    }

    const multipliedCubes = new Set(
      preAggregationCTEs
        .filter(cte => cte.cteReason === 'fanOutPrevention')
        .map(cte => cte.cube.name)
    )

    for (const measureRef of measures) {
      const cube = measureRef.cube.cube
      const measure = cube.measures?.[measureRef.localName]

      if (!measure || !multipliedCubes.has(cube.name)) {
        classification.regular.push(measureRef)
        continue
      }

      if (this.isDeduplicationSafeMeasure(measure)) {
        classification.deduplicationSafe.push(measureRef)
      } else {
        classification.multiplied.push(measureRef)
      }
    }

    return classification
  }

  private selectMeasureStrategy(
    classification: MeasureClassification,
    query: SemanticQuery,
    cubes: Map<string, Cube>
  ): MeasureStrategy {
    if (classification.multiplied.length === 0) {
      return 'simple'
    }

    const hasPrimaryKeysForAllMultiplied = classification.multiplied.every(
      measure => this.getPrimaryKeyColumns(measure.cube.cube).length > 0
    )

    if (
      hasPrimaryKeysForAllMultiplied &&
      this.isKeysDeduplicationExecutionSupported(classification, query, cubes)
    ) {
      return 'keysDeduplication'
    }

    return 'ctePreAggregateFallback'
  }

  /**
   * Initial execution scope for keys deduplication:
   * - exactly one multiplied cube
   * - all query measures belong to that cube
   * - only additive measure types currently handled by the physical keys path
   * - no measure filters (HAVING) in the query
   */
  private isKeysDeduplicationExecutionSupported(
    classification: MeasureClassification,
    query: SemanticQuery,
    cubes: Map<string, Cube>
  ): boolean {
    const multipliedCubeNames = new Set(
      classification.multiplied.map(measure => measure.cube.name)
    )

    if (multipliedCubeNames.size !== 1) {
      return false
    }

    const multipliedCubeName = Array.from(multipliedCubeNames)[0]
    const queryMeasures = query.measures ?? []
    if (queryMeasures.length === 0) {
      return false
    }

    // For the first execution slice we only support measure sets fully sourced
    // from the multiplied cube.
    if (!queryMeasures.every(measure => measure.startsWith(`${multipliedCubeName}.`))) {
      return false
    }

    const multipliedCube = cubes.get(multipliedCubeName)
    if (!multipliedCube) {
      return false
    }

    for (const measureName of queryMeasures) {
      const [, localName] = measureName.split('.')
      const measure = multipliedCube.measures?.[localName]
      if (!measure) {
        return false
      }

      // Support additive base types only in this first pass.
      if (!['sum', 'count', 'number'].includes(measure.type)) {
        return false
      }
    }

    if (this.queryHasMeasureFilter(query, multipliedCubeName, multipliedCube)) {
      return false
    }

    return true
  }

  private queryHasMeasureFilter(
    query: SemanticQuery,
    cubeName: string,
    cube: Cube
  ): boolean {
    const hasMeasureMember = (member: string): boolean => {
      const [memberCube, localName] = member.split('.')
      return memberCube === cubeName && Boolean(cube.measures?.[localName])
    }

    const walk = (filters?: SemanticQuery['filters']): boolean => {
      if (!filters) return false
      for (const filter of filters) {
        if ('and' in filter) {
          if (walk(filter.and)) return true
          continue
        }
        if ('or' in filter) {
          if (walk(filter.or)) return true
          continue
        }
        if ('member' in filter && hasMeasureMember(filter.member)) {
          return true
        }
      }
      return false
    }

    return walk(query.filters)
  }

  private buildKeysDeduplicationSource(
    simpleSource: SimpleSource,
    classification: MeasureClassification
  ): KeysDeduplication {
    const joinOn = this.deduplicateColumnRefs(
      classification.multiplied.flatMap(measure =>
        this.getPrimaryKeyColumns(measure.cube.cube)
      )
    )

    return {
      type: 'keysDeduplication',
      schema: simpleSource.schema,
      keysSource: simpleSource,
      measureSource: simpleSource,
      joinOn
    }
  }

  private isDeduplicationSafeMeasure(measure: Measure): boolean {
    return measure.type === 'countDistinct' || measure.type === 'countDistinctApprox'
  }

  private getPrimaryKeyColumns(cube: Cube): ColumnRef[] {
    const result: ColumnRef[] = []

    for (const [dimensionName, dimension] of Object.entries(cube.dimensions ?? {})) {
      if (!dimension.primaryKey || typeof dimension.sql === 'function') {
        continue
      }

      result.push({
        column: dimension.sql as any,
        alias: `${cube.name}.${dimensionName}`
      })
    }

    return result
  }

  private deduplicateColumnRefs(columns: ColumnRef[]): ColumnRef[] {
    const deduplicated = new Map<string, ColumnRef>()
    for (const column of columns) {
      const key = column.alias ?? String((column.column as any)?.name ?? '')
      if (!deduplicated.has(key)) {
        deduplicated.set(key, column)
      }
    }
    return Array.from(deduplicated.values())
  }

  private buildQueryNode(
    source: LogicalNode,
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

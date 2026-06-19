/**
 * Schema derivation — pure functions that turn a SemanticQuery (or a
 * pre-aggregation CTE descriptor) plus the resolved cube registry into a
 * LogicalSchema (measures, dimensions, time dimensions).
 *
 * Extracted from LogicalPlanBuilder so schema correctness is verifiable in
 * isolation, with no LogicalPlanner / QueryContext setup. Mirrors the repo's
 * other pure derivation modules (cte-planner-helpers, compiler-metadata,
 * measure-classification).
 */
import type { Cube, PhysicalQueryPlan } from '../types/index.js'
import type { SemanticQuery } from '../types/query.js'
import { t } from '../../i18n/runtime.js'
import type {
  CubeRef,
  MeasureRef,
  DimensionRef,
  TimeDimensionRef,
  LogicalSchema
} from './types.js'

export function toCubeRef(cube: Cube): CubeRef {
  return { name: cube.name, cube }
}

export function buildMeasureRefs(query: SemanticQuery, cubes: Map<string, Cube>): MeasureRef[] {
  if (!query.measures) return []

  return query.measures.map(name => {
    const [cubeName, localName] = name.split('.')
    const cube = cubes.get(cubeName)
    if (!cube) throw new Error(t('server.errors.cubeNotFoundForMeasure', { cubeName, measure: name }))
    return {
      name,
      cube: toCubeRef(cube),
      localName
    }
  })
}

export function buildDimensionRefs(query: SemanticQuery, cubes: Map<string, Cube>): DimensionRef[] {
  if (!query.dimensions) return []

  return query.dimensions.map(name => {
    const [cubeName, localName] = name.split('.')
    const cube = cubes.get(cubeName)
    if (!cube) throw new Error(t('server.errors.cubeNotFoundForDimension', { cubeName, dimension: name }))
    return {
      name,
      cube: toCubeRef(cube),
      localName
    }
  })
}

export function buildTimeDimensionRefs(query: SemanticQuery, cubes: Map<string, Cube>): TimeDimensionRef[] {
  if (!query.timeDimensions) return []

  return query.timeDimensions.map(td => {
    const [cubeName, localName] = td.dimension.split('.')
    const cube = cubes.get(cubeName)
    if (!cube) throw new Error(t('server.errors.cubeNotFoundForTimeDimension', { cubeName, timeDimension: td.dimension }))
    return {
      name: td.dimension,
      cube: toCubeRef(cube),
      localName,
      granularity: td.granularity,
      dateRange: td.dateRange,
      fillMissingDates: td.fillMissingDates,
      compareDateRange: td.compareDateRange
    }
  })
}

/**
 * Compose the full logical schema (measures, dimensions, time dimensions) for a
 * query. This is the primary public interface: `(query, cubes) => LogicalSchema`.
 */
export function buildLogicalSchema(query: SemanticQuery, cubes: Map<string, Cube>): LogicalSchema {
  return {
    measures: buildMeasureRefs(query, cubes),
    dimensions: buildDimensionRefs(query, cubes),
    timeDimensions: buildTimeDimensionRefs(query, cubes)
  }
}

/**
 * Derive the measures-only schema for a pre-aggregation CTE. Unlike the
 * query-driven builders above, this intentionally does NOT throw on a missing
 * cube (the cube is guaranteed present by the planner that produced the CTE
 * descriptor) — preserving exact prior behavior keeps generated SQL unchanged.
 */
export function buildCTESchema(
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

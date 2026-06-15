/**
 * AnnotationBuilder — builds the UI annotation metadata (measures, dimensions,
 * timeDimensions) for a query result from the physical plan and the query.
 *
 * Pure: depends only on its arguments. Extracted from QueryExecutor.
 */

import type {
  PhysicalQueryPlan,
  SemanticQuery,
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation
} from '../types'

/**
 * Generate annotations for UI metadata - unified approach.
 * Collects measure/dimension/timeDimension titles from every cube in the plan
 * (primary + joins + multi-fact merge groups).
 */
export function buildAnnotations(
  queryPlan: PhysicalQueryPlan,
  query: SemanticQuery
): {
  measures: Record<string, MeasureAnnotation>
  dimensions: Record<string, DimensionAnnotation>
  segments: Record<string, never>
  timeDimensions: Record<string, TimeDimensionAnnotation>
} {
  // Get all cubes involved (primary + join cubes + multi-fact merge groups)
  const allCubes = collectPlanCubes(queryPlan)

  return {
    measures: buildMeasureAnnotations(query, allCubes),
    dimensions: buildDimensionAnnotations(query, allCubes),
    segments: {},
    timeDimensions: buildTimeDimensionAnnotations(query, allCubes)
  }
}

/** Collect every cube referenced by the plan (primary + joins + merge groups). */
function collectPlanCubes(queryPlan: PhysicalQueryPlan): any[] {
  const allCubes = [queryPlan.primaryCube].filter(Boolean)
  if (queryPlan.joinCubes && queryPlan.joinCubes.length > 0) {
    allCubes.push(...queryPlan.joinCubes.map((jc: any) => jc.cube).filter(Boolean))
  }
  if (queryPlan.multiFactMerge?.groups?.length) {
    for (const group of queryPlan.multiFactMerge.groups) {
      if (group.queryPlan.primaryCube) {
        allCubes.push(group.queryPlan.primaryCube)
      }
      if (group.queryPlan.joinCubes?.length) {
        allCubes.push(...group.queryPlan.joinCubes.map((jc: any) => jc.cube).filter(Boolean))
      }
    }
  }
  return allCubes
}

/** Find the field's cube and dimension definition across the involved cubes. */
function findDimension(allCubes: any[], cubeName: string, fieldName: string): any | undefined {
  const cube = allCubes.find(c => c?.name === cubeName)
  return cube?.dimensions?.[fieldName]
}

function buildMeasureAnnotations(
  query: SemanticQuery,
  allCubes: any[]
): Record<string, MeasureAnnotation> {
  const measures: Record<string, MeasureAnnotation> = {}
  if (!query.measures) return measures

  for (const measureName of query.measures) {
    const [cubeName, fieldName] = measureName.split('.')
    const cube = allCubes.find(c => c?.name === cubeName)
    const measure = cube?.measures?.[fieldName]
    if (measure) {
      measures[measureName] = {
        title: measure.title || fieldName,
        shortTitle: measure.title || fieldName,
        type: measure.type
      }
    }
  }
  return measures
}

function buildDimensionAnnotations(
  query: SemanticQuery,
  allCubes: any[]
): Record<string, DimensionAnnotation> {
  const dimensions: Record<string, DimensionAnnotation> = {}
  if (!query.dimensions) return dimensions

  for (const dimensionName of query.dimensions) {
    const [cubeName, fieldName] = dimensionName.split('.')
    const dimension = findDimension(allCubes, cubeName, fieldName)
    if (dimension) {
      dimensions[dimensionName] = {
        title: dimension.title || fieldName,
        shortTitle: dimension.title || fieldName,
        type: dimension.type
      }
    }
  }
  return dimensions
}

function buildTimeDimensionAnnotations(
  query: SemanticQuery,
  allCubes: any[]
): Record<string, TimeDimensionAnnotation> {
  const timeDimensions: Record<string, TimeDimensionAnnotation> = {}
  if (!query.timeDimensions) return timeDimensions

  for (const timeDim of query.timeDimensions) {
    const [cubeName, fieldName] = timeDim.dimension.split('.')
    const dimension = findDimension(allCubes, cubeName, fieldName)
    if (dimension) {
      timeDimensions[timeDim.dimension] = {
        title: dimension.title || fieldName,
        shortTitle: dimension.title || fieldName,
        type: dimension.type,
        granularity: timeDim.granularity
      }
    }
  }
  return timeDimensions
}

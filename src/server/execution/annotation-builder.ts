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
  const measures: Record<string, MeasureAnnotation> = {}
  const dimensions: Record<string, DimensionAnnotation> = {}
  const timeDimensions: Record<string, TimeDimensionAnnotation> = {}

  // Get all cubes involved (primary + join cubes)
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

  // Generate measure annotations from all cubes
  if (query.measures) {
    for (const measureName of query.measures) {
      const [cubeName, fieldName] = measureName.split('.')
      const cube = allCubes.find(c => c?.name === cubeName)
      if (cube && cube.measures[fieldName]) {
        const measure = cube.measures[fieldName]
        measures[measureName] = {
          title: measure.title || fieldName,
          shortTitle: measure.title || fieldName,
          type: measure.type
        }
      }
    }
  }

  // Generate dimension annotations from all cubes
  if (query.dimensions) {
    for (const dimensionName of query.dimensions) {
      const [cubeName, fieldName] = dimensionName.split('.')
      const cube = allCubes.find(c => c?.name === cubeName)
      if (cube && cube.dimensions?.[fieldName]) {
        const dimension = cube.dimensions[fieldName]
        dimensions[dimensionName] = {
          title: dimension.title || fieldName,
          shortTitle: dimension.title || fieldName,
          type: dimension.type
        }
      }
    }
  }

  // Generate time dimension annotations from all cubes
  if (query.timeDimensions) {
    for (const timeDim of query.timeDimensions) {
      const [cubeName, fieldName] = timeDim.dimension.split('.')
      const cube = allCubes.find(c => c?.name === cubeName)
      if (cube && cube.dimensions?.[fieldName]) {
        const dimension = cube.dimensions[fieldName]
        timeDimensions[timeDim.dimension] = {
          title: dimension.title || fieldName,
          shortTitle: dimension.title || fieldName,
          type: dimension.type,
          granularity: timeDim.granularity
        }
      }
    }
  }

  return {
    measures,
    dimensions,
    segments: {},
    timeDimensions
  }
}

/**
 * Cube metadata builders
 *
 * Pure helpers extracted from SemanticLayerCompiler.generateCubeMetadata. Each
 * builder converts one section of a cube definition (measures, dimensions,
 * relationships, hierarchies) into its API-metadata shape. Keeping them pure and
 * module-level keeps the compiler method small and testable.
 */

import type {
  Cube,
  MeasureMetadata,
  DimensionMetadata,
  CubeRelationshipMetadata,
  HierarchyMetadata,
  TimeGranularity
} from './types'
import { resolveCubeReference } from './cube-utils'

/** Default time granularities used when a time dimension omits `granularities`. */
export const DEFAULT_TIME_GRANULARITIES: TimeGranularity[] = [
  'year', 'quarter', 'month', 'week', 'day', 'hour'
]

/** Qualify a member name with the cube name unless it is already qualified. */
function qualify(cubeName: string, member: string): string {
  return member.includes('.') ? member : `${cubeName}.${member}`
}

/** Build measure metadata, normalizing drillMembers to fully-qualified names. */
export function buildMeasureMetadata(cube: Cube): MeasureMetadata[] {
  const keys = Object.keys(cube.measures)
  const measures: MeasureMetadata[] = new Array(keys.length)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const measure = cube.measures[key]

    let drillMembers: string[] | undefined
    if (measure.drillMembers && measure.drillMembers.length > 0) {
      drillMembers = measure.drillMembers.map(member => qualify(cube.name, member))
    }

    measures[i] = {
      name: `${cube.name}.${key}`,
      title: measure.title || key,
      shortTitle: measure.title || key,
      type: measure.type,
      format: undefined, // Measure doesn't have format field
      description: measure.description,
      synonyms: measure.synonyms,
      drillMembers
    }
  }

  return measures
}

/** Build dimension metadata, including granularities for time dimensions. */
export function buildDimensionMetadata(cube: Cube): DimensionMetadata[] {
  const keys = Object.keys(cube.dimensions)
  const dimensions: DimensionMetadata[] = new Array(keys.length)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const dimension = cube.dimensions[key]

    const granularities: TimeGranularity[] | undefined = dimension.type === 'time'
      ? (dimension.granularities || DEFAULT_TIME_GRANULARITIES)
      : undefined

    dimensions[i] = {
      name: `${cube.name}.${key}`,
      title: dimension.title || key,
      shortTitle: dimension.title || key,
      type: dimension.type,
      format: undefined, // Dimension doesn't have format field
      description: dimension.description,
      synonyms: dimension.synonyms,
      granularities
    }
  }

  return dimensions
}

/** Build relationship metadata from a cube's joins, resolving target cubes. */
export function buildRelationshipMetadata(
  cube: Cube,
  cubes: Map<string, Cube>,
  getColumnName: (column: any) => string
): CubeRelationshipMetadata[] {
  const relationships: CubeRelationshipMetadata[] = []
  if (!cube.joins) return relationships

  for (const [, join] of Object.entries(cube.joins)) {
    const targetCube = resolveCubeReference(join.targetCube, cubes)
    if (!targetCube) continue

    relationships.push({
      targetCube: targetCube.name,
      relationship: join.relationship,
      joinFields: join.on.map(condition => ({
        sourceField: getColumnName(condition.source),
        targetField: getColumnName(condition.target)
      }))
    })
  }

  return relationships
}

/** Build hierarchy metadata, qualifying level names to full member names. */
export function buildHierarchyMetadata(cube: Cube): HierarchyMetadata[] {
  const hierarchies: HierarchyMetadata[] = []
  if (!cube.hierarchies) return hierarchies

  for (const [, hierarchy] of Object.entries(cube.hierarchies)) {
    hierarchies.push({
      name: hierarchy.name,
      title: hierarchy.title || hierarchy.name,
      cubeName: cube.name,
      levels: hierarchy.levels.map(level => qualify(cube.name, level))
    })
  }

  return hierarchies
}

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
} from './types/index.js'
import { resolveCubeReference } from './cube-utils.js'

/** Default time granularities used when a time dimension omits `granularities`. */
export const DEFAULT_TIME_GRANULARITIES: TimeGranularity[] = [
  'year', 'quarter', 'month', 'week', 'day', 'hour'
]

/** Qualify a member name with the cube name unless it is already qualified. */
function qualify(cubeName: string, member: string): string {
  return member.includes('.') ? member : `${cubeName}.${member}`
}

/**
 * Strip a same-cube qualifier from a member name so it can be looked up in
 * `cube.dimensions`/`cube.measures`. A level written as `'hiddenTag'` or as
 * `'Widgets.hiddenTag'` (self-qualified) both resolve to the same local key;
 * a level qualified with a different cube name is left untouched (returns
 * `null`) since it cannot be resolved against this cube's own members.
 */
function unqualifyOwnCube(cubeName: string, member: string): string | null {
  if (!member.includes('.')) return member
  const prefix = `${cubeName}.`
  return member.startsWith(prefix) ? member.slice(prefix.length) : null
}

/**
 * Build measure metadata, normalizing drillMembers to fully-qualified names.
 *
 * Measures with `shown: false` are omitted from the result — matching Cube.js
 * semantics, where a hidden measure remains fully usable in queries but is
 * excluded from metadata/UI surfaces. `shown: undefined` means shown, so
 * today's behaviour is preserved exactly.
 */
export function buildMeasureMetadata(cube: Cube): MeasureMetadata[] {
  const keys = Object.keys(cube.measures)
  const measures: MeasureMetadata[] = []

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const measure = cube.measures[key]
    if (measure.shown === false) continue

    let drillMembers: string[] | undefined
    if (measure.drillMembers && measure.drillMembers.length > 0) {
      drillMembers = measure.drillMembers.map(member => qualify(cube.name, member))
    }

    measures.push({
      name: `${cube.name}.${key}`,
      title: measure.title || key,
      shortTitle: measure.title || key,
      type: measure.type,
      format: undefined, // Measure doesn't have format field
      description: measure.description,
      synonyms: measure.synonyms,
      drillMembers
    })
  }

  return measures
}

/**
 * Build dimension metadata, including granularities for time dimensions.
 *
 * Dimensions with `shown: false` are omitted from the result — matching
 * Cube.js semantics, where a hidden dimension remains fully usable in queries
 * but is excluded from metadata/UI surfaces. `shown: undefined` means shown,
 * so today's behaviour is preserved exactly.
 */
export function buildDimensionMetadata(cube: Cube): DimensionMetadata[] {
  const keys = Object.keys(cube.dimensions)
  const dimensions: DimensionMetadata[] = []

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const dimension = cube.dimensions[key]
    if (dimension.shown === false) continue

    const granularities: TimeGranularity[] | undefined = dimension.type === 'time'
      ? (dimension.granularities || DEFAULT_TIME_GRANULARITIES)
      : undefined

    dimensions.push({
      name: `${cube.name}.${key}`,
      title: dimension.title || key,
      shortTitle: dimension.title || key,
      type: dimension.type,
      format: undefined, // Dimension doesn't have format field
      description: dimension.description,
      synonyms: dimension.synonyms,
      granularities
    })
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

/**
 * Build hierarchy metadata, qualifying level names to full member names.
 *
 * Levels referencing a dimension with `shown: false` are dropped, so a
 * hierarchy never emits a dangling reference to a dimension that has been
 * omitted from the cube's own dimension metadata. A hierarchy left with no
 * visible levels is omitted entirely rather than published as empty.
 */
export function buildHierarchyMetadata(cube: Cube): HierarchyMetadata[] {
  const hierarchies: HierarchyMetadata[] = []
  if (!cube.hierarchies) return hierarchies

  for (const [, hierarchy] of Object.entries(cube.hierarchies)) {
    const levels = hierarchy.levels
      .filter(level => {
        const localKey = unqualifyOwnCube(cube.name, level)
        // A level qualified with a different cube's name can't be resolved
        // against this cube's dimensions — pass it through unfiltered.
        if (localKey === null) return true
        return cube.dimensions[localKey]?.shown !== false
      })
      .map(level => qualify(cube.name, level))

    if (levels.length === 0) continue

    hierarchies.push({
      name: hierarchy.name,
      title: hierarchy.title || hierarchy.name,
      cubeName: cube.name,
      levels
    })
  }

  return hierarchies
}

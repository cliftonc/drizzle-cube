/**
 * Pure helpers for CTEPlanner.
 *
 * These functions derive CTE join keys and resolve join definitions without
 * touching Drizzle SQL or the security context — they operate purely on cube
 * join metadata. Extracted from cte-planner.ts to keep the planning phase
 * readable and individually testable.
 */

import type { Cube, CubeJoin, SemanticQuery } from '../types/index.js'
import { resolveCubeReference } from '../cube-utils.js'
import { extractCubeNamesFromFilter } from './planner-utils.js'

/** A resolved CTE join key (column names plus the underlying column objects). */
export interface CTEJoinKey {
  sourceColumn: string
  targetColumn: string
  sourceColumnObj: any
  targetColumnObj: any
}

/** A join definition located relative to a primary/target cube pair. */
export interface FoundJoinInfo {
  sourceCube: Cube
  joinDef: CubeJoin
  reversed?: boolean
}

/**
 * Derive join keys for a belongsToMany relationship via its junction table.
 *
 * Direction matters: when the belongsToMany is defined on the primary cube
 * (and not reversed), `targetKey` connects junction → CTE cube. Otherwise
 * `sourceKey` connects CTE → junction.
 */
function deriveBelongsToManyJoinKeys(
  joinInfo: FoundJoinInfo,
  primaryCube: Cube
): CTEJoinKey[] {
  const through = joinInfo.joinDef.through!
  const isDefinedOnPrimary =
    joinInfo.sourceCube?.name === primaryCube.name && !joinInfo.reversed

  if (isDefinedOnPrimary) {
    // targetKey connects junction -> CTE cube
    return through.targetKey.map(tk => ({
      sourceColumn: tk.source.name, // junction table column
      targetColumn: tk.target.name, // CTE cube column
      sourceColumnObj: tk.source,
      targetColumnObj: tk.target
    }))
  }

  // sourceKey connects CTE -> junction
  // sourceKey[].source = CTE cube's column (CTE SELECT/GROUP BY via targetColumnObj)
  // sourceKey[].target = junction column (outer join condition via sourceColumnObj)
  return through.sourceKey.map(sk => ({
    sourceColumn: sk.target.name,
    targetColumn: sk.source.name,
    sourceColumnObj: sk.target,
    targetColumnObj: sk.source
  }))
}

/**
 * Derive the CTE join keys for a located join definition, handling
 * belongsToMany junctions and reversed (belongsTo-back-to-primary) joins.
 */
export function deriveCTEJoinKeys(joinInfo: FoundJoinInfo, primaryCube: Cube): CTEJoinKey[] {
  if (joinInfo.joinDef.relationship === 'belongsToMany' && joinInfo.joinDef.through) {
    return deriveBelongsToManyJoinKeys(joinInfo, primaryCube)
  }

  // For reversed joins (CTE cube has belongsTo back to primary), swap
  // source/target so sourceColumnObj references the primary cube's column.
  if (joinInfo.reversed) {
    return joinInfo.joinDef.on.map(joinOn => ({
      sourceColumn: joinOn.target.name,
      targetColumn: joinOn.source.name,
      sourceColumnObj: joinOn.target,
      targetColumnObj: joinOn.source
    }))
  }

  return joinInfo.joinDef.on.map(joinOn => ({
    sourceColumn: joinOn.source.name,
    targetColumn: joinOn.target.name,
    sourceColumnObj: joinOn.source,
    targetColumnObj: joinOn.target
  }))
}

/**
 * Derive the join keys connecting a downstream dimension cube through the CTE
 * cube, handling belongsToMany (via junction sourceKey) and regular joins.
 */
export function deriveDownstreamJoinKeys(joinDef: CubeJoin): CTEJoinKey[] {
  if (joinDef.relationship === 'belongsToMany' && joinDef.through) {
    // sourceKey[].source = CTE cube's column (CTE SELECT via sourceColumnObj)
    // sourceKey[].target = junction table column
    return joinDef.through.sourceKey.map(sk => ({
      sourceColumn: sk.source.name,
      targetColumn: sk.target.name,
      sourceColumnObj: sk.source,
      targetColumnObj: sk.target
    }))
  }

  return joinDef.on.map(joinOn => ({
    sourceColumn: joinOn.source.name,
    targetColumn: joinOn.target.name,
    sourceColumnObj: joinOn.source,
    targetColumnObj: joinOn.target
  }))
}

/**
 * Scan a single cube's joins for one whose resolved target matches
 * `wantTargetName`. Returns the matching join definition or null.
 */
function findJoinInCube(
  cube: Cube,
  wantTargetName: string,
  cubes: Map<string, Cube>
): CubeJoin | null {
  if (!cube.joins) return null
  for (const [, joinDef] of Object.entries(cube.joins)) {
    const resolvedTarget = resolveCubeReference(joinDef.targetCube, cubes)
    if (!resolvedTarget) continue
    if (resolvedTarget.name === wantTargetName) {
      return joinDef as CubeJoin
    }
  }
  return null
}

/**
 * Find join information for a target cube, searching (in priority order):
 * 1. The primary cube's direct join to the target.
 * 2. The target cube's join back to the primary (reverse lookup → reversed).
 * 3. Any other registered cube's join to the target.
 */
export function findJoinInfoForCube(
  cubes: Map<string, Cube>,
  primaryCube: Cube,
  targetCubeName: string
): FoundJoinInfo | null {
  // 1. Primary cube → target
  const fromPrimary = findJoinInCube(primaryCube, targetCubeName, cubes)
  if (fromPrimary) {
    return { sourceCube: primaryCube, joinDef: fromPrimary }
  }

  // 2. Target cube → primary (reverse lookup)
  const targetCube = cubes.get(targetCubeName)
  if (targetCube) {
    const backToPrimary = findJoinInCube(targetCube, primaryCube.name, cubes)
    if (backToPrimary) {
      return { sourceCube: targetCube, joinDef: backToPrimary, reversed: true }
    }
  }

  // 3. Any other cube → target
  for (const [, cube] of cubes) {
    if (cube.name === primaryCube.name || cube.name === targetCubeName) continue
    const fromOther = findJoinInCube(cube, targetCubeName, cubes)
    if (fromOther) {
      return { sourceCube: cube, joinDef: fromOther }
    }
  }

  return null
}

/**
 * Collect the names of cubes (other than the CTE cube) that contribute
 * dimensions, time dimensions, or filter members to the query. These are the
 * candidate downstream cubes that may need to join through the CTE.
 */
export function collectDimensionCubeNames(query: SemanticQuery, cteCubeName: string): Set<string> {
  const names = new Set<string>()

  if (query.dimensions) {
    for (const dim of query.dimensions) {
      const [cubeName] = dim.split('.')
      if (cubeName !== cteCubeName) names.add(cubeName)
    }
  }

  if (query.timeDimensions) {
    for (const timeDim of query.timeDimensions) {
      const [cubeName] = timeDim.dimension.split('.')
      if (cubeName !== cteCubeName) names.add(cubeName)
    }
  }

  if (query.filters) {
    for (const filter of query.filters) {
      extractCubeNamesFromFilter(filter, names)
    }
    // The CTE cube itself might have been added from filters — remove it.
    names.delete(cteCubeName)
  }

  return names
}

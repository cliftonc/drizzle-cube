/**
 * JoinPlanner — builds the join plan for a multi-cube query.
 *
 * Resolves join paths between the primary cube and every other referenced cube,
 * expanding belongsToMany relationships and materialising join conditions.
 * Extracted from LogicalPlanner.
 */

import type {
  Cube,
  CubeJoin,
  SemanticQuery
} from '../types/index.js'
import {
  resolveCubeReference,
  getJoinType,
  reverseRelationship
} from '../cube-utils.js'
import { t } from '../../i18n/runtime.js'
import { ResolverCache, analyzeCubeUsage } from './planner-utils.js'
import type { JoinRef } from './types.js'

export class JoinPlanner {
  constructor(private readonly resolverCache: ResolverCache) {}

  /**
   * Build join plan for multi-cube query
   * Supports both direct joins and transitive joins through intermediate cubes
   *
   * Uses query-aware path selection to prefer joining through cubes that have
   * measures in the query (e.g., joining Teams through EmployeeTeams when
   * EmployeeTeams.count is a measure)
   */
  buildJoinPlan(
    cubes: Map<string, Cube>,
    primaryCube: Cube,
    cubeNames: string[],
    _ctx: unknown,
    query: SemanticQuery
  ): JoinRef[] {
    const resolver = this.resolverCache.get(cubes)
    const joinCubes: JoinRef[] = []
    const processedCubes = new Set([primaryCube.name])

    // Cubes with measures are still needed for CTE pre-detection.
    const cubesWithMeasures = new Set<string>()
    if (query.measures) {
      for (const measure of query.measures) {
        const [cubeName] = measure.split('.')
        cubesWithMeasures.add(cubeName)
      }
    }

    // Rust-style hinting: include all query member cubes to drive path selection.
    const preferredPathCubes = analyzeCubeUsage(query)

    // Pre-identify cubes that will become CTEs (hasMany relationships with measures)
    // IMPORTANT: We must NOT give "already processed" preference to CTE'd cubes because
    // when a cube becomes a CTE, its original table columns are replaced by CTE columns.
    // If we route join paths through a CTE'd cube, the join conditions will reference
    // the original table (e.g., productivity.departmentId) instead of the CTE alias,
    // causing "missing FROM-clause entry" errors.
    const willBeCTEd = new Set<string>()
    for (const cubeName of cubesWithMeasures) {
      if (cubeName === primaryCube.name) continue
      // Check if this cube has hasMany relationship from primary
      const hasManyJoin = this.findHasManyJoinDef(primaryCube, cubeName, cubes)
      if (hasManyJoin) {
        willBeCTEd.add(cubeName)
      }
    }

    // Find cubes to join (all except primary)
    const cubesToJoin = cubeNames.filter(name => name !== primaryCube.name)

    for (const cubeName of cubesToJoin) {
      if (processedCubes.has(cubeName)) {
        continue // Already processed
      }

      // When finding join paths, filter out CTE'd cubes from the "already processed" set.
      // This prevents the path scorer from preferring longer paths through CTE'd cubes
      // when shorter direct paths exist.
      // Example: Without this fix, Employees → Productivity → Departments would be chosen
      // over Employees → Departments because Productivity is "already processed", even though
      // Productivity is a CTE and its join conditions won't work.
      const effectiveProcessed = new Set(
        [...processedCubes].filter(c => !willBeCTEd.has(c))
      )

      // Use preferring method to route through cubes with measures when possible
      const joinPath = resolver.findPathPreferring(
        primaryCube.name,
        cubeName,
        preferredPathCubes,
        effectiveProcessed
      )
      if (!joinPath || joinPath.length === 0) {
        throw new Error(t('server.errors.noJoinPath', { fromCube: primaryCube.name, toCube: cubeName }))
      }

      // Add all cubes in the join path
      for (const { fromCube: pathFromCube, toCube, joinDef, reversed } of joinPath) {
        if (processedCubes.has(toCube)) {
          continue // Skip if already processed
        }

        const cube = cubes.get(toCube)
        if (!cube) {
          throw new Error(t('server.errors.cubeNotFound', { cubeName: toCube }))
        }

        joinCubes.push(this.buildJoinRef(cube, toCube, pathFromCube, joinDef as CubeJoin, reversed))
        processedCubes.add(toCube)
      }
    }

    return joinCubes
  }

  /**
   * Build a single symbolic JoinRef for a join-path step. Handles belongsToMany
   * (junction-table) joins and regular (belongsTo/hasOne/hasMany) joins. The join
   * conditions and security WHERE are materialized later by DrizzlePlanBuilder;
   * only the join type is resolved here (it depends on the effective relationship).
   */
  private buildJoinRef(
    cube: Cube,
    toCube: string,
    pathFromCube: string,
    joinDef: CubeJoin,
    reversed: boolean | undefined
  ): JoinRef {
    // Compute effective relationship: reversed belongsTo↔hasMany
    const effectiveRelationship = reversed
      ? reverseRelationship(joinDef.relationship)
      : joinDef.relationship

    if (effectiveRelationship === 'belongsToMany' && joinDef.through) {
      // Emit a symbolic junction join. belongsToMany uses a single resolved join type.
      const junctionJoinType = getJoinType('belongsToMany', joinDef.sqlJoinType) as 'inner' | 'left' | 'right' | 'full'

      return {
        target: { name: cube.name, cube },
        alias: `${toCube.toLowerCase()}_cube`,
        joinType: junctionJoinType,
        joinDef,
        relationship: 'belongsToMany',
        junctionTable: {
          table: joinDef.through.table,
          alias: `junction_${toCube.toLowerCase()}`,
          joinType: junctionJoinType,
          sourceCubeName: pathFromCube
        }
      }
    }

    // Regular join (belongsTo, hasOne, hasMany).
    const joinType = getJoinType(effectiveRelationship, joinDef.sqlJoinType) as 'inner' | 'left' | 'right' | 'full'

    return {
      target: { name: cube.name, cube },
      alias: `${toCube.toLowerCase()}_cube`,
      joinType,
      joinDef,
      relationship: effectiveRelationship as 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
    }
  }

  /**
   * Find hasMany join definition from primary cube to target cube
   */
  findHasManyJoinDef(
    primaryCube: Cube,
    targetCubeName: string,
    cubes?: Map<string, Cube>
  ): CubeJoin | null {
    if (!primaryCube.joins) {
      return null
    }

    // Look through all joins from primary cube
    for (const [, joinDef] of Object.entries(primaryCube.joins)) {
      const resolvedTargetCube = resolveCubeReference(joinDef.targetCube, cubes)
      if (!resolvedTargetCube) continue
      if (resolvedTargetCube.name === targetCubeName && joinDef.relationship === 'hasMany') {
        return joinDef as CubeJoin
      }
    }

    return null
  }
}

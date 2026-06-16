/**
 * Shared planning utilities used across the logical-plan sub-planners
 * (JoinPlanner, CTEPlanner, FilterPropagation, PlanAnalysisReporter).
 *
 * These are small, side-effect-free helpers plus a per-cubes resolver cache.
 * Extracted from LogicalPlanner so the planning phases can live in separate
 * single-responsibility modules without duplicating cube-usage analysis or
 * re-instantiating JoinPathResolver.
 */

import type { Cube, SemanticQuery } from '../types/index.js'
import { JoinPathResolver } from '../resolvers/join-path-resolver.js'

/**
 * Caches a JoinPathResolver per cubes map to avoid repeated instantiation.
 * Shared by all sub-planners so a single query reuses one resolver per cubes map.
 */
export class ResolverCache {
  private cache: WeakMap<Map<string, Cube>, JoinPathResolver> = new WeakMap()

  get(cubes: Map<string, Cube>): JoinPathResolver {
    let resolver = this.cache.get(cubes)
    if (!resolver) {
      resolver = new JoinPathResolver(cubes)
      this.cache.set(cubes, resolver)
    }
    return resolver
  }
}

/**
 * Analyze a semantic query to determine which cubes are involved.
 * Scans measures, dimensions, time dimensions, filters and ORDER BY members.
 */
export function analyzeCubeUsage(query: SemanticQuery): Set<string> {
  const cubesUsed = new Set<string>()

  // Extract cube names from measures
  if (query.measures) {
    for (const measure of query.measures) {
      const [cubeName] = measure.split('.')
      cubesUsed.add(cubeName)
    }
  }

  // Extract cube names from dimensions
  if (query.dimensions) {
    for (const dimension of query.dimensions) {
      const [cubeName] = dimension.split('.')
      cubesUsed.add(cubeName)
    }
  }

  // Extract cube names from time dimensions
  if (query.timeDimensions) {
    for (const timeDim of query.timeDimensions) {
      const [cubeName] = timeDim.dimension.split('.')
      cubesUsed.add(cubeName)
    }
  }

  // Extract cube names from filters
  if (query.filters) {
    for (const filter of query.filters) {
      extractCubeNamesFromFilter(filter, cubesUsed)
    }
  }

  // Extract cube names from ORDER BY members
  if (query.order) {
    for (const member of Object.keys(query.order)) {
      const [cubeName] = member.split('.')
      if (cubeName) {
        cubesUsed.add(cubeName)
      }
    }
  }

  return cubesUsed
}

/**
 * Recursively extract cube names from a filter (handles logical AND/OR filters)
 * into the provided set.
 */
export function extractCubeNamesFromFilter(filter: any, cubesUsed: Set<string>): void {
  // Handle logical filters (AND/OR) - Server format: { and: [...] } or { or: [...] }
  if ('and' in filter || 'or' in filter) {
    const logicalFilters = filter.and || filter.or || []
    for (const subFilter of logicalFilters) {
      extractCubeNamesFromFilter(subFilter, cubesUsed)
    }
    return
  }

  // Handle simple filter condition
  if ('member' in filter) {
    const [cubeName] = filter.member.split('.')
    if (cubeName) {
      cubesUsed.add(cubeName)
    }
  }
}

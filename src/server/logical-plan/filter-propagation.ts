/**
 * FilterPropagation — determines which filters from related cubes must
 * propagate into a pre-aggregation CTE.
 *
 * When cube A has filters and a hasMany relationship to CTE cube B, A's filters
 * must propagate into B's CTE (via a subquery) so the aggregation is computed
 * over the correct, filtered row set. Extracted from LogicalPlanner.
 */

import type {
  Cube,
  SemanticQuery,
  PropagatingFilter,
  Filter
} from '../types'
import { resolveCubeReference } from '../cube-utils'

export class FilterPropagation {
  /**
   * Find filters that need to propagate from related cubes to a CTE cube.
   * When cube A has filters and a hasMany relationship to cube B (the CTE cube),
   * A's filters should propagate into B's CTE via a subquery.
   *
   * Example: Employees.createdAt filter should propagate to Productivity CTE
   * via: employee_id IN (SELECT id FROM employees WHERE created_at >= $date)
   */
  findPropagatingFilters(
    query: SemanticQuery,
    cteCube: Cube,
    allCubes: Map<string, Cube>
  ): PropagatingFilter[] {
    const result: PropagatingFilter[] = []
    if (!query.filters) return result

    // Extract all cube names referenced in filters
    const filterCubeNames = new Set<string>()
    this.extractFilterCubeNamesToSet(query.filters, filterCubeNames)

    // Also check time dimension filters which may have date ranges
    if (query.timeDimensions) {
      for (const timeDim of query.timeDimensions) {
        if (timeDim.dateRange) {
          const [cubeName] = timeDim.dimension.split('.')
          if (cubeName) {
            filterCubeNames.add(cubeName)
          }
        }
      }
    }

    // For each filter cube, check if it has a hasMany relationship TO the CTE cube
    for (const filterCubeName of filterCubeNames) {
      if (filterCubeName === cteCube.name) continue // Same cube, handled elsewhere

      const filterCube = allCubes.get(filterCubeName)
      if (!filterCube?.joins) continue

      // Check if filterCube has hasMany -> cteCube
      for (const [, joinDef] of Object.entries(filterCube.joins)) {
        const targetCube = resolveCubeReference(joinDef.targetCube, allCubes)
        if (!targetCube) continue
        if (targetCube.name === cteCube.name && joinDef.relationship === 'hasMany') {
          // Found: filterCube hasMany -> cteCube
          // Extract the filters for this cube
          const filtersForCube = this.extractFiltersForCube(query.filters, filterCubeName)

          // Also add time dimension date ranges as filters
          const timeFilters = this.extractTimeDimensionFiltersForCube(query, filterCubeName)
          const allFilters = [...filtersForCube, ...timeFilters]

          if (allFilters.length > 0 && joinDef.on.length > 0) {
            result.push({
              sourceCube: filterCube,
              filters: allFilters,
              // Map all join keys for composite key support
              // source = filterCube PK (e.g., employees.id)
              // target = cteCube FK (e.g., productivity.employeeId)
              joinConditions: joinDef.on.map(key => ({
                source: key.source,
                target: key.target
              }))
            })
          }
        }
      }
    }
    return result
  }

  /**
   * Extract cube names from filters into a Set (helper for findPropagatingFilters)
   */
  extractFilterCubeNamesToSet(filters: Filter[], cubesSet: Set<string>): void {
    for (const filter of filters) {
      // Handle logical filters (AND/OR)
      if ('and' in filter || 'or' in filter) {
        const logicalFilters = (filter as any).and || (filter as any).or || []
        this.extractFilterCubeNamesToSet(logicalFilters, cubesSet)
        continue
      }

      // Handle simple filter condition
      if ('member' in filter) {
        const [cubeName] = (filter as any).member.split('.')
        if (cubeName) {
          cubesSet.add(cubeName)
        }
      }
    }
  }

  /**
   * Extract filters for a specific cube from the filter array
   *
   * Logic for preserving filter semantics:
   * - AND: Safe to extract only matching branches (AND of fewer conditions is more permissive)
   * - OR: Must include ALL branches or skip entirely (partial OR changes semantics)
   *       If any branch belongs to another cube, skip the entire OR to be safe
   *       since we can't evaluate the other cube's conditions
   */
  extractFiltersForCube(filters: Filter[], targetCubeName: string): Filter[] {
    const result: Filter[] = []

    for (const filter of filters) {
      // Handle AND filters - safe to extract only matching branches
      if ('and' in filter) {
        const subFilters = this.extractFiltersForCube((filter as any).and || [], targetCubeName)
        if (subFilters.length > 0) {
          result.push({ and: subFilters })
        }
        continue
      }

      // Handle OR filters - must check if ALL branches belong to target cube
      // If any branch belongs to another cube, skip the entire OR
      if ('or' in filter) {
        const orFilters = (filter as any).or || []

        // Check if all simple filters in this OR belong to target cube
        // If any belong to other cubes, skip this OR entirely
        const allBelongToTarget = this.allFiltersFromCube(orFilters, targetCubeName)

        if (allBelongToTarget) {
          // All branches belong to target cube, safe to include
          const subFilters = this.extractFiltersForCube(orFilters, targetCubeName)
          if (subFilters.length > 0) {
            result.push({ or: subFilters })
          }
        }
        // If not all belong to target, skip this OR filter entirely
        // This is the safe choice for CTE propagation - we can't evaluate
        // conditions from other cubes, so we shouldn't filter rows based on
        // partial OR conditions
        continue
      }

      // Handle simple filter condition
      if ('member' in filter) {
        const [cubeName] = (filter as any).member.split('.')
        if (cubeName === targetCubeName) {
          result.push(filter)
        }
      }
    }

    return result
  }

  /**
   * Check if all simple filters in a filter array belong to the specified cube
   * Recursively checks nested AND/OR filters
   */
  allFiltersFromCube(filters: Filter[], targetCubeName: string): boolean {
    for (const filter of filters) {
      if ('and' in filter) {
        if (!this.allFiltersFromCube((filter as any).and || [], targetCubeName)) {
          return false
        }
        continue
      }
      if ('or' in filter) {
        if (!this.allFiltersFromCube((filter as any).or || [], targetCubeName)) {
          return false
        }
        continue
      }
      if ('member' in filter) {
        const [cubeName] = (filter as any).member.split('.')
        if (cubeName !== targetCubeName) {
          return false
        }
      }
    }
    return true
  }

  /**
   * Extract time dimension date range filters as regular filters for a specific cube
   */
  extractTimeDimensionFiltersForCube(query: SemanticQuery, targetCubeName: string): Filter[] {
    const result: Filter[] = []

    if (!query.timeDimensions) return result

    for (const timeDim of query.timeDimensions) {
      const [cubeName] = timeDim.dimension.split('.')
      if (cubeName === targetCubeName && timeDim.dateRange) {
        // Convert time dimension dateRange to an inDateRange filter
        result.push({
          member: timeDim.dimension,
          operator: 'inDateRange',
          values: Array.isArray(timeDim.dateRange) ? timeDim.dateRange : [timeDim.dateRange]
        })
      }
    }

    return result
  }
}

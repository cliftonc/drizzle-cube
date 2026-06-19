/**
 * Filter operations — the single owner of filter type guards, creation,
 * structural manipulation (add/remove/update group), member extraction,
 * server-format transforms, and cube validation.
 *
 * Consumed by both the dashboard filter UI and the analysis-builder filter UI.
 * These are pure functions: no React, no side effects.
 */

import type { CubeQuery, Filter, SimpleFilter, GroupFilter, CubeMeta } from '../../types.js'
import { transformFilterFromServer } from '../queryTransforms.js'

// ============================================================================
// Filter type guards
// ============================================================================

/**
 * Check if a filter is a simple filter.
 *
 * Discriminates against GroupFilter (which has `type`/`filters`, never
 * `member`/`operator`). `values` is intentionally NOT required: valueless
 * filters such as an `inDateRange` carrying only a `dateRange` are still simple.
 */
export function isSimpleFilter(filter: Filter): filter is SimpleFilter {
  return 'member' in filter && 'operator' in filter
}

/**
 * Check if a filter is a group filter
 */
export function isGroupFilter(filter: Filter): filter is GroupFilter {
  return 'type' in filter && 'filters' in filter
}

/**
 * Check if a filter is an AND filter
 */
export function isAndFilter(filter: Filter): filter is GroupFilter {
  return isGroupFilter(filter) && filter.type === 'and'
}

/**
 * Check if a filter is an OR filter
 */
export function isOrFilter(filter: Filter): filter is GroupFilter {
  return isGroupFilter(filter) && filter.type === 'or'
}

// ============================================================================
// Filter creation
// ============================================================================

/**
 * Create a new simple filter
 */
export function createSimpleFilter(member: string, operator: string = 'equals', values: any[] = []): SimpleFilter {
  return {
    member,
    operator: operator as any,
    values
  }
}

/**
 * Create a new AND filter group
 */
export function createAndFilter(filters: Filter[] = []): GroupFilter {
  return {
    type: 'and',
    filters
  }
}

/**
 * Create a new OR filter group
 */
export function createOrFilter(filters: Filter[] = []): GroupFilter {
  return {
    type: 'or',
    filters
  }
}

/**
 * Clean up filters - backward compatible (returns filters unchanged)
 * @deprecated This function is no longer used as we now support filtering on any schema field
 */
export function cleanupFilters(filters: Filter[], _query?: CubeQuery): Filter[] {
  return filters || []
}

// ============================================================================
// Filter traversal
// ============================================================================

/**
 * Flatten all simple filters from a hierarchical filter structure
 */
export function flattenFilters(filters: Filter[]): SimpleFilter[] {
  const simple: SimpleFilter[] = []

  const flatten = (filter: Filter) => {
    if (isSimpleFilter(filter)) {
      simple.push(filter)
    } else if (isGroupFilter(filter)) {
      filter.filters.forEach(flatten)
    }
  }

  filters.forEach(flatten)
  return simple
}

/**
 * Count total simple filters in a hierarchical structure
 */
export function countFilters(filters: Filter[]): number {
  let count = 0

  const countFilter = (filter: Filter) => {
    if (isSimpleFilter(filter)) {
      count++
    } else if (isGroupFilter(filter)) {
      filter.filters.forEach(countFilter)
    }
  }

  filters.forEach(countFilter)
  return count
}

/**
 * Extract all member names from a filter tree (handles nested group filters).
 * Returns names in traversal order, including duplicates; callers that need
 * unique fields should de-duplicate.
 */
export function extractFilterMembers(filters: Filter[]): string[] {
  const members: string[] = []

  const visit = (filter: Filter) => {
    if (isSimpleFilter(filter)) {
      members.push(filter.member)
    } else if (isGroupFilter(filter)) {
      filter.filters.forEach(visit)
    }
  }

  filters.forEach(visit)
  return members
}

// ============================================================================
// Structural manipulation (add / remove / update group)
// ============================================================================

/**
 * Add a simple filter at a specific path in the filter tree.
 * Path is an array of indices, e.g. [0, 2] means filters[0].filters[2].
 * An empty path adds at the root, wrapping bare filters in an AND group as needed.
 */
export function addFilterAtPath(filters: Filter[], path: number[], newFilter: SimpleFilter): Filter[] {
  if (path.length === 0) {
    // Add to root level
    if (filters.length === 0) {
      return [newFilter]
    } else if (filters.length === 1 && isSimpleFilter(filters[0])) {
      // Wrap in AND group
      return [{ type: 'and', filters: [filters[0], newFilter] }]
    } else if (filters.length === 1 && isGroupFilter(filters[0])) {
      // Add to existing group
      return [{
        ...filters[0],
        filters: [...filters[0].filters, newFilter]
      }]
    } else {
      // Wrap all in AND group
      return [{ type: 'and', filters: [...filters, newFilter] }]
    }
  }

  // Navigate to the target group and add
  const [firstIndex, ...restPath] = path
  const newFilters = [...filters]
  const targetFilter = newFilters[firstIndex]

  if (isGroupFilter(targetFilter)) {
    if (restPath.length === 0) {
      // Add to this group
      newFilters[firstIndex] = {
        ...targetFilter,
        filters: [...targetFilter.filters, newFilter]
      }
    } else {
      // Recurse deeper
      newFilters[firstIndex] = {
        ...targetFilter,
        filters: addFilterAtPath(targetFilter.filters, restPath, newFilter)
      }
    }
  }

  return newFilters
}

/**
 * Remove a top-level filter by index, unwrapping a sole remaining single-filter
 * group back to a bare filter (keeps the tree as shallow as possible).
 */
export function removeFilterAtIndex(filters: Filter[], index: number): Filter[] {
  const newFilters = filters.filter((_, i) => i !== index)

  // If we have a single group with one filter, unwrap it
  if (newFilters.length === 1 && isGroupFilter(newFilters[0])) {
    const group = newFilters[0]
    if (group.filters.length === 1) {
      return [group.filters[0]]
    }
  }

  return newFilters
}

/**
 * Return a copy of a group with its type toggled between AND and OR
 */
export function toggleGroupType(group: GroupFilter): GroupFilter {
  return { ...group, type: group.type === 'and' ? 'or' : 'and' }
}

/**
 * Find the first inDateRange filter for a given member, searching nested
 * groups. Returns its dateRange (preferring the dateRange property).
 */
export function findDateFilterForField(
  filters: Filter[],
  field: string
): { dateRange: string | string[] } | undefined {
  for (const filter of filters) {
    if (isGroupFilter(filter)) {
      const nested = findDateFilterForField(filter.filters, field)
      if (nested) return nested
    } else if (isSimpleFilter(filter)) {
      if (filter.member === field && filter.operator === 'inDateRange' && filter.dateRange) {
        return { dateRange: filter.dateRange }
      }
    }
  }
  return undefined
}

/**
 * Remove every simple filter matching a member (optionally restricted to an
 * operator) from a filter tree, pruning groups that become empty. Immutable.
 */
export function removeFilterForMember(filters: Filter[], member: string, operator?: string): Filter[] {
  return filters.reduce<Filter[]>((acc, filter) => {
    if (isGroupFilter(filter)) {
      const cleaned = removeFilterForMember(filter.filters, member, operator)
      // Only keep the group if it still has filters
      if (cleaned.length > 0) {
        acc.push({ type: filter.type, filters: cleaned })
      }
    } else if (isSimpleFilter(filter)) {
      const matches = filter.member === member && (operator === undefined || filter.operator === operator)
      if (!matches) {
        acc.push(filter)
      }
    } else {
      acc.push(filter)
    }
    return acc
  }, [])
}

// ============================================================================
// Server-format transforms
// ============================================================================

/**
 * Transform filters from the UI GroupFilter format to the legacy server format.
 * Server expects { and: [...] } / { or: [...] } instead of { type, filters }.
 */
export function transformFiltersForServer(filters: Filter[]): any[] {
  const transformFilter = (filter: Filter): any => {
    if (isSimpleFilter(filter)) {
      return filter
    } else if (isGroupFilter(filter)) {
      const transformedSubFilters = filter.filters.map(transformFilter)

      if (filter.type === 'and') {
        return { and: transformedSubFilters }
      } else {
        return { or: transformedSubFilters }
      }
    }
    return filter
  }

  return filters.map(transformFilter)
}

/**
 * Transform filters from server/API format to UI format.
 * Converts { and: [...] } / { or: [...] } to { type, filters } GroupFilters.
 */
export function transformFiltersFromServer(filters: any[]): Filter[] {
  return filters
    .map(transformFilterFromServer)
    .filter(Boolean) as Filter[] // Remove any null/undefined values
}

// ============================================================================
// Cube validation
// ============================================================================

/**
 * Check if a filter's field(s) exist in the cube metadata. Helps identify
 * filters that may not apply to a specific portlet's data. Fails open when no
 * metadata is available.
 */
export function validateFilterForCube(filter: Filter, cubeMeta: CubeMeta | null): boolean {
  if (!cubeMeta || !cubeMeta.cubes) {
    // If no metadata available, assume filter is valid (fail open)
    return true
  }

  const memberNames = extractFilterMembers([filter])

  // Check if any of the member names exist in cube metadata
  return memberNames.some(memberName => {
    return cubeMeta.cubes.some(cube => {
      const inMeasures = cube.measures?.some(m => m.name === memberName) ?? false
      const inDimensions = cube.dimensions?.some(d => d.name === memberName) ?? false
      return inMeasures || inDimensions
    })
  })
}

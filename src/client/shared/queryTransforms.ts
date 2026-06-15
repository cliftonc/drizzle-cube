/**
 * Helpers for transforming Cube queries and filters between server/API format
 * and the UI's internal representation. Split out of shared/utils.ts to keep
 * each unit small.
 */

import type { CubeQuery, Filter, SimpleFilter, GroupFilter } from '../types'

/**
 * Clean query object by removing empty arrays.
 *
 * Leaf helper kept here (rather than in shared/utils.ts) so that
 * `transformQueryForUIImpl` can use it without creating an import cycle back
 * into utils.ts. Re-exported from utils.ts to keep existing import paths stable.
 */
export function cleanQuery(query: CubeQuery): CubeQuery {
  const cleanedQuery: CubeQuery = {}

  if (query.measures && query.measures.length > 0) {
    cleanedQuery.measures = query.measures
  }

  if (query.dimensions && query.dimensions.length > 0) {
    cleanedQuery.dimensions = query.dimensions
  }

  if (query.timeDimensions && query.timeDimensions.length > 0) {
    cleanedQuery.timeDimensions = query.timeDimensions
  }

  if (query.filters && query.filters.length > 0) {
    cleanedQuery.filters = query.filters
  }

  if (query.order) {
    cleanedQuery.order = query.order
  }

  if (query.limit) {
    cleanedQuery.limit = query.limit
  }

  if (query.offset) {
    cleanedQuery.offset = query.offset
  }

  if (query.segments && query.segments.length > 0) {
    cleanedQuery.segments = query.segments
  }

  return cleanedQuery
}

/**
 * Transform a single filter from server/API format to UI format.
 * Converts {and: [...]} / {or: [...]} to {type, filters} GroupFilter shape and
 * recurses; passes simple filters through unchanged.
 */
export function transformFilterFromServer(filter: any): Filter | null | undefined {
  if (!filter || typeof filter !== 'object') {
    return filter
  }

  // Handle legacy {and: [...]} format
  if ('and' in filter && Array.isArray(filter.and)) {
    return {
      type: 'and',
      filters: filter.and.map(transformFilterFromServer).filter(Boolean) as Filter[]
    } as GroupFilter
  }

  // Handle legacy {or: [...]} format
  if ('or' in filter && Array.isArray(filter.or)) {
    return {
      type: 'or',
      filters: filter.or.map(transformFilterFromServer).filter(Boolean) as Filter[]
    } as GroupFilter
  }

  // Handle new format {type: 'and', filters: [...]} - process recursively
  if ('type' in filter && 'filters' in filter && Array.isArray(filter.filters)) {
    return {
      type: filter.type,
      filters: filter.filters.map(transformFilterFromServer).filter(Boolean) as Filter[]
    } as GroupFilter
  }

  // Simple filter - pass through
  return filter as SimpleFilter
}

/**
 * Copy the simple (non-filter) fields of an external query onto a UI query,
 * normalizing array-typed fields to arrays.
 */
function copyQueryScalars(query: any, target: CubeQuery): void {
  if (query.measures) target.measures = Array.isArray(query.measures) ? query.measures : []
  if (query.dimensions) target.dimensions = Array.isArray(query.dimensions) ? query.dimensions : []
  if (query.timeDimensions) target.timeDimensions = Array.isArray(query.timeDimensions) ? query.timeDimensions : []
  if (query.order) target.order = query.order
  if (query.limit) target.limit = query.limit
  if (query.offset) target.offset = query.offset
  if (query.segments) target.segments = Array.isArray(query.segments) ? query.segments : []
}

/**
 * Transform a Cube.js query from external format to UI internal format.
 * Handles format differences between server/API queries and QueryBuilder state.
 */
export function transformQueryForUIImpl(
  query: any,
  transformFiltersFromServer: (filters: any[]) => Filter[]
): CubeQuery {
  if (!query || typeof query !== 'object') {
    return {}
  }

  const transformed: CubeQuery = {}

  copyQueryScalars(query, transformed)

  // Transform filters from server format to UI format
  if (query.filters && Array.isArray(query.filters)) {
    transformed.filters = transformFiltersFromServer(query.filters)
  }

  return cleanQuery(transformed)
}

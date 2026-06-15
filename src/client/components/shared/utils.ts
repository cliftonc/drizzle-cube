/**
 * Utility functions for QueryBuilder components
 *
 * Common filter/query utilities are imported from the shared module
 * to avoid duplication. Only component-specific utilities are defined here.
 */

import type { CubeQuery, Filter, SimpleFilter } from '../../types'
import type { MetaField, MetaResponse } from './types'
import { getSelectedFieldNames, validateFilterOperator } from './queryFieldUtils'

// ============================================================================
// Re-export concern-split sibling utilities (canonical source for each lives
// in its own module; surfaced here so existing import paths stay stable)
// ============================================================================
export {
  // Sort utilities
  getSortDirection,
  getSortTooltip,
  getNextSortDirection,
} from './queryFieldUtils'

export type { DatePreset } from './dateRangeUtils'
export {
  DATE_PRESETS,
  XTD_OPTIONS,
  calculateDateRange,
  formatDateRangeDisplay,
  detectPresetFromDateRange,
} from './dateRangeUtils'

export { formatFilterValueDisplay } from './filterDisplayUtils'

// ============================================================================
// Re-export common utilities from shared module (canonical source)
// ============================================================================
export {
  // Filter type guards
  isSimpleFilter,
  isGroupFilter,
  isAndFilter,
  isOrFilter,
  // Filter manipulation
  flattenFilters,
  countFilters,
  createSimpleFilter,
  createAndFilter,
  createOrFilter,
  cleanupFilters,
  // Filter transformation
  transformFiltersForServer,
  transformFiltersFromServer,
  // Query utilities
  hasQueryContent,
  cleanQuery,
  cleanQueryForServer,
  transformQueryForUI,
  // Schema utilities
  getCubeNameFromField,
  getFieldType,
  getFieldTitle,
  getAvailableOperators,
  getAllFilterableFields,
  // Date utilities
  convertDateRangeTypeToValue,
  requiresNumberInput,
  formatDateForCube,
} from '../../shared/utils'

// Import for internal use
import {
  isSimpleFilter,
  isGroupFilter,
  getCubeNameFromField,
  getAllFilterableFields,
} from '../../shared/utils'

// ============================================================================
// Component-specific utilities (unique to this module)
// ============================================================================

/**
 * Check if a field is selected in the current query
 */
export function isFieldSelected(
  fieldName: string,
  fieldType: 'measures' | 'dimensions' | 'timeDimensions',
  query: CubeQuery
): boolean {
  if (fieldType === 'timeDimensions') {
    return query.timeDimensions?.some(td => td.dimension === fieldName) || false
  }
  return query[fieldType]?.includes(fieldName) || false
}

/**
 * Get all time dimension fields from schema
 */
export function getTimeDimensionFields(schema: MetaResponse): MetaField[] {
  const timeDimensions: MetaField[] = []

  schema.cubes.forEach(cube => {
    cube.dimensions.forEach(dimension => {
      if (dimension.type === 'time') {
        timeDimensions.push(dimension)
      }
    })
  })

  return timeDimensions
}

/**
 * Get all non-time dimension fields from schema
 */
export function getRegularDimensionFields(schema: MetaResponse): MetaField[] {
  const dimensions: MetaField[] = []

  schema.cubes.forEach(cube => {
    cube.dimensions.forEach(dimension => {
      if (dimension.type !== 'time') {
        dimensions.push(dimension)
      }
    })
  })

  return dimensions
}

/**
 * Get all measure fields from schema
 */
export function getMeasureFields(schema: MetaResponse): MetaField[] {
  const measures: MetaField[] = []

  schema.cubes.forEach(cube => {
    cube.measures.forEach(measure => {
      measures.push(measure)
    })
  })

  return measures
}

/**
 * Get count of selected fields across all types
 */
export function getSelectedFieldsCount(query: CubeQuery): number {
  let count = 0
  if (query.measures) count += query.measures.length
  if (query.dimensions) count += query.dimensions.length
  if (query.timeDimensions) count += query.timeDimensions.length
  return count
}

/**
 * Group fields by cube name
 */
export function groupFieldsByCube(fields: MetaField[]): Record<string, MetaField[]> {
  return fields.reduce((groups, field) => {
    const cubeName = getCubeNameFromField(field.name)
    if (!groups[cubeName]) {
      groups[cubeName] = []
    }
    groups[cubeName].push(field)
    return groups
  }, {} as Record<string, MetaField[]>)
}

/**
 * Create an empty query object
 */
export function createEmptyQuery(): CubeQuery {
  return {}
}

/**
 * Get all filterable fields from schema (measures, dimensions, and time dimensions)
 * Returns ALL fields if no query provided, or only query fields if query provided
 */
export function getFilterableFields(schema: MetaResponse, query?: CubeQuery): MetaField[] {
  const allFields: MetaField[] = []

  schema.cubes.forEach(cube => {
    allFields.push(...cube.measures)
    allFields.push(...cube.dimensions)
  })

  // If no query provided, return all fields
  if (!query) {
    return allFields.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Filter to only include selected fields
  const selectedFields = getSelectedFieldNames(query)
  const filterableFields = allFields.filter(field => selectedFields.has(field.name))

  return filterableFields.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get organized filter field options with query fields prioritized at top
 */
export function getOrganizedFilterFields(schema: MetaResponse, query?: CubeQuery): {
  queryFields: MetaField[]
  allFields: MetaField[]
} {
  const allFields = getAllFilterableFields(schema)

  if (!query) {
    return {
      queryFields: [],
      allFields
    }
  }

  // Split fields into query fields and other fields
  const selectedFields = getSelectedFieldNames(query)
  const queryFields = allFields.filter(field => selectedFields.has(field.name))

  return {
    queryFields,
    allFields
  }
}

/**
 * Validate a filter
 */
export function validateFilter(filter: SimpleFilter, schema: MetaResponse): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if field exists
  const fields = getFilterableFields(schema)
  const fieldExists = fields.some(f => f.name === filter.member)

  if (!fieldExists) {
    errors.push(`Field "${filter.member}" does not exist`)
  } else {
    // Check if operator is valid for field type
    errors.push(...validateFilterOperator(filter, schema))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Clean up filters by removing any that reference fields not in the current query (legacy)
 * Only used for backward compatibility - filters on non-query fields are now supported
 */
export function cleanupFiltersLegacy(filters: Filter[], query: CubeQuery): Filter[] {
  if (!filters || filters.length === 0) {
    return []
  }

  // Get currently selected fields from the query
  const selectedFields = getSelectedFieldNames(query)

  // Recursively clean filters
  const cleanFilter = (filter: Filter): Filter | null => {
    if (isSimpleFilter(filter)) {
      // Remove filter if its field is not selected
      return selectedFields.has(filter.member) ? filter : null
    } else if (isGroupFilter(filter)) {
      // Clean group recursively
      const cleanedFilters = filter.filters.map(cleanFilter).filter(f => f !== null) as Filter[]
      return cleanedFilters.length > 0 ? { type: filter.type, filters: cleanedFilters } : null
    }
    return null
  }

  // Clean all filters and remove nulls
  const cleanedFilters = filters.map(cleanFilter).filter(f => f !== null) as Filter[]

  return cleanedFilters
}

/**
 * Get the time dimensions that have date ranges applied
 */
export function getTimeDimensionsWithDateRanges(query: CubeQuery): Record<string, string | string[]> {
  const dateRanges: Record<string, string | string[]> = {}

  if (query.timeDimensions) {
    query.timeDimensions.forEach(td => {
      if (td.dateRange) {
        dateRanges[td.dimension] = td.dateRange
      }
    })
  }

  return dateRanges
}

/**
 * Check if a query has any time dimensions
 */
export function hasTimeDimensions(query: CubeQuery): boolean {
  return Boolean(query.timeDimensions && query.timeDimensions.length > 0)
}

// ============================================================================
// Sorting utility functions
// ============================================================================

/**
 * Clean up order object by removing fields that are no longer in the query
 */
export function cleanupOrder(order: Record<string, 'asc' | 'desc'> | undefined, query: CubeQuery): Record<string, 'asc' | 'desc'> | undefined {
  if (!order) return undefined

  const allFields = new Set<string>([
    ...(query.measures || []),
    ...(query.dimensions || []),
    ...(query.timeDimensions || []).map(td => td.dimension)
  ])

  const cleanedOrder: Record<string, 'asc' | 'desc'> = {}
  for (const [field, direction] of Object.entries(order)) {
    if (allFields.has(field)) {
      cleanedOrder[field] = direction
    }
  }

  return Object.keys(cleanedOrder).length > 0 ? cleanedOrder : undefined
}

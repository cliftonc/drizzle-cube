/**
 * Shared utility functions used across QueryBuilder and AnalysisBuilder
 */

import type { CubeQuery, Filter, SimpleFilter, GroupFilter } from '../types'
import type { MetaField, MetaResponse } from './types'
import { FILTER_OPERATORS } from './types'
import { transformFilterFromServer, transformQueryForUIImpl } from './queryTransforms'

// ============================================================================
// Filter type guards
// ============================================================================

/**
 * Check if a filter is a simple filter
 */
export function isSimpleFilter(filter: Filter): filter is SimpleFilter {
  return 'member' in filter && 'operator' in filter && 'values' in filter
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
// Filter manipulation functions
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
 * Count total filters in hierarchical structure
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
// Filter transformation functions
// ============================================================================

/**
 * Transform filters from new GroupFilter format to legacy server format
 * Server expects { and: [...] } and { or: [...] } instead of { type: 'and', filters: [...] }
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
 * Transform filters from server/API format to UI format
 * Converts {and: [...]} and {or: [...]} to {type: 'and', filters: [...]} format
 */
export function transformFiltersFromServer(filters: any[]): Filter[] {
  return filters
    .map(transformFilterFromServer)
    .filter(Boolean) as Filter[] // Remove any null/undefined values
}

// ============================================================================
// Query utility functions
// ============================================================================

/**
 * Check if query has any content (measures, dimensions, or timeDimensions)
 */
export function hasQueryContent(query: CubeQuery): boolean {
  return Boolean(
    (query.measures && query.measures.length > 0) ||
    (query.dimensions && query.dimensions.length > 0) ||
    (query.timeDimensions && query.timeDimensions.length > 0)
  )
}

/**
 * Clean query object by removing empty arrays
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
 * Clean a query and transform filters for server compatibility
 * This version transforms GroupFilter to legacy and/or format
 */
export function cleanQueryForServer(query: CubeQuery): CubeQuery {
  const cleanedQuery = cleanQuery(query)

  // Apply server transformation to filters
  if (cleanedQuery.filters && cleanedQuery.filters.length > 0) {
    cleanedQuery.filters = transformFiltersForServer(cleanedQuery.filters) as any
  }

  return cleanedQuery
}

/**
 * Transform a Cube.js query from external format to UI internal format
 * This handles format differences between server/API queries and QueryBuilder state
 */
export function transformQueryForUI(query: any): CubeQuery {
  return transformQueryForUIImpl(query, transformFiltersFromServer)
}

// ============================================================================
// Schema utility functions
// ============================================================================

/**
 * Get cube name from field name (e.g., "Employees.count" -> "Employees")
 */
export function getCubeNameFromField(fieldName: string): string {
  return fieldName.split('.')[0]
}

/**
 * Find a field (measure or dimension) by name across all cubes in the schema.
 */
function findSchemaField(fieldName: string, schema: MetaResponse): MetaField | undefined {
  for (const cube of schema.cubes) {
    const measure = cube.measures.find(m => m.name === fieldName)
    if (measure) return measure

    const dimension = cube.dimensions.find(d => d.name === fieldName)
    if (dimension) return dimension
  }

  return undefined
}

/**
 * Get field type from schema
 */
export function getFieldType(fieldName: string, schema: MetaResponse): string {
  return findSchemaField(fieldName, schema)?.type ?? 'string' // Default fallback
}

/**
 * Get field title from schema metadata, falling back to field name
 */
export function getFieldTitle(fieldName: string, schema: MetaResponse | null): string {
  if (!schema) return fieldName

  const field = findSchemaField(fieldName, schema)
  // Fallback to field name if not found
  return field ? (field.title || field.shortTitle || fieldName) : fieldName
}

/**
 * Get available operators for a field type
 */
export function getAvailableOperators(fieldType: string): Array<{operator: string, label: string}> {
  const operators: Array<{operator: string, label: string}> = []

  for (const [operator, meta] of Object.entries(FILTER_OPERATORS)) {
    if (meta.fieldTypes.includes(fieldType)) {
      operators.push({
        operator,
        label: meta.label
      })
    }
  }

  return operators
}

/**
 * Get ALL filterable fields from schema
 */
export function getAllFilterableFields(schema: MetaResponse): MetaField[] {
  const allFields: MetaField[] = []

  schema.cubes.forEach(cube => {
    allFields.push(...cube.measures)
    allFields.push(...cube.dimensions)
  })

  return allFields.sort((a, b) => a.name.localeCompare(b.name))
}

// ============================================================================
// Date range utility functions
// ============================================================================

/**
 * Convert DateRangeType to Cube.js compatible date range format
 */
export function convertDateRangeTypeToValue(rangeType: string, number?: number): string {
  const typeMap: Record<string, string> = {
    'today': 'today',
    'yesterday': 'yesterday',
    'this_week': 'this week',
    'this_month': 'this month',
    'this_quarter': 'this quarter',
    'this_year': 'this year',
    'last_7_days': 'last 7 days',
    'last_30_days': 'last 30 days',
    'last_week': 'last week',
    'last_month': 'last month',
    'last_quarter': 'last quarter',
    'last_year': 'last year',
    'last_12_months': 'last 12 months'
  }

  // Handle dynamic ranges with number input
  if (rangeType.startsWith('last_n_') && number !== undefined && number > 0) {
    const unit = rangeType.replace('last_n_', '')
    const unitSingular = unit.slice(0, -1) // Remove 's' for singular form
    return number === 1 ? `last ${unitSingular}` : `last ${number} ${unit}`
  }

  return typeMap[rangeType] || rangeType
}

/**
 * Check if a date range type requires a number input
 */
export function requiresNumberInput(rangeType: string): boolean {
  return rangeType.startsWith('last_n_')
}

/**
 * Format date for Cube.js (YYYY-MM-DD)
 */
export function formatDateForCube(date: Date): string {
  return date.toISOString().split('T')[0]
}

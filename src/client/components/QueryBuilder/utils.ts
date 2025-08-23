/**
 * Utility functions for QueryBuilder components
 */

import type { CubeQuery, Filter, SimpleFilter, GroupFilter } from '../../types'
import type { MetaField, MetaResponse } from './types'
import { FILTER_OPERATORS } from './types'

/**
 * Check if a field is selected in the current query
 */
export function isFieldSelected(
  fieldName: string, 
  fieldType: 'measures' | 'dimensions' | 'timeDimensions',
  query: CubeQuery
): boolean {
  switch (fieldType) {
    case 'measures':
      return query.measures?.includes(fieldName) || false
    case 'dimensions':
      return query.dimensions?.includes(fieldName) || false
    case 'timeDimensions':
      return query.timeDimensions?.some(td => td.dimension === fieldName) || false
    default:
      return false
  }
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
 * Get cube name from field name (e.g., "Employees.count" -> "Employees")
 */
export function getCubeNameFromField(fieldName: string): string {
  return fieldName.split('.')[0]
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
 * Create an empty query object
 */
export function createEmptyQuery(): CubeQuery {
  return {}
}

/**
 * Filter utility functions
 */

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
 * Get all filterable fields from schema (measures, dimensions, and time dimensions)
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
  
  // Get currently selected fields from the query
  const selectedFields = new Set<string>()
  
  // Add measures
  if (query.measures) {
    query.measures.forEach(measure => selectedFields.add(measure))
  }
  
  // Add dimensions
  if (query.dimensions) {
    query.dimensions.forEach(dimension => selectedFields.add(dimension))
  }
  
  // Add time dimensions
  if (query.timeDimensions) {
    query.timeDimensions.forEach(td => selectedFields.add(td.dimension))
  }
  
  // Filter to only include selected fields
  const filterableFields = allFields.filter(field => selectedFields.has(field.name))
  
  return filterableFields.sort((a, b) => a.name.localeCompare(b.name))
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
 * Get field type from schema
 */
export function getFieldType(fieldName: string, schema: MetaResponse): string {
  for (const cube of schema.cubes) {
    // Check measures
    const measure = cube.measures.find(m => m.name === fieldName)
    if (measure) return measure.type
    
    // Check dimensions
    const dimension = cube.dimensions.find(d => d.name === fieldName)
    if (dimension) return dimension.type
  }
  
  return 'string' // Default fallback
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
  }
  
  // Check if operator is valid for field type
  if (fieldExists) {
    const fieldType = getFieldType(filter.member, schema)
    const operatorMeta = FILTER_OPERATORS[filter.operator]
    
    if (!operatorMeta) {
      errors.push(`Invalid operator "${filter.operator}"`)
    } else if (!operatorMeta.fieldTypes.includes(fieldType)) {
      errors.push(`Operator "${filter.operator}" is not valid for field type "${fieldType}"`)
    } else {
      // Check values
      if (operatorMeta.requiresValues && (!filter.values || filter.values.length === 0)) {
        errors.push(`Operator "${filter.operator}" requires values`)
      }
      
      if (!operatorMeta.supportsMultipleValues && filter.values && filter.values.length > 1) {
        errors.push(`Operator "${filter.operator}" does not support multiple values`)
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
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
 * Clean up filters by removing any that reference fields not in the current query
 */
export function cleanupFilters(filters: Filter[], query: CubeQuery): Filter[] {
  if (!filters || filters.length === 0) {
    return []
  }
  
  // Get currently selected fields from the query
  const selectedFields = new Set<string>()
  
  // Add measures
  if (query.measures) {
    query.measures.forEach(measure => selectedFields.add(measure))
  }
  
  // Add dimensions
  if (query.dimensions) {
    query.dimensions.forEach(dimension => selectedFields.add(dimension))
  }
  
  // Add time dimensions
  if (query.timeDimensions) {
    query.timeDimensions.forEach(td => selectedFields.add(td.dimension))
  }
  
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
 * Date range utility functions
 */

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

/**
 * Transform a Cube.js query from external format to UI internal format
 * This handles format differences between server/API queries and QueryBuilder state
 */
export function transformQueryForUI(query: any): CubeQuery {
  if (!query || typeof query !== 'object') {
    return {}
  }
  
  const transformed: CubeQuery = {}
  
  // Copy simple fields if they exist
  if (query.measures) transformed.measures = Array.isArray(query.measures) ? query.measures : []
  if (query.dimensions) transformed.dimensions = Array.isArray(query.dimensions) ? query.dimensions : []
  if (query.timeDimensions) transformed.timeDimensions = Array.isArray(query.timeDimensions) ? query.timeDimensions : []
  if (query.order) transformed.order = query.order
  if (query.limit) transformed.limit = query.limit
  if (query.offset) transformed.offset = query.offset
  if (query.segments) transformed.segments = Array.isArray(query.segments) ? query.segments : []
  
  // Transform filters from server format to UI format
  if (query.filters && Array.isArray(query.filters)) {
    transformed.filters = transformFiltersFromServer(query.filters)
  }
  
  return cleanQuery(transformed)
}

/**
 * Transform filters from server/API format to UI format
 * Converts {and: [...]} and {or: [...]} to {type: 'and', filters: [...]} format
 */
function transformFiltersFromServer(filters: any[]): Filter[] {
  return filters.map(filter => {
    if (!filter || typeof filter !== 'object') {
      return filter
    }
    
    // Handle legacy {and: [...]} format
    if ('and' in filter && Array.isArray(filter.and)) {
      return {
        type: 'and',
        filters: transformFiltersFromServer(filter.and)
      } as GroupFilter
    }
    
    // Handle legacy {or: [...]} format
    if ('or' in filter && Array.isArray(filter.or)) {
      return {
        type: 'or',
        filters: transformFiltersFromServer(filter.or)
      } as GroupFilter
    }
    
    // Handle new format {type: 'and', filters: [...]} - process recursively
    if ('type' in filter && 'filters' in filter && Array.isArray(filter.filters)) {
      return {
        type: filter.type,
        filters: transformFiltersFromServer(filter.filters)
      } as GroupFilter
    }
    
    // Simple filter - pass through
    return filter as SimpleFilter
  }).filter(Boolean) // Remove any null/undefined values
}
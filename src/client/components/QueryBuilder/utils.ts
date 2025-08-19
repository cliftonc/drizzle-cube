/**
 * Utility functions for QueryBuilder components
 */

import type { CubeQuery } from '../../types'
import type { MetaField, MetaResponse } from './types'

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
 * Create an empty query object
 */
export function createEmptyQuery(): CubeQuery {
  return {}
}
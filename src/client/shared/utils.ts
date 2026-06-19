/**
 * Shared utility functions used across QueryBuilder and AnalysisBuilder
 *
 * Filter type guards, manipulation, operator metadata, and server-format
 * transforms now live in ./filters (the single filter module). This file keeps
 * query-level and schema/date helpers.
 */

import type { CubeQuery } from '../types.js'
import type { MetaField, MetaResponse } from './types.js'
import { cleanQuery, transformQueryForUIImpl } from './queryTransforms.js'
import { transformFiltersForServer, transformFiltersFromServer } from './filters/index.js'

// Re-exported from queryTransforms (its canonical home) to keep import paths stable.
export { cleanQuery }

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

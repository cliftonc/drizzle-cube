/**
 * Utility functions for PortletBuilder component
 */

import type {
  MetricItem,
  BreakdownItem,
  FieldOption,
  FieldType,
  RecentFieldsStorage
} from './types'
import type { MetaResponse, MetaField } from '../../shared/types'
import type { CubeQuery, Filter } from '../../types'

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID for items
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate letter label for metrics (A, B, C, ..., AA, AB, ...)
 */
export function generateMetricLabel(index: number): string {
  let label = ''
  let n = index
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

// ============================================================================
// Query Building
// ============================================================================

/**
 * Convert metrics and breakdowns to CubeQuery format
 */
export function buildCubeQuery(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[]
): CubeQuery {
  const query: CubeQuery = {
    measures: metrics.map((m) => m.field),
    dimensions: breakdowns.filter((b) => !b.isTimeDimension).map((b) => b.field),
    timeDimensions: breakdowns
      .filter((b) => b.isTimeDimension)
      .map((b) => ({
        dimension: b.field,
        granularity: b.granularity || 'day'
      })),
    filters: filters.length > 0 ? filters : undefined
  }

  // Clean up empty arrays
  if (query.measures?.length === 0) delete query.measures
  if (query.dimensions?.length === 0) delete query.dimensions
  if (query.timeDimensions?.length === 0) delete query.timeDimensions

  return query
}

/**
 * Check if a query has any content
 */
export function hasQueryContent(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  filters: Filter[]
): boolean {
  return metrics.length > 0 || breakdowns.length > 0 || filters.length > 0
}

// ============================================================================
// Field Utilities
// ============================================================================

/**
 * Get cube name from a field name (e.g., "Employees.count" -> "Employees")
 */
export function getCubeNameFromField(fieldName: string): string {
  return fieldName.split('.')[0]
}

/**
 * Get field short name from full name (e.g., "Employees.count" -> "count")
 */
export function getFieldShortName(fieldName: string): string {
  const parts = fieldName.split('.')
  return parts.length > 1 ? parts.slice(1).join('.') : fieldName
}

/**
 * Find field metadata from schema
 */
export function findFieldInSchema(
  fieldName: string,
  schema: MetaResponse | null
): { field: MetaField; cubeName: string; fieldType: FieldType } | null {
  if (!schema) return null

  for (const cube of schema.cubes) {
    // Check measures
    const measure = cube.measures.find((m) => m.name === fieldName)
    if (measure) {
      return { field: measure, cubeName: cube.name, fieldType: 'measure' }
    }

    // Check dimensions
    const dimension = cube.dimensions.find((d) => d.name === fieldName)
    if (dimension) {
      return {
        field: dimension,
        cubeName: cube.name,
        fieldType: dimension.type === 'time' ? 'timeDimension' : 'dimension'
      }
    }
  }

  return null
}

/**
 * Get display title for a field
 */
export function getFieldTitle(fieldName: string, schema: MetaResponse | null): string {
  const found = findFieldInSchema(fieldName, schema)
  if (found) {
    return found.field.title || found.field.shortTitle || fieldName
  }
  return fieldName
}

/**
 * Determine field type from metadata
 */
export function getFieldType(field: MetaField): FieldType {
  if (field.type === 'time') return 'timeDimension'
  // Measures typically have aggregation types
  if (['count', 'countDistinct', 'sum', 'avg', 'min', 'max', 'runningTotal', 'countDistinctApprox'].includes(field.type)) {
    return 'measure'
  }
  return 'dimension'
}

// ============================================================================
// Field Search & Filtering
// ============================================================================

/**
 * Convert schema to flat list of field options
 */
export function schemaToFieldOptions(
  schema: MetaResponse | null,
  mode: 'metrics' | 'breakdown' | 'filter'
): FieldOption[] {
  if (!schema) return []

  const options: FieldOption[] = []

  for (const cube of schema.cubes) {
    if (mode === 'metrics') {
      // Add measures only
      for (const measure of cube.measures) {
        options.push({
          name: measure.name,
          title: measure.title || measure.shortTitle || measure.name,
          shortTitle: measure.shortTitle || measure.title || measure.name,
          type: measure.type,
          description: measure.description,
          cubeName: cube.name,
          fieldType: 'measure'
        })
      }
    } else if (mode === 'breakdown') {
      // Add dimensions only (both regular and time)
      for (const dimension of cube.dimensions) {
        const isTime = dimension.type === 'time'
        options.push({
          name: dimension.name,
          title: dimension.title || dimension.shortTitle || dimension.name,
          shortTitle: dimension.shortTitle || dimension.title || dimension.name,
          type: dimension.type,
          description: dimension.description,
          cubeName: cube.name,
          fieldType: isTime ? 'timeDimension' : 'dimension'
        })
      }
    } else {
      // 'filter' mode - add BOTH measures AND dimensions
      // Add measures first
      for (const measure of cube.measures) {
        options.push({
          name: measure.name,
          title: measure.title || measure.shortTitle || measure.name,
          shortTitle: measure.shortTitle || measure.title || measure.name,
          type: measure.type,
          description: measure.description,
          cubeName: cube.name,
          fieldType: 'measure'
        })
      }
      // Add dimensions (both regular and time)
      for (const dimension of cube.dimensions) {
        const isTime = dimension.type === 'time'
        options.push({
          name: dimension.name,
          title: dimension.title || dimension.shortTitle || dimension.name,
          shortTitle: dimension.shortTitle || dimension.title || dimension.name,
          type: dimension.type,
          description: dimension.description,
          cubeName: cube.name,
          fieldType: isTime ? 'timeDimension' : 'dimension'
        })
      }
    }
  }

  return options
}

/**
 * Filter field options by search term
 */
export function filterFieldOptions(
  options: FieldOption[],
  searchTerm: string,
  selectedCube?: string | null
): FieldOption[] {
  let filtered = options

  // Filter by cube if selected
  if (selectedCube && selectedCube !== 'all') {
    filtered = filtered.filter((opt) => opt.cubeName === selectedCube)
  }

  // Filter by search term
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(
      (opt) =>
        opt.name.toLowerCase().includes(term) ||
        opt.title.toLowerCase().includes(term) ||
        (opt.description?.toLowerCase().includes(term) ?? false)
    )
  }

  return filtered
}

/**
 * Group field options by cube
 */
export function groupFieldsByCube(options: FieldOption[]): Map<string, FieldOption[]> {
  const grouped = new Map<string, FieldOption[]>()

  for (const option of options) {
    const existing = grouped.get(option.cubeName) || []
    existing.push(option)
    grouped.set(option.cubeName, existing)
  }

  return grouped
}

// ============================================================================
// Recent Fields Storage
// ============================================================================

const RECENT_FIELDS_KEY = 'drizzle-cube-recent-fields'
const MAX_RECENT_FIELDS = 10

/**
 * Get recent fields from localStorage
 */
export function getRecentFields(): RecentFieldsStorage {
  try {
    const stored = localStorage.getItem(RECENT_FIELDS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore errors
  }
  return { metrics: [], breakdowns: [] }
}

/**
 * Add a field to recent fields
 */
export function addRecentField(fieldName: string, mode: 'metrics' | 'breakdowns'): void {
  try {
    const recent = getRecentFields()
    const list = recent[mode]

    // Remove if already exists
    const filtered = list.filter((f) => f !== fieldName)

    // Add to front
    filtered.unshift(fieldName)

    // Limit size
    recent[mode] = filtered.slice(0, MAX_RECENT_FIELDS)

    localStorage.setItem(RECENT_FIELDS_KEY, JSON.stringify(recent))
  } catch {
    // Ignore errors
  }
}

/**
 * Get recent field options from schema
 */
export function getRecentFieldOptions(
  schema: MetaResponse | null,
  mode: 'metrics' | 'breakdown' | 'filter',
  recentFieldNames: string[]
): FieldOption[] {
  if (!schema || recentFieldNames.length === 0) return []

  const allOptions = schemaToFieldOptions(schema, mode)
  const recentOptions: FieldOption[] = []

  for (const fieldName of recentFieldNames) {
    const option = allOptions.find((opt) => opt.name === fieldName)
    if (option) {
      recentOptions.push(option)
    }
  }

  return recentOptions
}

// ============================================================================
// Cube List Utilities
// ============================================================================

/**
 * Get list of cube names from schema
 */
export function getCubeNames(schema: MetaResponse | null): string[] {
  if (!schema) return []
  return schema.cubes.map((cube) => cube.name)
}

/**
 * Get cube title by name
 */
export function getCubeTitle(cubeName: string, schema: MetaResponse | null): string {
  if (!schema) return cubeName
  const cube = schema.cubes.find((c) => c.name === cubeName)
  return cube?.title || cubeName
}

// ============================================================================
// State Persistence
// ============================================================================

const STORAGE_KEY = 'drizzle-cube-portlet-builder-state'

/**
 * Save state to localStorage
 */
export function saveStateToStorage(state: {
  metrics: MetricItem[]
  breakdowns: BreakdownItem[]
  filters: Filter[]
  chartType: string
  chartConfig: object
  displayConfig: object
  activeView: string
}): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore errors
  }
}

/**
 * Load state from localStorage
 */
export function loadStateFromStorage(): {
  metrics: MetricItem[]
  breakdowns: BreakdownItem[]
  filters: Filter[]
  chartType: string
  chartConfig: object
  displayConfig: object
  activeView: string
} | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore errors
  }
  return null
}

/**
 * Clear state from localStorage
 */
export function clearStateFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore errors
  }
}

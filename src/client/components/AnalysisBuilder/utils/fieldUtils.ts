/**
 * Field Metadata Utilities for AnalysisBuilder
 *
 * Functions for working with field metadata from the schema.
 */

import type { FieldOption, FieldType } from '../types'
import type { MetaResponse, MetaField } from '../../../shared/types'

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

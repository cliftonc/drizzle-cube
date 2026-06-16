/**
 * Query-field selection helpers and sort utilities.
 *
 * Split out of `shared/utils.ts` by concern. Re-exported from there to keep
 * existing import paths stable.
 */

import type { CubeQuery, SimpleFilter } from '../../types.js'
import type { MetaResponse } from './types.js'
import { FILTER_OPERATORS } from './types.js'
import { getFieldType } from '../../shared/utils.js'

/** Collect the set of field names currently selected by a query. */
export function getSelectedFieldNames(query: CubeQuery): Set<string> {
  const selected = new Set<string>()
  query.measures?.forEach(m => selected.add(m))
  query.dimensions?.forEach(d => selected.add(d))
  query.timeDimensions?.forEach(td => selected.add(td.dimension))
  return selected
}

/**
 * Validate operator compatibility / value requirements for a filter.
 * Assumes the filter member is already known to exist.
 */
export function validateFilterOperator(filter: SimpleFilter, schema: MetaResponse): string[] {
  const errors: string[] = []
  const fieldType = getFieldType(filter.member, schema)
  const operatorMeta = FILTER_OPERATORS[filter.operator]

  if (!operatorMeta) {
    errors.push(`Invalid operator "${filter.operator}"`)
    return errors
  }

  if (!operatorMeta.fieldTypes.includes(fieldType)) {
    errors.push(`Operator "${filter.operator}" is not valid for field type "${fieldType}"`)
    return errors
  }

  if (operatorMeta.requiresValues && (!filter.values || filter.values.length === 0)) {
    errors.push(`Operator "${filter.operator}" requires values`)
  }

  if (!operatorMeta.supportsMultipleValues && filter.values && filter.values.length > 1) {
    errors.push(`Operator "${filter.operator}" does not support multiple values`)
  }

  return errors
}

/**
 * Get sort direction for a field from the order object
 */
export function getSortDirection(
  fieldName: string,
  order: Record<string, 'asc' | 'desc'> | undefined
): 'asc' | 'desc' | null {
  return order?.[fieldName] || null
}

/**
 * Get tooltip text for sort button based on current direction
 */
export function getSortTooltip(direction: 'asc' | 'desc' | null): string {
  switch (direction) {
    case 'asc':
      return 'Sorted ascending (click for descending)'
    case 'desc':
      return 'Sorted descending (click to remove)'
    default:
      return 'Click to sort ascending'
  }
}

/**
 * Get next sort direction in the cycle: null -> asc -> desc -> null
 */
export function getNextSortDirection(current: 'asc' | 'desc' | null): 'asc' | 'desc' | null {
  switch (current) {
    case null:
      return 'asc'
    case 'asc':
      return 'desc'
    case 'desc':
      return null
    default:
      return 'asc'
  }
}

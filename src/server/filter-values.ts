/**
 * Filter value rules.
 *
 * Pure, SQL-free rules for which filters take values and which values a filter
 * drops before SQL is built. They live outside the `builders/` (SQL-generation)
 * layer so the planning layer can tell which filters have no values without
 * depending on a SQL builder. `FilterBuilder` applies the same rules.
 */

import type { FilterOperator } from './types/index.js'

/**
 * Operators that test the field itself and take no values (`values` may be
 * omitted or empty).
 */
export const NO_VALUE_FILTER_OPERATORS: ReadonlySet<FilterOperator> = new Set<FilterOperator>([
  'set', 'notSet', 'isEmpty', 'isNotEmpty'
])

/**
 * Whether a filter drops a value before building SQL: an empty value, or a
 * string that contains a null byte.
 *
 * @param value - One of a filter's values
 * @returns True when the filter ignores the value
 */
export function isDiscardedFilterValue(value: unknown): boolean {
  return value === null || value === undefined || value === '' ||
    (typeof value === 'string' && value.includes('\x00'))
}

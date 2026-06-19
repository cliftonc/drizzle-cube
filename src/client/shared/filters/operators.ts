/**
 * Filter operator definitions.
 *
 * The single source of truth for which operators exist and their metadata
 * (value requirements, supported field types). Consumed by both the dashboard
 * filter UI and the analysis-builder filter UI. Labels/descriptions are i18n
 * keys resolved at render time, never bare strings.
 */

import type { FilterOperator } from '../../types.js'

export interface FilterOperatorMeta {
  label: string
  description: string
  requiresValues: boolean
  supportsMultipleValues: boolean
  valueType: 'string' | 'number' | 'date' | 'boolean' | 'any'
  fieldTypes: string[] // Which field types support this operator
}

export const FILTER_OPERATORS: Record<FilterOperator, FilterOperatorMeta> = {
  // String operators
  equals: {
    label: 'filter.operator.equals.label',
    description: 'filter.operator.equals.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean', 'time']
  },
  notEquals: {
    label: 'filter.operator.notEquals.label',
    description: 'filter.operator.notEquals.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean', 'time']
  },
  contains: {
    label: 'filter.operator.contains.label',
    description: 'filter.operator.contains.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notContains: {
    label: 'filter.operator.notContains.label',
    description: 'filter.operator.notContains.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  startsWith: {
    label: 'filter.operator.startsWith.label',
    description: 'filter.operator.startsWith.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notStartsWith: {
    label: 'filter.operator.notStartsWith.label',
    description: 'filter.operator.notStartsWith.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  endsWith: {
    label: 'filter.operator.endsWith.label',
    description: 'filter.operator.endsWith.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notEndsWith: {
    label: 'filter.operator.notEndsWith.label',
    description: 'filter.operator.notEndsWith.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  like: {
    label: 'filter.operator.like.label',
    description: 'filter.operator.like.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notLike: {
    label: 'filter.operator.notLike.label',
    description: 'filter.operator.notLike.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  ilike: {
    label: 'filter.operator.ilike.label',
    description: 'filter.operator.ilike.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Numeric operators
  gt: {
    label: 'filter.operator.gt.label',
    description: 'filter.operator.gt.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  gte: {
    label: 'filter.operator.gte.label',
    description: 'filter.operator.gte.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lt: {
    label: 'filter.operator.lt.label',
    description: 'filter.operator.lt.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lte: {
    label: 'filter.operator.lte.label',
    description: 'filter.operator.lte.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  between: {
    label: 'filter.operator.between.label',
    description: 'filter.operator.between.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  notBetween: {
    label: 'filter.operator.notBetween.label',
    description: 'filter.operator.notBetween.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  // Array operators
  in: {
    label: 'filter.operator.in.label',
    description: 'filter.operator.in.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  notIn: {
    label: 'filter.operator.notIn.label',
    description: 'filter.operator.notIn.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  // Null/Empty operators
  set: {
    label: 'filter.operator.set.label',
    description: 'filter.operator.set.description',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  notSet: {
    label: 'filter.operator.notSet.label',
    description: 'filter.operator.notSet.description',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  isEmpty: {
    label: 'filter.operator.isEmpty.label',
    description: 'filter.operator.isEmpty.description',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  isNotEmpty: {
    label: 'filter.operator.isNotEmpty.label',
    description: 'filter.operator.isNotEmpty.description',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Date operators
  inDateRange: {
    label: 'filter.operator.inDateRange.label',
    description: 'filter.operator.inDateRange.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  beforeDate: {
    label: 'filter.operator.beforeDate.label',
    description: 'filter.operator.beforeDate.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  afterDate: {
    label: 'filter.operator.afterDate.label',
    description: 'filter.operator.afterDate.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  // Regex operators
  regex: {
    label: 'filter.operator.regex.label',
    description: 'filter.operator.regex.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notRegex: {
    label: 'filter.operator.notRegex.label',
    description: 'filter.operator.notRegex.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // PostgreSQL array operators
  arrayContains: {
    label: 'filter.operator.arrayContains.label',
    description: 'filter.operator.arrayContains.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  },
  arrayOverlaps: {
    label: 'filter.operator.arrayOverlaps.label',
    description: 'filter.operator.arrayOverlaps.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  },
  arrayContained: {
    label: 'filter.operator.arrayContained.label',
    description: 'filter.operator.arrayContained.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  }
}

/**
 * Get available operators for a field type
 */
export function getAvailableOperators(fieldType: string): Array<{ operator: string; label: string }> {
  const operators: Array<{ operator: string; label: string }> = []

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

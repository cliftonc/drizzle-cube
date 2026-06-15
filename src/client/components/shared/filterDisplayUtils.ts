/**
 * Filter value formatting utilities for compact chips.
 *
 * Split out of `shared/utils.ts` by concern. Re-exported from there to keep
 * existing import paths stable.
 */

/** Operators that render without any values. */
const NO_VALUE_LABELS: Record<string, string> = {
  set: 'is set',
  notSet: 'is not set',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty'
}

/** Operators rendered as `<symbol> <firstValue>`. */
const UNARY_SYMBOLS: Record<string, string> = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<='
}

/** Operators rendered as `<verb> "<firstValue>"`. */
const QUOTED_VERBS: Record<string, string> = {
  contains: 'contains',
  notContains: '!contains',
  startsWith: 'starts with',
  endsWith: 'ends with'
}

function stringifyValue(v: any): string {
  if (v === true) return 'true'
  if (v === false) return 'false'
  if (v === null || v === undefined) return 'null'
  return String(v)
}

/**
 * Format filter value for display in a compact chip
 */
export function formatFilterValueDisplay(values: any[], operator: string): string {
  if (!values || values.length === 0) {
    // Handle operators that don't need values
    return NO_VALUE_LABELS[operator] ?? ''
  }

  const formattedValues = values.map(stringifyValue)

  if (UNARY_SYMBOLS[operator]) {
    return `${UNARY_SYMBOLS[operator]} ${formattedValues[0]}`
  }

  if (QUOTED_VERBS[operator]) {
    return `${QUOTED_VERBS[operator]} "${formattedValues[0]}"`
  }

  switch (operator) {
    case 'equals':
      return formattedValues.length === 1 ? `= ${formattedValues[0]}` : `in (${formattedValues.join(', ')})`
    case 'notEquals':
      return formattedValues.length === 1 ? `!= ${formattedValues[0]}` : `not in (${formattedValues.join(', ')})`
    case 'between':
      return `${formattedValues[0]} - ${formattedValues[1] || '?'}`
    case 'in':
      return `in (${formattedValues.join(', ')})`
    case 'notIn':
      return `not in (${formattedValues.join(', ')})`
    case 'set':
      return 'is set'
    case 'notSet':
      return 'is not set'
    default:
      return formattedValues.join(', ')
  }
}

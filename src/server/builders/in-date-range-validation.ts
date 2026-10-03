import { t } from '../../i18n/runtime.js'
import { isDateOnlyString, parseRelativeDateRangeValue, toValidDate } from './date-time-helpers.js'

export type DateRangeReason = 'missing' | 'shape' | 'invalidDate' | 'invalidRelative' | 'reverseOrder' | 'conflict'
export type DateRangeValidation = { valid: true } | { valid: false; reason: DateRangeReason; input: 'values' | 'dateRange'; value?: string }

type Endpoint = string | number

function isEndpoint(value: unknown): value is Endpoint {
  return (typeof value === 'string' && value.trim().length > 0 && !value.includes('\x00')) ||
    (typeof value === 'number' && Number.isFinite(value))
}

/** Validate an exact absolute tuple without accepting JS Date rollover or nested arrays. */
export function validateDateTuple(value: unknown): DateRangeReason | null {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(isEndpoint)) return 'shape'
  const start = toValidDate(value[0])
  const end = toValidDate(value[1])
  if (!start || !end || !value.every(isRealCalendarDate)) return 'invalidDate'
  // The SQL builders include the entire end day for date-only strings.
  if (isDateOnlyString(value[1])) end.setUTCHours(23, 59, 59, 999)
  if (start.getTime() > end.getTime()) return 'reverseOrder'
  return null
}

function isRealCalendarDate(value: Endpoint): boolean {
  if (typeof value !== 'string') return true
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value.trim())
  if (!match) return true // Other accepted formats use the shared date parser.
  const [, year, month, day] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === `${year}-${month}-${day}`
}

function validateRange(value: unknown, singleDay: boolean): DateRangeReason | null {
  // The builders treat a one-element array as its single expression; a nested pair stays invalid.
  if (Array.isArray(value) && value.length === 1 && !Array.isArray(value[0])) return validateRange(value[0], singleDay)
  if (Array.isArray(value)) return validateDateTuple(value)
  if (singleDay && typeof value === 'string' && toValidDate(value) && isRealCalendarDate(value)) return null
  if (typeof value !== 'string' || !value.trim() || value.includes('\x00')) return 'shape'
  return parseRelativeDateRangeValue(value) ? null : 'invalidRelative'
}

/** The range a `values` array expresses: a one-element array holds a single expression. */
function rangeFromValues(values: unknown[]): unknown {
  return values.length === 1 ? values[0] : values
}

/**
 * Validate a standalone date range (`filter.dateRange` or `timeDimensions[].dateRange`):
 * a relative expression, one absolute day, or a flat `[start, end]` pair.
 */
export function validateDateRangeInput(dateRange: unknown): DateRangeValidation {
  const reason = validateRange(dateRange, true)
  return reason
    ? { valid: false, reason, input: 'dateRange', value: typeof dateRange === 'string' ? dateRange : undefined }
    : { valid: true }
}

export function validateInDateRange(values: unknown, dateRange?: unknown): DateRangeValidation {
  // `null` has always meant "not provided" for dateRange.
  const range = dateRange ?? undefined
  const hasValues = Array.isArray(values) && values.length > 0
  if (range !== undefined) {
    // Saved dashboard filters carry the same range in both fields, so only a
    // genuine disagreement between them is ambiguous.
    if (hasValues && JSON.stringify(rangeFromValues(values)) !== JSON.stringify(range)) {
      return { valid: false, reason: 'conflict', input: 'values' }
    }
    return validateDateRangeInput(range)
  }
  if (!Array.isArray(values) || values.length === 0) {
    return { valid: false, reason: values === undefined || (Array.isArray(values) && values.length === 0) ? 'missing' : 'shape', input: 'values' }
  }
  // A single value is a relative expression or one absolute day, exactly like dateRange.
  const reason = values.length === 1 && Array.isArray(values[0])
    ? 'shape' : values.length === 1 ? validateRange(values[0], true) : validateDateTuple(values)
  return reason ? { valid: false, reason, input: 'values', value: typeof values[0] === 'string' ? values[0] : undefined } : { valid: true }
}

/**
 * Diagnostic for SQL builders, which only see a field expression. Queries are
 * validated before they reach the builders, so this only surfaces for callers
 * that bypass validation.
 */
export function dateRangeInputDiagnostic(result: DateRangeValidation): string {
  if (result.valid) throw new Error('Expected invalid date range')
  return t('server.validation.query.invalidDateRangeInput', { reason: dateRangeReason(result) })
}

export function timeDimensionDateRangeDiagnostic(member: string, result: DateRangeValidation): string {
  if (result.valid) throw new Error('Expected invalid date range')
  return t('server.validation.query.invalidTimeDimensionDateRange', { member, reason: dateRangeReason(result) })
}

function dateRangeReason(result: Extract<DateRangeValidation, { valid: false }>): string {
  return t(`server.validation.query.inDateRangeReason.${result.reason}`, { value: result.value ?? '' })
}

export function inDateRangeDiagnostic(member: string, result: DateRangeValidation): string {
  if (result.valid) throw new Error('Expected invalid date range')
  const reason = dateRangeReason(result)
  if (result.reason === 'conflict') return t('server.validation.query.inDateRangeConflictingInputs', { member, reason })
  return t(result.input === 'values'
    ? 'server.validation.query.invalidInDateRangeValues'
    : 'server.validation.query.invalidInDateRangeDateRange', { member, reason })
}

import { t } from '../../i18n/runtime.js'
import { parseRelativeDateRangeValue, toValidDate } from './date-time-helpers.js'

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
  if (Array.isArray(value)) return validateDateTuple(value)
  if (singleDay && typeof value === 'string' && toValidDate(value) && isRealCalendarDate(value)) return null
  if (typeof value !== 'string' || !value.trim() || value.includes('\x00')) return 'shape'
  return parseRelativeDateRangeValue(value) ? null : 'invalidRelative'
}

export function validateInDateRange(values: unknown, dateRange?: unknown): DateRangeValidation {
  const hasValues = Array.isArray(values) && values.length > 0
  if (hasValues && dateRange !== undefined) return { valid: false, reason: 'conflict', input: 'values' }
  if (dateRange !== undefined) {
    const reason = validateRange(dateRange, true)
    return reason ? { valid: false, reason, input: 'dateRange', value: typeof dateRange === 'string' ? dateRange : undefined } : { valid: true }
  }
  if (!Array.isArray(values) || values.length === 0) {
    return { valid: false, reason: values === undefined || (Array.isArray(values) && values.length === 0) ? 'missing' : 'shape', input: 'values' }
  }
  const reason = values.length === 1 && Array.isArray(values[0])
    ? 'shape' : values.length === 1 ? validateRange(values[0], false) : validateDateTuple(values)
  return reason ? { valid: false, reason, input: 'values', value: typeof values[0] === 'string' ? values[0] : undefined } : { valid: true }
}

export function inDateRangeDiagnostic(member: string, result: DateRangeValidation): string {
  if (result.valid) throw new Error('Expected invalid date range')
  const reason = t(`server.validation.query.inDateRangeReason.${result.reason}`, { value: result.value ?? '' })
  if (result.reason === 'conflict') return t('server.validation.query.inDateRangeConflictingInputs', { member, reason })
  return t(result.input === 'values'
    ? 'server.validation.query.invalidInDateRangeValues'
    : 'server.validation.query.invalidInDateRangeDateRange', { member, reason })
}

/**
 * dashboardFilterConfigModalUtils
 *
 * Pure helpers extracted from DashboardFilterConfigModal to keep the component's
 * effects and handlers flat. Behaviour is identical to the previous inline logic.
 *
 * `deriveRangeFromDateRange` lives in the shared `dateRangeUtils` module and is
 * re-exported here to keep existing import paths stable.
 */

export type { DerivedRange } from '../shared/dateRangeUtils.js'
export { deriveRangeFromDateRange } from '../shared/dateRangeUtils.js'

/**
 * Compute the next filter `values` for a direct text/number input change.
 * Mirrors the previous inline `handleDirectInput` logic exactly:
 *  - For number-typed operators: keep numeric values, clear on empty/partial sign.
 *  - For everything else: store the raw string (or clear when empty).
 *
 * Returns `null` when the current values should be left untouched (e.g. an
 * unparseable number that is neither empty nor a lone "-").
 */
export function computeDirectInputValues(
  value: string,
  valueType: string | undefined
): unknown[] | null {
  if (valueType === 'number') {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      return [numValue]
    }
    if (value === '' || value === '-') {
      return []
    }
    return null
  }
  return value ? [value] : []
}

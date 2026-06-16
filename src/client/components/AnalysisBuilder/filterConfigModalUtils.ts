/**
 * filterConfigModalUtils
 *
 * Pure helpers extracted from FilterConfigModal to keep the component's effects
 * and render flat. Behaviour is identical to the previous inline logic.
 *
 * `deriveRangeFromDateRange` lives in the shared `dateRangeUtils` module and is
 * re-exported here to keep existing import paths stable.
 */

export type { DerivedRange } from '../shared/dateRangeUtils.js'
export { deriveRangeFromDateRange } from '../shared/dateRangeUtils.js'

/** Action the value-dropdown keyboard handler should apply, decided purely. */
export type ValueKeyAction =
  | { type: 'none' }
  | { type: 'highlight'; index: number }
  | { type: 'select'; index: number }
  | { type: 'close' }

/**
 * Pure keyboard-navigation logic for the filter value dropdown. Given the key
 * and current state, returns the action to apply (no side effects), so the
 * branchy decision can be unit-tested and the React handler stays a thin
 * dispatcher.
 */
export function resolveValueKeyboardAction(
  key: string,
  isOpen: boolean,
  length: number,
  highlightedIndex: number
): ValueKeyAction {
  if (!isOpen || length === 0) return { type: 'none' }
  switch (key) {
    case 'ArrowDown':
      return { type: 'highlight', index: highlightedIndex < length - 1 ? highlightedIndex + 1 : 0 }
    case 'ArrowUp':
      return { type: 'highlight', index: highlightedIndex > 0 ? highlightedIndex - 1 : length - 1 }
    case 'Enter':
      return highlightedIndex >= 0 && highlightedIndex < length
        ? { type: 'select', index: highlightedIndex }
        : { type: 'none' }
    case 'Escape':
      return { type: 'close' }
    default:
      return { type: 'none' }
  }
}

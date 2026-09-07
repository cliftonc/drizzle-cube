/**
 * filterConfigModalUtils
 *
 * Pure helpers extracted from FilterConfigModal to keep the component's effects
 * and render flat. Behaviour is identical to the previous inline logic.
 *
 * `deriveRangeFromDateRange` lives in the shared `dateRangeUtils` module and is
 * re-exported here to keep existing import paths stable.
 */
export type { DerivedRange } from '../shared/dateRangeUtils.js';
export { deriveRangeFromDateRange } from '../shared/dateRangeUtils.js';
/** Action the value-dropdown keyboard handler should apply, decided purely. */
export type ValueKeyAction = {
    type: 'none';
} | {
    type: 'highlight';
    index: number;
} | {
    type: 'select';
    index: number;
} | {
    type: 'close';
};
/**
 * Pure keyboard-navigation logic for the filter value dropdown. Given the key
 * and current state, returns the action to apply (no side effects), so the
 * branchy decision can be unit-tested and the React handler stays a thin
 * dispatcher.
 */
export declare function resolveValueKeyboardAction(key: string, isOpen: boolean, length: number, highlightedIndex: number): ValueKeyAction;

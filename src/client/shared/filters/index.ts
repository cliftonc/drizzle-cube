/**
 * Filter module — the single home for filter types, operator definitions, and
 * add/remove/update-group manipulation logic. Consumed by both the dashboard
 * filter UI and the analysis-builder filter UI; the two surfaces differ only in
 * their value-source wiring, not in filter semantics.
 */

// Filter types (canonical declarations live in client types.ts; re-exported
// here so this module is a single import point for everything filter-related)
export type { Filter, SimpleFilter, GroupFilter, FilterOperator } from '../../types.js'

// Operator definitions
export type { FilterOperatorMeta } from './operators.js'
export { FILTER_OPERATORS, getAvailableOperators } from './operators.js'

// Operations
export {
  // type guards
  isSimpleFilter,
  isGroupFilter,
  isAndFilter,
  isOrFilter,
  // creation
  createSimpleFilter,
  createAndFilter,
  createOrFilter,
  cleanupFilters,
  // traversal
  flattenFilters,
  countFilters,
  extractFilterMembers,
  // structural manipulation
  addFilterAtPath,
  removeFilterAtIndex,
  toggleGroupType,
  findDateFilterForField,
  removeFilterForMember,
  // server-format transforms
  transformFiltersForServer,
  transformFiltersFromServer,
  // cube validation
  validateFilterForCube
} from './filterOperations.js'

/**
 * Filter module — the single home for filter types, operator definitions, and
 * add/remove/update-group manipulation logic. Consumed by both the dashboard
 * filter UI and the analysis-builder filter UI; the two surfaces differ only in
 * their value-source wiring, not in filter semantics.
 */
export type { Filter, SimpleFilter, GroupFilter, FilterOperator } from '../../types.js';
export type { FilterOperatorMeta } from './operators.js';
export { FILTER_OPERATORS, getAvailableOperators, normalizeFilterFieldType } from './operators.js';
export { isSimpleFilter, isGroupFilter, isAndFilter, isOrFilter, createSimpleFilter, createAndFilter, createOrFilter, cleanupFilters, flattenFilters, countFilters, extractFilterMembers, addFilterAtPath, removeFilterAtIndex, toggleGroupType, findDateFilterForField, removeFilterForMember, transformFiltersForServer, transformFiltersFromServer, validateFilterForCube } from './filterOperations.js';

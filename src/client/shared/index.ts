/**
 * Shared module exports
 * Common types, utilities, and components used across QueryBuilder and AnalysisBuilder
 */

// Types
export type {
  MetaField,
  MetaCube,
  MetaResponse,
  QueryAnalysis,
  PrimaryCubeSelectionReason,
  PrimaryCubeCandidate,
  PrimaryCubeAnalysis,
  JoinPathStep,
  JoinPathAnalysis,
  PreAggregationAnalysis,
  QuerySummary,
  ValidationResult,
  FilterOperatorMeta,
  DateRangeType,
  DateRangeOption,
  TimeGranularity
} from './types'

// Constants
export {
  FILTER_OPERATORS,
  DATE_RANGE_OPTIONS,
  TIME_GRANULARITIES
} from './types'

// Utility functions
export {
  // Filter type guards
  isSimpleFilter,
  isGroupFilter,
  isAndFilter,
  isOrFilter,
  // Filter manipulation
  flattenFilters,
  countFilters,
  createSimpleFilter,
  createAndFilter,
  createOrFilter,
  // Filter transformation
  transformFiltersForServer,
  transformFiltersFromServer,
  // Query utilities
  hasQueryContent,
  cleanQuery,
  cleanQueryForServer,
  transformQueryForUI,
  // Schema utilities
  getCubeNameFromField,
  getFieldType,
  getFieldTitle,
  getAvailableOperators,
  getAllFilterableFields,
  // Date range utilities
  convertDateRangeTypeToValue,
  requiresNumberInput,
  formatDateForCube
} from './utils'

// Components
export { default as QueryAnalysisPanel } from './components/QueryAnalysisPanel'

// Chart defaults (smart chart type selection and configuration)
export {
  getChartAvailability,
  getAllChartAvailability,
  selectBestChartType,
  getSmartChartDefaults,
  shouldAutoSwitchChartType,
  mergeChartConfigWithDefaults
} from './chartDefaults'

export type {
  SmartChartDefaults,
  ChartAvailability,
  ChartAvailabilityMap
} from './chartDefaults'

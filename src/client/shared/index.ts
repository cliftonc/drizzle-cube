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
} from './types.js'

// Constants
export {
  DATE_RANGE_OPTIONS,
  TIME_GRANULARITIES
} from './types.js'

// Filter module (single home for filter operators + manipulation logic)
export {
  // Operator metadata
  FILTER_OPERATORS,
  getAvailableOperators,
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
  transformFiltersFromServer
} from './filters/index.js'

// Utility functions
export {
  // Query utilities
  hasQueryContent,
  cleanQuery,
  cleanQueryForServer,
  transformQueryForUI,
  // Schema utilities
  getCubeNameFromField,
  getFieldType,
  getFieldTitle,
  getAllFilterableFields,
  // Date range utilities
  convertDateRangeTypeToValue,
  requiresNumberInput,
  formatDateForCube
} from './utils.js'

// Components
export { default as QueryAnalysisPanel } from './components/QueryAnalysisPanel.js'
export { default as CodeBlock } from './components/CodeBlock.js'

// Chart defaults (smart chart type selection and configuration)
export {
  getChartAvailability,
  getAllChartAvailability,
  selectBestChartType,
  getSmartChartDefaults,
  shouldAutoSwitchChartType,
  mergeChartConfigWithDefaults
} from './chartDefaults.js'

export type {
  SmartChartDefaults,
  ChartAvailability,
  ChartAvailabilityMap
} from './chartDefaults.js'

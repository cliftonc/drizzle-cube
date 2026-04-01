/**
 * Shared type definitions used across QueryBuilder and AnalysisBuilder
 */

import type { CubeQuery, FilterOperator } from '../types'

// ============================================================================
// Meta endpoint response types
// ============================================================================

export interface MetaField {
  name: string                      // e.g., "Employees.count"
  title: string                     // e.g., "Total Employees"
  shortTitle: string                // e.g., "Total Employees"
  type: string                      // e.g., "count", "string", "time", "number"
  description?: string              // Optional description
}

export interface MetaCubeRelationship {
  targetCube: string
  relationship: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
  joinFields?: Array<{
    sourceField: string
    targetField: string
  }>
}

export interface MetaCube {
  name: string                      // e.g., "Employees"
  title: string                     // e.g., "Employee Analytics"
  description: string               // e.g., "Employee data and metrics"
  measures: MetaField[]             // e.g., "Employees.count"
  dimensions: MetaField[]           // e.g., "Employees.name"
  segments: MetaField[]             // Currently empty in examples
  relationships?: MetaCubeRelationship[]  // Optional join relationships to other cubes
}

export interface MetaResponse {
  cubes: MetaCube[]
}

// ============================================================================
// Query warning types (from server-side query planner)
// ============================================================================

/**
 * Severity level for query warnings
 */
export type QueryWarningSeverity = 'info' | 'warning' | 'error'

/**
 * Warning emitted during query planning or execution
 * Provides user-facing feedback about potential query issues
 */
export interface QueryWarning {
  /** Unique code for programmatic handling (e.g., 'FAN_OUT_NO_DIMENSIONS') */
  code: string
  /** Human-readable warning message */
  message: string
  /** Severity level for UI styling */
  severity: QueryWarningSeverity
  /** Cubes involved in the warning (if applicable) */
  cubes?: string[]
  /** Measures involved in the warning (if applicable) */
  measures?: string[]
  /** Actionable suggestion for the user */
  suggestion?: string
}

// ============================================================================
// Query analysis types for debugging transparency
// ============================================================================

export type PrimaryCubeSelectionReason =
  | 'most_dimensions'
  | 'most_connected'
  | 'alphabetical_fallback'
  | 'single_cube'

export interface PrimaryCubeCandidate {
  cubeName: string
  dimensionCount: number
  joinCount: number
  canReachAll: boolean
}

export interface PrimaryCubeAnalysis {
  selectedCube: string
  reason: PrimaryCubeSelectionReason
  explanation: string
  candidates?: PrimaryCubeCandidate[]
}

export interface JoinPathStep {
  fromCube: string
  toCube: string
  relationship: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
  joinType: 'inner' | 'left' | 'right' | 'full'
  joinColumns: Array<{
    sourceColumn: string
    targetColumn: string
  }>
  junctionTable?: {
    tableName: string
    sourceColumns: string[]
    targetColumns: string[]
  }
}

export interface JoinPathAnalysis {
  targetCube: string
  pathFound: boolean
  path?: JoinPathStep[]
  pathLength?: number
  error?: string
  visitedCubes?: string[]
  selection?: {
    strategy: 'shortest' | 'preferred' | 'fallbackShortest'
    preferredCubes?: string[]
    selectedRank?: number
    selectedScore?: number
    candidates?: Array<{
      rank: number
      score: number
      usesPreferredJoin: boolean
      preferredCubesInPath: number
      usesProcessed: boolean
      scoreBreakdown: {
        preferredJoinBonus: number
        preferredCubeBonus: number
        lengthPenalty: number
      }
      path: JoinPathStep[]
    }>
  }
}

/**
 * Reason why a cube requires a CTE
 */
export type CTEReason = 'hasMany' | 'fanOutPrevention'

export interface PreAggregationAnalysis {
  cubeName: string
  cteAlias: string
  /** Why this cube needs a CTE (human-readable explanation) */
  reason: string
  /** Typed reason for programmatic use */
  reasonType?: CTEReason
  measures: string[]
  joinKeys: Array<{
    sourceColumn: string
    targetColumn: string
  }>
}

export interface QuerySummary {
  queryType: 'single_cube' | 'multi_cube_join' | 'multi_cube_cte'
  measureStrategy?: 'simple' | 'keysDeduplication' | 'ctePreAggregateFallback' | 'multiFactMerge'
  joinCount: number
  cteCount: number
  hasPreAggregation: boolean
}

export interface QueryAnalysis {
  timestamp: string
  cubeCount: number
  cubesInvolved: string[]
  primaryCube: PrimaryCubeAnalysis
  joinPaths: JoinPathAnalysis[]
  preAggregations: PreAggregationAnalysis[]
  querySummary: QuerySummary
  warnings?: string[]
  planningTrace?: {
    steps: Array<{
      phase: 'cube_usage' | 'primary_cube_selection' | 'join_planning' | 'cte_planning' | 'measure_strategy' | 'warnings'
      decision: string
      details?: Record<string, unknown>
    }>
  }
}

// ============================================================================
// Validation response from /dry-run endpoint
// ============================================================================

export interface ValidationResult {
  valid?: boolean              // Our custom property (may not be present in official Cube.js)
  error?: string
  query?: CubeQuery
  sql?: {
    sql: string[]
    params: any[]
  }
  queryType?: string           // Always present in successful Cube.js responses
  normalizedQueries?: any[]
  queryOrder?: string[]
  transformedQueries?: any[]
  pivotQuery?: any
  complexity?: string
  cubesUsed?: string[]
  joinType?: string
  // Query analysis for debugging transparency
  analysis?: QueryAnalysis
}

// ============================================================================
// Filter operator metadata
// ============================================================================

export interface FilterOperatorMeta {
  label: string
  description: string
  requiresValues: boolean
  supportsMultipleValues: boolean
  valueType: 'string' | 'number' | 'date' | 'boolean' | 'any'
  fieldTypes: string[] // Which field types support this operator
}

export const FILTER_OPERATORS: Record<FilterOperator, FilterOperatorMeta> = {
  // String operators
  equals: {
    label: 'filter.operator.equals.label',
    description: 'filter.operator.equals.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean', 'time']
  },
  notEquals: {
    label: 'filter.operator.notEquals.label',
    description: 'filter.operator.notEquals.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean', 'time']
  },
  contains: {
    label: 'filter.operator.contains.label',
    description: 'filter.operator.contains.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notContains: {
    label: 'filter.operator.notContains.label',
    description: 'filter.operator.notContains.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  startsWith: {
    label: 'filter.operator.startsWith.label',
    description: 'filter.operator.startsWith.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notStartsWith: {
    label: 'filter.operator.notStartsWith.label',
    description: 'filter.operator.notStartsWith.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  endsWith: {
    label: 'filter.operator.endsWith.label',
    description: 'filter.operator.endsWith.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notEndsWith: {
    label: 'filter.operator.notEndsWith.label',
    description: 'filter.operator.notEndsWith.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  like: {
    label: 'filter.operator.like.label',
    description: 'filter.operator.like.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notLike: {
    label: 'filter.operator.notLike.label',
    description: 'filter.operator.notLike.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  ilike: {
    label: 'filter.operator.ilike.label',
    description: 'filter.operator.ilike.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Numeric operators
  gt: {
    label: 'filter.operator.gt.label',
    description: 'filter.operator.gt.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  gte: {
    label: 'filter.operator.gte.label',
    description: 'filter.operator.gte.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lt: {
    label: 'filter.operator.lt.label',
    description: 'filter.operator.lt.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lte: {
    label: 'filter.operator.lte.label',
    description: 'filter.operator.lte.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  between: {
    label: 'filter.operator.between.label',
    description: 'filter.operator.between.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  notBetween: {
    label: 'filter.operator.notBetween.label',
    description: 'filter.operator.notBetween.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  // Array operators
  in: {
    label: 'filter.operator.in.label',
    description: 'filter.operator.in.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  notIn: {
    label: 'filter.operator.notIn.label',
    description: 'filter.operator.notIn.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  // Null/Empty operators
  set: {
    label: 'filter.operator.set.label',
    description: 'filter.operator.set.description',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  notSet: {
    label: 'filter.operator.notSet.label',
    description: 'filter.operator.notSet.description',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  isEmpty: {
    label: 'filter.operator.isEmpty.label',
    description: 'filter.operator.isEmpty.description',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  isNotEmpty: {
    label: 'filter.operator.isNotEmpty.label',
    description: 'filter.operator.isNotEmpty.description',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Date operators
  inDateRange: {
    label: 'filter.operator.inDateRange.label',
    description: 'filter.operator.inDateRange.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  beforeDate: {
    label: 'filter.operator.beforeDate.label',
    description: 'filter.operator.beforeDate.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  afterDate: {
    label: 'filter.operator.afterDate.label',
    description: 'filter.operator.afterDate.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  // Regex operators
  regex: {
    label: 'filter.operator.regex.label',
    description: 'filter.operator.regex.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notRegex: {
    label: 'filter.operator.notRegex.label',
    description: 'filter.operator.notRegex.description',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // PostgreSQL array operators
  arrayContains: {
    label: 'filter.operator.arrayContains.label',
    description: 'filter.operator.arrayContains.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  },
  arrayOverlaps: {
    label: 'filter.operator.arrayOverlaps.label',
    description: 'filter.operator.arrayOverlaps.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  },
  arrayContained: {
    label: 'filter.operator.arrayContained.label',
    description: 'filter.operator.arrayContained.description',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  }
}

// ============================================================================
// Date range types
// ============================================================================

export type DateRangeType =
  | 'custom'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_week'
  | 'last_month'
  | 'last_quarter'
  | 'last_year'
  | 'last_12_months'
  | 'last_n_days'
  | 'last_n_weeks'
  | 'last_n_months'
  | 'last_n_quarters'
  | 'last_n_years'

export interface DateRangeOption {
  value: DateRangeType
  label: string
}

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { value: 'custom', label: 'dateRange.custom' },
  { value: 'today', label: 'dateRange.today' },
  { value: 'yesterday', label: 'dateRange.yesterday' },
  { value: 'this_week', label: 'dateRange.thisWeek' },
  { value: 'this_month', label: 'dateRange.thisMonth' },
  { value: 'this_quarter', label: 'dateRange.thisQuarter' },
  { value: 'this_year', label: 'dateRange.thisYear' },
  { value: 'last_7_days', label: 'dateRange.last7Days' },
  { value: 'last_30_days', label: 'dateRange.last30Days' },
  { value: 'last_n_days', label: 'dateRange.lastNDays' },
  { value: 'last_week', label: 'dateRange.lastWeek' },
  { value: 'last_n_weeks', label: 'dateRange.lastNWeeks' },
  { value: 'last_month', label: 'dateRange.lastMonth' },
  { value: 'last_12_months', label: 'dateRange.last12Months' },
  { value: 'last_n_months', label: 'dateRange.lastNMonths' },
  { value: 'last_quarter', label: 'dateRange.lastQuarter' },
  { value: 'last_n_quarters', label: 'dateRange.lastNQuarters' },
  { value: 'last_year', label: 'dateRange.lastYear' },
  { value: 'last_n_years', label: 'dateRange.lastNYears' }
]

// ============================================================================
// Time dimension granularity options
// ============================================================================

export const TIME_GRANULARITIES = [
  { value: 'hour', label: 'timeGranularity.hour' },
  { value: 'day', label: 'timeGranularity.day' },
  { value: 'week', label: 'timeGranularity.week' },
  { value: 'month', label: 'timeGranularity.month' },
  { value: 'quarter', label: 'timeGranularity.quarter' },
  { value: 'year', label: 'timeGranularity.year' }
]

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

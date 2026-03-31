/**
 * Shared type definitions used across QueryBuilder and AnalysisBuilder
 */

import type { CubeQuery, FilterOperator } from '../types'
import { t } from '../../i18n/runtime'

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
    label: t('filter.operator.equals.label'),
    description: t('filter.operator.equals.description'),
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean', 'time']
  },
  notEquals: {
    label: t('filter.operator.notEquals.label'),
    description: t('filter.operator.notEquals.description'),
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean', 'time']
  },
  contains: {
    label: t('filter.operator.contains.label'),
    description: t('filter.operator.contains.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notContains: {
    label: t('filter.operator.notContains.label'),
    description: t('filter.operator.notContains.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  startsWith: {
    label: t('filter.operator.startsWith.label'),
    description: t('filter.operator.startsWith.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notStartsWith: {
    label: t('filter.operator.notStartsWith.label'),
    description: t('filter.operator.notStartsWith.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  endsWith: {
    label: t('filter.operator.endsWith.label'),
    description: t('filter.operator.endsWith.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notEndsWith: {
    label: t('filter.operator.notEndsWith.label'),
    description: t('filter.operator.notEndsWith.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  like: {
    label: t('filter.operator.like.label'),
    description: t('filter.operator.like.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notLike: {
    label: t('filter.operator.notLike.label'),
    description: t('filter.operator.notLike.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  ilike: {
    label: t('filter.operator.ilike.label'),
    description: t('filter.operator.ilike.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Numeric operators
  gt: {
    label: t('filter.operator.gt.label'),
    description: t('filter.operator.gt.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  gte: {
    label: t('filter.operator.gte.label'),
    description: t('filter.operator.gte.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lt: {
    label: t('filter.operator.lt.label'),
    description: t('filter.operator.lt.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lte: {
    label: t('filter.operator.lte.label'),
    description: t('filter.operator.lte.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  between: {
    label: t('filter.operator.between.label'),
    description: t('filter.operator.between.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  notBetween: {
    label: t('filter.operator.notBetween.label'),
    description: t('filter.operator.notBetween.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  // Array operators
  in: {
    label: t('filter.operator.in.label'),
    description: t('filter.operator.in.description'),
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  notIn: {
    label: t('filter.operator.notIn.label'),
    description: t('filter.operator.notIn.description'),
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  // Null/Empty operators
  set: {
    label: t('filter.operator.set.label'),
    description: t('filter.operator.set.description'),
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  notSet: {
    label: t('filter.operator.notSet.label'),
    description: t('filter.operator.notSet.description'),
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  isEmpty: {
    label: t('filter.operator.isEmpty.label'),
    description: t('filter.operator.isEmpty.description'),
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  isNotEmpty: {
    label: t('filter.operator.isNotEmpty.label'),
    description: t('filter.operator.isNotEmpty.description'),
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Date operators
  inDateRange: {
    label: t('filter.operator.inDateRange.label'),
    description: t('filter.operator.inDateRange.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  beforeDate: {
    label: t('filter.operator.beforeDate.label'),
    description: t('filter.operator.beforeDate.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  afterDate: {
    label: t('filter.operator.afterDate.label'),
    description: t('filter.operator.afterDate.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  // Regex operators
  regex: {
    label: t('filter.operator.regex.label'),
    description: t('filter.operator.regex.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notRegex: {
    label: t('filter.operator.notRegex.label'),
    description: t('filter.operator.notRegex.description'),
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // PostgreSQL array operators
  arrayContains: {
    label: t('filter.operator.arrayContains.label'),
    description: t('filter.operator.arrayContains.description'),
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  },
  arrayOverlaps: {
    label: t('filter.operator.arrayOverlaps.label'),
    description: t('filter.operator.arrayOverlaps.description'),
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  },
  arrayContained: {
    label: t('filter.operator.arrayContained.label'),
    description: t('filter.operator.arrayContained.description'),
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
  { value: 'custom', label: t('dateRange.custom') },
  { value: 'today', label: t('dateRange.today') },
  { value: 'yesterday', label: t('dateRange.yesterday') },
  { value: 'this_week', label: t('dateRange.thisWeek') },
  { value: 'this_month', label: t('dateRange.thisMonth') },
  { value: 'this_quarter', label: t('dateRange.thisQuarter') },
  { value: 'this_year', label: t('dateRange.thisYear') },
  { value: 'last_7_days', label: t('dateRange.last7Days') },
  { value: 'last_30_days', label: t('dateRange.last30Days') },
  { value: 'last_n_days', label: t('dateRange.lastNDays') },
  { value: 'last_week', label: t('dateRange.lastWeek') },
  { value: 'last_n_weeks', label: t('dateRange.lastNWeeks') },
  { value: 'last_month', label: t('dateRange.lastMonth') },
  { value: 'last_12_months', label: t('dateRange.last12Months') },
  { value: 'last_n_months', label: t('dateRange.lastNMonths') },
  { value: 'last_quarter', label: t('dateRange.lastQuarter') },
  { value: 'last_n_quarters', label: t('dateRange.lastNQuarters') },
  { value: 'last_year', label: t('dateRange.lastYear') },
  { value: 'last_n_years', label: t('dateRange.lastNYears') }
]

// ============================================================================
// Time dimension granularity options
// ============================================================================

export const TIME_GRANULARITIES = [
  { value: 'hour', label: t('timeGranularity.hour') },
  { value: 'day', label: t('timeGranularity.day') },
  { value: 'week', label: t('timeGranularity.week') },
  { value: 'month', label: t('timeGranularity.month') },
  { value: 'quarter', label: t('timeGranularity.quarter') },
  { value: 'year', label: t('timeGranularity.year') }
]

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

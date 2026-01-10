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
}

export interface PreAggregationAnalysis {
  cubeName: string
  cteAlias: string
  reason: string
  measures: string[]
  joinKeys: Array<{
    sourceColumn: string
    targetColumn: string
  }>
}

export interface QuerySummary {
  queryType: 'single_cube' | 'multi_cube_join' | 'multi_cube_cte'
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
    label: 'equals',
    description: 'Exact match',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean', 'time']
  },
  notEquals: {
    label: 'not equals',
    description: 'Does not match',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean', 'time']
  },
  contains: {
    label: 'contains',
    description: 'Contains text (case insensitive)',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notContains: {
    label: 'not contains',
    description: 'Does not contain text',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  startsWith: {
    label: 'starts with',
    description: 'Starts with text',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notStartsWith: {
    label: 'not starts with',
    description: 'Does not start with text',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  endsWith: {
    label: 'ends with',
    description: 'Ends with text',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notEndsWith: {
    label: 'not ends with',
    description: 'Does not end with text',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  like: {
    label: 'like',
    description: 'SQL LIKE pattern matching (case sensitive)',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notLike: {
    label: 'not like',
    description: 'SQL NOT LIKE pattern matching (case sensitive)',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  ilike: {
    label: 'ilike',
    description: 'SQL ILIKE pattern matching (case insensitive)',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Numeric operators
  gt: {
    label: 'greater than',
    description: 'Greater than value',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  gte: {
    label: 'greater than or equal',
    description: 'Greater than or equal to value',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lt: {
    label: 'less than',
    description: 'Less than value',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lte: {
    label: 'less than or equal',
    description: 'Less than or equal to value',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  between: {
    label: 'between',
    description: 'Between two values (inclusive)',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  notBetween: {
    label: 'not between',
    description: 'Not between two values',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  // Array operators
  in: {
    label: 'in',
    description: 'Matches any of the provided values',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  notIn: {
    label: 'not in',
    description: 'Does not match any of the provided values',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  // Null/Empty operators
  set: {
    label: 'is set',
    description: 'Is not null/empty',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  notSet: {
    label: 'is not set',
    description: 'Is null/empty',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  isEmpty: {
    label: 'is empty',
    description: 'Is empty string or null',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  isNotEmpty: {
    label: 'is not empty',
    description: 'Is not empty string and not null',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Date operators
  inDateRange: {
    label: 'in date range',
    description: 'Between two dates',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  beforeDate: {
    label: 'before date',
    description: 'Before specified date',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  afterDate: {
    label: 'after date',
    description: 'After specified date',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  // Regex operators
  regex: {
    label: 'matches regex',
    description: 'Matches regular expression pattern',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notRegex: {
    label: 'not matches regex',
    description: 'Does not match regular expression pattern',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // PostgreSQL array operators
  arrayContains: {
    label: 'array contains all',
    description: 'Array field contains all specified values (PostgreSQL only)',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  },
  arrayOverlaps: {
    label: 'array contains any',
    description: 'Array field contains any of the specified values (PostgreSQL only)',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'string',
    fieldTypes: ['string']
  },
  arrayContained: {
    label: 'array values in',
    description: 'All array field values are within specified values (PostgreSQL only)',
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
  { value: 'custom', label: 'Custom' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_n_days', label: 'Last N days' },
  { value: 'last_week', label: 'Last week' },
  { value: 'last_n_weeks', label: 'Last N weeks' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_12_months', label: 'Last 12 months' },
  { value: 'last_n_months', label: 'Last N months' },
  { value: 'last_quarter', label: 'Last quarter' },
  { value: 'last_n_quarters', label: 'Last N quarters' },
  { value: 'last_year', label: 'Last year' },
  { value: 'last_n_years', label: 'Last N years' }
] as const

// ============================================================================
// Time dimension granularity options
// ============================================================================

export const TIME_GRANULARITIES = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' }
] as const

export type TimeGranularity = typeof TIME_GRANULARITIES[number]['value']

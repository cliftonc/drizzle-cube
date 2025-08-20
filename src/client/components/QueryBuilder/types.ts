/**
 * Type definitions for QueryBuilder components
 */

import type { CubeQuery, FilterOperator, Filter, SimpleFilter, AndFilter, OrFilter } from '../../types'

// Meta endpoint response types
export interface MetaField {
  name: string                      // e.g., "Employees.count"
  title: string                     // e.g., "Total Employees"
  shortTitle: string                // e.g., "Total Employees"
  type: string                      // e.g., "count", "string", "time", "number"
  description?: string              // Optional description
}

export interface MetaCube {
  name: string                      // e.g., "Employees"
  title: string                     // e.g., "Employee Analytics"
  description: string               // e.g., "Employee data and metrics"
  measures: MetaField[]             // e.g., "Employees.count"
  dimensions: MetaField[]           // e.g., "Employees.name"
  segments: MetaField[]             // Currently empty in examples
}

export interface MetaResponse {
  cubes: MetaCube[]
}

// Query builder state types
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'
export type ExecutionStatus = 'idle' | 'loading' | 'success' | 'error'
export type SchemaStatus = 'idle' | 'loading' | 'success' | 'error'

export interface QueryBuilderState {
  query: CubeQuery                 // Current query being built
  schema: MetaResponse | null      // Schema from /meta endpoint
  schemaStatus: SchemaStatus       // Status of schema loading
  schemaError: string | null       // Error from schema loading
  validationStatus: ValidationStatus
  validationError: string | null
  validationSql: { sql: string[], params: any[] } | null     // Generated SQL from validation
  executionStatus: ExecutionStatus
  executionResults: any[] | null
  executionError: string | null
  totalRowCount: number | null     // Total rows without limit
  totalRowCountStatus: 'idle' | 'loading' | 'success' | 'error'
}

// Validation response from /dry-run endpoint
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
  // Additional validation metadata can be added here
}

// API Configuration
export interface ApiConfig {
  baseApiUrl: string               // Base URL for Cube API (default: '/cubejs-api/v1')
  apiToken: string                 // API token for authentication (default: empty)
}

// Component props
export interface QueryBuilderProps {
  baseUrl: string                  // Configurable Cube API base URL
  className?: string               // Optional CSS classes
  initialQuery?: CubeQuery         // Initial query to load (overrides localStorage)
  disableLocalStorage?: boolean    // Disable localStorage persistence
  hideSettings?: boolean           // Hide the settings/configuration button
}

export interface QueryBuilderRef {
  getCurrentQuery: () => CubeQuery
  getValidationState: () => { status: ValidationStatus, result?: ValidationResult }
  getValidationResult: () => ValidationResult | null
}

export interface CubeMetaExplorerProps {
  schema: MetaResponse | null
  schemaStatus: SchemaStatus
  schemaError: string | null
  selectedFields: {
    measures: string[]
    dimensions: string[]
    timeDimensions: string[]
  }
  onFieldSelect: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onFieldDeselect: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onRetrySchema?: () => void
  onOpenSettings?: () => void
}

export interface QueryPanelProps {
  query: CubeQuery
  schema: MetaResponse | null
  validationStatus: ValidationStatus
  validationError: string | null
  validationSql: { sql: string[], params: any[] } | null
  onValidate: () => void
  onExecute: () => void
  onRemoveField: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onTimeDimensionGranularityChange: (dimensionName: string, granularity: string) => void
  onFiltersChange: (filters: Filter[]) => void
  onClearQuery?: () => void
  showSettings?: boolean           // Show the settings/configuration button
  onSettingsClick?: () => void     // Handler for settings button click
}

export interface ResultsPanelProps {
  executionStatus: ExecutionStatus
  executionResults: any[] | null
  executionError: string | null
  query: CubeQuery
  displayLimit?: number
  onDisplayLimitChange?: (limit: number) => void
  totalRowCount?: number | null
  totalRowCountStatus?: 'idle' | 'loading' | 'success' | 'error'
}

// Time dimension granularity options
export const TIME_GRANULARITIES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' }
] as const

export type TimeGranularity = typeof TIME_GRANULARITIES[number]['value']

// Filter operator metadata
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
    label: 'Equals',
    description: 'Exact match',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  notEquals: {
    label: 'Not equals',
    description: 'Does not match',
    requiresValues: true,
    supportsMultipleValues: true,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'boolean']
  },
  contains: {
    label: 'Contains',
    description: 'Contains text (case insensitive)',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  notContains: {
    label: 'Not contains',
    description: 'Does not contain text',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  startsWith: {
    label: 'Starts with',
    description: 'Starts with text',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  endsWith: {
    label: 'Ends with',
    description: 'Ends with text',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'string',
    fieldTypes: ['string']
  },
  // Numeric operators
  gt: {
    label: 'Greater than',
    description: 'Greater than value',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  gte: {
    label: 'Greater than or equal',
    description: 'Greater than or equal to value',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lt: {
    label: 'Less than',
    description: 'Less than value',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  lte: {
    label: 'Less than or equal',
    description: 'Less than or equal to value',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max']
  },
  // Null operators
  set: {
    label: 'Is set',
    description: 'Is not null/empty',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  notSet: {
    label: 'Is not set',
    description: 'Is null/empty',
    requiresValues: false,
    supportsMultipleValues: false,
    valueType: 'any',
    fieldTypes: ['string', 'number', 'time', 'boolean']
  },
  // Date operators
  inDateRange: {
    label: 'In date range',
    description: 'Between two dates',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  beforeDate: {
    label: 'Before date',
    description: 'Before specified date',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  },
  afterDate: {
    label: 'After date',
    description: 'After specified date',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'date',
    fieldTypes: ['time']
  }
}

// Filter builder component props
export interface FilterBuilderProps {
  filters: Filter[]
  schema: MetaResponse | null
  onFiltersChange: (filters: Filter[]) => void
}

export interface FilterItemProps {
  filter: SimpleFilter
  index: number
  onFilterChange: (index: number, filter: SimpleFilter) => void
  onFilterRemove: (index: number) => void
  schema: MetaResponse | null
}

export interface FilterGroupProps {
  group: AndFilter | OrFilter
  index: number
  onGroupChange: (index: number, group: AndFilter | OrFilter) => void
  onGroupRemove: (index: number) => void
  schema: MetaResponse | null
  depth: number
}

export interface FilterValueSelectorProps {
  fieldName: string
  operator: FilterOperator
  values: any[]
  onValuesChange: (values: any[]) => void
}
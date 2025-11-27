/**
 * Type definitions for QueryBuilder components
 */

import type { CubeQuery, FilterOperator, Filter, SimpleFilter, GroupFilter } from '../../types'

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
  onExpandSchema?: (expanded: boolean) => void
  onViewTypeChange?: (viewType: 'tree' | 'diagram') => void
  isExpanded?: boolean
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
  onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void
  onDateRangeRemove: (timeDimension: string) => void
  onOrderChange: (fieldName: string, direction: 'asc' | 'desc' | null) => void
  onClearQuery?: () => void
  showSettings?: boolean           // Show the settings/configuration button
  onSettingsClick?: () => void     // Handler for settings button click
  onAIAssistantClick?: () => void  // Handler for AI Assistant button click
  onSchemaClick?: () => void       // Handler for Schema button click
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
  { value: 'hour', label: 'Hour' },
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
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max', 'time']
  },
  notBetween: {
    label: 'not between',
    description: 'Not between two values',
    requiresValues: true,
    supportsMultipleValues: false,
    valueType: 'number',
    fieldTypes: ['number', 'count', 'sum', 'avg', 'min', 'max', 'time']
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
  }
}

// Filter builder component props
export interface FilterBuilderProps {
  filters: Filter[]
  schema: MetaResponse | null
  query: CubeQuery
  onFiltersChange: (filters: Filter[]) => void
  hideFieldSelector?: boolean // Hide the field selector (for universal time filters)
}

export interface FilterItemProps {
  filter: SimpleFilter
  index: number
  onFilterChange: (index: number, filter: SimpleFilter) => void
  onFilterRemove: (index: number) => void
  schema: MetaResponse | null
  query: CubeQuery
  hideFieldSelector?: boolean // Hide the field selector (for read-only filters)
  hideOperatorSelector?: boolean // Hide the operator selector (for read-only filters)
  hideRemoveButton?: boolean // Hide the remove button (for read-only filters)
}

export interface FilterGroupProps {
  group: GroupFilter
  index: number
  onGroupChange: (index: number, group: GroupFilter) => void
  onGroupChangeWithUnwrap?: (index: number, group: GroupFilter) => void
  onGroupRemove: (index: number) => void
  schema: MetaResponse | null
  query: CubeQuery
  depth: number
}

export interface FilterValueSelectorProps {
  fieldName: string
  operator: FilterOperator
  values: any[]
  onValuesChange: (values: any[]) => void
  schema: MetaResponse | null
}

// Date range types
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

export interface DateRangeFilter {
  id: string
  timeDimension: string
  rangeType: DateRangeType
  startDate?: string
  endDate?: string
}

// Date range component props
export interface DateRangeSelectorProps {
  timeDimensions: string[]
  onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void
  onDateRangeRemove: (timeDimension: string) => void
  currentDateRanges: Record<string, string | string[]>
}

export interface DateRangeFilterProps {
  timeDimensions: Array<{ dimension: string; granularity?: string; dateRange?: string | string[] }>
  onDateRangeChange: (timeDimension: string, dateRange: string | string[]) => void
  onDateRangeRemove: (timeDimension: string) => void
}
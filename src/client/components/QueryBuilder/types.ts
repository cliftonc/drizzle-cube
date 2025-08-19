/**
 * Type definitions for QueryBuilder components
 */

import type { CubeQuery } from '../../types'

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
  valid: boolean
  error?: string
  query?: CubeQuery
  sql?: {
    sql: string[]
    params: any[]
  }
  queryType?: string
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
  validationStatus: ValidationStatus
  validationError: string | null
  validationSql: { sql: string[], params: any[] } | null
  onValidate: () => void
  onExecute: () => void
  onRemoveField: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onTimeDimensionGranularityChange: (dimensionName: string, granularity: string) => void
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
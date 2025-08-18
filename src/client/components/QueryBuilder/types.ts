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

export interface QueryBuilderState {
  query: CubeQuery                 // Current query being built
  schema: MetaResponse | null      // Schema from /meta endpoint
  validationStatus: ValidationStatus
  validationError: string | null
  executionStatus: ExecutionStatus
  executionResults: any[] | null
  executionError: string | null
}

// Validation response from /dry-run endpoint
export interface ValidationResult {
  valid: boolean
  error?: string
  query?: CubeQuery
  // Additional validation metadata can be added here
}

// Component props
export interface QueryBuilderProps {
  baseUrl: string                  // Configurable Cube API base URL
  className?: string               // Optional CSS classes
  onQueryChange?: (query: CubeQuery) => void  // Optional callback for query changes
}

export interface CubeMetaExplorerProps {
  schema: MetaResponse | null
  selectedFields: {
    measures: string[]
    dimensions: string[]
    timeDimensions: string[]
  }
  onFieldSelect: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onFieldDeselect: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
}

export interface QueryPanelProps {
  query: CubeQuery
  validationStatus: ValidationStatus
  validationError: string | null
  onValidate: () => void
  onExecute: () => void
  onRemoveField: (fieldName: string, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => void
  onTimeDimensionGranularityChange: (dimensionName: string, granularity: string) => void
}

export interface ResultsPanelProps {
  executionStatus: ExecutionStatus
  executionResults: any[] | null
  executionError: string | null
  query: CubeQuery
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
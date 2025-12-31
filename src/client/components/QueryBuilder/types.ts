/**
 * Type definitions for QueryBuilder components
 *
 * DEPRECATED: QueryBuilder has been replaced by AnalysisBuilder
 *
 * This file is kept for backward compatibility with QueryBuilderShim only.
 *
 * - QueryBuilder UI components have been removed
 * - Shared filter/schema components moved to ../shared/
 * - Core types are in ../../shared/types.ts
 * - New code should use AnalysisBuilder instead
 */

import type { CubeQuery, FilterOperator, Filter, SimpleFilter, GroupFilter, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../types'

// Re-export shared types for backward compatibility
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
} from '../../shared/types'

export {
  FILTER_OPERATORS,
  DATE_RANGE_OPTIONS,
  TIME_GRANULARITIES
} from '../../shared/types'

// Query builder state types
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'
export type ExecutionStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error'
export type SchemaStatus = 'idle' | 'loading' | 'success' | 'error'

export interface QueryBuilderState {
  query: CubeQuery                 // Current query being built
  validationStatus: ValidationStatus
  validationError: string | null
  validationSql: { sql: string[], params: any[] } | null     // Generated SQL from validation
  executionStatus: ExecutionStatus
  executionResults: any[] | null
  executionError: string | null
  totalRowCount: number | null     // Total rows without limit
  totalRowCountStatus: 'idle' | 'loading' | 'success' | 'error'
  resultsStale: boolean
}

// Import shared types for use in this file
import type { MetaResponse, QueryAnalysis, ValidationResult } from '../../shared/types'

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
  enableSharing?: boolean          // Enable share analysis button (default: false)
  onShare?: (url: string) => void  // Callback when share URL is generated
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

// Share button states
export type ShareButtonState = 'idle' | 'copied' | 'copied-no-chart'

export interface QueryPanelProps {
  query: CubeQuery
  schema: MetaResponse | null
  validationStatus: ValidationStatus
  validationError: string | null
  validationSql: { sql: string[], params: any[] } | null
  validationAnalysis?: QueryAnalysis | null  // Query analysis for debugging transparency
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
  onShareClick?: () => void        // Handler for share button click
  canShare?: boolean               // Whether share action is enabled
  shareButtonState?: ShareButtonState  // Current state of share button
  isViewingShared?: boolean        // Whether viewing a shared analysis
}

// Available fields for chart configuration (derived from validation result)
export interface AvailableFields {
  dimensions: string[]
  timeDimensions: string[]
  measures: string[]
}

export interface ResultsPanelProps {
  executionStatus: ExecutionStatus
  executionResults: any[] | null
  executionError: string | null
  resultsStale?: boolean
  query: CubeQuery
  displayLimit?: number
  onDisplayLimitChange?: (limit: number) => void
  totalRowCount?: number | null
  totalRowCountStatus?: 'idle' | 'loading' | 'success' | 'error'

  // Chart visualization props
  chartType?: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  availableFields?: AvailableFields | null
  onChartTypeChange?: (type: ChartType) => void
  onChartConfigChange?: (config: ChartAxisConfig) => void
  onDisplayConfigChange?: (config: ChartDisplayConfig) => void

  // View state props
  activeView?: 'table' | 'chart'
  onActiveViewChange?: (view: 'table' | 'chart') => void
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

// Import DateRangeType for use in interfaces
import type { DateRangeType } from '../../shared/types'

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

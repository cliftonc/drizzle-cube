/**
 * Type definitions for AnalysisBuilder components
 *
 * AnalysisBuilder is a redesigned query builder with:
 * - Results panel on the left (large)
 * - Query builder panel on the right
 * - Search-based field selection via modal
 * - Sections: Metrics (measures), Breakdown (dimensions), Filters
 */

import type React from 'react'
import type {
  CubeQuery,
  Filter,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig
} from '../../types'
import type { ColorPalette } from '../../utils/colorPalettes'
import type { MetaResponse, MetaField, MetaCube, QueryAnalysis } from '../../shared/types'
import type { ChartAvailabilityMap } from '../../shared/chartDefaults'

// Re-export types from shared for convenience
export type { MetaResponse, MetaField, MetaCube, QueryAnalysis }

// ============================================================================
// Metric and Breakdown Items
// ============================================================================

/**
 * A selected metric (measure) with a letter label (A, B, C, ...)
 */
export interface MetricItem {
  /** Unique identifier for this metric selection */
  id: string
  /** Full field name, e.g., "Employees.count" */
  field: string
  /** Display label (A, B, C, ...) */
  label: string
}

/**
 * A selected breakdown (dimension or time dimension)
 */
export interface BreakdownItem {
  /** Unique identifier for this breakdown selection */
  id: string
  /** Full field name, e.g., "Employees.departmentName" */
  field: string
  /** Granularity for time dimensions (day, week, month, quarter, year) */
  granularity?: string
  /** Whether this is a time dimension */
  isTimeDimension: boolean
}

// ============================================================================
// State Types
// ============================================================================

/** Validation status for query building */
export type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

/** Execution status for query results */
export type ExecutionStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error'

/**
 * Main state for the AnalysisBuilder component
 */
export interface AnalysisBuilderState {
  /** Selected metrics (measures) */
  metrics: MetricItem[]
  /** Selected breakdowns (dimensions and time dimensions) */
  breakdowns: BreakdownItem[]
  /** Applied filters */
  filters: Filter[]

  // Validation state
  validationStatus: ValidationStatus
  validationError: string | null

  // Execution state
  executionStatus: ExecutionStatus
  executionResults: any[] | null
  executionError: string | null
  totalRowCount: number | null

  // Stale indicator (query changed since last execution)
  resultsStale: boolean
}

/**
 * State for the AI query generation panel
 */
export interface AIState {
  /** Whether the AI panel is open */
  isOpen: boolean
  /** User's natural language prompt */
  userPrompt: string
  /** Whether a query is being generated */
  isGenerating: boolean
  /** Error message from generation */
  error: string | null
  /** Whether the AI has generated a query that's been loaded */
  hasGeneratedQuery: boolean
  /** Snapshot of state before AI was opened (for undo) */
  previousState: {
    metrics: MetricItem[]
    breakdowns: BreakdownItem[]
    filters: Filter[]
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  } | null
}

// ============================================================================
// Field Search Modal Types
// ============================================================================

/**
 * Mode for the field search modal - determines which field types are shown
 */
export type FieldSearchMode = 'metrics' | 'breakdown' | 'filter'

/**
 * Field type categorization
 */
export type FieldType = 'measure' | 'dimension' | 'timeDimension'

/**
 * A field option for display in the search modal
 */
export interface FieldOption {
  /** Full field name, e.g., "Employees.count" */
  name: string
  /** Display title */
  title: string
  /** Short title for compact display */
  shortTitle: string
  /** Field type (count, sum, avg, string, time, number, etc.) */
  type: string
  /** Optional description */
  description?: string
  /** Parent cube name */
  cubeName: string
  /** Categorized field type */
  fieldType: FieldType
}

/**
 * Props for the FieldSearchModal component
 */
export interface FieldSearchModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** Callback when a field is selected. keepOpen=true when shift-click multi-selecting */
  onSelect: (field: MetaField, fieldType: FieldType, cubeName: string, keepOpen?: boolean) => void
  /** Mode determines which field types to show */
  mode: FieldSearchMode
  /** Schema metadata */
  schema: MetaResponse | null
  /** Already selected field names (to show checkmarks) */
  selectedFields: string[]
  /** Recently used field names */
  recentFields?: string[]
}

/**
 * Props for the FieldSearchItem component
 */
export interface FieldSearchItemProps {
  /** Field data */
  field: FieldOption
  /** Whether this field is selected */
  isSelected: boolean
  /** Whether this field is focused/highlighted */
  isFocused: boolean
  /** Click handler - receives mouse event for shift-click multi-select */
  onClick: (e: React.MouseEvent) => void
  /** Mouse enter handler (for detail panel) */
  onMouseEnter: () => void
}

/**
 * Props for the FieldDetailPanel component
 */
export interface FieldDetailPanelProps {
  /** Field to display details for */
  field: FieldOption | null
}

// ============================================================================
// Panel Component Props
// ============================================================================

/**
 * Tab options for the query panel
 */
export type QueryPanelTab = 'query' | 'chart' | 'display'

/**
 * Props for the AnalysisQueryPanel component
 */
export interface AnalysisQueryPanelProps {
  /** Selected metrics */
  metrics: MetricItem[]
  /** Selected breakdowns */
  breakdowns: BreakdownItem[]
  /** Applied filters */
  filters: Filter[]
  /** Schema metadata */
  schema: MetaResponse | null

  /** Currently active tab */
  activeTab: QueryPanelTab
  /** Callback when active tab changes */
  onActiveTabChange: (tab: QueryPanelTab) => void

  // Metric actions
  onAddMetric: () => void
  onRemoveMetric: (id: string) => void
  onReorderMetrics?: (fromIndex: number, toIndex: number) => void

  // Breakdown actions
  onAddBreakdown: () => void
  onRemoveBreakdown: (id: string) => void
  onBreakdownGranularityChange: (id: string, granularity: string) => void
  onReorderBreakdowns?: (fromIndex: number, toIndex: number) => void

  // Filter actions
  onFiltersChange: (filters: Filter[]) => void
  onDropFieldToFilter?: (field: string) => void

  // Sorting
  /** Current sort order */
  order?: Record<string, 'asc' | 'desc'>
  /** Callback when sort order changes */
  onOrderChange: (fieldName: string, direction: 'asc' | 'desc' | null) => void

  // Chart configuration
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  /** Color palette for display config options */
  colorPalette?: ColorPalette
  /** Map of chart type availability for disabling unavailable chart types */
  chartAvailability?: ChartAvailabilityMap
  onChartTypeChange: (type: ChartType) => void
  onChartConfigChange: (config: ChartAxisConfig) => void
  onDisplayConfigChange: (config: ChartDisplayConfig) => void

  // Validation state (for showing errors)
  validationStatus: ValidationStatus
  validationError: string | null
}

/**
 * Props for the AnalysisResultsPanel component
 */
export interface AnalysisResultsPanelProps {
  /** Current execution status */
  executionStatus: ExecutionStatus
  /** Execution results (raw data) */
  executionResults: any[] | null
  /** Execution error message */
  executionError: string | null
  /** Total row count (before limit) */
  totalRowCount: number | null
  /** Whether results are stale (query changed) */
  resultsStale: boolean

  /** Chart type for visualization */
  chartType: ChartType
  /** Chart axis configuration */
  chartConfig: ChartAxisConfig
  /** Chart display configuration */
  displayConfig: ChartDisplayConfig
  /** Color palette for charts */
  colorPalette?: ColorPalette
  /** Current palette name (for selector) */
  currentPaletteName?: string
  /** Callback when color palette changes (shows selector when provided) */
  onColorPaletteChange?: (paletteName: string) => void

  /** Current query object (for annotation/metadata) */
  query: CubeQuery
  /** Schema metadata */
  schema: MetaResponse | null

  /** Active view (table or chart) */
  activeView: 'table' | 'chart'
  /** Callback when active view changes */
  onActiveViewChange: (view: 'table' | 'chart') => void

  /** Display limit for table */
  displayLimit: number
  /** Callback when display limit changes */
  onDisplayLimitChange: (limit: number) => void

  /** Whether the query has metrics (measures) - needed to enable/disable chart view */
  hasMetrics: boolean

  // Debug information (from dry-run)
  debugQuery?: CubeQuery | null
  debugSql?: { sql: string; params: any[] } | null
  debugAnalysis?: QueryAnalysis | null
  debugLoading?: boolean
  debugError?: string | null

  // Share functionality
  onShareClick?: () => void
  canShare?: boolean
  shareButtonState?: 'idle' | 'copied' | 'copied-no-chart'

  // Clear functionality
  onClearClick?: () => void
  canClear?: boolean

  // AI functionality
  enableAI?: boolean
  isAIOpen?: boolean
  onAIToggle?: () => void
}

// ============================================================================
// Section Component Props
// ============================================================================

/**
 * Props for the MetricsSection component
 */
export interface MetricsSectionProps {
  /** Selected metrics */
  metrics: MetricItem[]
  /** Schema for resolving field titles */
  schema: MetaResponse | null
  /** Add metric handler */
  onAdd: () => void
  /** Remove metric handler */
  onRemove: (id: string) => void
  /** Whether the section is expanded */
  isExpanded?: boolean
  /** Toggle expansion */
  onToggleExpanded?: () => void
  /** Current sort order */
  order?: Record<string, 'asc' | 'desc'>
  /** Callback when sort order changes */
  onOrderChange?: (fieldName: string, direction: 'asc' | 'desc' | null) => void
  /** Callback when metrics are reordered via drag/drop */
  onReorder?: (fromIndex: number, toIndex: number) => void
  /** Callback when a metric is dragged to the filter section */
  onDragToFilter?: (field: string) => void
}

/**
 * Props for the BreakdownSection component
 */
export interface BreakdownSectionProps {
  /** Selected breakdowns */
  breakdowns: BreakdownItem[]
  /** Schema for resolving field titles */
  schema: MetaResponse | null
  /** Add breakdown handler */
  onAdd: () => void
  /** Remove breakdown handler */
  onRemove: (id: string) => void
  /** Change granularity for time dimension */
  onGranularityChange: (id: string, granularity: string) => void
  /** Whether the section is expanded */
  isExpanded?: boolean
  /** Toggle expansion */
  onToggleExpanded?: () => void
  /** Current sort order */
  order?: Record<string, 'asc' | 'desc'>
  /** Callback when sort order changes */
  onOrderChange?: (fieldName: string, direction: 'asc' | 'desc' | null) => void
  /** Callback when breakdowns are reordered via drag/drop */
  onReorder?: (fromIndex: number, toIndex: number) => void
  /** Callback when a breakdown is dragged to the filter section */
  onDragToFilter?: (field: string) => void
}

/**
 * Props for MetricItemCard component
 */
export interface MetricItemCardProps {
  /** Metric item data */
  metric: MetricItem
  /** Field metadata (for title, description) */
  fieldMeta: MetaField | null
  /** Remove handler */
  onRemove: () => void
  /** Current sort direction for this field */
  sortDirection?: 'asc' | 'desc' | null
  /** Sort priority (1, 2, 3...) if sorted */
  sortPriority?: number
  /** Toggle sort handler */
  onToggleSort?: () => void
  /** Index in the list (for drag/drop) */
  index?: number
  /** Whether this item is being dragged */
  isDragging?: boolean
  /** Whether dragging over this item */
  isDragOver?: boolean
  /** Drag start handler */
  onDragStart?: (e: React.DragEvent, index: number) => void
  /** Drag over handler */
  onDragOver?: (e: React.DragEvent, index: number) => void
  /** Drop handler */
  onDrop?: (e: React.DragEvent, index: number) => void
  /** Drag end handler */
  onDragEnd?: () => void
}

/**
 * Props for BreakdownItemCard component
 */
export interface BreakdownItemCardProps {
  /** Breakdown item data */
  breakdown: BreakdownItem
  /** Field metadata (for title, description) */
  fieldMeta: MetaField | null
  /** Remove handler */
  onRemove: () => void
  /** Granularity change handler (for time dimensions) */
  onGranularityChange?: (granularity: string) => void
  /** Current sort direction for this field */
  sortDirection?: 'asc' | 'desc' | null
  /** Sort priority (1, 2, 3...) if sorted */
  sortPriority?: number
  /** Toggle sort handler */
  onToggleSort?: () => void
  /** Index in the list (for drag/drop) */
  index?: number
  /** Whether this item is being dragged */
  isDragging?: boolean
  /** Whether dragging over this item */
  isDragOver?: boolean
  /** Drag start handler */
  onDragStart?: (e: React.DragEvent, index: number) => void
  /** Drag over handler */
  onDragOver?: (e: React.DragEvent, index: number) => void
  /** Drop handler */
  onDrop?: (e: React.DragEvent, index: number) => void
  /** Drag end handler */
  onDragEnd?: () => void
}

// ============================================================================
// Main Component Props
// ============================================================================

/**
 * Props for the main AnalysisBuilder component
 */
export interface AnalysisBuilderProps {
  /** Additional CSS classes */
  className?: string
  /** Maximum height for the component (e.g., '800px', '100vh', 'calc(100vh - 64px)') */
  maxHeight?: string
  /** Initial query to load */
  initialQuery?: CubeQuery
  /** Initial chart configuration (for editing existing portlets) */
  initialChartConfig?: {
    chartType?: ChartType
    chartConfig?: ChartAxisConfig
    displayConfig?: ChartDisplayConfig
  }
  /** Initial data to display (avoids re-fetching when editing existing portlets) */
  initialData?: any[]
  /** Color palette for chart visualization */
  colorPalette?: ColorPalette
  /** Disable localStorage persistence */
  disableLocalStorage?: boolean
  /** Hide settings button */
  hideSettings?: boolean
  /** Callback when query changes (for modal integration) */
  onQueryChange?: (query: CubeQuery) => void
  /** Callback when chart config changes */
  onChartConfigChange?: (config: { chartType: ChartType; chartConfig: ChartAxisConfig; displayConfig: ChartDisplayConfig }) => void
}

/**
 * Ref interface for AnalysisBuilder (for external access)
 */
export interface AnalysisBuilderRef {
  /** Get the current query object */
  getCurrentQuery: () => CubeQuery
  /** Get current chart configuration */
  getChartConfig: () => { chartType: ChartType; chartConfig: ChartAxisConfig; displayConfig: ChartDisplayConfig }
  /** Execute the current query */
  executeQuery: () => void
  /** Clear the current query */
  clearQuery: () => void
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Local storage state shape for persistence
 */
export interface AnalysisBuilderStorageState {
  metrics: MetricItem[]
  breakdowns: BreakdownItem[]
  filters: Filter[]
  order?: Record<string, 'asc' | 'desc'>
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  activeView: 'table' | 'chart'
}

/**
 * Recent fields storage shape
 */
export interface RecentFieldsStorage {
  metrics: string[]
  breakdowns: string[]
}

/**
 * Time granularity options
 */
export const TIME_GRANULARITIES = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' }
] as const

export type TimeGranularity = typeof TIME_GRANULARITIES[number]['value']

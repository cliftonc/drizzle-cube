/**
 * Type definitions for AnalysisBuilder components
 *
 * AnalysisBuilder is a redesigned query builder with:
 * - Results panel on the left (large)
 * - Query builder panel on the right
 * - Search-based field selection via modal
 * - Sections: Metrics (measures), Breakdown (dimensions), Filters
 */

import type { MouseEvent, DragEvent } from 'react'
import type {
  CubeQuery,
  Filter,
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig,
  MultiQueryConfig,
  QueryMergeStrategy,
  FunnelBindingKey,
  AnalysisType,
  FunnelStepState,
} from '../../types'
import type { ColorPalette } from '../../utils/colorPalettes'
import type { MetaResponse, MetaField, MetaCube, QueryAnalysis } from '../../shared/types'
import type { ChartAvailabilityMap } from '../../shared/chartDefaults'
import type { MultiQueryValidationResult } from '../../utils/multiQueryValidation'
import type { ValidationResult } from '../../adapters/modeAdapter'

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
  /** Enable period comparison for time dimensions (compares current filter period vs prior period) */
  enableComparison?: boolean
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
 *
 * Note: Execution state (results, loading, error) is NOT stored here.
 * All server state is managed by TanStack Query. This state only contains
 * client-side configuration (metrics, breakdowns, filters, validation).
 */
export interface AnalysisBuilderState {
  /** Selected metrics (measures) */
  metrics: MetricItem[]
  /** Selected breakdowns (dimensions and time dimensions) */
  breakdowns: BreakdownItem[]
  /** Applied filters */
  filters: Filter[]
  /** Sort order for this query (field name -> 'asc' | 'desc') */
  order?: Record<string, 'asc' | 'desc'>

  // Validation state (client-side query validation)
  validationStatus: ValidationStatus
  validationError: string | null
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
    /** Analysis type for restoring mode on cancel */
    analysisType?: AnalysisType
  } | null
  /** Full AnalysisConfig snapshot for complete restore (handles funnel mode properly) */
  previousConfig?: import('../../types/analysisConfig').AnalysisConfig | null
}

// ============================================================================
// Field Search Modal Types
// ============================================================================

/**
 * Mode for the field search modal - determines which field types are shown
 * - 'metrics': Only measures
 * - 'breakdown': Only dimensions (including time dimensions)
 * - 'filter': Both measures and dimensions
 * - 'dimensionFilter': Only dimensions (for funnel step filters where measures don't work)
 */
export type FieldSearchMode = 'metrics' | 'breakdown' | 'filter' | 'dimensionFilter'

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
  onClick: (e: MouseEvent) => void
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
 * Tab options for the funnel panel
 */
export type FunnelPanelTab = 'steps' | 'display'

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
  onBreakdownComparisonToggle?: (id: string) => void
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

  // Multi-query props
  /** Number of queries (determines single vs multi-query display) */
  queryCount?: number
  /** Index of the currently active query tab */
  activeQueryIndex?: number
  /** Strategy for merging results from multiple queries */
  mergeStrategy?: QueryMergeStrategy
  /** Callback when active query tab changes */
  onActiveQueryChange?: (index: number) => void
  /** Callback to add a new query */
  onAddQuery?: () => void
  /** Callback to remove a query at specified index */
  onRemoveQuery?: (index: number) => void
  /** Callback when merge strategy changes */
  onMergeStrategyChange?: (strategy: QueryMergeStrategy) => void
  /** Whether breakdowns are locked (synced from Q1 in merge mode) */
  breakdownsLocked?: boolean
  /** Combined metrics from all queries (for chart config in multi-query mode) */
  combinedMetrics?: MetricItem[]
  /** Combined breakdowns from all queries (for chart config in multi-query mode) */
  combinedBreakdowns?: BreakdownItem[]
  /** Validation result for multi-query mode (errors and warnings) */
  multiQueryValidation?: MultiQueryValidationResult | null
  /** Validation result from adapter (NEW - Phase 5) */
  adapterValidation?: ValidationResult | null

  // Funnel-specific props (when mergeStrategy === 'funnel')
  /** Binding key dimension that links funnel steps together */
  funnelBindingKey?: FunnelBindingKey | null
  /** Callback when funnel binding key changes */
  onFunnelBindingKeyChange?: (bindingKey: FunnelBindingKey | null) => void

  // Analysis Type props (explicit mode selection)
  /** Current analysis type (query, multi, funnel) */
  analysisType?: AnalysisType
  /** Callback when analysis type changes */
  onAnalysisTypeChange?: (type: AnalysisType) => void

  // Funnel Mode props (when analysisType === 'funnel')
  /** Selected cube for funnel mode (all steps use this cube) */
  funnelCube?: string | null
  /** Dedicated funnel steps (separate from queryStates) */
  funnelSteps?: FunnelStepState[]
  /** Index of currently active funnel step */
  activeFunnelStepIndex?: number
  /** Time dimension for funnel temporal ordering */
  funnelTimeDimension?: string | null
  /** Callback when funnel cube changes */
  onFunnelCubeChange?: (cube: string | null) => void
  /** Add a new funnel step */
  onAddFunnelStep?: () => void
  /** Remove a funnel step by index */
  onRemoveFunnelStep?: (index: number) => void
  /** Update a funnel step by index */
  onUpdateFunnelStep?: (index: number, updates: Partial<FunnelStepState>) => void
  /** Set the active funnel step index */
  onSelectFunnelStep?: (index: number) => void
  /** Reorder funnel steps */
  onReorderFunnelSteps?: (fromIndex: number, toIndex: number) => void
  /** Set the time dimension for funnel */
  onFunnelTimeDimensionChange?: (dimension: string | null) => void
  /** Funnel display config (for Display tab in funnel mode) */
  funnelDisplayConfig?: ChartDisplayConfig
  /** Callback when funnel display config changes */
  onFunnelDisplayConfigChange?: (config: ChartDisplayConfig) => void

  // Flow Mode props (when analysisType === 'flow')
  /** Selected cube for flow analysis */
  flowCube?: string | null
  /** Binding key for flow mode (entity linking) */
  flowBindingKey?: FunnelBindingKey | null
  /** Time dimension for flow mode (event ordering) */
  flowTimeDimension?: string | null
  /** Event dimension for flow mode (node labels in Sankey) */
  eventDimension?: string | null
  /** Starting step configuration for flow mode */
  startingStep?: import('../../types/flow').FlowStartingStep
  /** Number of steps to explore before starting step */
  stepsBefore?: number
  /** Number of steps to explore after starting step */
  stepsAfter?: number
  /** Join strategy for flow execution */
  flowJoinStrategy?: 'auto' | 'lateral' | 'window'
  /** Callback when flow cube changes */
  onFlowCubeChange?: (cube: string | null) => void
  /** Callback when flow binding key changes */
  onFlowBindingKeyChange?: (key: FunnelBindingKey | null) => void
  /** Callback when flow time dimension changes */
  onFlowTimeDimensionChange?: (dim: string | null) => void
  /** Callback when event dimension changes */
  onEventDimensionChange?: (dim: string | null) => void
  /** Callback when starting step filters change */
  onStartingStepFiltersChange?: (filters: Filter[]) => void
  /** Callback when steps before changes */
  onStepsBeforeChange?: (count: number) => void
  /** Callback when steps after changes */
  onStepsAfterChange?: (count: number) => void
  /** Callback when join strategy changes */
  onFlowJoinStrategyChange?: (strategy: 'auto' | 'lateral' | 'window') => void
  /** Flow display config (for Display tab in flow mode) */
  flowDisplayConfig?: ChartDisplayConfig
  /** Callback when flow display config changes */
  onFlowDisplayConfigChange?: (config: ChartDisplayConfig) => void

  // Retention Mode props (when analysisType === 'retention' - simplified Mixpanel-style)
  /** Single cube for retention analysis */
  retentionCube?: string | null
  /** Binding key for retention analysis */
  retentionBindingKey?: import('../../types').FunnelBindingKey | null
  /** Single timestamp dimension for retention */
  retentionTimeDimension?: string | null
  /** Date range for cohort analysis (REQUIRED) */
  retentionDateRange?: import('../../types/retention').DateRange
  /** Cohort filters - define who enters the cohort */
  retentionCohortFilters?: Filter[]
  /** Activity filters - define what counts as a return */
  retentionActivityFilters?: Filter[]
  /** Breakdown dimensions for segmentation */
  retentionBreakdowns?: import('../../types/retention').RetentionBreakdownItem[]
  /** Granularity for viewing retention periods */
  retentionViewGranularity?: import('../../types/retention').RetentionGranularity
  /** Number of periods */
  retentionPeriods?: number
  /** Retention type */
  retentionType?: import('../../types/retention').RetentionType
  /** Retention display config */
  retentionDisplayConfig?: ChartDisplayConfig
  /** Callback when cube changes */
  onRetentionCubeChange?: (cube: string | null) => void
  /** Callback when retention binding key changes */
  onRetentionBindingKeyChange?: (key: import('../../types').FunnelBindingKey | null) => void
  /** Callback when time dimension changes */
  onRetentionTimeDimensionChange?: (dim: string | null) => void
  /** Callback when date range changes */
  onRetentionDateRangeChange?: (range: import('../../types/retention').DateRange) => void
  /** Callback when cohort filters change */
  onRetentionCohortFiltersChange?: (filters: Filter[]) => void
  /** Callback when activity filters change */
  onRetentionActivityFiltersChange?: (filters: Filter[]) => void
  /** Callback when breakdowns change (set all) */
  onRetentionBreakdownsChange?: (breakdowns: import('../../types/retention').RetentionBreakdownItem[]) => void
  /** Callback to add a breakdown */
  onAddRetentionBreakdown?: (breakdown: import('../../types/retention').RetentionBreakdownItem) => void
  /** Callback to remove a breakdown */
  onRemoveRetentionBreakdown?: (field: string) => void
  /** Callback when granularity changes */
  onRetentionViewGranularityChange?: (granularity: import('../../types/retention').RetentionGranularity) => void
  /** Callback when periods changes */
  onRetentionPeriodsChange?: (periods: number) => void
  /** Callback when retention type changes */
  onRetentionTypeChange?: (type: import('../../types/retention').RetentionType) => void
  /** Callback when retention display config changes */
  onRetentionDisplayConfigChange?: (config: ChartDisplayConfig) => void
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

  /** All queries for multi-query mode (used for table column headers per-query) */
  allQueries?: CubeQuery[]
  /**
   * In funnel mode, the actually executed queries with:
   * - Binding key dimension auto-added
   * - IN filter applied for steps 2+
   * Use these for debug display instead of allQueries.
   */
  funnelExecutedQueries?: CubeQuery[]
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

  // Debug information (from dry-run) - per-query for multi-query mode
  /** Debug data for each query (SQL, analysis, loading/error state) */
  debugDataPerQuery?: Array<{
    sql: { sql: string; params: unknown[] } | null
    analysis: QueryAnalysis | null
    loading: boolean
    error: Error | null
  }>

  // Share functionality
  onShareClick?: () => void
  canShare?: boolean
  shareButtonState?: 'idle' | 'copied' | 'copied-no-chart'

  // Refresh functionality
  /** Callback when refresh button is clicked. Receives options.bustCache when Shift+click */
  onRefreshClick?: (options?: { bustCache?: boolean }) => void
  canRefresh?: boolean
  isRefreshing?: boolean
  /**
   * Whether the query configuration has changed but results haven't been refreshed yet.
   * When true, shows a "Needs refresh" banner (manual refresh mode only).
   */
  needsRefresh?: boolean

  // Clear functionality
  onClearClick?: () => void
  canClear?: boolean

  // AI functionality
  enableAI?: boolean
  isAIOpen?: boolean
  onAIToggle?: () => void

  // Multi-query support
  /** Number of queries (for showing Table 1, Table 2 tabs) */
  queryCount?: number
  /** Per-query results (for table view in multi-query mode) */
  perQueryResults?: (any[] | null)[]
  /** Active table index in multi-query mode */
  activeTableIndex?: number
  /** Callback when active table changes */
  onActiveTableChange?: (index: number) => void
  /** Current analysis type (query or funnel) - primary way to detect mode */
  analysisType?: AnalysisType
  /**
   * Whether in funnel mode (always show unified results, no per-query tables)
   * @deprecated Use analysisType === 'funnel' instead
   */
  isFunnelMode?: boolean

  // Funnel-specific debug data (when analysisType === 'funnel')
  /**
   * The actual server funnel query { funnel: {...} } sent to the server.
   * Use this for debug display instead of per-query debug data.
   */
  funnelServerQuery?: unknown
  /**
   * Unified debug data for funnel queries (SQL, analysis, loading/error state).
   * Contains the CTE-based SQL for the entire funnel.
   */
  funnelDebugData?: {
    sql: { sql: string; params: unknown[] } | null
    analysis: unknown
    loading: boolean
    error: Error | null
    funnelMetadata?: unknown
  } | null
  /**
   * The actual server flow query { flow: {...} } sent to the server.
   * Use this for debug display instead of per-query debug data.
   */
  flowServerQuery?: unknown
  /**
   * Unified debug data for flow queries (SQL, analysis, loading/error state).
   * Contains the CTE-based SQL for the flow analysis.
   */
  flowDebugData?: {
    sql: { sql: string; params: unknown[] } | null
    analysis: unknown
    loading: boolean
    error: Error | null
    flowMetadata?: unknown
  } | null
  /**
   * In retention mode, the actual server query { retention: {...} } sent to the API.
   * Use this for debug display.
   */
  retentionServerQuery?: unknown
  /**
   * Unified debug data for retention queries (SQL, analysis, loading/error state).
   * Contains the CTE-based SQL for the retention analysis.
   */
  retentionDebugData?: {
    sql: { sql: string; params: unknown[] } | null
    analysis: unknown
    loading: boolean
    error: Error | null
    retentionMetadata?: unknown
  } | null
  /**
   * Retention chart data (cohort × period matrix) for rendering.
   */
  retentionChartData?: import('../../types/retention').RetentionChartData | null
  /**
   * Retention validation result (errors explaining why query cannot be built).
   */
  retentionValidation?: { isValid: boolean; errors: string[]; warnings: string[] } | null
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
  /** Toggle comparison for time dimension */
  onComparisonToggle?: (id: string) => void
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
  onDragStart?: (e: DragEvent, index: number) => void
  /** Drag over handler */
  onDragOver?: (e: DragEvent, index: number) => void
  /** Drop handler */
  onDrop?: (e: DragEvent, index: number) => void
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
  /** Toggle comparison for time dimensions */
  onComparisonToggle?: () => void
  /** Whether another time dimension already has comparison enabled */
  comparisonDisabled?: boolean
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
  onDragStart?: (e: DragEvent, index: number) => void
  /** Drag over handler */
  onDragOver?: (e: DragEvent, index: number) => void
  /** Drop handler */
  onDrop?: (e: DragEvent, index: number) => void
  /** Drag end handler */
  onDragEnd?: () => void
}

// ============================================================================
// Main Component Props
// ============================================================================

/**
 * Initial funnel state for AnalysisBuilder (matches InitialFunnelState in store)
 */
export interface AnalysisBuilderInitialFunnelState {
  funnelCube?: string | null
  funnelSteps?: FunnelStepState[]
  funnelTimeDimension?: string | null
  funnelBindingKey?: FunnelBindingKey | null
  funnelChartType?: ChartType
  funnelChartConfig?: ChartAxisConfig
  funnelDisplayConfig?: ChartDisplayConfig
}

/**
 * Initial flow state for AnalysisBuilder (matches FlowSliceState in store)
 */
export interface AnalysisBuilderInitialFlowState {
  flowCube?: string | null
  flowBindingKey?: FunnelBindingKey | null
  flowTimeDimension?: string | null
  startingStep?: import('../../types/flow').FlowStartingStep
  stepsBefore?: number
  stepsAfter?: number
  eventDimension?: string | null
  joinStrategy?: 'auto' | 'lateral' | 'window'
  flowChartType?: ChartType
  flowChartConfig?: ChartAxisConfig
  flowDisplayConfig?: ChartDisplayConfig
}

/**
 * Initial retention state for AnalysisBuilder (matches RetentionSliceState in store)
 */
export interface AnalysisBuilderInitialRetentionState {
  retentionCube?: string | null
  retentionBindingKey?: FunnelBindingKey | null
  retentionTimeDimension?: string | null
  retentionDateRange?: import('../../types/retention').DateRange
  retentionCohortFilters?: Filter[]
  retentionActivityFilters?: Filter[]
  retentionBreakdowns?: import('../../types/retention').RetentionBreakdownItem[]
  retentionViewGranularity?: import('../../types/retention').RetentionGranularity
  retentionPeriods?: number
  retentionType?: import('../../types/retention').RetentionType
  retentionChartType?: ChartType
  retentionChartConfig?: ChartAxisConfig
  retentionDisplayConfig?: ChartDisplayConfig
}

/**
 * Props for the main AnalysisBuilder component
 */
export interface AnalysisBuilderProps {
  /** Additional CSS classes */
  className?: string
  /** Maximum height for the component (e.g., '800px', '100vh', 'calc(100vh - 64px)') */
  maxHeight?: string
  /**
   * Initial query configuration to load.
   * Accepts either a single CubeQuery or a MultiQueryConfig - the component handles both internally.
   * This keeps multi-query complexity contained within AnalysisBuilder.
   */
  initialQuery?: CubeQuery | MultiQueryConfig
  /** Initial chart configuration (for editing existing portlets) */
  initialChartConfig?: {
    chartType?: ChartType
    chartConfig?: ChartAxisConfig
    displayConfig?: ChartDisplayConfig
  }
  /** Initial analysis type (query or funnel) - defaults to 'query' */
  initialAnalysisType?: AnalysisType
  /** Initial funnel state (when initialAnalysisType === 'funnel') */
  initialFunnelState?: AnalysisBuilderInitialFunnelState
  /** Initial flow state (when initialAnalysisType === 'flow') */
  initialFlowState?: AnalysisBuilderInitialFlowState
  /** Initial retention state (when initialAnalysisType === 'retention') */
  initialRetentionState?: AnalysisBuilderInitialRetentionState
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
 * Funnel state returned by getFunnelState
 */
export interface FunnelStateSnapshot {
  funnelCube: string | null
  funnelSteps: FunnelStepState[]
  funnelTimeDimension: string | null
  funnelBindingKey: FunnelBindingKey | null
  funnelChartType: ChartType
  funnelChartConfig: ChartAxisConfig
  funnelDisplayConfig: ChartDisplayConfig
  activeFunnelStepIndex: number
}

/**
 * Ref interface for AnalysisBuilder (for external access)
 */
export interface AnalysisBuilderRef {
  /**
   * Get the current query configuration.
   * Returns CubeQuery (single query), MultiQueryConfig (multiple queries), or ServerFunnelQuery (funnel mode).
   * Consumers should just JSON.stringify the result - no need to check the type.
   * @deprecated Use getAnalysisConfig() for Phase 3+ integrations
   */
  getQueryConfig: () => CubeQuery | MultiQueryConfig | import('../../types/funnel').ServerFunnelQuery
  /** Get current chart configuration */
  getChartConfig: () => { chartType: ChartType; chartConfig: ChartAxisConfig; displayConfig: ChartDisplayConfig }
  /** Get the current analysis type (query or funnel) */
  getAnalysisType: () => AnalysisType
  /** Get the current funnel state (for persisting funnel mode configuration) */
  getFunnelState: () => FunnelStateSnapshot
  /**
   * Phase 3: Get the complete AnalysisConfig.
   * This is the canonical format for persisting analysis state.
   * Replaces getQueryConfig + getChartConfig + getAnalysisType.
   */
  getAnalysisConfig: () => import('../../types/analysisConfig').AnalysisConfig
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
  // Legacy single-query format (for backward compatibility)
  metrics: MetricItem[]
  breakdowns: BreakdownItem[]
  filters: Filter[]
  order?: Record<string, 'asc' | 'desc'>
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  activeView: 'table' | 'chart'

  // Multi-query format (when multiple queries are configured)
  queryStates?: AnalysisBuilderState[]
  activeQueryIndex?: number
  mergeStrategy?: QueryMergeStrategy
  /** Dimension keys used for merging in 'merge' strategy */
  mergeKeys?: string[]
  /** Binding key for funnel strategy (links steps together) */
  funnelBindingKey?: FunnelBindingKey | null
  /** Time window per step for funnel strategy (ISO 8601 duration) */
  stepTimeToConvert?: (string | null)[]
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

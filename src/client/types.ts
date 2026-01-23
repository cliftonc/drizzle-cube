/**
 * Type definitions for drizzle-cube client components
 */

import type { ReactNode } from 'react'
import type { ColorPalette } from './utils/colorPalettes'
import type { FunnelBindingKey } from './types/funnel'
import type { FlowChartData } from './types/flow'
import type { RetentionChartData } from './types/retention'

// Cube metadata types
export interface CubeMetaField {
  name: string
  title: string
  shortTitle: string
  type: string
}

export interface CubeMetaRelationship {
  targetCube: string
  relationship: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany'
  joinFields?: Array<{
    sourceField: string
    targetField: string
  }>
}

export interface CubeMetaCube {
  name: string
  title: string
  description?: string
  measures: CubeMetaField[]
  dimensions: CubeMetaField[]
  segments: CubeMetaField[]
  relationships?: CubeMetaRelationship[]
  /** Additional cube metadata (e.g., eventStream configuration for funnel queries) */
  meta?: {
    eventStream?: {
      bindingKey: string
      timeDimension: string
    }
    [key: string]: any
  }
}

export interface CubeMeta {
  cubes: CubeMetaCube[]
}

export type FieldLabelMap = Record<string, string>

// Re-export color palette types
export type { ColorPalette } from './utils/colorPalettes'

// Chart types
export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'table'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'radialBar'
  | 'treemap'
  | 'bubble'
  | 'activityGrid'
  | 'kpiNumber'
  | 'kpiDelta'
  | 'kpiText'
  | 'markdown'
  | 'funnel'
  | 'sankey'
  | 'sunburst'
  | 'heatmap'
  | 'retentionHeatmap'
  | 'retentionCombined'

// Axis formatting configuration
export interface AxisFormatConfig {
  label?: string              // Custom axis label (overrides auto-generated)
  unit?: 'currency' | 'percent' | 'number' | 'custom'  // Unit type for formatting
  abbreviate?: boolean        // Use K, M, B suffixes for large numbers
  decimals?: number           // Decimal places (0-4, undefined = auto)
  customPrefix?: string       // Prefix for 'custom' unit type
  customSuffix?: string       // Suffix for 'custom' unit type
}

// Chart configuration
export interface ChartAxisConfig {
  // New format (for advanced portlet editor)
  xAxis?: string[] // Dimension fields for X axis
  yAxis?: string[] // Measure fields for Y axis  
  series?: string[] // Fields to use for series/grouping
  
  // Bubble chart specific fields
  sizeField?: string // Field for bubble size
  colorField?: string // Field for bubble color
  
  // Activity grid chart specific fields
  dateField?: string[] // Time dimension field for activity grid
  valueField?: string[] // Measure field for activity intensity
  
  // Legacy format (for backward compatibility)
  x?: string // Single dimension field for X axis
  y?: string[] // Measure fields for Y axis

  // Dual Y-axis support: per-measure axis assignment (left or right)
  // Default: 'left' for all measures (backward compatible)
  yAxisAssignment?: Record<string, 'left' | 'right'>
}

export interface ChartDisplayConfig {
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  colors?: string[]
  orientation?: 'horizontal' | 'vertical'
  stacked?: boolean // Deprecated: use stackType instead
  stackType?: 'none' | 'normal' | 'percent' // Stacking mode: none, normal (sum), or percent (100%)
  connectNulls?: boolean // For Area/Line charts: draw continuous lines through missing data
  hideHeader?: boolean // Hide portlet header in non-edit mode
  
  // Bubble chart specific display options
  minBubbleSize?: number
  maxBubbleSize?: number
  bubbleOpacity?: number
  
  // Activity grid specific display options
  showLabels?: boolean
  fitToWidth?: boolean

  // DataTable specific display options
  pivotTimeDimension?: boolean // Pivot time dimension as columns (default: true when time dimension present)

  // Target functionality
  target?: string // Target values as string (single value or comma-separated for spread)
  
  // KPI specific display options
  template?: string // JavaScript template string for KPI Text
  prefix?: string   // Text prefix for KPI Number
  suffix?: string   // Text suffix for KPI Number
  decimals?: number // Number of decimal places
  formatValue?: (value: number | null | undefined) => string // Custom value formatter function (takes precedence over prefix/suffix/decimals)
  valueColor?: string // Color for the KPI value (legacy)
  valueColorIndex?: number // Index of color from dashboard palette for KPI value
  
  // KPI Delta specific display options
  positiveColorIndex?: number // Index of color from dashboard palette for positive changes
  negativeColorIndex?: number // Index of color from dashboard palette for negative changes
  showHistogram?: boolean // Whether to show variance histogram

  // KPI time period handling
  useLastCompletePeriod?: boolean // Exclude incomplete current period (e.g., partial week/month)
  skipLastPeriod?: boolean // Always exclude the last period regardless of completeness
  
  // Markdown specific display options
  content?: string // Markdown content text
  accentColorIndex?: number // Index of color from dashboard palette for headers, bullets, links
  fontSize?: 'small' | 'medium' | 'large' // Text size for markdown content
  alignment?: 'left' | 'center' | 'right' // Text alignment for markdown content

  // Axis formatting options (for Line, Area, Bar, Scatter charts)
  xAxisFormat?: AxisFormatConfig       // Formatting for X-axis values
  leftYAxisFormat?: AxisFormatConfig   // Formatting for left Y-axis values
  rightYAxisFormat?: AxisFormatConfig  // Formatting for right Y-axis values (dual-axis charts)

  // Period comparison display options (for compareDateRange queries)
  /**
   * How to display compared periods:
   * - 'separate': Each period as distinct series with different colors (default)
   * - 'overlay': Periods aligned by day-of-period index with ghost styling for prior periods
   */
  comparisonMode?: 'separate' | 'overlay'
  /** Line style for prior periods in overlay mode */
  priorPeriodStyle?: 'solid' | 'dashed' | 'dotted'
  /** Opacity for prior period lines (0-1), default: 0.5 */
  priorPeriodOpacity?: number
  /** Include period labels in legend */
  showPeriodLabels?: boolean

  // Funnel chart specific display options
  /** Custom labels for funnel steps (array indexed by step, e.g., ["Signup", "Activation", "Purchase"]) */
  funnelStepLabels?: string[]
  /** Hide the summary footer in funnel charts */
  hideSummaryFooter?: boolean
  /** Funnel orientation: horizontal (bars left to right) or vertical (bars bottom to top) */
  funnelOrientation?: 'horizontal' | 'vertical'
  /** @deprecated Use showFunnelAvgTime, showFunnelMedianTime, showFunnelP90Time instead */
  showFunnelTimeMetrics?: boolean
  /** Funnel visualization style: 'bars' (horizontal bars) or 'funnel' (trapezoid funnel shape) */
  funnelStyle?: 'bars' | 'funnel'
  /** Show step-to-step conversion rate (default: true) */
  showFunnelConversion?: boolean
  /** Show average time-to-convert metric in funnel charts */
  showFunnelAvgTime?: boolean
  /** Show median time-to-convert metric in funnel charts */
  showFunnelMedianTime?: boolean
  /** Show P90 time-to-convert metric in funnel charts */
  showFunnelP90Time?: boolean

  // Retention chart specific display options
  /** Retention display mode: line chart, heatmap table, or combined view */
  retentionDisplayMode?: 'line' | 'heatmap' | 'combined'
}

// Portlet configuration
export interface PortletConfig {
  id: string
  title: string

  /**
   * Canonical format for analysis configuration.
   * This is the single source of truth for all query/chart config.
   * New portlets only save this field. Legacy portlets are migrated on-the-fly.
   */
  analysisConfig?: import('./types/analysisConfig').AnalysisConfig

  // === Legacy fields (deprecated - for backward compatibility only) ===
  // These fields are optional and only used for reading old configurations.
  // New portlets do not write these fields.
  /** @deprecated Use analysisConfig.query instead */
  query?: string // JSON string of cube query (CubeQuery, MultiQueryConfig, or ServerFunnelQuery)
  /** @deprecated Use analysisConfig.charts[mode].chartType instead */
  chartType?: ChartType
  /** @deprecated Use analysisConfig.charts[mode].chartConfig instead */
  chartConfig?: ChartAxisConfig
  /** @deprecated Use analysisConfig.charts[mode].displayConfig instead */
  displayConfig?: ChartDisplayConfig
  dashboardFilterMapping?: string[] // Array of dashboard filter IDs that apply to this portlet
  eagerLoad?: boolean // Force immediate loading (overrides dashboard lazy loading setting)
  /** @deprecated Use analysisConfig.analysisType instead */
  analysisType?: AnalysisType // Optional - defaults to 'query' when undefined (backward compatible)

  // Funnel mode state (deprecated - now stored in analysisConfig)
  /** @deprecated Use analysisConfig for funnel mode */
  funnelCube?: string | null
  /** @deprecated Use analysisConfig for funnel mode */
  funnelSteps?: FunnelStepState[]
  /** @deprecated Use analysisConfig for funnel mode */
  funnelTimeDimension?: string | null
  /** @deprecated Use analysisConfig for funnel mode */
  funnelBindingKey?: FunnelBindingKey | null
  /** @deprecated Use analysisConfig for funnel mode */
  funnelChartType?: ChartType
  /** @deprecated Use analysisConfig for funnel mode */
  funnelChartConfig?: ChartAxisConfig
  /** @deprecated Use analysisConfig for funnel mode */
  funnelDisplayConfig?: ChartDisplayConfig

  w: number // Grid width
  h: number // Grid height
  x: number // Grid x position
  y: number // Grid y position
}

export type DashboardLayoutMode = 'grid' | 'rows'

export interface DashboardGridSettings {
  cols: number
  rowHeight: number
  minW: number
  minH: number
}

export interface RowLayoutColumn {
  portletId: string
  w: number
}

export interface RowLayout {
  id: string
  h: number
  columns: RowLayoutColumn[]
}

// Dashboard configuration
export interface DashboardConfig {
  portlets: PortletConfig[]
  layoutMode?: DashboardLayoutMode
  grid?: DashboardGridSettings
  rows?: RowLayout[]
  layouts?: { [key: string]: any } // react-grid-layout layouts
  colorPalette?: string // Name of the color palette to use (defaults to 'default')
  filters?: DashboardFilter[] // Dashboard-level filters that can be applied to portlets
  eagerLoad?: boolean // Force immediate loading for all portlets (default: false, lazy load enabled)
  // Thumbnail fields for dashboard preview/sharing
  thumbnailData?: string  // Transient: base64 data URI for upload (cleared by server after processing)
  thumbnailUrl?: string   // Permanent: CDN URL after server-side processing
}

// Analysis type for explicit mode selection in AnalysisBuilder
// 'query' supports both single and multi-query (add more queries via + button)
// 'funnel' for funnel analysis with sequential steps
// 'flow' for bidirectional flow analysis with Sankey visualization
// 'retention' for cohort-based retention analysis
export type AnalysisType = 'query' | 'funnel' | 'flow' | 'retention'

/**
 * State for a single funnel step (dedicated for Funnel mode)
 * Each step represents a stage in the funnel with its own cube and filters
 */
export interface FunnelStepState {
  /** Unique step identifier */
  id: string
  /** Display name for the step (e.g., "Signup", "Purchase") */
  name: string
  /** Which cube this step uses (for multi-cube funnels) */
  cube: string
  /** Filters that define which events qualify for this step */
  filters: Filter[]
  /** Time window from previous step (ISO 8601 duration, e.g., "P7D" for 7 days) */
  timeToConvert?: string
}

// Filter types - hierarchical structure supporting AND/OR logic
export type FilterOperator = 
  // String operators
  | 'equals' | 'notEquals' | 'contains' | 'notContains' 
  | 'startsWith' | 'notStartsWith' | 'endsWith' | 'notEndsWith'
  | 'like' | 'notLike' | 'ilike'
  // Numeric operators  
  | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'notBetween'
  // Array operators
  | 'in' | 'notIn'
  // PostgreSQL array operators
  | 'arrayContains' | 'arrayOverlaps' | 'arrayContained'
  // Null/Empty operators
  | 'set' | 'notSet' | 'isEmpty' | 'isNotEmpty'
  // Date operators
  | 'inDateRange' | 'beforeDate' | 'afterDate'
  // Regex operators
  | 'regex' | 'notRegex'

export interface SimpleFilter {
  member: string
  operator: FilterOperator
  values: any[]
  dateRange?: string | string[]
}

export interface GroupFilter {
  type: 'and' | 'or'
  filters: Filter[]
}

export type Filter = SimpleFilter | GroupFilter

// Dashboard filter with ID and label for dashboard-level filtering
export interface DashboardFilter {
  id: string // Unique identifier for the filter
  label: string // Display label for the filter
  filter: Filter // The actual filter definition
  isUniversalTime?: boolean // When true, applies to all timeDimensions in portlets (ignores member field)
}

// Cube query types
export interface CubeQuery {
  measures?: string[]
  dimensions?: string[]
  timeDimensions?: Array<{
    dimension: string
    granularity?: string
    dateRange?: string[] | string
    fillMissingDates?: boolean
    /**
     * Array of date ranges for period-over-period comparison.
     * When specified, queries are executed for each period and results are merged.
     */
    compareDateRange?: (string | [string, string])[]
  }>
  filters?: Filter[]
  order?: { [key: string]: 'asc' | 'desc' }
  limit?: number
  offset?: number
  segments?: string[]
}

/**
 * Merge strategy for combining multiple query results
 * - 'concat': Append rows with __queryIndex marker (for separate series per query)
 * - 'merge': Align data by common dimension key (for combined visualization)
 *
 * Note: For funnel analysis, use the dedicated funnel mode (analysisType === 'funnel')
 */
export type QueryMergeStrategy = 'concat' | 'merge'

/**
 * Configuration for multi-query portlets
 * Detected by presence of 'queries' array property
 *
 * Note: For funnel analysis, use the dedicated funnel mode (analysisType === 'funnel')
 */
export interface MultiQueryConfig {
  queries: CubeQuery[]
  mergeStrategy: QueryMergeStrategy
  mergeKeys?: string[]        // Dimensions to align on (for 'merge' strategy) - composite key
  queryLabels?: string[]      // User-defined labels per query
}

/**
 * Type guard to detect multi-query configuration
 */
export function isMultiQueryConfig(obj: unknown): obj is MultiQueryConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'queries' in obj &&
    Array.isArray((obj as MultiQueryConfig).queries) &&
    (obj as MultiQueryConfig).queries.length > 0
  )
}

export interface CubeQueryOptions {
  skip?: boolean
  resetResultSetOnChange?: boolean
  subscribe?: boolean
}

export interface CubeApiOptions {
  apiUrl?: string
  token?: string
  headers?: Record<string, string>
  credentials?: 'include' | 'omit' | 'same-origin'
}

// Result set types
export interface CubeResultSet {
  rawData(): any[]
  tablePivot(): any[]
  series(): any[]
  annotation(): any
  loadResponse?: any
  cacheInfo?(): { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | undefined
}

// Component props
export interface AnalyticsPortletProps {
  query: string
  chartType: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  dashboardFilters?: DashboardFilter[] // Dashboard-level filters to merge with portlet query
  dashboardFilterMapping?: string[] // Array of dashboard filter IDs that apply to this portlet
  eagerLoad?: boolean // Force immediate loading (default: false, lazy load enabled)
  isVisible?: boolean // Whether the portlet is visible in the viewport (for lazy loading)
  height?: string | number
  title?: string
  colorPalette?: ColorPalette  // Complete palette with both colors and gradient
  loadingComponent?: ReactNode // Custom loading indicator (defaults to LoadingIndicator)
  onDebugDataReady?: (debugData: {
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
    queryObject: any
    data: any[] | FlowChartData | RetentionChartData
    chartType: ChartType
    cacheInfo?: { hit: true; cachedAt: string; ttlMs: number; ttlRemainingMs: number } | null
  }) => void
}

export interface AnalyticsDashboardProps {
  config: DashboardConfig
  editable?: boolean
  dashboardFilters?: DashboardFilter[] // Programmatic dashboard filters (merged with config.filters)
  loadingComponent?: ReactNode // Custom loading indicator for all portlets (defaults to LoadingIndicator)
  onConfigChange?: (config: DashboardConfig) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  onSaveThumbnail?: (thumbnailData: string) => Promise<string | void> // Callback to save thumbnail separately (called on edit mode exit)
  onDirtyStateChange?: (isDirty: boolean) => void
}

export interface ChartProps {
  data: any[]
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  queryObject?: CubeQuery
  height?: string | number
  colorPalette?: ColorPalette  // Complete palette with both colors and gradient
}

// Thumbnail feature configuration
export interface ThumbnailFeatureConfig {
  enabled: boolean
  width?: number   // default: 1600 (higher resolution for crisp thumbnails)
  height?: number  // default: 1200 (4:3 aspect ratio)
  format?: 'png' | 'jpeg'  // default: 'png'
  quality?: number // 0-1, mainly for jpeg (PNG ignores this)
}

// Features configuration
export interface FeaturesConfig {
  enableAI?: boolean // Default: true for backward compatibility
  aiEndpoint?: string // Custom AI endpoint (default: '/api/ai/generate')
  showSchemaDiagram?: boolean // Deprecated - schema diagram feature has been removed
  useAnalysisBuilder?: boolean // Deprecated - AnalysisBuilder modal is now always used (PortletEditModal was removed)
  editToolbar?: 'floating' | 'top' | 'both' // Which edit toolbar(s) to show: 'floating' only, 'top' only, or 'both' (default: 'both')
  floatingToolbarPosition?: 'left' | 'right' // Position of floating toolbar when enabled (default: 'right')
  thumbnail?: ThumbnailFeatureConfig // Optional dashboard thumbnail capture on save
  manualRefresh?: boolean // When true, queries don't auto-execute on config changes. User must click Refresh. (default: false)
}

// Grid layout types (simplified)
export interface GridLayout {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export interface ResponsiveLayout {
  [breakpoint: string]: GridLayout[]
}

// Dashboard display modes for responsive layout
export type DashboardDisplayMode = 'desktop' | 'scaled' | 'mobile'

// Re-export funnel types
export type {
  FunnelBindingKey,
  FunnelBindingKeyMapping,
  FunnelStep,
  FunnelConfig,
  FunnelStepResult,
  FunnelExecutionResult,
  FunnelChartData,
  FunnelValidationError,
  FunnelValidationResult,
  UseFunnelQueryOptions,
  UseFunnelQueryResult,
  ServerFunnelQuery,
} from './types/funnel'

/**
 * Type guard to detect server funnel query format
 * Used to distinguish { funnel: {...} } from CubeQuery or MultiQueryConfig
 */
export function isServerFunnelQuery(obj: unknown): obj is import('./types/funnel').ServerFunnelQuery {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'funnel' in obj &&
    typeof (obj as { funnel: unknown }).funnel === 'object'
  )
}

// Re-export flow types
export type {
  FlowStartingStep,
  ServerFlowQuery,
  FlowQueryConfig,
  SankeyNode,
  SankeyLink,
  FlowResultRow,
  FlowChartData,
  FlowSliceState,
  FlowSliceActions,
} from './types/flow'

export { isServerFlowQuery, isSankeyData } from './types/flow'

// ============================================================================
// EXPLAIN PLAN TYPES
// These types mirror the server-side types in src/server/types/executor.ts
// ============================================================================

/**
 * Options for EXPLAIN query execution
 */
export interface ExplainOptions {
  /** Use EXPLAIN ANALYZE to actually execute the query and get real timing (PostgreSQL, MySQL 8.0.18+) */
  analyze?: boolean
}

/**
 * A single operation/node in the query execution plan
 * Normalized structure across all databases
 */
export interface ExplainOperation {
  /** Operation type (e.g., 'Seq Scan', 'Index Scan', 'Hash Join', 'Sort') */
  type: string
  /** Table name if applicable */
  table?: string
  /** Index name if used */
  index?: string
  /** Estimated row count from planner */
  estimatedRows?: number
  /** Actual row count (if ANALYZE was used) */
  actualRows?: number
  /** Estimated cost (database-specific units) */
  estimatedCost?: number
  /** Filter condition if any */
  filter?: string
  /** Additional details specific to this operation */
  details?: string
  /** Nested/child operations */
  children?: ExplainOperation[]
}

/**
 * Summary statistics from the execution plan
 */
export interface ExplainSummary {
  /** Database engine type */
  database: 'postgres' | 'mysql' | 'sqlite'
  /** Planning time in milliseconds (if available) */
  planningTime?: number
  /** Execution time in milliseconds (if ANALYZE was used) */
  executionTime?: number
  /** Total estimated cost */
  totalCost?: number
  /** Quick flag: true if any sequential scans detected */
  hasSequentialScans: boolean
  /** List of indexes used in the plan */
  usedIndexes: string[]
}

/**
 * Result of an EXPLAIN query
 * Provides both normalized structure and raw output
 */
export interface ExplainResult {
  /** Normalized hierarchical plan as operations */
  operations: ExplainOperation[]
  /** Summary statistics */
  summary: ExplainSummary
  /** Raw EXPLAIN output as text (for display) */
  raw: string
  /** Original SQL query */
  sql: {
    sql: string
    params?: unknown[]
  }
}

// ============================================================================
// AI EXPLAIN ANALYSIS TYPES
// These types mirror the server-side types in src/server/types/executor.ts
// ============================================================================

/**
 * A recommendation from AI analysis of an execution plan
 */
export interface ExplainRecommendation {
  /** Type of recommendation */
  type: 'index' | 'table' | 'cube' | 'general'
  /** Severity/priority of the recommendation */
  severity: 'critical' | 'warning' | 'suggestion'
  /** Short actionable title */
  title: string
  /** Detailed explanation of why this helps */
  description: string
  /** Actionable SQL statement (e.g., CREATE INDEX) - for index/table recommendations */
  sql?: string
  /** TypeScript code snippet to add to cube definition - for cube recommendations */
  cubeCode?: string
  /** Which cube to modify - for cube recommendations */
  cubeName?: string
  /** Affected database table */
  table?: string
  /** Affected columns */
  columns?: string[]
  /** Expected performance improvement */
  estimatedImpact?: string
}

/**
 * Issue identified in the execution plan
 */
export interface ExplainIssue {
  /** Type of issue */
  type: 'sequential_scan' | 'missing_index' | 'high_cost' | 'sort_operation' | string
  /** Description of the issue */
  description: string
  /** Severity level */
  severity: 'high' | 'medium' | 'low'
}

/**
 * AI-generated analysis of an execution plan
 */
export interface AIExplainAnalysis {
  /** One-sentence description of what the query does */
  summary: string
  /** Overall performance assessment */
  assessment: 'good' | 'warning' | 'critical'
  /** Reason for the assessment */
  assessmentReason: string
  /** Detailed explanation of the query's purpose and structure */
  queryUnderstanding: string
  /** Issues identified in the execution plan */
  issues: ExplainIssue[]
  /** Actionable recommendations for improvement */
  recommendations: ExplainRecommendation[]
  /** Metadata from the AI analysis */
  _meta?: {
    model: string
    usingUserKey: boolean
  }
}

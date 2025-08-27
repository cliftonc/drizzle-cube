/**
 * Type definitions for drizzle-cube client components
 */

// Re-export metadata types from useCubeMeta hook
export type { CubeMeta, CubeMetaCube, CubeMetaField, FieldLabelMap } from './hooks/useCubeMeta'

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
  | 'kpiText'

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
}

export interface ChartDisplayConfig {
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  colors?: string[]
  orientation?: 'horizontal' | 'vertical'
  stacked?: boolean
  
  // Bubble chart specific display options
  minBubbleSize?: number
  maxBubbleSize?: number
  bubbleOpacity?: number
  
  // Activity grid specific display options
  showLabels?: boolean
  colorIntensity?: 'low' | 'medium' | 'high'
  
  // KPI specific display options
  template?: string // JavaScript template string for KPI Text
  prefix?: string   // Text prefix for KPI Number
  suffix?: string   // Text suffix for KPI Number  
  decimals?: number // Number of decimal places
}

// Portlet configuration
export interface PortletConfig {
  id: string
  title: string
  query: string // JSON string of cube query
  chartType: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  w: number // Grid width
  h: number // Grid height  
  x: number // Grid x position
  y: number // Grid y position
}

// Dashboard configuration
export interface DashboardConfig {
  portlets: PortletConfig[]
  layouts?: { [key: string]: any } // react-grid-layout layouts
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
}

export interface GroupFilter {
  type: 'and' | 'or'
  filters: Filter[]
}

export type Filter = SimpleFilter | GroupFilter

// Cube query types
export interface CubeQuery {
  measures?: string[]
  dimensions?: string[]
  timeDimensions?: Array<{
    dimension: string
    granularity?: string
    dateRange?: string[] | string
  }>
  filters?: Filter[]
  order?: { [key: string]: 'asc' | 'desc' }
  limit?: number
  offset?: number
  segments?: string[]
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
}

// Result set types
export interface CubeResultSet {
  rawData(): any[]
  tablePivot(): any[]
  series(): any[]
  annotation(): any
  loadResponse?: any
}

// Component props
export interface AnalyticsPortletProps {
  query: string
  chartType: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  height?: string | number
  title?: string
  onDebugDataReady?: (debugData: {
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
    queryObject: any
    data: any[]
    chartType: ChartType
  }) => void
}

export interface AnalyticsDashboardProps {
  config: DashboardConfig
  editable?: boolean
  onConfigChange?: (config: DashboardConfig) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  onDirtyStateChange?: (isDirty: boolean) => void
}

export interface ChartProps {
  data: any[]
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  queryObject?: CubeQuery
  height?: string | number
}

// Features configuration
export interface FeaturesConfig {
  enableAI?: boolean // Default: true for backward compatibility
  aiEndpoint?: string // Custom AI endpoint (default: '/api/ai/generate')
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
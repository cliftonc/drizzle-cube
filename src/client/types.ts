/**
 * Type definitions for drizzle-cube client components
 */

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

// Chart configuration
export interface ChartAxisConfig {
  // New format (for advanced portlet editor)
  xAxis?: string[] // Dimension fields for X axis
  yAxis?: string[] // Measure fields for Y axis  
  series?: string[] // Fields to use for series/grouping
  
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
  stackedBarChart?: boolean
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
  | 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  // Numeric operators  
  | 'gt' | 'gte' | 'lt' | 'lte'
  // Null operators
  | 'set' | 'notSet'
  // Date operators
  | 'inDateRange' | 'beforeDate' | 'afterDate'

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
}

export interface AnalyticsDashboardProps {
  config: DashboardConfig
  apiUrl?: string
  apiOptions?: CubeApiOptions
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
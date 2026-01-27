/**
 * Types for drill-down and hierarchy navigation functionality
 */

import type { MouseEvent } from 'react'
import type { CubeQuery, Filter, TimeGranularity, ChartAxisConfig } from '../types'

/**
 * Event fired when a user clicks on a data point in a chart
 * Generic across all chart types (bar, line, pie, etc.)
 */
export interface ChartDataPointClickEvent {
  /**
   * The clicked data point values (from the transformed chart data)
   * Contains all fields for the clicked row
   * @example { name: '2024-01', 'Revenue': 50000, 'Orders': 120 }
   */
  dataPoint: Record<string, unknown>

  /**
   * Which field/series was clicked (typically a y-axis field or measure)
   * @example 'Orders.totalRevenue'
   */
  clickedField: string

  /**
   * The x-axis value (category/time value)
   * @example '2024-01' or 'Electronics'
   */
  xValue: unknown

  /**
   * Screen coordinates for positioning drill menu/popover
   */
  position: { x: number; y: number }

  /**
   * Original mouse event for additional context
   */
  nativeEvent?: MouseEvent
}

/**
 * Drill option types
 * - drillDown: Navigate to more granular level
 * - drillUp: Navigate to less granular level (roll-up)
 * - details: Show underlying records via drillMembers
 */
export type DrillOptionType = 'drillDown' | 'drillUp' | 'details'

/**
 * Where to apply the drill action
 * - portlet: Only affects the current chart/portlet
 * - dashboard: Updates a dashboard filter, affecting all mapped portlets
 */
export type DrillScope = 'portlet' | 'dashboard'

/**
 * A single drill option shown in the drill menu
 */
export interface DrillOption {
  /** Unique identifier for this option */
  id: string

  /**
   * Display label
   * @example "Drill to Week", "Show Order Details", "Roll up to Quarter"
   */
  label: string

  /** Type of drill action */
  type: DrillOptionType

  /**
   * Icon to display
   * - 'time': For time granularity changes
   * - 'hierarchy': For dimension hierarchy navigation
   * - 'table': For showing detail records
   */
  icon?: 'time' | 'hierarchy' | 'table'

  /**
   * Which hierarchy this option belongs to (if type is drillDown/drillUp for hierarchies)
   * @example 'location', 'product'
   */
  hierarchy?: string

  /**
   * Target time granularity (for time-based drill)
   * @example 'week', 'day', 'month'
   */
  targetGranularity?: TimeGranularity

  /**
   * Target dimension (for hierarchy-based drill)
   * @example 'Orders.city', 'Products.subcategory'
   */
  targetDimension?: string

  /**
   * Where to apply this drill action
   */
  scope: DrillScope

  /**
   * Dashboard filter ID to update (when scope is 'dashboard')
   */
  dashboardFilterId?: string

  /**
   * Measure being drilled (for context)
   */
  measure?: string
}

/**
 * Entry in the drill navigation path (breadcrumb)
 * Tracks the history of drill actions for back-navigation
 */
export interface DrillPathEntry {
  /** Unique identifier */
  id: string

  /**
   * Display label for the breadcrumb
   * @example "All Time", "Q1 2024", "January 2024"
   */
  label: string

  /**
   * The query state at this level
   */
  query: CubeQuery

  /**
   * Filters applied at this level (for restoration on back-nav)
   */
  filters?: Filter[]

  /**
   * Time granularity at this level (for time-based drill)
   */
  granularity?: TimeGranularity

  /**
   * Active dimension at this level (for hierarchy-based drill)
   */
  dimension?: string

  /**
   * Which hierarchy was used (if any)
   */
  hierarchy?: string

  /**
   * The clicked value that led to this drill
   * @example '2024-01', 'Electronics'
   */
  clickedValue?: unknown

  /**
   * Chart configuration override for this drill level
   * Used when drilling to details to map drillMembers to chart axes
   */
  chartConfig?: ChartAxisConfig
}

/**
 * Result of building a drill query
 */
export interface DrillResult {
  /** The new query to execute */
  query: CubeQuery

  /** Context about the drill for breadcrumb/navigation */
  pathEntry: DrillPathEntry

  /**
   * Filter to apply at dashboard level (when scope is 'dashboard')
   */
  dashboardFilter?: {
    id: string
    filter: Filter
  }

  /**
   * Chart configuration override for this drill
   * When drilling to details, maps drillMembers to chart axes
   */
  chartConfig?: ChartAxisConfig
}

/**
 * Configuration for the useDrillInteraction hook
 */
export interface UseDrillInteractionOptions {
  /** Current query being displayed */
  query: CubeQuery

  /** Cube metadata for computing drill options */
  metadata: import('../types').CubeMeta | null

  /** Callback when query changes due to drill */
  onQueryChange: (query: CubeQuery) => void

  /** Current chart configuration (to restore on drill up to root) */
  chartConfig?: ChartAxisConfig

  /** Dashboard filters context (for dashboard-level drill) */
  dashboardFilters?: import('../types').DashboardFilter[]

  /** Which dashboard filters apply to this portlet */
  dashboardFilterMapping?: string[]

  /** Callback to update a dashboard filter */
  onDashboardFilterChange?: (filterId: string, filter: import('../types').Filter) => void

  /** Whether drill is enabled (default: true) */
  enabled?: boolean
}

/**
 * Return type of useDrillInteraction hook
 */
export interface DrillInteraction {
  /** Handler to pass to chart's onDataPointClick prop */
  handleDataPointClick: (event: ChartDataPointClickEvent) => void

  /** Whether the drill menu is currently open */
  menuOpen: boolean

  /** Position for the drill menu */
  menuPosition: { x: number; y: number } | null

  /** Available drill options for the clicked data point */
  menuOptions: DrillOption[]

  /** Handler for when user selects a drill option */
  handleOptionSelect: (option: DrillOption) => void

  /** Close the drill menu */
  closeMenu: () => void

  /** Current drill navigation path (for breadcrumb) */
  drillPath: DrillPathEntry[]

  /** Navigate back one level */
  navigateBack: () => void

  /** Navigate to a specific level in the path */
  navigateToLevel: (index: number) => void

  /** Whether any drill options are available for the current query/metadata */
  drillEnabled: boolean

  /** Whether the current dimension matches a dashboard filter */
  hasDashboardFilterMatch: boolean

  /** Current chart config override from drill (null if using original config) */
  currentChartConfig: ChartAxisConfig | null
}

/**
 * Props for the DrillMenu component
 */
export interface DrillMenuProps {
  /** Available drill options */
  options: DrillOption[]

  /** Position for the menu */
  position: { x: number; y: number }

  /** Handler when an option is selected */
  onSelect: (option: DrillOption) => void

  /** Handler to close the menu */
  onClose: () => void
}

/**
 * Props for the DrillBreadcrumb component
 */
export interface DrillBreadcrumbProps {
  /** Drill path entries */
  path: DrillPathEntry[]

  /** Handler when navigating back */
  onNavigate: () => void

  /** Handler when clicking a specific level */
  onLevelClick?: (index: number) => void
}

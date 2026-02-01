/**
 * Drizzle Cube Chart Components
 *
 * Chart components only - optimized for applications that only need charts
 * without the full dashboard or query builder functionality.
 *
 * For code splitting, use LazyChart instead of direct chart imports:
 *   import { LazyChart, preloadCharts } from 'drizzle-cube/client/charts'
 */

// Direct chart component exports (static imports)
export {
  RechartsBarChart,
  RechartsLineChart,
  RechartsAreaChart,
  RechartsPieChart,
  RechartsScatterChart,
  RechartsRadarChart,
  RechartsRadialBarChart,
  RechartsTreeMapChart,
  FunnelChart,
  DataTable
} from './components/charts'

// Lazy loading utilities for code splitting
export {
  LazyChart,
  preloadChart,
  preloadCharts,
  isValidChartType,
  getAvailableChartTypes,
  isChartTypeAvailable,
  getUnavailableChartTypes
} from './charts/ChartLoader'

export type { LazyChartProps } from './charts/ChartLoader'

// Lazy chart config registry
export {
  getChartConfigAsync,
  getChartConfigSync,
  useChartConfig,
  isChartConfigLoaded,
  preloadChartConfig,
  preloadChartConfigs,
  loadAllChartConfigs,
  clearChartConfigCache
} from './charts/lazyChartConfigRegistry'

// Chart utilities and constants
export { formatChartData } from './utils/index'
export {
  CHART_COLORS,
  POSITIVE_COLOR,
  NEGATIVE_COLOR,
  CHART_MARGINS
} from './utils/chartConstants'

// Chart-related types
export type {
  ChartType,
  ChartAxisConfig,
  ChartDisplayConfig
} from './types'

// Chart configuration types
export type {
  ChartTypeConfig,
  DisplayOptionConfig,
  AxisDropZoneConfig
} from './charts/chartConfigs'

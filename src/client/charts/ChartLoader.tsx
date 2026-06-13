/**
 * Lazy Chart Loader
 *
 * Provides React.lazy-based dynamic loading for chart components.
 * This enables code splitting - each chart type loads only when needed.
 *
 * Handles missing optional dependencies gracefully by showing a fallback
 * component instead of crashing the application.
 */

import { lazy, Suspense, ReactNode, LazyExoticComponent } from 'react'
import type { BuiltInChartType, ChartType, ChartProps } from '../types'
import {
  type LazyChartComponent,
  chartLoaderCache,
  failedChartTypes,
  customChartMap,
  createSafeImport,
  createUnknownChartFallback
} from './chartComponentRegistry'

// The custom-chart registration API lives in chartComponentRegistry to avoid an
// import cycle (chartPlugin → ChartLoader → DataTable → CubeProvider → chartPlugin).
// Re-exported here so existing import paths keep working.
export { registerChartComponent, unregisterChartComponent } from './chartComponentRegistry'

// Dynamic import functions for built-in chart types
const chartImportMap: Record<BuiltInChartType, () => Promise<{ default: LazyChartComponent }>> = {
  bar: () => import('../components/charts/BarChart'),
  line: () => import('../components/charts/LineChart'),
  area: () => import('../components/charts/AreaChart'),
  pie: () => import('../components/charts/PieChart'),
  scatter: () => import('../components/charts/ScatterChart'),
  radar: () => import('../components/charts/RadarChart'),
  radialBar: () => import('../components/charts/RadialBarChart'),
  treemap: () => import('../components/charts/TreeMapChart'),
  bubble: () => import('../components/charts/BubbleChart'),
  table: () => import('../components/charts/DataTable'),
  activityGrid: () => import('../components/charts/ActivityGridChart'),
  kpiNumber: () => import('../components/charts/KpiNumber'),
  kpiDelta: () => import('../components/charts/KpiDelta'),
  kpiText: () => import('../components/charts/KpiText'),
  markdown: () => import('../components/charts/MarkdownChart'),
  funnel: () => import('../components/charts/FunnelChart'),
  sankey: () => import('../components/charts/SankeyChart'),
  sunburst: () => import('../components/charts/SunburstChart'),
  heatmap: () => import('../components/charts/HeatMapChart'),
  retentionHeatmap: () => import('../components/charts/RetentionHeatmap'),
  retentionCombined: () => import('../components/charts/RetentionCombinedChart'),
  boxPlot: () => import('../components/charts/BoxPlotChart'),
  waterfall: () => import('../components/charts/WaterfallChart'),
  candlestick: () => import('../components/charts/CandlestickChart'),
  measureProfile: () => import('../components/charts/MeasureProfileChart'),
  gauge: () => import('../components/charts/GaugeChart'),
}

/**
 * Get or create a lazy component for a chart type.
 * Checks custom (plugin) charts first, then built-in charts.
 * Returns an unknown chart fallback for unregistered types instead of throwing.
 */
function getLazyChart(chartType: ChartType): LazyExoticComponent<LazyChartComponent> {
  // 1. Check custom charts first (allows overriding built-ins)
  const customChart = customChartMap.get(chartType)
  if (customChart) {
    return customChart
  }

  // 2. Check built-in cache
  if (chartLoaderCache.has(chartType)) {
    return chartLoaderCache.get(chartType)!
  }

  // 3. Check built-in import map
  const importFn = chartImportMap[chartType as BuiltInChartType]
  if (importFn) {
    const safeImport = createSafeImport(chartType, importFn)
    chartLoaderCache.set(chartType, lazy(safeImport))
    return chartLoaderCache.get(chartType)!
  }

  // 4. Unknown chart type — return graceful fallback
  return lazy(() => Promise.resolve({ default: createUnknownChartFallback(chartType) }))
}

/**
 * Check if a chart type is supported (built-in or custom plugin)
 */
export function isValidChartType(chartType: string): chartType is ChartType {
  return chartType in chartImportMap || customChartMap.has(chartType)
}

// Props for the LazyChart wrapper
export interface LazyChartProps extends ChartProps {
  chartType: ChartType
  fallback?: ReactNode
}

/**
 * Default loading placeholder for charts
 */
function DefaultChartFallback({ height }: { height?: string | number }) {
  return (
    <div
      className="dc:flex dc:items-center dc:justify-center dc:w-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height || '200px' }}
    >
      <div className="dc:animate-pulse bg-dc-surface-secondary dc:rounded dc:w-full dc:h-full dc:min-h-[100px]" />
    </div>
  )
}

/**
 * Lazy Chart Component
 *
 * Renders a chart component with React.lazy dynamic loading.
 * The chart type determines which chart component is loaded.
 *
 * @example
 * ```tsx
 * <LazyChart
 *   chartType="bar"
 *   data={chartData}
 *   chartConfig={{ yAxis: ['value'] }}
 *   height={300}
 * />
 * ```
 */
export function LazyChart({
  chartType,
  fallback,
  height,
  ...chartProps
}: LazyChartProps) {
  const ChartComponent = getLazyChart(chartType)

  return (
    <Suspense fallback={fallback ?? <DefaultChartFallback height={height} />}>
      <ChartComponent height={height} {...chartProps} />
    </Suspense>
  )
}

/**
 * Preload a chart type
 *
 * Triggers the dynamic import without rendering.
 * Useful for prefetching charts that will likely be needed.
 *
 * @example
 * ```tsx
 * // Preload bar chart on hover
 * onMouseEnter={() => preloadChart('bar')}
 * ```
 */
export function preloadChart(chartType: ChartType): void {
  const importFn = chartImportMap[chartType as BuiltInChartType]
  if (importFn) {
    importFn()
  }
}

/**
 * Preload multiple chart types
 *
 * @example
 * ```tsx
 * // Preload common charts on app init
 * useEffect(() => {
 *   preloadCharts(['bar', 'line', 'pie'])
 * }, [])
 * ```
 */
export function preloadCharts(chartTypes: ChartType[]): void {
  chartTypes.forEach(preloadChart)
}

/**
 * Get all available chart types (built-in + custom plugins)
 */
export function getAvailableChartTypes(): ChartType[] {
  const builtIn = Object.keys(chartImportMap) as ChartType[]
  const custom = Array.from(customChartMap.keys())
  // Deduplicate in case a custom chart overrides a built-in
  return [...new Set([...builtIn, ...custom])]
}

/**
 * Check if a chart type has loaded successfully.
 * Returns false if the chart failed to load due to missing dependencies.
 *
 * Note: This only returns accurate results after the chart has been attempted to load.
 * Use this for conditional UI logic (e.g., hiding unavailable chart types).
 */
export function isChartTypeAvailable(chartType: ChartType): boolean {
  return !failedChartTypes.has(chartType)
}

/**
 * Get list of chart types that failed to load due to missing dependencies.
 */
export function getUnavailableChartTypes(): ChartType[] {
  return Array.from(failedChartTypes)
}
